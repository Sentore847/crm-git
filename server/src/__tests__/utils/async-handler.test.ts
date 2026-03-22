import { asyncHandler } from '../../utils/async-handler';
import { Request, Response, NextFunction } from 'express';

const mockReq = {} as Request;
const mockRes = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('asyncHandler', () => {
  it('should call the wrapped function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn();
    const handler = asyncHandler(fn);

    await handler(mockReq, mockRes, next);
    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, next);
  });

  it('should call next with error when function rejects', async () => {
    const error = new Error('test error');
    const fn = jest.fn().mockRejectedValue(error);
    const next = jest.fn();
    const handler = asyncHandler(fn);

    await handler(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with error when async function throws', async () => {
    const error = new Error('async throw');
    const fn = jest.fn().mockImplementation(async () => {
      throw error;
    });
    const next = jest.fn();
    const handler = asyncHandler(fn);

    await handler(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should not call next on success', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn();
    const handler = asyncHandler(fn);

    await handler(mockReq, mockRes, next);
    expect(next).not.toHaveBeenCalled();
  });
});
