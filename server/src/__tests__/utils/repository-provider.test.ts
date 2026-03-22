import { parseRepoInput, detectProviderFromRepositoryUrl } from '../../utils/repository-provider';

describe('parseRepoInput', () => {
  describe('GitHub (default provider)', () => {
    it('should parse "owner/repo" as GitHub', () => {
      const result = parseRepoInput('owner/repo');
      expect(result).toEqual({ provider: 'github', owner: 'owner', name: 'repo' });
    });

    it('should parse with leading/trailing spaces', () => {
      const result = parseRepoInput('  owner/repo  ');
      expect(result).toEqual({ provider: 'github', owner: 'owner', name: 'repo' });
    });

    it('should parse GitHub HTTPS URL', () => {
      const result = parseRepoInput('https://github.com/facebook/react');
      expect(result).toEqual({ provider: 'github', owner: 'facebook', name: 'react' });
    });

    it('should parse GitHub URL with .git suffix', () => {
      const result = parseRepoInput('https://github.com/facebook/react.git');
      expect(result).toEqual({ provider: 'github', owner: 'facebook', name: 'react' });
    });

    it('should parse "github:owner/repo" prefix', () => {
      const result = parseRepoInput('github:owner/repo');
      expect(result).toEqual({ provider: 'github', owner: 'owner', name: 'repo' });
    });
  });

  describe('GitLab', () => {
    it('should parse "gitlab:group/repo" prefix', () => {
      const result = parseRepoInput('gitlab:mygroup/myrepo');
      expect(result).toEqual({ provider: 'gitlab', owner: 'mygroup', name: 'myrepo' });
    });

    it('should parse "gitlab:group/subgroup/repo" with subgroups', () => {
      const result = parseRepoInput('gitlab:group/subgroup/repo');
      expect(result).toEqual({ provider: 'gitlab', owner: 'group/subgroup', name: 'repo' });
    });

    it('should parse GitLab HTTPS URL', () => {
      const result = parseRepoInput('https://gitlab.com/mygroup/myrepo');
      expect(result).toEqual({ provider: 'gitlab', owner: 'mygroup', name: 'myrepo' });
    });

    it('should parse GitLab URL with subgroups', () => {
      const result = parseRepoInput('https://gitlab.com/group/subgroup/repo');
      expect(result).toEqual({ provider: 'gitlab', owner: 'group/subgroup', name: 'repo' });
    });

    it('should handle GitLab URL with dash paths (merge requests, etc.)', () => {
      const result = parseRepoInput('https://gitlab.com/mygroup/myrepo/-/merge_requests');
      expect(result).toEqual({ provider: 'gitlab', owner: 'mygroup', name: 'myrepo' });
    });
  });

  describe('Bitbucket', () => {
    it('should parse "bitbucket:workspace/repo" prefix', () => {
      const result = parseRepoInput('bitbucket:myworkspace/myrepo');
      expect(result).toEqual({ provider: 'bitbucket', owner: 'myworkspace', name: 'myrepo' });
    });

    it('should parse Bitbucket HTTPS URL', () => {
      const result = parseRepoInput('https://bitbucket.org/workspace/repo');
      expect(result).toEqual({ provider: 'bitbucket', owner: 'workspace', name: 'repo' });
    });
  });

  describe('Invalid inputs', () => {
    it('should throw for empty string', () => {
      expect(() => parseRepoInput('')).toThrow();
    });

    it('should throw for single segment', () => {
      expect(() => parseRepoInput('just-a-name')).toThrow();
    });

    it('should throw for unsupported host', () => {
      expect(() => parseRepoInput('https://example.com/owner/repo')).toThrow('Unsupported');
    });

    it('should throw for gitlab prefix with single segment', () => {
      expect(() => parseRepoInput('gitlab:onlyone')).toThrow();
    });
  });
});

describe('detectProviderFromRepositoryUrl', () => {
  it('should detect github from URL', () => {
    expect(detectProviderFromRepositoryUrl('https://github.com/foo/bar')).toBe('github');
  });

  it('should detect gitlab from URL', () => {
    expect(detectProviderFromRepositoryUrl('https://gitlab.com/foo/bar')).toBe('gitlab');
  });

  it('should detect bitbucket from URL', () => {
    expect(detectProviderFromRepositoryUrl('https://bitbucket.org/foo/bar')).toBe('bitbucket');
  });

  it('should default to github for unknown URLs', () => {
    expect(detectProviderFromRepositoryUrl('https://example.com/foo/bar')).toBe('github');
  });

  it('should default to github for invalid URLs', () => {
    expect(detectProviderFromRepositoryUrl('not-a-url')).toBe('github');
  });
});
