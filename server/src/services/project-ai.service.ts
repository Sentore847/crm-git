import axios from 'axios';
import {
  BRANCH_SUMMARY_COMMITS_LIMIT,
  BRANCH_SUMMARY_RETURN_FORMAT,
  BRANCH_SUMMARY_SYSTEM_PROMPT,
  CODE_FIX_MAX_TOKENS,
  CODE_FIX_RETURN_FORMAT,
  CODE_FIX_SYSTEM_PROMPT,
  CODE_REVIEW_COMMITS_LIMIT,
  CODE_REVIEW_MAX_DIFF_LENGTH,
  CODE_REVIEW_MAX_TOKENS,
  CODE_REVIEW_RETURN_FORMAT,
  CODE_REVIEW_SYSTEM_PROMPT,
  ISSUES_OVERVIEW_RETURN_FORMAT,
  ISSUES_OVERVIEW_SYSTEM_PROMPT,
  PULLS_OVERVIEW_RETURN_FORMAT,
  PULLS_OVERVIEW_SYSTEM_PROMPT,
  SUMMARY_DEFAULT_LIMIT,
  SUMMARY_MAX_LIMIT,
  SUMMARY_MIN_LIMIT,
} from '../constants/project-ai.constants';
import { generateSummaryFromPrompt, isAiConfigured, type AiConfig } from '../utils/ai';
import {
  detectProviderFromRepositoryUrl,
  fetchCommitsByProvider,
  fetchIssuesByProvider,
  fetchPullRequestsByProvider,
  fetchRecentDiffs,
  UnifiedIssue,
  UnifiedPullRequest,
} from '../utils/repository-provider';
import { AppError } from '../utils/app-error';
import { mapProviderError, getProviderLabel } from '../utils/provider-error';
import { getOwnedProjectOrThrow } from './project.service';
import { prisma } from '../utils/prisma';

const AI_MISSING_KEY_MESSAGE = 'AI API key is not configured. Set your key in Settings.';

const getUserAiConfig = async (userId: string): Promise<AiConfig | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiProvider: true, aiApiKey: true, aiModel: true, aiBaseUrl: true },
  });

  if (!user?.aiApiKey) {
    return null;
  }

  return {
    apiKey: user.aiApiKey,
    provider: user.aiProvider,
    model: user.aiModel,
    baseUrl: user.aiBaseUrl,
  };
};

const ensureAiConfiguredOrThrow = (config: AiConfig | null) => {
  if (!isAiConfigured(config?.apiKey)) {
    throw new AppError(400, AI_MISSING_KEY_MESSAGE);
  }
};

const parseSummaryLimit = (value: unknown) => {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return SUMMARY_DEFAULT_LIMIT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return SUMMARY_DEFAULT_LIMIT;
  }

  return Math.max(SUMMARY_MIN_LIMIT, Math.min(SUMMARY_MAX_LIMIT, parsed));
};


const mapAiError = (error: unknown, fallbackMessage: string): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error && error.message) {
    throw new AppError(500, error.message);
  }

  throw new AppError(500, fallbackMessage);
};

const buildIssuesPrompt = (issues: UnifiedIssue[], owner: string, repo: string) => {
  const issuesText = issues
    .map(issue => {
      const author = issue.user?.login || 'unknown';
      return `#${issue.number} | ${issue.state} | created: ${issue.created_at} | author: ${author} | title: ${issue.title}`;
    })
    .join('\n');

  return `Repository: ${owner}/${repo}\nLatest issues:\n${issuesText}`;
};

const buildPullRequestsPrompt = (pullRequests: UnifiedPullRequest[], owner: string, repo: string) => {
  const pullRequestsText = pullRequests
    .map(pullRequest => {
      const author = pullRequest.user?.login || 'unknown';
      return `#${pullRequest.number} | ${pullRequest.state} | updated: ${pullRequest.updated_at} | author: ${author} | title: ${pullRequest.title}`;
    })
    .join('\n');

  return `Repository: ${owner}/${repo}\nLatest pull requests:\n${pullRequestsText}`;
};

export const summarizeLatestBranchChanges = async (
  projectId: string,
  userId: string,
  branchName: string
) => {
  const aiConfig = await getUserAiConfig(userId);
  ensureAiConfiguredOrThrow(aiConfig);

  if (!branchName) {
    throw new AppError(400, 'branchName is required');
  }

  const project = await getOwnedProjectOrThrow(projectId, userId);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const commits = await fetchCommitsByProvider(
      provider,
      project.owner,
      project.name,
      branchName,
      BRANCH_SUMMARY_COMMITS_LIMIT
    );

    if (commits.length === 0) {
      throw new AppError(404, 'No commits found for this branch');
    }

    const commitsText = commits
      .map(commit => {
        const firstLineMessage = commit.message.split('\n')[0];
        const author = commit.author || 'unknown';
        const authoredAt = commit.authoredAt || 'unknown';
        return `${commit.sha.slice(0, 7)} | ${authoredAt} | ${author} | ${firstLineMessage}`;
      })
      .join('\n');

    const summary = await generateSummaryFromPrompt(
      BRANCH_SUMMARY_SYSTEM_PROMPT,
      `Repository: ${project.owner}/${project.name}\nBranch: ${branchName}\nLatest commits:\n${commitsText}\n\n${BRANCH_SUMMARY_RETURN_FORMAT}`,
      aiConfig
    );

    return {
      branchName,
      commitsAnalyzed: commits.length,
      summary,
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      mapProviderError(
        provider,
        error,
        'Failed to generate branch summary',
        `Branch or repository not found on ${getProviderLabel(provider)}`,
      );
    }

    mapAiError(error, 'Failed to generate branch summary');
  }
};

