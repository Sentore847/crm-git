import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require('../../utils/prisma');

const generateToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!);

describe('User Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/settings', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/user/settings');
      expect(res.status).toBe(401);
    });

    it('should return settings for authenticated user', async () => {
      const token = generateToken('user-1');
      prisma.user.findUnique.mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: 'sk-test-key-1234',
        aiModel: 'gpt-4o',
        aiBaseUrl: null,
        hideIntro: false,
      });

      const res = await request(app)
        .get('/api/user/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.aiProvider).toBe('openai');
      expect(res.body.aiApiKey).toBe('****1234');
    });
  });

  describe('PUT /api/user/settings', () => {
    it('should update settings', async () => {
      const token = generateToken('user-1');
      prisma.user.update.mockResolvedValue({
        aiProvider: 'gemini',
        aiApiKey: null,
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: true,
      });

      const res = await request(app)
        .put('/api/user/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ aiProvider: 'gemini', hideIntro: true });

      expect(res.status).toBe(200);
      expect(res.body.aiProvider).toBe('gemini');
      expect(res.body.hideIntro).toBe(true);
    });

    it('should reject invalid provider', async () => {
      const token = generateToken('user-1');

      const res = await request(app)
        .put('/api/user/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ aiProvider: 'invalid-provider' });

      expect(res.status).toBe(400);
    });
  });
});
