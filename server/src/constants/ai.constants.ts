export const AI_TEMPERATURE = 0.2;
export const AI_MAX_TOKENS = 450;

export interface AiProviderConfig {
  label: string;
  baseUrl: string;
  defaultModel: string;
}

export const AI_PROVIDERS: Record<string, AiProviderConfig> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    defaultModel: '',
  },
};
