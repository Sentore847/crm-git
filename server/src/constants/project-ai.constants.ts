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

export const CODE_REVIEW_COMMITS_LIMIT = 5;
export const CODE_REVIEW_MAX_DIFF_LENGTH = 6000;
export const CODE_REVIEW_MAX_TOKENS = 1500;
export const CODE_FIX_MAX_TOKENS = 1000;

export const CODE_REVIEW_SYSTEM_PROMPT =
  'You are a senior code reviewer. Analyze the provided git diff and identify potential bugs, bad practices, security issues, and code that does not follow best practices. Be concise and actionable. Only report real issues, not style nitpicks.';

export const CODE_REVIEW_RETURN_FORMAT =
  'Return ONLY a valid JSON array (no markdown, no backticks). Each element: {"file": "path/to/file", "line": "line or range", "snippet": "problematic code fragment", "type": "bug"|"practice"|"security"|"improvement", "severity": "high"|"medium"|"low", "description": "short explanation of the issue"}. If no issues found, return an empty array: []';

export const CODE_FIX_SYSTEM_PROMPT =
  'You are a senior developer. Given a code snippet and a description of the problem, provide an improved version of the code with a brief explanation of what was changed and why.';

export const CODE_FIX_RETURN_FORMAT =
  'Return ONLY a valid JSON object (no markdown, no backticks): {"improvedCode": "the fixed code", "explanation": "brief explanation of changes"}';
