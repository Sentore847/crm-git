import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/app-error';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isAppError(err)) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Internal server error' });
};
