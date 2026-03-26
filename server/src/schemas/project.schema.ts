import { z } from 'zod';

export const addProjectBody = z.object({
  repoPath: z.string().min(1, 'Repository path is required'),
});

export const projectIdParams = z.object({
  id: z.string().uuid('Invalid project ID'),
});

export const listProjectsQuery = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().max(200).optional(),
    platform: z.enum(['all', 'github', 'gitlab', 'bitbucket']).optional(),
    sortBy: z.enum(['createdAt', 'stars', 'forks', 'issues', 'name']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    favorite: z.enum(['true', 'false']).optional(),
  })
  .passthrough();

export const sortLimitQuery = z
  .object({
    sort: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  })
  .passthrough();

export const branchSummaryBody = z.object({
  branchName: z.string().optional().default(''),
});

export const summaryLimitBody = z.object({
  limit: z.number().int().positive().max(50).optional(),
});

export const codeReviewBody = z.object({
  branchName: z.string().optional().default(''),
});

export const codeFixBody = z.object({
  file: z.string().optional().default(''),
  snippet: z.string().optional().default(''),
  description: z.string().optional().default(''),
});
