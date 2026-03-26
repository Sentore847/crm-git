import { prisma } from '../../utils/prisma';
import { AppError } from '../../utils/app-error';
import {
  getOwnedProjectOrThrow,
  getProjectsForUser,
  getProjectsForUserLegacy,
  deleteProjectForUser,
  toggleFavoriteForUser,
} from '../../services/project.service';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/repository-provider', () => ({
  parseRepoInput: jest.fn(),
  detectProviderFromRepositoryUrl: jest.fn().mockReturnValue('github'),
  fetchRepositoryByProvider: jest.fn(),
  fetchBranchesByProvider: jest.fn(),
  fetchIssuesByProvider: jest.fn(),
  fetchPullRequestsByProvider: jest.fn(),
}));

jest.mock('../../utils/provider-error', () => ({
  mapProviderError: jest.fn().mockImplementation((_p, _e, msg) => {
    throw new AppError(500, msg);
  }),
  getProviderLabel: jest.fn().mockReturnValue('GitHub'),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('project.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOwnedProjectOrThrow', () => {
    it('should return project when it exists and belongs to user', async () => {
      const mockProject = {
        id: 'proj-1',
        userId: 'user-1',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
      };
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const result = await getOwnedProjectOrThrow('proj-1', 'user-1');
      expect(result).toEqual(mockProject);
    });

    it('should throw 404 when project not found', async () => {
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getOwnedProjectOrThrow('proj-1', 'user-1')).rejects.toThrow(AppError);
      await expect(getOwnedProjectOrThrow('proj-1', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 404 when project belongs to different user', async () => {
      const mockProject = { id: 'proj-1', userId: 'other-user' };
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      await expect(getOwnedProjectOrThrow('proj-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('getProjectsForUser', () => {
    it('should return paginated projects', async () => {
      (mockedPrisma.project.count as jest.Mock).mockResolvedValue(5);
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ]);

      const result = await getProjectsForUser('user-1', { page: '1', limit: '3' });
      expect(result.items).toHaveLength(3);
      expect(result.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 3,
          total: 5,
          totalPages: 2,
          hasPrev: false,
          hasNext: true,
        }),
      );
    });

    it('should use defaults for invalid page/limit', async () => {
      (mockedPrisma.project.count as jest.Mock).mockResolvedValue(0);
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getProjectsForUser('user-1', { page: 'abc', limit: undefined });
      expect(result.pagination.page).toBe(1);
    });

    it('should clamp page to totalPages', async () => {
      (mockedPrisma.project.count as jest.Mock).mockResolvedValue(3);
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getProjectsForUser('user-1', { page: '999', limit: '3' });
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getProjectsForUserLegacy', () => {
    it('should return all projects for user', async () => {
      const mockProjects = [{ id: '1' }, { id: '2' }];
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await getProjectsForUserLegacy('user-1');
      expect(result).toEqual(mockProjects);
      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteProjectForUser', () => {
    it('should delete a project owned by the user', async () => {
      const mockProject = { id: 'proj-1', userId: 'user-1' };
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (mockedPrisma.project.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteProjectForUser('proj-1', 'user-1');
      expect(mockedPrisma.project.delete).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
    });

    it('should throw 404 when trying to delete non-owned project', async () => {
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteProjectForUser('proj-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('toggleFavoriteForUser', () => {
    it('should toggle isFavorite from false to true', async () => {
      const mockProject = { id: 'proj-1', userId: 'user-1', isFavorite: false };
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (mockedPrisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isFavorite: true,
      });

      const result = await toggleFavoriteForUser('proj-1', 'user-1');
      expect(result.isFavorite).toBe(true);
      expect(mockedPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { isFavorite: true },
      });
    });

    it('should toggle isFavorite from true to false', async () => {
      const mockProject = { id: 'proj-1', userId: 'user-1', isFavorite: true };
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (mockedPrisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isFavorite: false,
      });

      const result = await toggleFavoriteForUser('proj-1', 'user-1');
      expect(result.isFavorite).toBe(false);
      expect(mockedPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { isFavorite: false },
      });
    });

    it('should throw 404 for non-owned project', async () => {
      (mockedPrisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(toggleFavoriteForUser('proj-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('getProjectsForUser with favorite filter', () => {
    it('should filter by favorite when favorite=true', async () => {
      (mockedPrisma.project.count as jest.Mock).mockResolvedValue(1);
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: '1', isFavorite: true },
      ]);

      await getProjectsForUser('user-1', { page: '1', limit: '3', favorite: 'true' });
      expect(mockedPrisma.project.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ userId: 'user-1', isFavorite: true }),
      });
    });

    it('should not filter by favorite when not provided', async () => {
      (mockedPrisma.project.count as jest.Mock).mockResolvedValue(0);
      (mockedPrisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await getProjectsForUser('user-1', { page: '1', limit: '3' });
      const countCall = (mockedPrisma.project.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.isFavorite).toBeUndefined();
    });
  });
});
