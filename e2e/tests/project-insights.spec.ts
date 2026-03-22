import { test, expect } from '@playwright/test';
import { mockAllAPIs, setAuthToken } from '../helpers/mock-api';

test.describe('Project Insights', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await setAuthToken(page);
    await page.goto('/projects');
  });

  test('should open insights panel', async ({ page }) => {
    const openInsightsBtn = page.getByRole('button', { name: /open insights/i }).first();
    await openInsightsBtn.click();

    // Should show tab buttons (insights-tab-btn class)
    await expect(page.locator('.insights-tab-btn').first()).toBeVisible();
  });

  test('should close insights panel', async ({ page }) => {
    const openInsightsBtn = page.getByRole('button', { name: /open insights/i }).first();
    await openInsightsBtn.click();

    const hideInsightsBtn = page.getByRole('button', { name: /hide insights/i }).first();
    await hideInsightsBtn.click();

    await expect(page.getByRole('button', { name: /open insights/i }).first()).toBeVisible();
  });

  test('should display branches in branches tab', async ({ page }) => {
    const openInsightsBtn = page.getByRole('button', { name: /open insights/i }).first();
    await openInsightsBtn.click();

    // Wait for branches data to load - look for commit message in table
    await expect(page.getByText('Update dependencies').first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to issues tab', async ({ page }) => {
    const openInsightsBtn = page.getByRole('button', { name: /open insights/i }).first();
    await openInsightsBtn.click();

    // Click the Issues tab button using the insights-tab-btn class
    const issuesTab = page.locator('.insights-tab-btn', { hasText: 'Issues' }).first();
    await issuesTab.click();

    await expect(page.getByText('Bug: Hydration mismatch in SSR').first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to pull requests tab', async ({ page }) => {
    const openInsightsBtn = page.getByRole('button', { name: /open insights/i }).first();
    await openInsightsBtn.click();

    const prTab = page.locator('.insights-tab-btn', { hasText: 'Pull Requests' }).first();
    await prTab.click();

    await expect(page.getByText('Fix: Resolve hydration warning').first()).toBeVisible({ timeout: 5000 });
  });
});
