import axios from 'axios';
import { getProviderLabel, mapProviderError } from '../../utils/provider-error';
import { AppError } from '../../utils/app-error';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getProviderLabel', () => {
  it('should return GitHub for github', () => {
    expect(getProviderLabel('github')).toBe('GitHub');
  });

  it('should return GitLab for gitlab', () => {
    expect(getProviderLabel('gitlab')).toBe('GitLab');
  });

  it('should return Bitbucket for bitbucket', () => {
    expect(getProviderLabel('bitbucket')).toBe('Bitbucket');
  });
});

describe('mapProviderError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 404 AppError for 404 axios error', () => {
    const error = { response: { status: 404 }, isAxiosError: true } as any;
    mockedAxios.isAxiosError.mockReturnValue(true);

    expect(() => mapProviderError('github', error, 'fallback')).toThrow(AppError);
    try {
      mapProviderError('github', error, 'fallback');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(404);
      expect((e as AppError).message).toContain('GitHub');
    }
  });

  it('should use custom notFoundMessage for 404', () => {
    const error = { response: { status: 404 }, isAxiosError: true } as any;
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      mapProviderError('gitlab', error, 'fallback', 'Custom not found');
    } catch (e) {
      expect((e as AppError).message).toBe('Custom not found');
    }
  });

  it('should throw 401 AppError for 401 axios error', () => {
    const error = { response: { status: 401 }, isAxiosError: true } as any;
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      mapProviderError('github', error, 'fallback');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
      expect((e as AppError).message).toContain('Unauthorized');
    }
  });

  it('should throw 429 AppError for 403 axios error', () => {
    const error = { response: { status: 403 }, isAxiosError: true } as any;
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      mapProviderError('bitbucket', error, 'fallback');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(429);
      expect((e as AppError).message).toContain('rate limit');
    }
  });

  it('should throw 429 AppError for 429 axios error', () => {
    const error = { response: { status: 429 }, isAxiosError: true } as any;
    mockedAxios.isAxiosError.mockReturnValue(true);

    try {
      mapProviderError('github', error, 'fallback');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(429);
    }
  });

  it('should throw 500 AppError with fallback for unknown errors', () => {
    mockedAxios.isAxiosError.mockReturnValue(false);

    try {
      mapProviderError('github', new Error('unknown'), 'Custom fallback');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(500);
      expect((e as AppError).message).toBe('Custom fallback');
    }
  });
});
