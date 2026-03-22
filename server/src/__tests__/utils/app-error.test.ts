import { AppError, isAppError } from '../../utils/app-error';

describe('AppError', () => {
  it('should create an error with statusCode and message', () => {
    const error = new AppError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should set correct prototype chain', () => {
    const error = new AppError(500, 'Server error');
    expect(error instanceof AppError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should preserve stack trace', () => {
    const error = new AppError(400, 'Bad request');
    expect(error.stack).toBeDefined();
  });
});

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    expect(isAppError(new AppError(400, 'test'))).toBe(true);
  });

  it('should return false for regular Error', () => {
    expect(isAppError(new Error('test'))).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(42)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});
