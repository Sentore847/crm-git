import { prisma } from "../utils/prisma";
import {
  detectProviderFromRepositoryUrl,
  fetchBranchesByProvider,
  fetchIssuesByProvider,
  fetchPullRequestsByProvider,
  fetchRepositoryByProvider,
  parseRepoInput,
} from "../utils/repository-provider";
import { AppError } from "../utils/app-error";
import { mapProviderError } from "../utils/provider-error";
import {
  BRANCH_DEFAULT_SORT,
  ISSUE_DEFAULT_SORT,
  PROJECT_LIST_DEFAULT_LIMIT,
  PROJECT_LIST_MAX_LIMIT,
  PROJECTS_PAGE_DEFAULT,
  PROJECTS_PAGE_DEFAULT_LIMIT,
  PROJECTS_PAGE_MAX_LIMIT,
  PULL_REQUEST_DEFAULT_SORT,
} from "../constants/project.constants";

const PROJECT_NOT_FOUND_MESSAGE = "Project not found or access denied";

export type BranchSort = "latest" | "oldest";
export type IssueSort = "newest" | "oldest";
export type PullRequestSort = "recent" | "oldest";

const toUnixSeconds = (isoDate: string) =>
  Math.floor(new Date(isoDate).getTime() / 1000);

const sortByDate = <T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  direction: "asc" | "desc",
) => {
  const sorted = [...items].sort((a, b) => {
    const aDate = getDate(a);
    const bDate = getDate(b);

    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;

    return bTime - aTime;
  });

  if (direction === "asc") {
    sorted.reverse();
  }

  return sorted;
};

const parseLimit = (value: unknown) => {
  if (typeof value !== "number" && typeof value !== "string") {
    return PROJECT_LIST_DEFAULT_LIMIT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return PROJECT_LIST_DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(PROJECT_LIST_MAX_LIMIT, parsed));
};

const parseProjectsPage = (value: unknown) => {
  if (typeof value !== "number" && typeof value !== "string") {
    return PROJECTS_PAGE_DEFAULT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return PROJECTS_PAGE_DEFAULT;
  }

  return Math.max(1, parsed);
};

const parseProjectsLimit = (value: unknown) => {
  if (typeof value !== "number" && typeof value !== "string") {
    return PROJECTS_PAGE_DEFAULT_LIMIT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return PROJECTS_PAGE_DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(PROJECTS_PAGE_MAX_LIMIT, parsed));
};

const parseBranchSort = (sort: unknown): BranchSort => {
  if (sort === "latest" || sort === "oldest") {
    return sort;
  }

  return BRANCH_DEFAULT_SORT as BranchSort;
};

const parseIssueSort = (sort: unknown): IssueSort => {
  if (sort === "newest" || sort === "oldest") {
    return sort;
  }

  return ISSUE_DEFAULT_SORT as IssueSort;
};

const parsePullRequestSort = (sort: unknown): PullRequestSort => {
  if (sort === "recent" || sort === "oldest") {
    return sort;
  }

  return PULL_REQUEST_DEFAULT_SORT as PullRequestSort;
};


export const getOwnedProjectOrThrow = async (
  projectId: string,
  userId: string,
) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || project.userId !== userId) {
    throw new AppError(404, PROJECT_NOT_FOUND_MESSAGE);
  }

  return project;
};

export const addProjectForUser = async (userId: string, repoPath: string) => {
  let parsedInput: ReturnType<typeof parseRepoInput>;

  try {
    parsedInput = parseRepoInput(repoPath);
  } catch (error: unknown) {
    throw new AppError(
      400,
      error instanceof Error ? error.message : "Invalid repository path",
    );
  }

  const { owner, name, provider } = parsedInput;

  const existingCandidates = await prisma.project.findMany({
    where: { owner, name, userId },
  });

  const existingProject = existingCandidates.find(
    (project) => detectProviderFromRepositoryUrl(project.url) === provider,
  );

  if (existingProject) {
    throw new AppError(400, "Project already added");
  }

  try {
    const repository = await fetchRepositoryByProvider(provider, owner, name);

    return await prisma.project.create({
      data: {
        owner,
        name,
        url: repository.htmlUrl,
        stars: repository.stars,
        forks: repository.forks,
        issues: repository.openIssues,
        createdAt: Math.floor(Date.now() / 1000),
        userId,
      },
    });
  } catch (error: unknown) {
    return mapProviderError(provider, error, "Failed to add project");
  }
};

