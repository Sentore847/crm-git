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
  toggleFavorite,
  updateProject,
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { aiLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  addProjectBody,
  projectIdParams,
  listProjectsQuery,
  sortLimitQuery,
  branchSummaryBody,
  summaryLimitBody,
  codeReviewBody,
  codeFixBody,
} from '../schemas/project.schema';

const router = Router();

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Add a repository
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [repoPath]
 *             properties:
 *               repoPath:
 *                 type: string
 *                 example: facebook/react
 *                 description: 'owner/repo, gitlab:group/repo, bitbucket:workspace/repo, or HTTPS URL'
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid repository path
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validate({ body: addProjectBody }), addProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List user's projects
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, validate({ query: listProjectsQuery }), getProjects);

/**
 * @swagger
 * /projects/{id}/details:
 *   get:
 *     tags: [Projects]
 *     summary: Get project details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/:id/details', authenticate, validate({ params: projectIdParams }), getProjectDetails);

/**
 * @swagger
 * /projects/{id}/branches:
 *   get:
 *     tags: [Projects]
 *     summary: Get project branches
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Branches list
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id/branches',
  authenticate,
  validate({ params: projectIdParams, query: sortLimitQuery }),
  getProjectBranches,
);

/**
 * @swagger
 * /projects/{id}/issues:
 *   get:
 *     tags: [Projects]
 *     summary: Get project issues
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Issues list
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id/issues',
  authenticate,
  validate({ params: projectIdParams, query: sortLimitQuery }),
  getProjectIssues,
);

/**
 * @swagger
 * /projects/{id}/pulls:
 *   get:
 *     tags: [Projects]
 *     summary: Get project pull requests
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pull requests list
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id/pulls',
  authenticate,
  validate({ params: projectIdParams, query: sortLimitQuery }),
  getProjectPullRequests,
);

/**
 * @swagger
 * /projects/{id}/ai/branch-summary:
 *   post:
 *     tags: [AI Analysis]
 *     summary: AI summary of latest branch changes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchName:
 *                 type: string
 *                 example: main
 *     responses:
 *       200:
 *         description: AI-generated summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiSummary'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ai/branch-summary',
  authenticate,
  aiLimiter,
  validate({ params: projectIdParams, body: branchSummaryBody }),
  askLatestChangesInBranch,
);

/**
 * @swagger
 * /projects/{id}/ai/issues-summary:
 *   post:
 *     tags: [AI Analysis]
 *     summary: AI summary of latest issues
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: AI-generated issues summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiSummary'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ai/issues-summary',
  authenticate,
  aiLimiter,
  validate({ params: projectIdParams, body: summaryLimitBody }),
  askLatestIssuesOverview,
);

/**
 * @swagger
 * /projects/{id}/ai/pulls-summary:
 *   post:
 *     tags: [AI Analysis]
 *     summary: AI summary of latest pull requests
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: AI-generated pull requests summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiSummary'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ai/pulls-summary',
  authenticate,
  aiLimiter,
  validate({ params: projectIdParams, body: summaryLimitBody }),
  askLatestPullRequestsOverview,
);

/**
 * @swagger
 * /projects/{id}/ai/code-review:
 *   post:
 *     tags: [AI Analysis]
 *     summary: AI code review of recent changes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchName:
 *                 type: string
 *                 example: main
 *     responses:
 *       200:
 *         description: Code review findings
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ai/code-review',
  authenticate,
  aiLimiter,
  validate({ params: projectIdParams, body: codeReviewBody }),
  askCodeReview,
);

/**
 * @swagger
 * /projects/{id}/ai/code-fix:
 *   post:
 *     tags: [AI Analysis]
 *     summary: AI code fix suggestions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *               snippet:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code fix suggestions
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ai/code-fix',
  authenticate,
  aiLimiter,
  validate({ params: projectIdParams, body: codeFixBody }),
  askCodeFix,
);

/**
 * @swagger
 * /projects/{id}/favorite:
 *   patch:
 *     tags: [Projects]
 *     summary: Toggle project favorite status
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.patch('/:id/favorite', authenticate, validate({ params: projectIdParams }), toggleFavorite);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.delete('/:id', authenticate, validate({ params: projectIdParams }), deleteProject);

/**
 * @swagger
 * /projects/{id}/update:
 *   patch:
 *     tags: [Projects]
 *     summary: Refresh project metadata from repository
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.patch('/:id/update', authenticate, validate({ params: projectIdParams }), updateProject);

export default router;
