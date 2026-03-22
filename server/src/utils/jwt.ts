import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
};
