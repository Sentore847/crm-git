import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../../middlewares/auth.middleware';
import { Response, NextFunction } from 'express';

describe('authenticate middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { headers: {} };
    mockRes = { status: statusMock, json: jsonMock } as any;
    mockNext = jest.fn();
  });

  it('should return 401 when no authorization header', () => {
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    mockReq.headers = { authorization: 'Basic abc123' };
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 for invalid token', () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('should set userId and call next for valid token', () => {
    const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET!);
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(mockReq.userId).toBe('user-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 for expired token', () => {
    const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET!, { expiresIn: '0s' });
    mockReq.headers = { authorization: `Bearer ${token}` };

    // Need a slight delay to ensure token expires
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
  });
});
