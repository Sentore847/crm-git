import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
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
  parseRepoInput: jest.fn().mockReturnValue({ provider: 'github', owner: 'test', name: 'repo' }),
  detectProviderFromRepositoryUrl: jest.fn().mockReturnValue('github'),
  fetchRepositoryByProvider: jest.fn().mockResolvedValue({
    htmlUrl: 'https://github.com/test/repo',
    stars: 10,
    forks: 5,
    openIssues: 3,
    createdAt: '2024-01-01T00:00:00Z',
  }),
  fetchBranchesByProvider: jest.fn(),
  fetchIssuesByProvider: jest.fn(),
  fetchPullRequestsByProvider: jest.fn(),
  fetchCommitsByProvider: jest.fn(),
  fetchRecentDiffs: jest.fn(),
}));

jest.mock('../../utils/provider-error', () => ({
  mapProviderError: jest.fn(),
  getProviderLabel: jest.fn().mockReturnValue('GitHub'),
}));

const { prisma } = require('../../utils/prisma');

const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';
const TEST_USER_ID_2 = '00000000-0000-4000-8000-000000000002';
const TEST_PROJECT_ID = '00000000-0000-4000-8000-000000000010';

const generateToken = (userId: string) => jwt.sign({ userId }, process.env.JWT_SECRET!);

describe('Project Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects (authenticated)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return projects with valid token (legacy)', async () => {
      const token = generateToken(TEST_USER_ID);
      prisma.project.findMany.mockResolvedValue([{ id: 'p1', name: 'repo1', owner: 'owner1' }]);

      const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should return paginated projects', async () => {
      const token = generateToken(TEST_USER_ID);
      prisma.project.count.mockResolvedValue(10);
      prisma.project.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);

      const res = await request(app)
        .get('/api/projects?page=1&limit=3')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('POST /api/projects', () => {
    it('should return 400 for missing repoPath', async () => {
      const token = generateToken(TEST_USER_ID);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should create project with valid repoPath', async () => {
      const token = generateToken(TEST_USER_ID);
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.create.mockResolvedValue({
        id: 'new-proj',
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
        stars: 10,
        forks: 5,
        issues: 3,
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ repoPath: 'test/repo' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('repo');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project owned by user', async () => {
      const token = generateToken(TEST_USER_ID);
      prisma.project.findUnique.mockResolvedValue({
        id: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
      });
      prisma.project.delete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Project deleted successfully');
    });

    it('should return 404 for non-owned project', async () => {
      const token = generateToken(TEST_USER_ID);
      prisma.project.findUnique.mockResolvedValue({
        id: TEST_PROJECT_ID,
        userId: TEST_USER_ID_2,
      });

      const res = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
