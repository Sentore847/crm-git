import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../utils/prisma';
import { AI_PROVIDERS } from '../constants/ai.constants';

const maskKey = (key: string): string => {
  if (key.length <= 4) {
    return '****';
  }
  return '****' + key.slice(-4);
};

const AI_SETTINGS_SELECT = {
  aiProvider: true,
  aiApiKey: true,
  aiModel: true,
  aiBaseUrl: true,
  hideIntro: true,
} as const;

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: AI_SETTINGS_SELECT,
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({
    aiProvider: user.aiProvider,
    aiApiKey: user.aiApiKey ? maskKey(user.aiApiKey) : null,
    aiModel: user.aiModel,
    aiBaseUrl: user.aiBaseUrl,
    hideIntro: user.hideIntro,
  });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { aiProvider, aiApiKey, aiModel, aiBaseUrl, hideIntro } = req.body as {
    aiProvider?: string;
    aiApiKey?: string | null;
    aiModel?: string | null;
    aiBaseUrl?: string | null;
    hideIntro?: boolean;
  };

  const dataToUpdate: Record<string, unknown> = {};

  if (aiProvider !== undefined) {
    if (typeof aiProvider !== 'string' || (!AI_PROVIDERS[aiProvider])) {
      throw new AppError(400, 'Invalid AI provider');
    }
    dataToUpdate.aiProvider = aiProvider;
  }

  if (aiApiKey !== undefined) {
    if (aiApiKey !== null && typeof aiApiKey !== 'string') {
      throw new AppError(400, 'aiApiKey must be a string or null');
    }
    dataToUpdate.aiApiKey = aiApiKey && aiApiKey.trim().length > 0 ? aiApiKey.trim() : null;
  }

  if (aiModel !== undefined) {
    dataToUpdate.aiModel = aiModel && typeof aiModel === 'string' && aiModel.trim().length > 0
      ? aiModel.trim()
      : null;
  }

  if (aiBaseUrl !== undefined) {
    dataToUpdate.aiBaseUrl = aiBaseUrl && typeof aiBaseUrl === 'string' && aiBaseUrl.trim().length > 0
      ? aiBaseUrl.trim()
      : null;
  }

  if (typeof hideIntro === 'boolean') {
    dataToUpdate.hideIntro = hideIntro;
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: dataToUpdate,
    select: AI_SETTINGS_SELECT,
  });

  res.json({
    aiProvider: updated.aiProvider,
    aiApiKey: updated.aiApiKey ? maskKey(updated.aiApiKey) : null,
    aiModel: updated.aiModel,
    aiBaseUrl: updated.aiBaseUrl,
    hideIntro: updated.hideIntro,
  });
});
