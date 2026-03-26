import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import {
  addProjectForUser,
  deleteProjectForUser,
  getProjectBranchesForUser,
  getProjectDetailsForUser,
  getProjectIssuesForUser,
  getProjectPullRequestsForUser,
  getProjectsForUser,
  getProjectsForUserLegacy,
  toggleFavoriteForUser,
  updateProjectForUser,
} from '../services/project.service';
import {
  reviewRecentCode,
  suggestCodeFix,
  summarizeLatestBranchChanges,
  summarizeLatestIssues,
  summarizeLatestPullRequests,
} from '../services/project-ai.service';

export const addProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { repoPath } = req.body;

  const project = await addProjectForUser(req.userId!, repoPath);
  res.status(201).json(project);
});

export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, search, platform, sortBy, sortDir, favorite } = req.query;

  if (typeof page === 'undefined' && typeof limit === 'undefined') {
    const projects = await getProjectsForUserLegacy(req.userId!);
    res.json(projects);
    return;
  }

  const projects = await getProjectsForUser(req.userId!, {
    page,
    limit,
    search: typeof search === 'string' ? search : undefined,
    platform: typeof platform === 'string' ? platform : undefined,
    sortBy: typeof sortBy === 'string' ? sortBy : undefined,
    sortDir: typeof sortDir === 'string' ? sortDir : undefined,
    favorite: typeof favorite === 'string' ? favorite : undefined,
  });
  res.json(projects);
});

export const getProjectDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const details = await getProjectDetailsForUser(req.params.id, req.userId!);
  res.json(details);
});

export const getProjectBranches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sort, limit } = req.query;
  const payload = await getProjectBranchesForUser(req.params.id, req.userId!, sort, limit);
  res.json(payload);
});

export const getProjectIssues = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sort, limit } = req.query;
  const payload = await getProjectIssuesForUser(req.params.id, req.userId!, sort, limit);
  res.json(payload);
});

export const getProjectPullRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sort, limit } = req.query;
  const payload = await getProjectPullRequestsForUser(req.params.id, req.userId!, sort, limit);
  res.json(payload);
});

export const askLatestChangesInBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { branchName } = req.body;
  const summary = await summarizeLatestBranchChanges(req.params.id, req.userId!, branchName);
  res.json(summary);
});

export const askLatestIssuesOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit } = req.body;
  const summary = await summarizeLatestIssues(req.params.id, req.userId!, limit);
  res.json(summary);
});

export const askLatestPullRequestsOverview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { limit } = req.body;
    const summary = await summarizeLatestPullRequests(req.params.id, req.userId!, limit);
    res.json(summary);
  },
);

export const askCodeReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { branchName } = req.body;
  const result = await reviewRecentCode(req.params.id, req.userId!, branchName);
  res.json(result);
});

export const askCodeFix = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { file, snippet, description } = req.body;
  const result = await suggestCodeFix(req.params.id, req.userId!, {
    file,
    snippet,
    description,
  });
  res.json(result);
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updatedProject = await toggleFavoriteForUser(req.params.id, req.userId!);
  res.json(updatedProject);
});

export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteProjectForUser(req.params.id, req.userId!);
  res.json({ message: 'Project deleted successfully' });
});

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updatedProject = await updateProjectForUser(req.params.id, req.userId!);
  res.json(updatedProject);
});
