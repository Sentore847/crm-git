import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.coerce.number().int().positive().default(5000),
  PORT_BACKEND: z.coerce.number().int().positive().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITLAB_TOKEN: z.string().optional(),
  BITBUCKET_USERNAME: z.string().optional(),
  BITBUCKET_APP_PASSWORD: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

const data = parsed.data;

export const env = {
  JWT_SECRET: data.JWT_SECRET,
  PORT: data.PORT_BACKEND ?? data.PORT,
  GITHUB_TOKEN: data.GITHUB_TOKEN,
  GITLAB_TOKEN: data.GITLAB_TOKEN,
  BITBUCKET_USERNAME: data.BITBUCKET_USERNAME,
  BITBUCKET_APP_PASSWORD: data.BITBUCKET_APP_PASSWORD,
  OPENAI_API_KEY: data.OPENAI_API_KEY,
  OPENAI_BASE_URL: data.OPENAI_BASE_URL,
  OPENAI_MODEL: data.OPENAI_MODEL,
  CORS_ORIGIN: data.CORS_ORIGIN,
} as const;
