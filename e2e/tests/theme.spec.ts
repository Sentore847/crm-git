import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test('should render theme toggle button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible();
  });

  test('should open theme menu on click', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /theme/i }).click();
    await expect(page.getByText('System')).toBeVisible();
    await expect(page.getByText('Light')).toBeVisible();
    await expect(page.getByText('Dark')).toBeVisible();
  });

  test('should switch to dark theme', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /theme/i }).click();

    await page.getByRole('menuitemradio', { name: 'Dark' }).click();

    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(theme).toBe('dark');
  });

  test('should switch to light theme', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /theme/i }).click();

    await page.getByRole('menuitemradio', { name: 'Light' }).click();

    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(theme).toBe('light');
  });

  test('should persist theme in localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();

    const storedTheme = await page.evaluate(() => localStorage.getItem('theme-mode'));
    expect(storedTheme).toBe('dark');
  });

  test('should restore saved theme on reload', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('theme-mode', 'dark'));
    await page.reload();

    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(theme).toBe('dark');
  });
});
