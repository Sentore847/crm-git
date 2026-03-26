import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Strict limiter for auth endpoints (login/signup).
 * Prevents brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: isTest ? 0 : 5, // 0 = disabled in test
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again after 1 minute' },
  skip: () => isTest,
});

/**
 * Moderate limiter for AI endpoints.
 * These proxy to paid external APIs (OpenAI, Gemini, etc.).
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: isTest ? 0 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please try again after 1 minute' },
  skip: () => isTest,
});

/**
 * General API limiter for all other endpoints.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: isTest ? 0 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again after 1 minute' },
  skip: () => isTest,
});
