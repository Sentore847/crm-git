import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/app-error';
import { logger } from '../config/logger';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isAppError(err)) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({ message: 'Internal server error' });
};
