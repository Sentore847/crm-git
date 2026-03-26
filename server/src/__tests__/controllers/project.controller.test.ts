import {
  addProject,
  getProjects,
  deleteProject,
  toggleFavorite,
} from '../../controllers/project.controller';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../services/project.service', () => ({
  addProjectForUser: jest.fn(),
  getProjectsForUser: jest.fn(),
  getProjectsForUserLegacy: jest.fn(),
  deleteProjectForUser: jest.fn(),
  toggleFavoriteForUser: jest.fn(),
  updateProjectForUser: jest.fn(),
  getProjectDetailsForUser: jest.fn(),
  getProjectBranchesForUser: jest.fn(),
  getProjectIssuesForUser: jest.fn(),
  getProjectPullRequestsForUser: jest.fn(),
}));

jest.mock('../../services/project-ai.service', () => ({
  summarizeLatestBranchChanges: jest.fn(),
  summarizeLatestIssues: jest.fn(),
  summarizeLatestPullRequests: jest.fn(),
  reviewRecentCode: jest.fn(),
  suggestCodeFix: jest.fn(),
}));

const {
  addProjectForUser,
  getProjectsForUser,
  getProjectsForUserLegacy,
  deleteProjectForUser,
  toggleFavoriteForUser,
} = require('../../services/project.service');

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('project.controller', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn();
  });

  describe('addProject', () => {
    it('should create project and return 201', async () => {
      const mockProject = { id: 'proj-1', name: 'repo', owner: 'owner' };
      addProjectForUser.mockResolvedValue(mockProject);

      const req = { body: { repoPath: 'owner/repo' }, userId: 'user-1' } as AuthRequest;
      const res = createMockResponse();

      await (addProject as any)(req, res, mockNext);
      expect(addProjectForUser).toHaveBeenCalledWith('user-1', 'owner/repo');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('getProjects', () => {
    it('should use legacy method when no pagination params', async () => {
      const mockProjects = [{ id: '1' }, { id: '2' }];
      getProjectsForUserLegacy.mockResolvedValue(mockProjects);

      const req = { query: {}, userId: 'user-1' } as unknown as AuthRequest;
      const res = createMockResponse();

      await (getProjects as any)(req, res, mockNext);
      expect(getProjectsForUserLegacy).toHaveBeenCalledWith('user-1');
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });

    it('should use paginated method when page/limit provided', async () => {
      const mockResult = { items: [], pagination: {} };
      getProjectsForUser.mockResolvedValue(mockResult);

      const req = { query: { page: '1', limit: '3' }, userId: 'user-1' } as unknown as AuthRequest;
      const res = createMockResponse();

      await (getProjects as any)(req, res, mockNext);
      expect(getProjectsForUser).toHaveBeenCalledWith('user-1', {
        page: '1',
        limit: '3',
        search: undefined,
        platform: undefined,
        sortBy: undefined,
        sortDir: undefined,
        favorite: undefined,
      });
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite and return updated project', async () => {
      const mockProject = { id: 'proj-1', name: 'repo', isFavorite: true };
      toggleFavoriteForUser.mockResolvedValue(mockProject);

      const req = { params: { id: 'proj-1' }, userId: 'user-1' } as unknown as AuthRequest;
      const res = createMockResponse();

      await (toggleFavorite as any)(req, res, mockNext);
      expect(toggleFavoriteForUser).toHaveBeenCalledWith('proj-1', 'user-1');
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete project and return success message', async () => {
      deleteProjectForUser.mockResolvedValue(undefined);

      const req = { params: { id: 'proj-1' }, userId: 'user-1' } as unknown as AuthRequest;
      const res = createMockResponse();

      await (deleteProject as any)(req, res, mockNext);
      expect(deleteProjectForUser).toHaveBeenCalledWith('proj-1', 'user-1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Project deleted successfully' });
    });
  });
});
