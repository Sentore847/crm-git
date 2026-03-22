import axios from "axios";
import { AppError } from "./app-error";
import { RepoProvider } from "./repository-provider";

const providerLabelMap: Record<RepoProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

export const getProviderLabel = (provider: RepoProvider): string =>
  providerLabelMap[provider];

export const mapProviderError = (
  provider: RepoProvider,
  error: unknown,
  fallbackMessage: string,
  notFoundMessage?: string,
): never => {
  const providerLabel = providerLabelMap[provider];

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new AppError(
        404,
        notFoundMessage || `Repository not found on ${providerLabel}`,
      );
    }

    if (error.response?.status === 401) {
      throw new AppError(
        401,
        `Unauthorized request to ${providerLabel} API. Check access token/credentials for private repositories.`,
      );
    }

    if (error.response?.status === 403 || error.response?.status === 429) {
      throw new AppError(
        429,
        `${providerLabel} API rate limit exceeded. Retry later or configure provider token.`,
      );
    }
  }

  throw new AppError(500, fallbackMessage);
};
