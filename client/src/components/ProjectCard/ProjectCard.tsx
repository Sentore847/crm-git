import { useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { Project } from '@/types/project.types';
import type {
  BranchesResponse,
  BranchInfo,
  BranchSummaryResponse,
  CodeFixResponse,
  CodeReviewFinding,
  CodeReviewResponse,
  IssueInfo,
  IssuesResponse,
  IssuesSummaryResponse,
  PullRequestInfo,
  PullRequestsResponse,
  PullRequestsSummaryResponse,
} from '@/types/project-details.types';
import api from '@/services/api';
import DeleteProjectButton from '@/components/DeleteProjectButton';
import UpdateProjectButton from '@/components/UpdateProjectButton';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

type InsightsTab = 'branches' | 'issues' | 'pulls' | 'review';
type BranchSortMode = 'latest' | 'oldest';
type IssueSortMode = 'newest' | 'oldest';
type PullRequestSortMode = 'recent' | 'oldest';
type RepoPlatform = 'github' | 'gitlab' | 'bitbucket' | 'unknown';

const INSIGHTS_LIMIT = 80;

const IconBase = ({ children, className }: { children: ReactNode; className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    {children}
  </svg>
);

const IconRepo = () => (
  <IconBase className="project-icon">
    <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
    <path d="M12 3v9" />
    <path d="M4 7.5 12 12l8-4.5" />
  </IconBase>
);

const IconGithub = () => (
  <IconBase className="project-icon">
    <path d="M12 5.2a6.9 6.9 0 0 0-2.2 13.44v-2.2c-.92.2-1.56-.13-1.94-.92-.22-.46-.58-.86-1.04-1.06-.33-.15-.29-.55.08-.57.47-.03.99.2 1.45.86.4.58.9.78 1.52.78.35 0 .72-.08 1.03-.2a2.84 2.84 0 0 1 .8-1.4c-2.5-.28-4.08-1.47-4.08-4.15 0-.9.31-1.74.86-2.4-.2-.62-.16-1.37.07-2.01.02-.05.07-.08.13-.08.7.03 1.37.35 2.01.95a7.3 7.3 0 0 1 4.64 0c.64-.6 1.31-.92 2.01-.95.06 0 .12.03.13.08.23.64.27 1.39.07 2.01.55.66.86 1.5.86 2.4 0 2.69-1.59 3.88-4.1 4.15.49.37.82.98.82 1.8v2.74A6.9 6.9 0 0 0 12 5.2Z" />
  </IconBase>
);

const IconGitlab = () => (
  <IconBase className="project-icon">
    <path d="M6.1 8.2 8.2 3.8a.6.6 0 0 1 1.1.1l1.5 4.3m3.2 0 1.5-4.3a.6.6 0 0 1 1.1-.1l2.1 4.4-6.2 8.6L6.1 8.2Z" />
    <path d="m6.1 8.2 5.9 8.6 6.2-8.6h-12.1Z" />
  </IconBase>
);

const IconBitbucket = () => (
  <IconBase className="project-icon">
    <path d="M5.2 5.8h13.6l-1.4 9.2a1.8 1.8 0 0 1-1.78 1.52H8.38A1.8 1.8 0 0 1 6.6 15L5.2 5.8Z" />
    <path d="M8 9.4h8l-.72 4.55H8.72L8 9.4Z" />
    <path d="M9.9 12.7h4.2" />
  </IconBase>
);

const getRepoPlatformFromUrl = (url: string): RepoPlatform => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('github.com')) {
      return 'github';
    }

    if (hostname.includes('gitlab.com')) {
      return 'gitlab';
    }

    if (hostname.includes('bitbucket.org')) {
      return 'bitbucket';
    }
  } catch {
    return 'unknown';
  }

  return 'unknown';
};

const RepoPlatformIcon = ({ platform }: { platform: RepoPlatform }) => {
  if (platform === 'github') {
    return <IconGithub />;
  }

  if (platform === 'gitlab') {
    return <IconGitlab />;
  }

  if (platform === 'bitbucket') {
    return <IconBitbucket />;
  }

  return <IconRepo />;
};

