import jwt from 'jsonwebtoken';
import { signToken } from '../../utils/jwt';

describe('signToken', () => {
  it('should return a valid JWT string', () => {
    const token = signToken({ userId: 'user-123' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should contain the correct payload', () => {
    const token = signToken({ userId: 'user-456' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    expect(decoded.userId).toBe('user-456');
  });

  it('should set expiration to 1 day', () => {
    const token = signToken({ userId: 'user-789' });
    const decoded = jwt.decode(token) as { exp: number; iat: number };
    const diff = decoded.exp - decoded.iat;
    expect(diff).toBe(86400); // 1 day in seconds
  });

  it('should produce different tokens for different payloads', () => {
    const token1 = signToken({ userId: 'a' });
    const token2 = signToken({ userId: 'b' });
    expect(token1).not.toBe(token2);
  });
});
