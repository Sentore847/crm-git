import { z } from 'zod';

const validProviders = ['openai', 'gemini', 'deepseek', 'openrouter', 'custom'] as const;

export const updateSettingsBody = z.object({
  aiProvider: z.enum(validProviders, { message: 'Invalid AI provider' }).optional(),
  aiApiKey: z.string().nullable().optional(),
  aiModel: z.string().nullable().optional(),
  aiBaseUrl: z.string().nullable().optional(),
  hideIntro: z.boolean().optional(),
});
