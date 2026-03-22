import { Page } from '@playwright/test';

const API_BASE = '**/api';

export interface MockProject {
  id: string;
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  issues: number;
  createdAt: number;
  userId: string;
}

export const MOCK_USER = {
  id: 'user-e2e-1',
  email: 'test@e2e.com',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_TOKEN = 'mock-jwt-token-for-e2e-tests';

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'proj-1',
    owner: 'facebook',
    name: 'react',
    url: 'https://github.com/facebook/react',
    stars: 220000,
    forks: 45000,
    issues: 1200,
    createdAt: 1609459200,
    userId: MOCK_USER.id,
  },
  {
    id: 'proj-2',
    owner: 'vercel',
    name: 'next.js',
    url: 'https://github.com/vercel/next.js',
    stars: 120000,
    forks: 26000,
    issues: 3400,
    createdAt: 1612137600,
    userId: MOCK_USER.id,
  },
  {
    id: 'proj-3',
    owner: 'microsoft',
    name: 'typescript',
    url: 'https://github.com/microsoft/typescript',
    stars: 98000,
    forks: 12000,
    issues: 5600,
    createdAt: 1614556800,
    userId: MOCK_USER.id,
  },
  {
    id: 'proj-4',
    owner: 'denoland',
    name: 'deno',
    url: 'https://github.com/denoland/deno',
    stars: 93000,
    forks: 5200,
    issues: 1800,
    createdAt: 1617235200,
    userId: MOCK_USER.id,
  },
];

export const MOCK_SETTINGS = {
  aiProvider: 'openai',
  aiApiKey: null as string | null,
  aiModel: null as string | null,
  aiBaseUrl: null as string | null,
  hideIntro: true,
};

export const MOCK_BRANCHES = [
  {
    name: 'main',
    commitSha: 'abc1234',
    commitUrl: 'https://github.com/facebook/react/commit/abc1234',
    lastCommitMessage: 'Update dependencies',
    lastCommitDate: '2024-06-01T10:00:00Z',
    lastCommitAuthor: 'dev1',
  },
  {
    name: 'feature/new-hooks',
    commitSha: 'def5678',
    commitUrl: 'https://github.com/facebook/react/commit/def5678',
    lastCommitMessage: 'Add useOptimistic hook',
    lastCommitDate: '2024-05-28T14:30:00Z',
    lastCommitAuthor: 'dev2',
  },
];

export const MOCK_ISSUES = [
  {
    id: 1,
    number: 101,
    title: 'Bug: Hydration mismatch in SSR',
    state: 'open',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-02T10:00:00Z',
    html_url: 'https://github.com/facebook/react/issues/101',
    user: { login: 'reporter1' },
  },
  {
    id: 2,
    number: 102,
    title: 'Feature request: Concurrent mode improvements',
    state: 'open',
    created_at: '2024-05-30T08:00:00Z',
    updated_at: '2024-06-01T08:00:00Z',
    html_url: 'https://github.com/facebook/react/issues/102',
    user: { login: 'reporter2' },
  },
];

export const MOCK_PULL_REQUESTS = [
  {
    id: 1,
    number: 201,
    title: 'Fix: Resolve hydration warning',
    state: 'open',
    created_at: '2024-06-01T12:00:00Z',
    updated_at: '2024-06-02T12:00:00Z',
    html_url: 'https://github.com/facebook/react/pull/201',
    user: { login: 'contributor1' },
    draft: false,
  },
];

export async function mockAuthAPI(page: Page) {
  await page.route(`${API_BASE}/auth/signup`, async (route) => {
    const body = route.request().postDataJSON();
    if (!body.email || !body.password) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email and password are required' }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route(`${API_BASE}/auth/login`, async (route) => {
    const body = route.request().postDataJSON();
    if (body.email === 'test@e2e.com' && body.password === 'password123') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: MOCK_TOKEN }),
      });
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid credentials' }),
    });
  });
}

export async function mockProjectsAPI(page: Page, projects: MockProject[] = MOCK_PROJECTS) {
  await page.route(`${API_BASE}/projects?*`, async (route) => {
    const url = new URL(route.request().url());
    const pageNum = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '3');

    const total = projects.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const clampedPage = Math.min(pageNum, totalPages);
    const start = (clampedPage - 1) * limit;
    const items = projects.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        pagination: {
          page: clampedPage,
          limit,
          total,
          totalPages,
          hasPrev: clampedPage > 1,
          hasNext: clampedPage < totalPages,
        },
      }),
    });
  });

  await page.route(`${API_BASE}/projects`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (!body.repoPath) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid repository path' }),
        });
      }
      const newProject: MockProject = {
        id: 'proj-new',
        owner: 'new-owner',
        name: 'new-repo',
        url: 'https://github.com/new-owner/new-repo',
        stars: 100,
        forks: 10,
        issues: 5,
        createdAt: Math.floor(Date.now() / 1000),
        userId: MOCK_USER.id,
      };
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newProject),
      });
    }

    // GET without params
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: projects.slice(0, 3),
        pagination: {
          page: 1,
          limit: 3,
          total: projects.length,
          totalPages: Math.ceil(projects.length / 3),
          hasPrev: false,
          hasNext: projects.length > 3,
        },
      }),
    });
  });

  await page.route(`${API_BASE}/projects/*/details`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: projects[0],
        branches: MOCK_BRANCHES,
        issues: MOCK_ISSUES,
        pullRequests: MOCK_PULL_REQUESTS,
      }),
    });
  });

  await page.route(`${API_BASE}/projects/*/branches*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: projects[0],
        sort: 'latest',
        limit: 50,
        branches: MOCK_BRANCHES,
      }),
    });
  });

  await page.route(`${API_BASE}/projects/*/issues*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: projects[0],
        sort: 'newest',
        limit: 50,
        issues: MOCK_ISSUES,
      }),
    });
  });

  await page.route(`${API_BASE}/projects/*/pulls*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: projects[0],
        sort: 'recent',
        limit: 50,
        pullRequests: MOCK_PULL_REQUESTS,
      }),
    });
  });

  // Delete project
  await page.route(/\/api\/projects\/[^/]+$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Project deleted successfully' }),
      });
    }
    return route.continue();
  });

  // Update project
  await page.route(`${API_BASE}/projects/*/update`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...projects[0], stars: projects[0].stars + 100 }),
    });
  });
}

export async function mockUserAPI(page: Page, settings = MOCK_SETTINGS) {
  await page.route(`${API_BASE}/user/settings`, async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settings),
      });
    }

    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      const updated = { ...settings, ...body };
      if (updated.aiApiKey && typeof updated.aiApiKey === 'string' && updated.aiApiKey.length > 4) {
        updated.aiApiKey = '****' + updated.aiApiKey.slice(-4);
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    }

    return route.continue();
  });
}

export async function setAuthToken(page: Page) {
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, MOCK_TOKEN);
}

export async function clearAuthToken(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
  });
}

export async function mockAllAPIs(page: Page, projects?: MockProject[]) {
  await mockAuthAPI(page);
  await mockProjectsAPI(page, projects);
  await mockUserAPI(page);
}
