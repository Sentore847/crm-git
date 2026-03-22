import type { Project } from './project.types';

export interface BranchInfo {
  name: string;
  commitSha: string;
  commitUrl: string;
  lastCommitMessage: string;
  lastCommitDate?: string;
  lastCommitAuthor?: string;
}

export interface IssueInfo {
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

export interface PullRequestInfo {
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

export interface ProjectDetailsResponse {
  project: Project;
  branches: BranchInfo[];
  issues: IssueInfo[];
  pullRequests: PullRequestInfo[];
}

export interface BranchesResponse {
  project: Project;
  sort: 'latest' | 'oldest';
  limit: number;
  branches: BranchInfo[];
}

export interface IssuesResponse {
  project: Project;
  sort: 'newest' | 'oldest';
  limit: number;
  issues: IssueInfo[];
}

export interface PullRequestsResponse {
  project: Project;
  sort: 'recent' | 'oldest';
  limit: number;
  pullRequests: PullRequestInfo[];
}

export interface BranchSummaryResponse {
  branchName: string;
  commitsAnalyzed: number;
  summary: string;
}

export interface IssuesSummaryResponse {
  totalIssues?: number;
  issuesAnalyzed: number;
  summary: string;
  latestIssues: IssueInfo[];
}

export interface PullRequestsSummaryResponse {
  totalPullRequests?: number;
  pullRequestsAnalyzed: number;
  summary: string;
  latestPullRequests: PullRequestInfo[];
}
