const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }
  return value;
};

export const env = {
  JWT_SECRET: requireEnv('JWT_SECRET'),
  PORT: Number(process.env.PORT || process.env.PORT_BACKEND || 5000),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITLAB_TOKEN: process.env.GITLAB_TOKEN,
  BITBUCKET_USERNAME: process.env.BITBUCKET_USERNAME,
  BITBUCKET_APP_PASSWORD: process.env.BITBUCKET_APP_PASSWORD,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;