export const getProjectsForUser = async (
  userId: string,
  pageValue: unknown,
  limitValue: unknown,
) => {
  const requestedPage = parseProjectsPage(pageValue);
  const limit = parseProjectsLimit(limitValue);

  const total = await prisma.project.count({
    where: { userId },
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * limit;

  const items = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
};

export const getProjectsForUserLegacy = async (userId: string) => {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getProjectBranchesForUser = async (
  projectId: string,
  userId: string,
  sortValue: unknown,
  limitValue: unknown,
) => {
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const sort = parseBranchSort(sortValue);
  const limit = parseLimit(limitValue);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const branches = await fetchBranchesByProvider(
      provider,
      project.owner,
      project.name,
      limit,
    );
    const direction = sort === "latest" ? "desc" : "asc";

    return {
      project,
      sort,
      limit,
      branches: sortByDate(
        branches,
        (branch) => branch.lastCommitDate,
        direction,
      ),
    };
  } catch (error: unknown) {
    return mapProviderError(provider, error, "Failed to fetch branches");
  }
};

export const getProjectIssuesForUser = async (
  projectId: string,
  userId: string,
  sortValue: unknown,
  limitValue: unknown,
) => {
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const sort = parseIssueSort(sortValue);
  const limit = parseLimit(limitValue);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const direction = sort === "newest" ? "desc" : "asc";
    const issues = await fetchIssuesByProvider(
      provider,
      project.owner,
      project.name,
      limit,
      direction,
    );

    return {
      project,
      sort,
      limit,
      issues,
    };
  } catch (error: unknown) {
    return mapProviderError(provider, error, "Failed to fetch issues");
  }
};

export const getProjectPullRequestsForUser = async (
  projectId: string,
  userId: string,
  sortValue: unknown,
  limitValue: unknown,
) => {
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const sort = parsePullRequestSort(sortValue);
  const limit = parseLimit(limitValue);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const direction = sort === "recent" ? "desc" : "asc";
    const pullRequests = await fetchPullRequestsByProvider(
      provider,
      project.owner,
      project.name,
      limit,
      direction,
    );

    return {
      project,
      sort,
      limit,
      pullRequests,
    };
  } catch (error: unknown) {
    return mapProviderError(provider, error, "Failed to fetch pull requests");
  }
};

export const getProjectDetailsForUser = async (
  projectId: string,
  userId: string,
) => {
  const [branchesPayload, issuesPayload, pullRequestsPayload] =
    await Promise.all([
      getProjectBranchesForUser(
        projectId,
        userId,
        BRANCH_DEFAULT_SORT,
        PROJECT_LIST_DEFAULT_LIMIT,
      ),
      getProjectIssuesForUser(
        projectId,
        userId,
        ISSUE_DEFAULT_SORT,
        PROJECT_LIST_DEFAULT_LIMIT,
      ),
      getProjectPullRequestsForUser(
        projectId,
        userId,
        PULL_REQUEST_DEFAULT_SORT,
        PROJECT_LIST_DEFAULT_LIMIT,
      ),
    ]);

  return {
    project: branchesPayload.project,
    branches: branchesPayload.branches,
    issues: issuesPayload.issues,
    pullRequests: pullRequestsPayload.pullRequests,
  };
};

export const deleteProjectForUser = async (
  projectId: string,
  userId: string,
) => {
  await getOwnedProjectOrThrow(projectId, userId);
  await prisma.project.delete({ where: { id: projectId } });
};

export const updateProjectForUser = async (
  projectId: string,
  userId: string,
) => {
  const project = await getOwnedProjectOrThrow(projectId, userId);
  const provider = detectProviderFromRepositoryUrl(project.url);

  try {
    const repository = await fetchRepositoryByProvider(
      provider,
      project.owner,
      project.name,
    );

    return await prisma.project.update({
      where: { id: project.id },
      data: {
        url: repository.htmlUrl,
        stars: repository.stars,
        forks: repository.forks,
        issues: repository.openIssues,
        createdAt: toUnixSeconds(repository.createdAt),
      },
    });
  } catch (error: unknown) {
    return mapProviderError(provider, error, "Failed to update project");
  }
};
