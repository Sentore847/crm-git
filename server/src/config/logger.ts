import pino from 'pino';
import pinoHttp from 'pino-http';

const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: !isTest,
});
