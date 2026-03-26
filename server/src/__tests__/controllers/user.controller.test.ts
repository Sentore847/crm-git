import { getSettings, updateSettings } from '../../controllers/user.controller';
import { prisma } from '../../utils/prisma';
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('user.controller', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn();
  });

  describe('getSettings', () => {
    it('should return user settings with masked API key', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: 'sk-test-key-12345678',
        aiModel: 'gpt-4o-mini',
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1' } as AuthRequest;
      const res = createMockResponse();

      getSettings(req, res, mockNext);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith({
        aiProvider: 'openai',
        aiApiKey: '****5678',
        aiModel: 'gpt-4o-mini',
        aiBaseUrl: null,
        hideIntro: false,
      });
    });

    it('should return null for missing API key', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: null,
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1' } as AuthRequest;
      const res = createMockResponse();

      getSettings(req, res, mockNext);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ aiApiKey: null }));
    });

    it('should throw 404 when user not found', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = { userId: 'nonexistent' } as AuthRequest;
      const res = createMockResponse();

      getSettings(req, res, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });

    it('should mask short API key', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: 'ab',
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1' } as AuthRequest;
      const res = createMockResponse();

      getSettings(req, res, mockNext);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ aiApiKey: '****' }));
    });
  });

  describe('updateSettings', () => {
    it('should update aiProvider', async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue({
        aiProvider: 'gemini',
        aiApiKey: null,
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1', body: { aiProvider: 'gemini' } } as AuthRequest;
      const res = createMockResponse();

      updateSettings(req, res, mockNext);
      await flushPromises();

      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ aiProvider: 'gemini' }),
        }),
      );
    });

    it('should update hideIntro flag', async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: null,
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: true,
      });

      const req = { userId: 'user-1', body: { hideIntro: true } } as AuthRequest;
      const res = createMockResponse();

      updateSettings(req, res, mockNext);
      await flushPromises();

      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hideIntro: true }),
        }),
      );
    });

    it('should trim and set API key', async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: 'sk-trimmed',
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1', body: { aiApiKey: '  sk-trimmed  ' } } as AuthRequest;
      const res = createMockResponse();

      updateSettings(req, res, mockNext);
      await flushPromises();

      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ aiApiKey: 'sk-trimmed' }),
        }),
      );
    });

    it('should set API key to null for empty string', async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue({
        aiProvider: 'openai',
        aiApiKey: null,
        aiModel: null,
        aiBaseUrl: null,
        hideIntro: false,
      });

      const req = { userId: 'user-1', body: { aiApiKey: '  ' } } as AuthRequest;
      const res = createMockResponse();

      updateSettings(req, res, mockNext);
      await flushPromises();

      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ aiApiKey: null }),
        }),
      );
    });
  });
});