export const summarizeLatestIssues = async (
  projectId: string,
  userId: string,
  limitValue: unknown
) => {
  const aiConfig = await getUserAiConfig(userId);
  ensureAiConfiguredOrThrow(aiConfig);

  const limit = parseSummaryLimit(limitValue);
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const latestIssues = await fetchIssuesByProvider(provider, project.owner, project.name, limit, 'desc');

    const summary = await generateSummaryFromPrompt(
      ISSUES_OVERVIEW_SYSTEM_PROMPT,
      `${buildIssuesPrompt(latestIssues, project.owner, project.name)}\n\n${ISSUES_OVERVIEW_RETURN_FORMAT}`,
      aiConfig
    );

    return {
      issuesAnalyzed: latestIssues.length,
      summary,
      latestIssues,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      mapProviderError(
        provider,
        error,
        'Failed to generate issues summary',
        `Repository not found on ${getProviderLabel(provider)}`,
      );
    }

    mapAiError(error, 'Failed to generate issues summary');
  }
};

export const summarizeLatestPullRequests = async (
  projectId: string,
  userId: string,
  limitValue: unknown
) => {
  const aiConfig = await getUserAiConfig(userId);
  ensureAiConfiguredOrThrow(aiConfig);

  const limit = parseSummaryLimit(limitValue);
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const latestPullRequests = await fetchPullRequestsByProvider(
      provider,
      project.owner,
      project.name,
      limit,
      'desc'
    );

    const summary = await generateSummaryFromPrompt(
      PULLS_OVERVIEW_SYSTEM_PROMPT,
      `${buildPullRequestsPrompt(latestPullRequests, project.owner, project.name)}\n\n${PULLS_OVERVIEW_RETURN_FORMAT}`,
      aiConfig
    );

    return {
      pullRequestsAnalyzed: latestPullRequests.length,
      summary,
      latestPullRequests,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      mapProviderError(
        provider,
        error,
        'Failed to generate pull requests summary',
        `Repository not found on ${getProviderLabel(provider)}`,
      );
    }

    mapAiError(error, 'Failed to generate pull requests summary');
  }
};

export const reviewRecentCode = async (
  projectId: string,
  userId: string,
  branchName: string
) => {
  const aiConfig = await getUserAiConfig(userId);
  ensureAiConfiguredOrThrow(aiConfig);

  if (!branchName) {
    throw new AppError(400, 'branchName is required');
  }

  const project = await getOwnedProjectOrThrow(projectId, userId);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const { diffs, commitsAnalyzed } = await fetchRecentDiffs(
      provider,
      project.owner,
      project.name,
      branchName,
      CODE_REVIEW_COMMITS_LIMIT,
      CODE_REVIEW_MAX_DIFF_LENGTH
    );

    if (!diffs || commitsAnalyzed === 0) {
      throw new AppError(404, 'No commit diffs found for this branch');
    }

    const rawResponse = await generateSummaryFromPrompt(
      CODE_REVIEW_SYSTEM_PROMPT,
      `Repository: ${project.owner}/${project.name}\nBranch: ${branchName}\n\nRecent changes (diff):\n${diffs}\n\n${CODE_REVIEW_RETURN_FORMAT}`,
      aiConfig,
      CODE_REVIEW_MAX_TOKENS
    );

    let findings: unknown[];
    try {
      findings = JSON.parse(rawResponse);
    } catch {
      findings = [];
    }

    if (!Array.isArray(findings)) {
      findings = [];
    }

    return {
      branchName,
      commitsAnalyzed,
      findings,
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      mapProviderError(
        provider,
        error,
        'Failed to review code',
        `Branch or repository not found on ${getProviderLabel(provider)}`,
      );
    }

    mapAiError(error, 'Failed to review code');
  }
};

export const suggestCodeFix = async (
  projectId: string,
  userId: string,
  finding: { file: string; snippet: string; description: string }
) => {
  const aiConfig = await getUserAiConfig(userId);
  ensureAiConfiguredOrThrow(aiConfig);

  await getOwnedProjectOrThrow(projectId, userId);

  if (!finding.snippet || !finding.description) {
    throw new AppError(400, 'snippet and description are required');
  }

  try {
    const rawResponse = await generateSummaryFromPrompt(
      CODE_FIX_SYSTEM_PROMPT,
      `File: ${finding.file}\n\nProblematic code:\n${finding.snippet}\n\nProblem: ${finding.description}\n\n${CODE_FIX_RETURN_FORMAT}`,
      aiConfig,
      CODE_FIX_MAX_TOKENS
    );

    let result: { improvedCode?: string; explanation?: string };
    try {
      result = JSON.parse(rawResponse);
    } catch {
      result = { improvedCode: rawResponse, explanation: '' };
    }

    return {
      improvedCode: result.improvedCode || rawResponse,
      explanation: result.explanation || '',
    };
  } catch (error: unknown) {
    mapAiError(error, 'Failed to generate code fix suggestion');
  }
};
