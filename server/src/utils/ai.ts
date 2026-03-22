import axios from 'axios';
import { env } from '../config/env';
import {
  OPENAI_MAX_TOKENS,
  OPENAI_TEMPERATURE,
} from '../constants/ai.constants';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export const isAiConfigured = () => Boolean(env.OPENAI_API_KEY);

export const generateSummaryFromPrompt = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  let content = '';

  try {
    const response = await axios.post<ChatCompletionResponse>(
      `${env.OPENAI_BASE_URL}/chat/completions`,
      {
        model: env.OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        max_tokens: OPENAI_MAX_TOKENS,
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
      const apiErrorMessage = (error.response?.data as { error?: { message?: string } } | undefined)
        ?.error?.message;
      throw new Error(apiErrorMessage || `OpenAI request failed with status ${error.response?.status}`);
    }

    throw error;
  }

  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return content;
};
