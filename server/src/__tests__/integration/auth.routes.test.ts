import request from 'supertest';
import app from '../../app';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcrypt';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ password: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });

    it('should return 409 when user exists', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'existing@test.com',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'existing@test.com', password: '123456' });

      expect(res.status).toBe(409);
    });

    it('should return 201 on successful signup', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'new@test.com',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'new@test.com', password: '123456' });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('new@test.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when fields missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid credentials', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return token on successful login', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashed',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'correct' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });
});
