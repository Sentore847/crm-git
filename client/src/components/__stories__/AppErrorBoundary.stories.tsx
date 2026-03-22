import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import AppErrorBoundary from '../AppErrorBoundary';

const meta: Meta<typeof AppErrorBoundary> = {
  title: 'Components/AppErrorBoundary',
  component: AppErrorBoundary,
};

export default meta;
type Story = StoryObj<typeof AppErrorBoundary>;

export const Normal: Story = {
  render: () => (
    <AppErrorBoundary>
      <div className="p-4">
        <h3>Application is working normally</h3>
        <p>No errors here!</p>
      </div>
    </AppErrorBoundary>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Application is working normally')).toBeInTheDocument();
    await expect(canvas.getByText('No errors here!')).toBeInTheDocument();
  },
};

const ThrowError = () => {
  throw new Error('Something went terribly wrong!');
};

export const WithError: Story = {
  render: () => (
    <AppErrorBoundary>
      <ThrowError />
    </AppErrorBoundary>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Application error')).toBeInTheDocument();
    await expect(canvas.getByText('Something went terribly wrong!')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  },
};
