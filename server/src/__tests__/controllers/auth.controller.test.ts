import { signup, login } from '../../controllers/auth.controller';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('../../utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('auth.controller', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn();
  });

  describe('signup', () => {
    it('should throw 409 when user already exists', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      const req = { body: { email: 'test@test.com', password: '123456' } } as Request;
      const res = createMockResponse();

      signup(req, res, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(409);
    });

    it('should create user and return 201', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
        createdAt: new Date('2024-01-01'),
      });

      const req = { body: { email: 'new@test.com', password: 'password123' } } as Request;
      const res = createMockResponse();

      signup(req, res, mockNext);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', email: 'new@test.com' }),
      );
    });
  });

  describe('login', () => {
    it('should throw 401 when user not found', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = { body: { email: 'bad@test.com', password: '123456' } } as Request;
      const res = createMockResponse();

      login(req, res, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should throw 401 when password is wrong', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = { body: { email: 'test@test.com', password: 'wrong' } } as Request;
      const res = createMockResponse();

      login(req, res, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should return token on successful login', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashed',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = { body: { email: 'test@test.com', password: 'correct' } } as Request;
      const res = createMockResponse();

      login(req, res, mockNext);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith({ token: 'mock-jwt-token' });
    });
  });
});
