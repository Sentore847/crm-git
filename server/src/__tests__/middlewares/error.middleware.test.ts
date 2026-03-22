import { errorHandler } from '../../middlewares/error.middleware';
import { AppError } from '../../utils/app-error';
import { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
  let mockReq: Request;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {} as Request;
    mockRes = { status: statusMock, json: jsonMock } as any;
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle AppError with correct status and message', () => {
    const error = new AppError(404, 'Not found');
    errorHandler(error, mockReq, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Not found' });
  });

  it('should handle AppError 400', () => {
    const error = new AppError(400, 'Bad request');
    errorHandler(error, mockReq, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Bad request' });
  });

  it('should return 500 for generic errors', () => {
    const error = new Error('Something went wrong');
    errorHandler(error, mockReq, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should return 500 for non-error objects', () => {
    errorHandler('string error', mockReq, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should log unhandled errors to console', () => {
    const error = new Error('unhandled');
    errorHandler(error, mockReq, mockRes as Response, mockNext);
    expect(console.error).toHaveBeenCalledWith('Unhandled error:', error);
  });

  it('should not log AppError to console', () => {
    const error = new AppError(400, 'expected');
    errorHandler(error, mockReq, mockRes as Response, mockNext);
    expect(console.error).not.toHaveBeenCalled();
  });
});
