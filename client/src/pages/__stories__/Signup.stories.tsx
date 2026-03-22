import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import Signup from '../Signup';

const meta: Meta<typeof Signup> = {
  title: 'Pages/Signup',
  component: Signup,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Signup>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Email')).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Password')).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Confirm Password')).toBeInTheDocument();

    const submitBtn = canvas.getByRole('button', { name: /sign up/i });
    await expect(submitBtn).toBeDisabled();

    await expect(canvas.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  },
};

export const ValidForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByPlaceholderText('Email'), 'test@test.com');
    await userEvent.type(canvas.getByPlaceholderText('Password'), 'password1');
    await userEvent.type(canvas.getByPlaceholderText('Confirm Password'), 'password1');

    // Button should become enabled
    const submitBtn = canvas.getByRole('button', { name: /sign up/i });
    await expect(submitBtn).toBeEnabled();
  },
};

export const InvalidEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByPlaceholderText('Email'), 'not-an-email');
    await userEvent.tab();

    await expect(canvas.getByText(/invalid email format/i)).toBeInTheDocument();
  },
};

export const ShortPassword: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByPlaceholderText('Password'), 'ab1');
    await userEvent.tab();

    await expect(canvas.getByText(/at least 6 characters/i)).toBeInTheDocument();
  },
};

export const PasswordMismatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByPlaceholderText('Email'), 'test@test.com');
    await userEvent.type(canvas.getByPlaceholderText('Password'), 'password1');
    await userEvent.type(canvas.getByPlaceholderText('Confirm Password'), 'different');
    await userEvent.tab();

    await expect(canvas.getByText(/passwords do not match/i)).toBeInTheDocument();
  },
};
