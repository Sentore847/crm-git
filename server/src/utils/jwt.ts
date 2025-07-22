import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'JWT is not defined';

export const signToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};
