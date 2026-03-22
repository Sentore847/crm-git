import { test, expect } from '@playwright/test';
import { mockAuthAPI, mockAllAPIs, MOCK_TOKEN, setAuthToken } from '../helpers/mock-api';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByPlaceholder('Email')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/login');
      const signupLink = page.getByRole('link', { name: 'Sign Up' });
      await expect(signupLink).toBeVisible();
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should login successfully and redirect to projects', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/login');

      await page.getByPlaceholder('Email').fill('test@e2e.com');
      await page.getByPlaceholder('Password').fill('password123');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page).toHaveURL(/\/projects/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBe(MOCK_TOKEN);
    });

    test('should display error on invalid credentials', async ({ page }) => {
      await mockAuthAPI(page);
      await page.goto('/login');

      await page.getByPlaceholder('Email').fill('wrong@test.com');
      await page.getByPlaceholder('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.locator('.alert-danger')).toContainText('Invalid credentials');
    });

    test('should redirect authenticated users to projects', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/');
      await setAuthToken(page);
      await page.goto('/login');
      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
      await expect(page.getByPlaceholder('Email')).toBeVisible();
      // Use input type selectors since there are two password fields
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs).toHaveCount(2);
      await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/signup');
      const loginLink = page.getByRole('link', { name: 'Log in' });
      await expect(loginLink).toBeVisible();
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/signup');

      await page.getByPlaceholder('Email').fill('invalid-email');
      // Tab to next field to trigger validation
      await page.getByPlaceholder('Password', { exact: true }).click();
      await expect(page.getByText('Invalid email format')).toBeVisible();
    });

    test('should show password mismatch error', async ({ page }) => {
      await page.goto('/signup');

      await page.getByPlaceholder('Email').fill('test@test.com');
      await page.getByPlaceholder('Password', { exact: true }).fill('password1');
      await page.getByPlaceholder('Confirm Password').fill('password2');
      // Click elsewhere to trigger blur validation
      await page.getByPlaceholder('Email').click();

      await expect(page.getByText('Passwords do not match')).toBeVisible();
    });

    test('should signup successfully and show success message', async ({ page }) => {
      await mockAuthAPI(page);
      await page.goto('/signup');

      await page.getByPlaceholder('Email').fill('new@e2e.com');
      await page.getByPlaceholder('Password', { exact: true }).fill('password1');
      await page.getByPlaceholder('Confirm Password').fill('password1');

      await expect(page.getByRole('button', { name: 'Sign Up' })).toBeEnabled();
      await page.getByRole('button', { name: 'Sign Up' }).click();

      await expect(page.locator('.alert-success')).toContainText('Registration successful');
    });

    test('should have submit button disabled when form is empty', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.getByRole('button', { name: 'Sign Up' })).toBeDisabled();
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      await mockAllAPIs(page);
      await page.goto('/');
      await setAuthToken(page);
      await page.goto('/projects');

      await expect(page.getByText('Your Projects')).toBeVisible();

      await page.getByRole('button', { name: /log out/i }).click();

      await expect(page).toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });
  });
});
