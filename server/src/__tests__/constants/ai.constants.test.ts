import { AI_TEMPERATURE, AI_MAX_TOKENS, AI_PROVIDERS } from '../../constants/ai.constants';

describe('AI Constants', () => {
  it('should have correct temperature', () => {
    expect(AI_TEMPERATURE).toBe(0.2);
  });

  it('should have correct max tokens', () => {
    expect(AI_MAX_TOKENS).toBe(450);
  });

  it('should define all expected providers', () => {
    expect(AI_PROVIDERS).toHaveProperty('openai');
    expect(AI_PROVIDERS).toHaveProperty('gemini');
    expect(AI_PROVIDERS).toHaveProperty('deepseek');
    expect(AI_PROVIDERS).toHaveProperty('openrouter');
    expect(AI_PROVIDERS).toHaveProperty('custom');
  });

  it('should have valid baseUrl for each non-custom provider', () => {
    const providerKeys = ['openai', 'gemini', 'deepseek', 'openrouter'];
    for (const key of providerKeys) {
      expect(AI_PROVIDERS[key].baseUrl).toBeTruthy();
      expect(AI_PROVIDERS[key].baseUrl.startsWith('https://')).toBe(true);
    }
  });

  it('should have defaultModel for each non-custom provider', () => {
    const providerKeys = ['openai', 'gemini', 'deepseek', 'openrouter'];
    for (const key of providerKeys) {
      expect(AI_PROVIDERS[key].defaultModel).toBeTruthy();
    }
  });

  it('should have empty baseUrl and defaultModel for custom provider', () => {
    expect(AI_PROVIDERS.custom.baseUrl).toBe('');
    expect(AI_PROVIDERS.custom.defaultModel).toBe('');
  });

  it('should have label for each provider', () => {
    for (const key of Object.keys(AI_PROVIDERS)) {
      expect(AI_PROVIDERS[key].label).toBeTruthy();
    }
  });

  it('openai should use gpt-4o-mini as default model', () => {
    expect(AI_PROVIDERS.openai.defaultModel).toBe('gpt-4o-mini');
  });
});
