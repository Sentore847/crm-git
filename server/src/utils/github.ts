import axios from 'axios';
import { env } from '../config/env';
import {
  GITHUB_API_BASE,
  GITHUB_API_VERSION,
  GITHUB_BRANCH_COMMIT_BATCH_SIZE,
  GITHUB_MAX_PAGES,
  GITHUB_PAGE_SIZE,
  GITHUB_REQUEST_TIMEOUT_MS,
} from '../constants/github.constants';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: GITHUB_REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
  },
});

export interface GithubRepository {
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
}

export interface GithubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      date?: string;
    };
    committer?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
  };
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user?: {
    login?: string;
  };
  pull_request?: unknown;
}

export interface GithubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  draft?: boolean;
  html_url: string;
  user?: {
    login?: string;
  };
}

type EnrichedBranch = {
  name: string;
  commitSha: string;
  commitUrl: string;
  lastCommitMessage: string;
  lastCommitDate?: string;
  lastCommitAuthor?: string;
};

const normalizeLimit = (value: number, max = GITHUB_PAGE_SIZE * GITHUB_MAX_PAGES) => {
  if (!Number.isInteger(value) || value <= 0) {
    return GITHUB_PAGE_SIZE;
  }

  return Math.min(value, max);
};

const mapInBatches = async <Input, Output>(
  input: Input[],
  batchSize: number,
  mapper: (item: Input) => Promise<Output>
): Promise<Output[]> => {
  const result: Output[] = [];

  for (let index = 0; index < input.length; index += batchSize) {
    const chunk = input.slice(index, index + batchSize);
    const chunkResult = await Promise.all(chunk.map(mapper));
    result.push(...chunkResult);
  }

  return result;
};

const fetchBranchesRaw = async (owner: string, repo: string, requestedLimit: number) => {
  const limit = normalizeLimit(requestedLimit);
  const allBranches: GithubBranch[] = [];
  let page = 1;

  while (allBranches.length < limit && page <= GITHUB_MAX_PAGES) {
    const perPage = Math.min(GITHUB_PAGE_SIZE, limit - allBranches.length);

    const res = await githubClient.get<GithubBranch[]>(`/repos/${owner}/${repo}/branches`, {
      params: { per_page: perPage, page },
    });

    allBranches.push(...res.data);

    if (res.data.length < perPage) {
      break;
    }

    page += 1;
  }

  return allBranches.slice(0, limit);
};

const enrichBranch = async (owner: string, repo: string, branch: GithubBranch): Promise<EnrichedBranch> => {
  const commitRes = await githubClient.get<GithubCommit>(
    `/repos/${owner}/${repo}/commits/${branch.commit.sha}`
  );

  const commit = commitRes.data;
  const message = commit.commit.message.split('\n')[0];
  const date = commit.commit.author?.date || commit.commit.committer?.date;
  const author = commit.author?.login || commit.commit.author?.name || commit.commit.committer?.name;

  return {
    name: branch.name,
    commitSha: branch.commit.sha,
    commitUrl: commit.html_url,
    lastCommitMessage: message,
    lastCommitDate: date,
    lastCommitAuthor: author,
  };
};

export const fetchRepository = async (owner: string, repo: string) => {
  const res = await githubClient.get<GithubRepository>(`/repos/${owner}/${repo}`);
  return res.data;
};

export const fetchBranchesWithCommits = async (
  owner: string,
  repo: string,
  limit = GITHUB_PAGE_SIZE
) => {
  const branches = await fetchBranchesRaw(owner, repo, limit);

  return mapInBatches(branches, GITHUB_BRANCH_COMMIT_BATCH_SIZE, branch =>
    enrichBranch(owner, repo, branch)
  );
};

export const fetchIssuesSlice = async (
  owner: string,
  repo: string,
  limit = GITHUB_PAGE_SIZE,
  direction: 'asc' | 'desc' = 'desc'
) => {
  const cappedLimit = normalizeLimit(limit, GITHUB_PAGE_SIZE);
  const issues: GithubIssue[] = [];
  let page = 1;

  while (issues.length < cappedLimit && page <= GITHUB_MAX_PAGES) {
    const res = await githubClient.get<GithubIssue[]>(`/repos/${owner}/${repo}/issues`, {
      params: {
        state: 'all',
        sort: 'created',
        direction,
        per_page: GITHUB_PAGE_SIZE,
        page,
      },
    });

    const filtered = res.data.filter(item => !item.pull_request);
    issues.push(...filtered);

    if (res.data.length < GITHUB_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return issues.slice(0, cappedLimit);
};

export const fetchPullRequestsSlice = async (
  owner: string,
  repo: string,
  limit = GITHUB_PAGE_SIZE,
  direction: 'asc' | 'desc' = 'desc'
) => {
  const cappedLimit = normalizeLimit(limit, GITHUB_PAGE_SIZE);
  const res = await githubClient.get<GithubPullRequest[]>(`/repos/${owner}/${repo}/pulls`, {
    params: {
      state: 'all',
      sort: 'updated',
      direction,
      per_page: cappedLimit,
      page: 1,
    },
  });

  return res.data;
};

export const fetchCommitsForBranch = async (
  owner: string,
  repo: string,
  branch: string,
  limit = 20
) => {
  const cappedLimit = normalizeLimit(limit, GITHUB_PAGE_SIZE);

  const res = await githubClient.get<GithubCommit[]>(`/repos/${owner}/${repo}/commits`, {
    params: { sha: branch, per_page: cappedLimit },
  });

  return res.data;
};

export const fetchCommitDiff = async (owner: string, repo: string, sha: string): Promise<string> => {
  const res = await githubClient.get<string>(`/repos/${owner}/${repo}/commits/${sha}`, {
    headers: { Accept: 'application/vnd.github.diff' },
    responseType: 'text',
    transformResponse: [(data: string) => data],
  });

  return res.data;
};
