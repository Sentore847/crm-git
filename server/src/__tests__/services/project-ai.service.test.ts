import { AppError } from '../../utils/app-error';
import {
  summarizeLatestBranchChanges,
  summarizeLatestIssues,
  suggestCodeFix,
} from '../../services/project-ai.service';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../utils/ai', () => ({
  generateSummaryFromPrompt: jest.fn(),
  isAiConfigured: jest.fn(),
}));

jest.mock('../../utils/repository-provider', () => ({
  detectProviderFromRepositoryUrl: jest.fn().mockReturnValue('github'),
  fetchCommitsByProvider: jest.fn(),
  fetchIssuesByProvider: jest.fn(),
  fetchPullRequestsByProvider: jest.fn(),
  fetchRecentDiffs: jest.fn(),
}));

jest.mock('../../utils/provider-error', () => ({
  mapProviderError: jest.fn().mockImplementation((_p, _e, msg) => {
    throw new AppError(500, msg);
  }),
  getProviderLabel: jest.fn().mockReturnValue('GitHub'),
}));

const { prisma } = require('../../utils/prisma');
const { generateSummaryFromPrompt, isAiConfigured } = require('../../utils/ai');
const { fetchCommitsByProvider, fetchIssuesByProvider } = require('../../utils/repository-provider');

describe('project-ai.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('summarizeLatestBranchChanges', () => {
    it('should throw 400 when AI is not configured', async () => {
      prisma.user.findUnique.mockResolvedValue({ aiApiKey: null });
      isAiConfigured.mockReturnValue(false);

      await expect(
        summarizeLatestBranchChanges('proj-1', 'user-1', 'main')
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 when branchName is empty', async () => {
      prisma.user.findUnique.mockResolvedValue({ aiApiKey: 'sk-test', aiProvider: 'openai' });
      isAiConfigured.mockReturnValue(true);

      await expect(
        summarizeLatestBranchChanges('proj-1', 'user-1', '')
      ).rejects.toThrow('branchName is required');
    });

    it('should return summary when successful', async () => {
      prisma.user.findUnique.mockResolvedValue({
        aiApiKey: 'sk-test',
        aiProvider: 'openai',
        aiModel: null,
        aiBaseUrl: null,
      });
      isAiConfigured.mockReturnValue(true);
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      });
      fetchCommitsByProvider.mockResolvedValue([
        { sha: 'abc1234', message: 'Fix bug', author: 'dev', authoredAt: '2024-01-01' },
      ]);
      generateSummaryFromPrompt.mockResolvedValue('Summary of changes');

      const result = await summarizeLatestBranchChanges('proj-1', 'user-1', 'main');
      expect(result).toEqual({
        branchName: 'main',
        commitsAnalyzed: 1,
        summary: 'Summary of changes',
      });
    });

    it('should throw 404 when no commits found', async () => {
      prisma.user.findUnique.mockResolvedValue({
        aiApiKey: 'sk-test',
        aiProvider: 'openai',
        aiModel: null,
        aiBaseUrl: null,
      });
      isAiConfigured.mockReturnValue(true);
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      });
      fetchCommitsByProvider.mockResolvedValue([]);

      await expect(
        summarizeLatestBranchChanges('proj-1', 'user-1', 'main')
      ).rejects.toThrow('No commits found');
    });
  });

  describe('summarizeLatestIssues', () => {
    it('should return issues summary', async () => {
      prisma.user.findUnique.mockResolvedValue({
        aiApiKey: 'sk-test',
        aiProvider: 'openai',
        aiModel: null,
        aiBaseUrl: null,
      });
      isAiConfigured.mockReturnValue(true);
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      });
      fetchIssuesByProvider.mockResolvedValue([
        { number: 1, title: 'Bug', state: 'open', created_at: '2024-01-01', user: { login: 'dev' } },
      ]);
      generateSummaryFromPrompt.mockResolvedValue('Issues summary');

      const result = await summarizeLatestIssues('proj-1', 'user-1', 8);
      expect(result).toEqual(
        expect.objectContaining({
          issuesAnalyzed: 1,
          summary: 'Issues summary',
        })
      );
    });
  });

  describe('suggestCodeFix', () => {
    it('should throw 400 when snippet is missing', async () => {
      prisma.user.findUnique.mockResolvedValue({
        aiApiKey: 'sk-test',
        aiProvider: 'openai',
        aiModel: null,
        aiBaseUrl: null,
      });
      isAiConfigured.mockReturnValue(true);
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      });

      await expect(
        suggestCodeFix('proj-1', 'user-1', { file: 'a.ts', snippet: '', description: 'fix' })
      ).rejects.toThrow('snippet and description are required');
    });

    it('should return code fix suggestion', async () => {
      prisma.user.findUnique.mockResolvedValue({
        aiApiKey: 'sk-test',
        aiProvider: 'openai',
        aiModel: null,
        aiBaseUrl: null,
      });
      isAiConfigured.mockReturnValue(true);
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      });
      generateSummaryFromPrompt.mockResolvedValue(
        JSON.stringify({ improvedCode: 'fixed code', explanation: 'improved it' })
      );

      const result = await suggestCodeFix('proj-1', 'user-1', {
        file: 'a.ts',
        snippet: 'bad code',
        description: 'it crashes',
      });
      expect(result).toEqual({
        improvedCode: 'fixed code',
        explanation: 'improved it',
      });
    });
  });
});
