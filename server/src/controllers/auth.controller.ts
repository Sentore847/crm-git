import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';

const BCRYPT_ROUNDS = 10;

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'User with this email already exists');
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  res.status(201).json({ id: user.id, email: user.email, createdAt: user.createdAt });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = signToken({ userId: user.id });
  res.json({ token });
});
