import { test, expect } from '@playwright/test';
import { mockAllAPIs, setAuthToken, clearAuthToken } from '../helpers/mock-api';

test.describe('Navigation & Route Protection', () => {
  test('should redirect unauthenticated user from / to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from /projects to /login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect authenticated user from /login to /projects', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await setAuthToken(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('should redirect authenticated user from / to /projects', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await setAuthToken(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('should redirect unknown routes to login when not authenticated', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unknown routes to projects when authenticated', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await setAuthToken(page);
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('should allow access to signup page without auth', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
  });

  test('should navigate from login to signup and back', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });
});
