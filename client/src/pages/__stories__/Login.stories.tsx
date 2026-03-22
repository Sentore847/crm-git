import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect, userEvent } from '@storybook/test';
import Login from '../Login';

const meta: Meta<typeof Login> = {
  title: 'Pages/Login',
  component: Login,
  args: {
    onLogin: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Login>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Email')).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Password')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /login/i })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  },
};

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const emailInput = canvas.getByPlaceholderText('Email');
    const passwordInput = canvas.getByPlaceholderText('Password');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');

    await expect(emailInput).toHaveValue('user@example.com');
    await expect(passwordInput).toHaveValue('password123');
  },
};

export const EmailValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const emailInput = canvas.getByPlaceholderText('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toBeRequired();

    const passwordInput = canvas.getByPlaceholderText('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toBeRequired();
  },
};
