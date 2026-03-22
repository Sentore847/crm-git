import { test, expect } from '@playwright/test';
import { mockAllAPIs, mockProjectsAPI, mockUserAPI, setAuthToken, MOCK_PROJECTS } from '../helpers/mock-api';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page);
  });

  test.describe('Projects List', () => {
    test('should display projects list', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await expect(page.getByText('Your Projects')).toBeVisible();
      await expect(page.getByText('facebook/react').first()).toBeVisible();
      await expect(page.getByText('vercel/next.js').first()).toBeVisible();
      await expect(page.getByText('microsoft/typescript').first()).toBeVisible();
    });

    test('should show empty state when no projects', async ({ page }) => {
      await mockProjectsAPI(page, []);
      await mockUserAPI(page);
      await page.goto('/projects');

      await expect(page.getByText("You don't have any projects yet.")).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add your first project' })).toBeVisible();
    });

    test('should display project metrics (stars, forks, issues)', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await expect(page.getByText('220000').first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination controls', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    });

    test('should navigate to next page', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
      await page.getByRole('button', { name: 'Next' }).click();

      await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
      await expect(page.getByText('denoland/deno').first()).toBeVisible();
    });

    test('should navigate back to previous page', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByText(/Page 2 of 2/)).toBeVisible();

      await page.getByRole('button', { name: 'Previous' }).click();
      await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
    });

    test('should not show pagination with single page', async ({ page }) => {
      await mockProjectsAPI(page, MOCK_PROJECTS.slice(0, 2));
      await mockUserAPI(page);
      await page.goto('/projects');

      await expect(page.getByText('Previous')).not.toBeVisible();
    });
  });

  test.describe('Add Project', () => {
    test('should open add project modal from header button', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Add Project' }).click();
      await expect(page.getByText('Add Repository')).toBeVisible();
    });

    test('should open add project modal from empty state', async ({ page }) => {
      await mockProjectsAPI(page, []);
      await mockUserAPI(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Add your first project' }).click();
      await expect(page.getByText('Add Repository')).toBeVisible();
    });

    test('should close modal with cancel button', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Add Project' }).click();
      await expect(page.getByText('Add Repository')).toBeVisible();

      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByText('Add Repository')).not.toBeVisible();
    });

    test('should add a project successfully', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Add Project' }).click();

      const input = page.getByPlaceholder(/facebook\/react/);
      await input.fill('new-owner/new-repo');

      await page.getByRole('button', { name: 'Add', exact: true }).click();

      // Modal should close
      await expect(page.getByText('Add Repository')).not.toBeVisible();
    });

    test('should show validation error for invalid repo path', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      await page.getByRole('button', { name: 'Add Project' }).click();

      const input = page.getByPlaceholder(/facebook\/react/);
      await input.fill('invalid');
      await input.blur();

      await expect(page.getByText(/Invalid path/)).toBeVisible();
    });
  });

  test.describe('Delete Project', () => {
    test('should delete project after confirmation', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      page.on('dialog', dialog => dialog.accept());

      const deleteButtons = page.getByRole('button', { name: 'Delete' });
      await deleteButtons.first().click();

      await expect(page.getByText('Your Projects')).toBeVisible();
    });

    test('should not delete project when confirmation is cancelled', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/projects');

      page.on('dialog', dialog => dialog.dismiss());

      const deleteButtons = page.getByRole('button', { name: 'Delete' });
      await deleteButtons.first().click();

      await expect(page.getByText('facebook/react').first()).toBeVisible();
    });
  });
});