const IconStar = () => (
  <IconBase className="project-icon metric-icon">
    <path d="m12 3.6 2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.82l-4.8 2.54.92-5.34-3.88-3.78 5.36-.78z" />
  </IconBase>
);

const IconFork = () => (
  <IconBase className="project-icon metric-icon">
    <circle cx="7" cy="5" r="2" />
    <circle cx="17" cy="8" r="2" />
    <circle cx="17" cy="18" r="2" />
    <path d="M9 5h4a4 4 0 0 1 4 3" />
    <path d="M9 5v13a4 4 0 0 0 4 0" />
  </IconBase>
);

const IconIssue = () => (
  <IconBase className="project-icon metric-icon">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v5" />
    <circle cx="12" cy="16.8" r="0.6" fill="currentColor" />
  </IconBase>
);

const IconCalendar = () => (
  <IconBase className="project-icon metric-icon">
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3.5v3" />
    <path d="M16 3.5v3" />
    <path d="M4 9.5h16" />
  </IconBase>
);

const IconBranches = () => (
  <IconBase className="project-icon tab-icon">
    <circle cx="6" cy="4" r="2" />
    <circle cx="18" cy="10" r="2" />
    <circle cx="6" cy="20" r="2" />
    <path d="M8 4h4a4 4 0 0 1 4 4" />
    <path d="M8 20h4a4 4 0 0 0 4-4v-4" />
  </IconBase>
);

const IconPR = () => (
  <IconBase className="project-icon tab-icon">
    <circle cx="6" cy="5" r="2" />
    <circle cx="18" cy="5" r="2" />
    <circle cx="18" cy="19" r="2" />
    <path d="M8 5h8" />
    <path d="M18 7v10" />
    <path d="M8 5v14h8" />
  </IconBase>
);

const IconSpark = () => (
  <IconBase className="project-icon spark-icon">
    <path d="m12 3 2.1 4.9L19 10l-4.9 2.1L12 17l-2.1-4.9L5 10l4.9-2.1z" />
  </IconBase>
);

const IconCodeReview = () => (
  <IconBase className="project-icon tab-icon">
    <path d="M9 7l-4 5 4 5" />
    <path d="M15 7l4 5-4 5" />
    <path d="M13 4l-2 16" />
  </IconBase>
);

