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
  updateProjectForUser,
} from '../services/project.service';
import {
  summarizeLatestBranchChanges,
  summarizeLatestIssues,
  summarizeLatestPullRequests,
} from '../services/project-ai.service';

export const addProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { repoPath } = req.body as { repoPath?: string };

  if (!repoPath || typeof repoPath !== 'string') {
    throw new AppError(400, 'Invalid repository path. Use "owner/repo" (GitHub), "gitlab:group/repo", "bitbucket:workspace/repo" or full HTTPS URL.');
  }

  const project = await addProjectForUser(req.userId!, repoPath);
  res.status(201).json(project);
});

export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;

  if (typeof page === 'undefined' && typeof limit === 'undefined') {
    const projects = await getProjectsForUserLegacy(req.userId!);
    res.json(projects);
    return;
  }

  const projects = await getProjectsForUser(req.userId!, page, limit);
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
  const { branchName } = req.body as { branchName?: string };
  const summary = await summarizeLatestBranchChanges(req.params.id, req.userId!, branchName || '');
  res.json(summary);
});

export const askLatestIssuesOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit } = req.body as { limit?: unknown };
  const summary = await summarizeLatestIssues(req.params.id, req.userId!, limit);
  res.json(summary);
});

export const askLatestPullRequestsOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit } = req.body as { limit?: unknown };
  const summary = await summarizeLatestPullRequests(req.params.id, req.userId!, limit);
  res.json(summary);
});

export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteProjectForUser(req.params.id, req.userId!);
  res.json({ message: 'Project deleted successfully' });
});

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updatedProject = await updateProjectForUser(req.params.id, req.userId!);
  res.json(updatedProject);
});
