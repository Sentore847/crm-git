import axios from 'axios';
import { env } from '../config/env';
import {
  AI_MAX_TOKENS,
  AI_TEMPERATURE,
  AI_PROVIDERS,
} from '../constants/ai.constants';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface AiConfig {
  apiKey: string;
  provider: string;
  model?: string | null;
  baseUrl?: string | null;
}

const resolveBaseUrl = (config: AiConfig): string => {
  if (config.provider === 'custom') {
    return config.baseUrl || '';
  }

  const providerConfig = AI_PROVIDERS[config.provider];
  return providerConfig?.baseUrl || AI_PROVIDERS.openai.baseUrl;
};

const resolveModel = (config: AiConfig): string => {
  if (config.model) {
    return config.model;
  }

  const providerConfig = AI_PROVIDERS[config.provider];
  return providerConfig?.defaultModel || 'gpt-4o-mini';
};

export const isAiConfigured = (userApiKey?: string | null) =>
  Boolean(userApiKey) || Boolean(env.OPENAI_API_KEY);

export const generateSummaryFromPrompt = async (
  systemPrompt: string,
  userPrompt: string,
  aiConfig?: AiConfig | null,
  maxTokens?: number
): Promise<string> => {
  const apiKey = aiConfig?.apiKey || env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('AI API key is not configured. Set your key in Settings.');
  }

  const baseUrl = aiConfig ? resolveBaseUrl(aiConfig) : env.OPENAI_BASE_URL;
  const model = aiConfig ? resolveModel(aiConfig) : env.OPENAI_MODEL;

  if (!baseUrl) {
    throw new Error('AI Base URL is not configured. Check your provider settings.');
  }

  let content = '';

  try {
    const response = await axios.post<ChatCompletionResponse>(
      `${baseUrl}/chat/completions`,
      {
        model,
        temperature: AI_TEMPERATURE,
        max_tokens: maxTokens || AI_MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    content = response.data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
      const apiErrorMessage = data?.error?.message || data?.message;

      if (status === 429) {
        throw new Error('Rate limit exceeded. Your AI provider is throttling requests — wait a moment and try again, or upgrade your plan.');
      }

      if (status === 401) {
        throw new Error('Invalid API key. Check your key in Settings.');
      }

      if (status === 403) {
        throw new Error('Access denied. Your API key may lack permissions or your provider account needs activation.');
      }

      throw new Error(apiErrorMessage || `AI request failed with status ${status}`);
    }

    throw error;
  }

  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return content;
};