const SEVERITY_COLORS: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  practice: 'Bad Practice',
  security: 'Security',
  improvement: 'Improvement',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const ProjectCard = ({ project, onUpdate, onDelete, onToggleFavorite }: Props) => {
  const repoPlatform = getRepoPlatformFromUrl(project.url);
  const [showInsights, setShowInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightsTab>('branches');

  const [branchSortMode, setBranchSortMode] = useState<BranchSortMode>('latest');
  const [issueSortMode, setIssueSortMode] = useState<IssueSortMode>('newest');
  const [pullRequestSortMode, setPullRequestSortMode] = useState<PullRequestSortMode>('recent');

  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [issues, setIssues] = useState<IssueInfo[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequestInfo[]>([]);

  const [loadedTabs, setLoadedTabs] = useState<Record<InsightsTab, boolean>>({
    branches: false,
    issues: false,
    pulls: false,
    review: false,
  });

  const [branchesLoading, setBranchesLoading] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [pullsLoading, setPullsLoading] = useState(false);

  const [branchesError, setBranchesError] = useState('');
  const [issuesError, setIssuesError] = useState('');
  const [pullsError, setPullsError] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchAiLoading, setBranchAiLoading] = useState(false);
  const [branchAiError, setBranchAiError] = useState('');
  const [branchAiSummaries, setBranchAiSummaries] = useState<Record<string, string>>({});

  const [issuesAiLoading, setIssuesAiLoading] = useState(false);
  const [issuesAiError, setIssuesAiError] = useState('');
  const [issuesAiSummary, setIssuesAiSummary] = useState('');

  const [pullsAiLoading, setPullsAiLoading] = useState(false);
  const [pullsAiError, setPullsAiError] = useState('');
  const [pullsAiSummary, setPullsAiSummary] = useState('');

  const [reviewBranch, setReviewBranch] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewFindings, setReviewFindings] = useState<CodeReviewFinding[]>([]);
  const [reviewCommitsAnalyzed, setReviewCommitsAnalyzed] = useState(0);
  const [fixLoadingIndex, setFixLoadingIndex] = useState<number | null>(null);
  const [fixResults, setFixResults] = useState<
    Record<number, { improvedCode: string; explanation: string }>
  >({});
  const [fixError, setFixError] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatProjectDate = (timestamp: number) => new Date(timestamp * 1000).toUTCString();
  const formatIsoDate = (value?: string) => (value ? new Date(value).toUTCString() : '-');

  const loadBranches = async (sortMode: BranchSortMode) => {
    setBranchesLoading(true);
    setBranchesError('');

    try {
      const res = await api.get<BranchesResponse>(`/projects/${project.id}/branches`, {
        params: { sort: sortMode, limit: INSIGHTS_LIMIT },
      });

      setBranches(res.data.branches);
      setSelectedBranch((prev) => {
        if (res.data.branches.length === 0) {
          return '';
        }

        if (prev && res.data.branches.some((branch) => branch.name === prev)) {
          return prev;
        }

        return res.data.branches[0].name;
      });
      setReviewBranch((prev) => {
        if (prev && res.data.branches.some((branch) => branch.name === prev)) {
          return prev;
        }

        return res.data.branches.length > 0 ? res.data.branches[0].name : '';
      });

      setLoadedTabs((prev) => ({ ...prev, branches: true }));
    } catch (error) {
      setBranchesError(getErrorMessage(error, 'Failed to fetch branches'));
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadIssues = async (sortMode: IssueSortMode) => {
    setIssuesLoading(true);
    setIssuesError('');

    try {
      const res = await api.get<IssuesResponse>(`/projects/${project.id}/issues`, {
        params: { sort: sortMode, limit: INSIGHTS_LIMIT },
      });

      setIssues(res.data.issues);
      setLoadedTabs((prev) => ({ ...prev, issues: true }));
    } catch (error) {
      setIssuesError(getErrorMessage(error, 'Failed to fetch issues'));
    } finally {
      setIssuesLoading(false);
    }
  };

  const loadPullRequests = async (sortMode: PullRequestSortMode) => {
    setPullsLoading(true);
    setPullsError('');

    try {
      const res = await api.get<PullRequestsResponse>(`/projects/${project.id}/pulls`, {
        params: { sort: sortMode, limit: INSIGHTS_LIMIT },
      });

      setPullRequests(res.data.pullRequests);
      setLoadedTabs((prev) => ({ ...prev, pulls: true }));
    } catch (error) {
      setPullsError(getErrorMessage(error, 'Failed to fetch pull requests'));
    } finally {
      setPullsLoading(false);
    }
  };

  const ensureTabData = async (tab: InsightsTab) => {
    if (tab === 'branches' && !loadedTabs.branches) {
      await loadBranches(branchSortMode);
      return;
    }

    if (tab === 'issues' && !loadedTabs.issues) {
      await loadIssues(issueSortMode);
      return;
    }

    if (tab === 'pulls' && !loadedTabs.pulls) {
      await loadPullRequests(pullRequestSortMode);
    }

    if (tab === 'review' && !loadedTabs.branches) {
      await loadBranches(branchSortMode);
    }
  };

  const toggleInsights = async () => {
    if (showInsights) {
      setShowInsights(false);
      return;
    }

    setShowInsights(true);
    await ensureTabData(activeTab);
  };

  const switchTab = async (tab: InsightsTab) => {
    setActiveTab(tab);

    if (showInsights) {
      await ensureTabData(tab);
    }
  };

  const handleBranchSortChange = async (newSort: BranchSortMode) => {
    setBranchSortMode(newSort);

    if (showInsights && activeTab === 'branches') {
      await loadBranches(newSort);
    }
  };

  const handleIssueSortChange = async (newSort: IssueSortMode) => {
    setIssueSortMode(newSort);

    if (showInsights && activeTab === 'issues') {
      await loadIssues(newSort);
    }
  };

  const handlePullSortChange = async (newSort: PullRequestSortMode) => {
    setPullRequestSortMode(newSort);

    if (showInsights && activeTab === 'pulls') {
      await loadPullRequests(newSort);
    }
  };

  const handleBranchAiSummary = async () => {
    if (!selectedBranch) {
      setBranchAiError('Select a branch first');
      return;
    }

    setBranchAiLoading(true);
    setBranchAiError('');

    try {
      const res = await api.post<BranchSummaryResponse>(
        `/projects/${project.id}/ai/branch-summary`,
        {
          branchName: selectedBranch,
        },
      );

      setBranchAiSummaries((prev) => ({
        ...prev,
        [selectedBranch]: res.data.summary,
      }));
    } catch (error) {
      setBranchAiError(getErrorMessage(error, 'Failed to generate branch summary'));
    } finally {
      setBranchAiLoading(false);
    }
  };

  const handleIssuesAiSummary = async () => {
    setIssuesAiLoading(true);
    setIssuesAiError('');

    try {
      const res = await api.post<IssuesSummaryResponse>(
        `/projects/${project.id}/ai/issues-summary`,
        {
          limit: 10,
        },
      );

      setIssuesAiSummary(res.data.summary);
    } catch (error) {
      setIssuesAiError(getErrorMessage(error, 'Failed to generate issues summary'));
    } finally {
      setIssuesAiLoading(false);
    }
  };

  const handlePullRequestsAiSummary = async () => {
    setPullsAiLoading(true);
    setPullsAiError('');

    try {
      const res = await api.post<PullRequestsSummaryResponse>(
        `/projects/${project.id}/ai/pulls-summary`,
        {
          limit: 10,
        },
      );

      setPullsAiSummary(res.data.summary);
    } catch (error) {
      setPullsAiError(getErrorMessage(error, 'Failed to generate pull requests summary'));
    } finally {
      setPullsAiLoading(false);
    }
  };

  const handleCodeReview = async () => {
    if (!reviewBranch) {
      setReviewError('Select a branch first');
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    setReviewFindings([]);
    setFixResults({});
    setFixError('');

    try {
      const res = await api.post<CodeReviewResponse>(`/projects/${project.id}/ai/code-review`, {
        branchName: reviewBranch,
      });

      setReviewFindings(res.data.findings);
      setReviewCommitsAnalyzed(res.data.commitsAnalyzed);
    } catch (error) {
      setReviewError(getErrorMessage(error, 'Failed to review code'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSuggestFix = async (finding: CodeReviewFinding, index: number) => {
    setFixLoadingIndex(index);
    setFixError('');

    try {
      const res = await api.post<CodeFixResponse>(`/projects/${project.id}/ai/code-fix`, {
        file: finding.file,
        snippet: finding.snippet,
        description: finding.description,
      });

      setFixResults((prev) => ({
        ...prev,
        [index]: { improvedCode: res.data.improvedCode, explanation: res.data.explanation },
      }));
    } catch (error) {
      setFixError(getErrorMessage(error, 'Failed to generate fix suggestion'));
    } finally {
      setFixLoadingIndex(null);
    }
  };

  return (
    <div className="project-card card h-100 border-0 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="repo-head">
          <div className="repo-title-wrap">
            <span className={`repo-icon-wrap repo-icon-wrap-${repoPlatform}`}>
              <RepoPlatformIcon platform={repoPlatform} />
            </span>
            <h5 className="card-title mb-0 repo-title">
              {project.owner} / {project.name}
            </h5>
            <button
              type="button"
              className={`favorite-btn${project.isFavorite ? ' active' : ''}`}
              onClick={() => onToggleFavorite(project.id, project.isFavorite)}
              aria-label={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                viewBox="0 0 24 24"
                fill={project.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                className="favorite-icon"
              >
                <path d="m12 3.6 2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.82l-4.8 2.54.92-5.34-3.88-3.78 5.36-.78z" />
              </svg>
            </button>
          </div>
          <span className="repo-link-wrap">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="repo-link">
              {project.url}
            </a>
          </span>
        </div>

        <div className="metrics-grid mb-3">
          <div className="metric-card">
            <div className="metric-meta">
              <IconStar />
              <span>Stars</span>
            </div>
            <strong>{project.stars}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-meta">
              <IconFork />
              <span>Forks</span>
            </div>
            <strong>{project.forks}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-meta">
              <IconIssue />
              <span>Open issues</span>
            </div>
            <strong>{project.issues}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-meta">
              <IconCalendar />
              <span>Created</span>
            </div>
            <small>{formatProjectDate(project.createdAt)}</small>
          </div>
        </div>

        <div className="project-actions mt-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => void toggleInsights()}
            disabled={branchesLoading || issuesLoading || pullsLoading}
          >
            {showInsights ? 'Hide insights' : 'Open insights'}
          </button>
          <UpdateProjectButton projectId={project.id} onUpdate={onUpdate} />
          <DeleteProjectButton projectId={project.id} onDelete={onDelete} />
        </div>

        {showInsights && (
          <div className="insights-shell mt-4 pt-3 border-top">
            <div className="insights-tabs mb-3">
              <button
                type="button"
                className={`insights-tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
                onClick={() => void switchTab('branches')}
              >
                <IconBranches />
                <span>Branches</span>
              </button>
              <button
                type="button"
                className={`insights-tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                onClick={() => void switchTab('issues')}
              >
                <IconIssue />
                <span>Issues</span>
              </button>
              <button
                type="button"
                className={`insights-tab-btn ${activeTab === 'pulls' ? 'active' : ''}`}
                onClick={() => void switchTab('pulls')}
              >
                <IconPR />
                <span>Pull requests</span>
              </button>
              <button
                type="button"
                className={`insights-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => void switchTab('review')}
              >
                <IconCodeReview />
                <span>Code review</span>
              </button>
            </div>

            {activeTab === 'branches' && (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 220 }}
                    value={branchSortMode}
                    onChange={(event) =>
                      void handleBranchSortChange(event.target.value as BranchSortMode)
                    }
                  >
                    <option value="latest">Latest branches first</option>
                    <option value="oldest">Oldest branches first</option>
                  </select>

                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 280 }}
                      value={selectedBranch}
                      onChange={(event) => setSelectedBranch(event.target.value)}
                    >
                      {branches.length === 0 && <option value="">No branches loaded</option>}
                      {branches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                      onClick={() => void handleBranchAiSummary()}
                      disabled={branchAiLoading || !selectedBranch}
                    >
                      <IconSpark />
                      {branchAiLoading ? 'Generating...' : 'Ask latest changes'}
                    </button>
                  </div>
                </div>

                {branchesError && <div className="alert alert-danger py-2">{branchesError}</div>}
                {branchAiError && <div className="alert alert-warning py-2">{branchAiError}</div>}
                {selectedBranch && branchAiSummaries[selectedBranch] && (
                  <div className="position-relative">
                    <div className="alert alert-info ai-summary-box">
                      {branchAiSummaries[selectedBranch]}
                    </div>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() =>
                        void handleCopy(
                          branchAiSummaries[selectedBranch],
                          `branch-${selectedBranch}`,
                        )
                      }
                    >
                      {copiedKey === `branch-${selectedBranch}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                <div className="table-responsive insights-scroll">
                  <table className="table table-sm align-middle insights-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Last commit</th>
                        <th>Date</th>
                        <th>Author</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchesLoading && (
                        <tr>
                          <td colSpan={4} className="table-loader-cell">
                            <div className="table-loader-wrap">
                              <div
                                className="spinner-border spinner-border-sm text-secondary"
                                role="status"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      {!branchesLoading && branches.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-muted">
                            No branches found
                          </td>
                        </tr>
                      )}
                      {branches.map((branch) => (
                        <tr key={branch.name}>
                          <td>
                            <code>{branch.name}</code>
                          </td>
                          <td>
                            <a href={branch.commitUrl} target="_blank" rel="noopener noreferrer">
                              {branch.lastCommitMessage}
                            </a>
                          </td>
                          <td>{formatIsoDate(branch.lastCommitDate)}</td>
                          <td>{branch.lastCommitAuthor || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 220 }}
                    value={issueSortMode}
                    onChange={(event) =>
                      void handleIssueSortChange(event.target.value as IssueSortMode)
                    }
                  >
                    <option value="newest">Newest issues first</option>
                    <option value="oldest">Oldest issues first</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                    onClick={() => void handleIssuesAiSummary()}
                    disabled={issuesAiLoading}
                  >
                    <IconSpark />
                    {issuesAiLoading ? 'Generating...' : 'AI overview for latest issues'}
                  </button>
                </div>

                {issuesError && <div className="alert alert-danger py-2">{issuesError}</div>}
                {issuesAiError && <div className="alert alert-warning py-2">{issuesAiError}</div>}
                {issuesAiSummary && (
                  <div className="position-relative">
                    <div className="alert alert-info ai-summary-box">{issuesAiSummary}</div>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => void handleCopy(issuesAiSummary, 'issues')}
                    >
                      {copiedKey === 'issues' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                <div className="table-responsive insights-scroll">
                  <table className="table table-sm align-middle insights-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>State</th>
                        <th>Created</th>
                        <th>Author</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuesLoading && (
                        <tr>
                          <td colSpan={5} className="table-loader-cell">
                            <div className="table-loader-wrap">
                              <div
                                className="spinner-border spinner-border-sm text-secondary"
                                role="status"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      {!issuesLoading && issues.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-muted">
                            No issues found
                          </td>
                        </tr>
                      )}
                      {issues.map((issue) => (
                        <tr key={issue.id}>
                          <td>#{issue.number}</td>
                          <td>
                            <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                              {issue.title}
                            </a>
                          </td>
                          <td>{issue.state}</td>
                          <td>{formatIsoDate(issue.created_at)}</td>
                          <td>{issue.user?.login || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'pulls' && (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 220 }}
                    value={pullRequestSortMode}
                    onChange={(event) =>
                      void handlePullSortChange(event.target.value as PullRequestSortMode)
                    }
                  >
                    <option value="recent">Recently updated first</option>
                    <option value="oldest">Oldest updated first</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                    onClick={() => void handlePullRequestsAiSummary()}
                    disabled={pullsAiLoading}
                  >
                    <IconSpark />
                    {pullsAiLoading ? 'Generating...' : 'AI overview for latest pull requests'}
                  </button>
                </div>

                {pullsError && <div className="alert alert-danger py-2">{pullsError}</div>}
                {pullsAiError && <div className="alert alert-warning py-2">{pullsAiError}</div>}
                {pullsAiSummary && (
                  <div className="position-relative">
                    <div className="alert alert-info ai-summary-box">{pullsAiSummary}</div>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => void handleCopy(pullsAiSummary, 'pulls')}
                    >
                      {copiedKey === 'pulls' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                <div className="table-responsive insights-scroll">
                  <table className="table table-sm align-middle insights-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>State</th>
                        <th>Updated</th>
                        <th>Author</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pullsLoading && (
                        <tr>
                          <td colSpan={5} className="table-loader-cell">
                            <div className="table-loader-wrap">
                              <div
                                className="spinner-border spinner-border-sm text-secondary"
                                role="status"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      {!pullsLoading && pullRequests.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-muted">
                            No pull requests found
                          </td>
                        </tr>
                      )}
                      {pullRequests.map((pullRequest) => (
                        <tr key={pullRequest.id}>
                          <td>#{pullRequest.number}</td>
                          <td>
                            <a
                              href={pullRequest.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {pullRequest.title}
                            </a>
                          </td>
                          <td>{pullRequest.state}</td>
                          <td>{formatIsoDate(pullRequest.updated_at)}</td>
                          <td>{pullRequest.user?.login || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 280 }}
                    value={reviewBranch}
                    onChange={(event) => setReviewBranch(event.target.value)}
                  >
                    {branches.length === 0 && <option value="">No branches loaded</option>}
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                    onClick={() => void handleCodeReview()}
                    disabled={reviewLoading || !reviewBranch}
                  >
                    <IconSpark />
                    {reviewLoading ? 'Analyzing...' : 'Review code'}
                  </button>
                </div>

                {reviewError && <div className="alert alert-danger py-2">{reviewError}</div>}
                {fixError && <div className="alert alert-warning py-2">{fixError}</div>}

                {reviewLoading && (
                  <div className="d-flex align-items-center gap-2 py-3">
                    <div
                      className="spinner-border spinner-border-sm text-secondary"
                      role="status"
                    />
                    <span className="text-muted">AI is analyzing recent commits...</span>
                  </div>
                )}

                {!reviewLoading && reviewFindings.length > 0 && (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="text-muted small mb-0">
                        Found {reviewFindings.length} issue{reviewFindings.length !== 1 ? 's' : ''}{' '}
                        in {reviewCommitsAnalyzed} commit{reviewCommitsAnalyzed !== 1 ? 's' : ''}
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={() => {
                          const text = reviewFindings
                            .map(
                              (f, i) =>
                                `${i + 1}. [${f.severity}] ${f.type} — ${f.file}${f.line ? `:${f.line}` : ''}\n${f.description}${f.snippet ? `\n\`\`\`\n${f.snippet}\n\`\`\`` : ''}`,
                            )
                            .join('\n\n');
                          void handleCopy(text, 'review');
                        }}
                      >
                        {copiedKey === 'review' ? 'Copied!' : 'Copy all'}
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {reviewFindings.map((finding, index) => (
                        <div key={index} className="card border-0 shadow-sm">
                          <div className="card-body py-2 px-3">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span
                                className={`badge bg-${SEVERITY_COLORS[finding.severity] || 'secondary'}`}
                              >
                                {finding.severity}
                              </span>
                              <span className="badge bg-secondary">
                                {TYPE_LABELS[finding.type] || finding.type}
                              </span>
                              <code className="small text-muted">
                                {finding.file}
                                {finding.line ? `:${finding.line}` : ''}
                              </code>
                            </div>
                            <p className="mb-1 small">{finding.description}</p>
                            {finding.snippet && (
                              <pre
                                className="bg-body-tertiary rounded p-2 small mb-2"
                                style={{ whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto' }}
                              >
                                <code>{finding.snippet}</code>
                              </pre>
                            )}
                            <div className="d-flex gap-2 align-items-center">
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                                onClick={() => void handleSuggestFix(finding, index)}
                                disabled={fixLoadingIndex === index}
                              >
                                <IconSpark />
                                {fixLoadingIndex === index ? 'Generating...' : 'Suggest fix'}
                              </button>
                            </div>
                            {fixResults[index] && (
                              <div className="mt-2 position-relative">
                                <p className="small text-muted mb-1">
                                  {fixResults[index].explanation}
                                </p>
                                <pre
                                  className="bg-body-tertiary rounded p-2 small"
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: 200,
                                    overflow: 'auto',
                                  }}
                                >
                                  <code>{fixResults[index].improvedCode}</code>
                                </pre>
                                <button
                                  type="button"
                                  className="copy-btn"
                                  onClick={() =>
                                    void handleCopy(fixResults[index].improvedCode, `fix-${index}`)
                                  }
                                >
                                  {copiedKey === `fix-${index}` ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!reviewLoading && reviewFindings.length === 0 && reviewCommitsAnalyzed > 0 && (
                  <div className="alert alert-success py-2">
                    No issues found in the last {reviewCommitsAnalyzed} commit
                    {reviewCommitsAnalyzed !== 1 ? 's' : ''}. Code looks good!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
