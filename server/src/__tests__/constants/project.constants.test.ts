import {
  PROJECT_LIST_DEFAULT_LIMIT,
  PROJECT_LIST_MAX_LIMIT,
  PROJECTS_PAGE_DEFAULT,
  PROJECTS_PAGE_DEFAULT_LIMIT,
  PROJECTS_PAGE_MAX_LIMIT,
  BRANCH_DEFAULT_SORT,
  ISSUE_DEFAULT_SORT,
  PULL_REQUEST_DEFAULT_SORT,
} from '../../constants/project.constants';

describe('Project Constants', () => {
  it('should have reasonable default limits', () => {
    expect(PROJECT_LIST_DEFAULT_LIMIT).toBe(50);
    expect(PROJECT_LIST_MAX_LIMIT).toBe(200);
    expect(PROJECT_LIST_DEFAULT_LIMIT).toBeLessThanOrEqual(PROJECT_LIST_MAX_LIMIT);
  });

  it('should have valid pagination defaults', () => {
    expect(PROJECTS_PAGE_DEFAULT).toBe(1);
    expect(PROJECTS_PAGE_DEFAULT_LIMIT).toBe(3);
    expect(PROJECTS_PAGE_MAX_LIMIT).toBe(20);
    expect(PROJECTS_PAGE_DEFAULT_LIMIT).toBeLessThanOrEqual(PROJECTS_PAGE_MAX_LIMIT);
  });

  it('should have valid sort defaults', () => {
    expect(BRANCH_DEFAULT_SORT).toBe('latest');
    expect(ISSUE_DEFAULT_SORT).toBe('newest');
    expect(PULL_REQUEST_DEFAULT_SORT).toBe('recent');
  });
});
