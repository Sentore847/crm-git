export const BRANCH_SUMMARY_COMMITS_LIMIT = 12;

export const SUMMARY_DEFAULT_LIMIT = 8;
export const SUMMARY_MIN_LIMIT = 3;
export const SUMMARY_MAX_LIMIT = 20;

export const BRANCH_SUMMARY_SYSTEM_PROMPT =
  'You explain git branch changes in concise developer-friendly language.';

export const BRANCH_SUMMARY_RETURN_FORMAT =
  'Return:\n1) Short summary of what changed\n2) Main areas touched\n3) Potential risks or follow-up checks';

export const ISSUES_OVERVIEW_SYSTEM_PROMPT =
  'You summarize repository issues for engineering teams in concise actionable format.';

export const ISSUES_OVERVIEW_RETURN_FORMAT =
  'Return:\n1) 2-4 sentence overall overview\n2) 3-6 bullet points with key issue themes\n3) Highest-priority issue numbers with reason';

export const PULLS_OVERVIEW_SYSTEM_PROMPT =
  'You summarize repository pull requests for engineering teams in concise actionable format.';

export const PULLS_OVERVIEW_RETURN_FORMAT =
  'Return:\n1) 2-4 sentence overall overview\n2) 3-6 bullet points with key change streams\n3) Pull requests that look risky with reason';
