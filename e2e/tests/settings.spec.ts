import { test, expect } from '@playwright/test';
import { mockAllAPIs, mockUserAPI, setAuthToken } from '../helpers/mock-api';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await setAuthToken(page);
    await page.goto('/projects');
  });

  test('should open settings modal', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText('AI Provider')).toBeVisible();
    await expect(page.getByText('API Key')).toBeVisible();
  });

  test('should show no key configured message', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText('No key configured')).toBeVisible();
  });

  test('should display provider dropdown with options', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    const select = page.locator('select.form-select');
    await expect(select).toBeVisible();

    // Check specific option values exist
    await expect(select.locator('option[value="openai"]')).toBeAttached();
    await expect(select.locator('option[value="gemini"]')).toBeAttached();
    await expect(select.locator('option[value="deepseek"]')).toBeAttached();
    await expect(select.locator('option[value="openrouter"]')).toBeAttached();
    await expect(select.locator('option[value="custom"]')).toBeAttached();
  });

  test('should change provider', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    const select = page.locator('select.form-select');
    await select.selectOption('gemini');

    await expect(select).toHaveValue('gemini');
  });

  test('should show Base URL field when Custom provider is selected', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    const select = page.locator('select.form-select');
    await select.selectOption('custom');

    await expect(page.getByText('Base URL')).toBeVisible();
    await expect(page.getByPlaceholder('https://api.example.com/v1')).toBeVisible();
  });

  test('should hide Base URL field for non-custom providers', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    const select = page.locator('select.form-select');
    await select.selectOption('openai');

    await expect(page.getByPlaceholder('https://api.example.com/v1')).not.toBeVisible();
  });

  test('should save settings successfully', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    await page.getByPlaceholder('Enter your API key...').fill('sk-new-test-key');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('.alert-success')).toContainText('Settings saved');
  });

  test('should close modal with close button', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText('AI Provider')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('AI Provider')).not.toBeVisible();
  });

  test('should show masked key when key is configured', async ({ page }) => {
    await mockUserAPI(page, {
      aiProvider: 'openai',
      aiApiKey: '****5678',
      aiModel: null,
      aiBaseUrl: null,
      hideIntro: true,
    });
    await page.getByRole('button', { name: /settings/i }).click();

    await expect(page.getByText('Current key: ****5678')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove key' })).toBeVisible();
  });

  test('should show intro guide checkbox', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText('Show intro guide on login')).toBeVisible();
  });
});
