import axios from 'axios';
import { env } from '../config/env';
import {
  fetchBranchesWithCommits as fetchGithubBranchesWithCommits,
  fetchCommitsForBranch as fetchGithubCommitsForBranch,
  fetchIssuesSlice as fetchGithubIssuesSlice,
  fetchPullRequestsSlice as fetchGithubPullRequestsSlice,
  fetchRepository as fetchGithubRepository,
} from './github';
import { GITHUB_MAX_PAGES, GITHUB_PAGE_SIZE, GITHUB_REQUEST_TIMEOUT_MS } from '../constants/github.constants';

export type RepoProvider = 'github' | 'gitlab' | 'bitbucket';
export type SortDirection = 'asc' | 'desc';

export interface ParsedRepositoryPath {
  provider: RepoProvider;
  owner: string;
  name: string;
}

export interface UnifiedRepository {
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
}

export interface UnifiedBranch {
  name: string;
  commitSha: string;
  commitUrl: string;
  lastCommitMessage: string;
  lastCommitDate?: string;
  lastCommitAuthor?: string;
}

export interface UnifiedIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user?: {
    login?: string;
  };
}

export interface UnifiedPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  draft?: boolean;
  html_url: string;
  user?: {
    login?: string;
  };
}

export interface UnifiedCommit {
  sha: string;
  message: string;
  authoredAt?: string;
  author?: string;
  htmlUrl: string;
}

interface BitbucketPaginated<T> {
  values: T[];
  next?: string;
  size?: number;
}

interface GitLabRepository {
  web_url: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
}

interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    web_url?: string;
    title?: string;
    message?: string;
    authored_date?: string;
    author_name?: string;
    committer_name?: string;
  };
}

interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  web_url: string;
  author?: {
    username?: string;
  };
}

interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  web_url: string;
  draft?: boolean;
  work_in_progress?: boolean;
  author?: {
    username?: string;
  };
}

interface GitLabCommit {
  id: string;
  message: string;
  authored_date?: string;
  author_name?: string;
  web_url?: string;
}

interface BitbucketRepository {
  links?: {
    html?: {
      href?: string;
    };
  };
  created_on: string;
}

interface BitbucketBranch {
  name: string;
  target?: {
    hash?: string;
    date?: string;
    message?: string;
    author?: {
      raw?: string;
    };
    links?: {
      html?: {
        href?: string;
      };
    };
  };
}

interface BitbucketIssue {
  id: number;
  title: string;
  state: string;
  created_on: string;
  updated_on?: string;
  links?: {
    html?: {
      href?: string;
    };
  };
  reporter?: {
    nickname?: string;
    username?: string;
    display_name?: string;
  };
}

interface BitbucketPullRequest {
  id: number;
  title: string;
  state: string;
  created_on: string;
  updated_on: string;
  links?: {
    html?: {
      href?: string;
    };
  };
  author?: {
    nickname?: string;
    username?: string;
    display_name?: string;
  };
  draft?: boolean;
}

interface BitbucketCommit {
  hash: string;
  message: string;
  date?: string;
  author?: {
    raw?: string;
  };
  links?: {
    html?: {
      href?: string;
    };
  };
}

const gitlabClient = axios.create({
  baseURL: 'https://gitlab.com/api/v4',
  timeout: GITHUB_REQUEST_TIMEOUT_MS,
  headers: env.GITLAB_TOKEN ? { 'PRIVATE-TOKEN': env.GITLAB_TOKEN } : undefined,
});

const bitbucketClient = axios.create({
  baseURL: 'https://api.bitbucket.org/2.0',
  timeout: GITHUB_REQUEST_TIMEOUT_MS,
  auth:
    env.BITBUCKET_USERNAME && env.BITBUCKET_APP_PASSWORD
      ? {
          username: env.BITBUCKET_USERNAME,
          password: env.BITBUCKET_APP_PASSWORD,
        }
      : undefined,
});

const trimGitSuffix = (value: string) => value.replace(/\.git$/i, '');

const normalizeLimit = (value: number, max = GITHUB_PAGE_SIZE * GITHUB_MAX_PAGES) => {
  if (!Number.isInteger(value) || value <= 0) {
    return GITHUB_PAGE_SIZE;
  }

  return Math.min(value, max);
};

const parseHostProvider = (host: string): RepoProvider | null => {
  if (host.includes('github.com')) {
    return 'github';
  }

  if (host.includes('gitlab.com')) {
    return 'gitlab';
  }

  if (host.includes('bitbucket.org')) {
    return 'bitbucket';
  }

  return null;
};

