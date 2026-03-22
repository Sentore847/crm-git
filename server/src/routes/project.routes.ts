import { Router } from 'express';
import {
  addProject,
  askCodeFix,
  askCodeReview,
  askLatestChangesInBranch,
  askLatestIssuesOverview,
  askLatestPullRequestsOverview,
  deleteProject,
  getProjectBranches,
  getProjectDetails,
  getProjectIssues,
  getProjectPullRequests,
  getProjects,
  updateProject,
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);
router.get('/', authenticate, getProjects);
router.get('/:id/details', authenticate, getProjectDetails);
router.get('/:id/branches', authenticate, getProjectBranches);
router.get('/:id/issues', authenticate, getProjectIssues);
router.get('/:id/pulls', authenticate, getProjectPullRequests);
router.post('/:id/ai/branch-summary', authenticate, askLatestChangesInBranch);
router.post('/:id/ai/issues-summary', authenticate, askLatestIssuesOverview);
router.post('/:id/ai/pulls-summary', authenticate, askLatestPullRequestsOverview);
router.post('/:id/ai/code-review', authenticate, askCodeReview);
router.post('/:id/ai/code-fix', authenticate, askCodeFix);
router.delete('/:id', authenticate, deleteProject);
router.patch('/:id/update', authenticate, updateProject);

export default router;