const parseFromProviderPath = (provider: RepoProvider, rawPath: string): ParsedRepositoryPath => {
  const normalizedPath = trimGitSuffix(rawPath.trim().replace(/^\/+|\/+$/g, ''));
  const chunks = normalizedPath.split('/').filter(Boolean);

  if (provider === 'gitlab') {
    if (chunks.length < 2) {
      throw new Error('Invalid repo path. Use "gitlab:group/repo" (subgroups are supported).');
    }

    return {
      provider,
      owner: chunks.slice(0, -1).join('/'),
      name: chunks[chunks.length - 1],
    };
  }

  if (chunks.length !== 2) {
    throw new Error(`Invalid repo path. Use format "${provider}:owner/repo".`);
  }

  return {
    provider,
    owner: chunks[0],
    name: chunks[1],
  };
};

const parseFromUrl = (repoUrl: string): ParsedRepositoryPath => {
  const url = new URL(repoUrl.trim());
  const provider = parseHostProvider(url.hostname.toLowerCase());

  if (!provider) {
    throw new Error('Unsupported repository host. Use GitHub, GitLab or Bitbucket.');
  }

  const rawChunks = url.pathname.split('/').filter(Boolean).map(chunk => trimGitSuffix(chunk));

  if (provider === 'gitlab') {
    const dashIndex = rawChunks.indexOf('-');
    const repoChunks = dashIndex >= 0 ? rawChunks.slice(0, dashIndex) : rawChunks;
    return parseFromProviderPath(provider, repoChunks.join('/'));
  }

  return parseFromProviderPath(provider, rawChunks.slice(0, 2).join('/'));
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFirstLine = (message: string | undefined) => (message || '').split('\n')[0] || '';

const gitlabProjectId = (owner: string, name: string) => encodeURIComponent(`${owner}/${name}`);

const fetchGitlabPaged = async <T>(
  endpoint: string,
  requestedLimit: number,
  params?: Record<string, string | number>
) => {
  const limit = normalizeLimit(requestedLimit);
  const items: T[] = [];
  let page = 1;

  while (items.length < limit && page <= GITHUB_MAX_PAGES) {
    const perPage = Math.min(GITHUB_PAGE_SIZE, limit - items.length);
    const response = await gitlabClient.get<T[]>(endpoint, {
      params: {
        ...params,
        per_page: perPage,
        page,
      },
    });

    items.push(...response.data);

    if (response.data.length < perPage) {
      break;
    }

    page += 1;
  }

  return items.slice(0, limit);
};

const fetchBitbucketPaged = async <T>(
  endpoint: string,
  requestedLimit: number,
  params?: Record<string, string | number>
) => {
  const limit = normalizeLimit(requestedLimit);
  const items: T[] = [];
  let nextUrl: string | undefined = endpoint;
  let shouldUseParams = true;

  while (items.length < limit && nextUrl) {
    const response: { data: BitbucketPaginated<T> } = await bitbucketClient.get(nextUrl, {
      params: shouldUseParams
        ? {
            ...params,
            pagelen: Math.min(100, limit),
          }
        : undefined,
    });

    items.push(...response.data.values);
    nextUrl = response.data.next;
    shouldUseParams = false;
  }

  return items.slice(0, limit);
};

const fetchBitbucketCollectionSize = async (
  endpoint: string,
  params?: Record<string, string | number>
) => {
  const response = await bitbucketClient.get<BitbucketPaginated<unknown>>(endpoint, {
    params: {
      ...params,
      pagelen: 1,
    },
  });

  return toNumber(response.data.size);
};

const fetchBitbucketOpenIssuesCount = async (owner: string, name: string) => {
  try {
    return await fetchBitbucketCollectionSize(`/repositories/${owner}/${name}/issues`, {
      q: 'state = "new" OR state = "open"',
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return 0;
    }

    throw error;
  }
};

const mapGitlabBranch = (owner: string, name: string, branch: GitLabBranch): UnifiedBranch => {
  const commit = branch.commit;
  const commitSha = commit.id || '';
  const commitUrl = commit.web_url || `https://gitlab.com/${owner}/${name}/-/commit/${commitSha}`;

  return {
    name: branch.name,
    commitSha,
    commitUrl,
    lastCommitMessage: toFirstLine(commit.title || commit.message),
    lastCommitDate: commit.authored_date,
    lastCommitAuthor: commit.author_name || commit.committer_name,
  };
};

const mapBitbucketBranch = (owner: string, name: string, branch: BitbucketBranch): UnifiedBranch => {
  const target = branch.target || {};
  const commitSha = target.hash || '';
  const commitUrl = target.links?.html?.href || `https://bitbucket.org/${owner}/${name}/commits/${commitSha}`;

  return {
    name: branch.name,
    commitSha,
    commitUrl,
    lastCommitMessage: toFirstLine(target.message),
    lastCommitDate: target.date,
    lastCommitAuthor: target.author?.raw,
  };
};

export const parseRepoInput = (repoPath: string): ParsedRepositoryPath => {
  const trimmed = repoPath.trim();
  const hasProtocol = /^https?:\/\//i.test(trimmed);

  try {
    if (hasProtocol) {
      return parseFromUrl(trimmed);
    }

    const prefixed = trimmed.match(/^(github|gitlab|bitbucket):(.+)$/i);
    if (prefixed) {
      return parseFromProviderPath(prefixed[1].toLowerCase() as RepoProvider, prefixed[2]);
    }

    return parseFromProviderPath('github', trimmed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid repository path.';
    throw new Error(
      `${message} Supported formats: "owner/repo" (GitHub), "gitlab:group/repo", "bitbucket:workspace/repo" or full HTTPS URL.`
    );
  }
};

export const detectProviderFromRepositoryUrl = (repositoryUrl: string): RepoProvider => {
  try {
    const parsed = new URL(repositoryUrl);
    return parseHostProvider(parsed.hostname.toLowerCase()) || 'github';
  } catch {
    return 'github';
  }
};

export const fetchRepositoryByProvider = async (
  provider: RepoProvider,
  owner: string,
  name: string
): Promise<UnifiedRepository> => {
  if (provider === 'github') {
    const repository = await fetchGithubRepository(owner, name);
    return {
      htmlUrl: repository.html_url,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
      createdAt: repository.created_at,
    };
  }

  if (provider === 'gitlab') {
    const response = await gitlabClient.get<GitLabRepository>(`/projects/${gitlabProjectId(owner, name)}`);
    return {
      htmlUrl: response.data.web_url,
      stars: toNumber(response.data.star_count),
      forks: toNumber(response.data.forks_count),
      openIssues: toNumber(response.data.open_issues_count),
      createdAt: response.data.created_at,
    };
  }

  const [repositoryResponse, stars, forks, openIssues] = await Promise.all([
    bitbucketClient.get<BitbucketRepository>(`/repositories/${owner}/${name}`),
    fetchBitbucketCollectionSize(`/repositories/${owner}/${name}/watchers`),
    fetchBitbucketCollectionSize(`/repositories/${owner}/${name}/forks`),
    fetchBitbucketOpenIssuesCount(owner, name),
  ]);

  return {
    htmlUrl: repositoryResponse.data.links?.html?.href || `https://bitbucket.org/${owner}/${name}`,
    stars,
    forks,
    openIssues,
    createdAt: repositoryResponse.data.created_on,
  };
};

export const fetchBranchesByProvider = async (
  provider: RepoProvider,
  owner: string,
  name: string,
  requestedLimit: number
): Promise<UnifiedBranch[]> => {
  if (provider === 'github') {
    return fetchGithubBranchesWithCommits(owner, name, requestedLimit);
  }

  if (provider === 'gitlab') {
    const branches = await fetchGitlabPaged<GitLabBranch>(
      `/projects/${gitlabProjectId(owner, name)}/repository/branches`,
      requestedLimit
    );

    return branches.map(branch => mapGitlabBranch(owner, name, branch));
  }

  const branches = await fetchBitbucketPaged<BitbucketBranch>(
    `/repositories/${owner}/${name}/refs/branches`,
    requestedLimit,
    { sort: '-target.date' }
  );

  return branches.map(branch => mapBitbucketBranch(owner, name, branch));
};

export const fetchIssuesByProvider = async (
  provider: RepoProvider,
  owner: string,
  name: string,
  requestedLimit: number,
  direction: SortDirection
): Promise<UnifiedIssue[]> => {
  if (provider === 'github') {
    return fetchGithubIssuesSlice(owner, name, requestedLimit, direction);
  }

  if (provider === 'gitlab') {
    const issues = await fetchGitlabPaged<GitLabIssue>(
      `/projects/${gitlabProjectId(owner, name)}/issues`,
      requestedLimit,
      {
        state: 'all',
        order_by: 'created_at',
        sort: direction,
      }
    );

    return issues.map(issue => ({
      id: toNumber(issue.id),
      number: toNumber(issue.iid),
      title: issue.title,
      state: issue.state,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.web_url,
      user: { login: issue.author?.username },
    }));
  }

  const sort = direction === 'desc' ? '-created_on' : 'created_on';
  const issues = await fetchBitbucketPaged<BitbucketIssue>(
    `/repositories/${owner}/${name}/issues`,
    requestedLimit,
    { sort }
  );

  return issues.map(issue => ({
    id: toNumber(issue.id),
    number: toNumber(issue.id),
    title: issue.title,
    state: issue.state,
    created_at: issue.created_on,
    updated_at: issue.updated_on || issue.created_on,
    html_url: issue.links?.html?.href || `https://bitbucket.org/${owner}/${name}/issues/${issue.id}`,
    user: {
      login: issue.reporter?.username || issue.reporter?.nickname || issue.reporter?.display_name,
    },
  }));
};

export const fetchPullRequestsByProvider = async (
  provider: RepoProvider,
  owner: string,
  name: string,
  requestedLimit: number,
  direction: SortDirection
): Promise<UnifiedPullRequest[]> => {
  if (provider === 'github') {
    return fetchGithubPullRequestsSlice(owner, name, requestedLimit, direction);
  }

  if (provider === 'gitlab') {
    const mergeRequests = await fetchGitlabPaged<GitLabMergeRequest>(
      `/projects/${gitlabProjectId(owner, name)}/merge_requests`,
      requestedLimit,
      {
        state: 'all',
        order_by: 'updated_at',
        sort: direction,
      }
    );

    return mergeRequests.map(mergeRequest => ({
      id: toNumber(mergeRequest.id),
      number: toNumber(mergeRequest.iid),
      title: mergeRequest.title,
      state: mergeRequest.state,
      created_at: mergeRequest.created_at,
      updated_at: mergeRequest.updated_at,
      merged_at: mergeRequest.merged_at,
      draft: Boolean(mergeRequest.draft || mergeRequest.work_in_progress),
      html_url: mergeRequest.web_url,
      user: { login: mergeRequest.author?.username },
    }));
  }

  const sort = direction === 'desc' ? '-updated_on' : 'updated_on';
  const pullRequests = await fetchBitbucketPaged<BitbucketPullRequest>(
    `/repositories/${owner}/${name}/pullrequests`,
    requestedLimit,
    {
      q: 'state = "OPEN" OR state = "MERGED" OR state = "DECLINED"',
      sort,
    }
  );

  return pullRequests.map(pullRequest => ({
    id: toNumber(pullRequest.id),
    number: toNumber(pullRequest.id),
    title: pullRequest.title,
    state: pullRequest.state,
    created_at: pullRequest.created_on,
    updated_at: pullRequest.updated_on,
    merged_at: pullRequest.state === 'MERGED' ? pullRequest.updated_on : null,
    draft: Boolean(pullRequest.draft),
    html_url:
      pullRequest.links?.html?.href || `https://bitbucket.org/${owner}/${name}/pull-requests/${pullRequest.id}`,
    user: {
      login:
        pullRequest.author?.username || pullRequest.author?.nickname || pullRequest.author?.display_name,
    },
  }));
};

export const fetchCommitsByProvider = async (
  provider: RepoProvider,
  owner: string,
  name: string,
  branch: string,
  requestedLimit: number
): Promise<UnifiedCommit[]> => {
  if (provider === 'github') {
    const commits = await fetchGithubCommitsForBranch(owner, name, branch, requestedLimit);

    return commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      authoredAt: commit.commit.author?.date || commit.commit.committer?.date,
      author: commit.author?.login || commit.commit.author?.name || commit.commit.committer?.name,
      htmlUrl: commit.html_url,
    }));
  }

  if (provider === 'gitlab') {
    const commits = await fetchGitlabPaged<GitLabCommit>(
      `/projects/${gitlabProjectId(owner, name)}/repository/commits`,
      requestedLimit,
      {
        ref_name: branch,
      }
    );

    return commits.map(commit => ({
      sha: commit.id,
      message: commit.message,
      authoredAt: commit.authored_date,
      author: commit.author_name,
      htmlUrl: commit.web_url || `https://gitlab.com/${owner}/${name}/-/commit/${commit.id}`,
    }));
  }

  const commits = await fetchBitbucketPaged<BitbucketCommit>(
    `/repositories/${owner}/${name}/commits/${encodeURIComponent(branch)}`,
    requestedLimit
  );

  return commits.map(commit => ({
    sha: commit.hash,
    message: commit.message,
    authoredAt: commit.date,
    author: commit.author?.raw,
    htmlUrl: commit.links?.html?.href || `https://bitbucket.org/${owner}/${name}/commits/${commit.hash}`,
  }));
};
