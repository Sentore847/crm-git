import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect, userEvent } from '@storybook/test';
import ProjectCard from './ProjectCard';
import type { Project } from '@/types/project.types';

const githubProject: Project = {
  id: 'proj-1',
  owner: 'facebook',
  name: 'react',
  url: 'https://github.com/facebook/react',
  stars: 220000,
  forks: 45000,
  issues: 1200,
  createdAt: 1609459200,
};

const gitlabProject: Project = {
  id: 'proj-2',
  owner: 'gitlab-org',
  name: 'gitlab',
  url: 'https://gitlab.com/gitlab-org/gitlab',
  stars: 8500,
  forks: 2400,
  issues: 9800,
  createdAt: 1577836800,
};

const bitbucketProject: Project = {
  id: 'proj-3',
  owner: 'atlassian',
  name: 'stash',
  url: 'https://bitbucket.org/atlassian/stash',
  stars: 3200,
  forks: 800,
  issues: 450,
  createdAt: 1546300800,
};

const meta: Meta<typeof ProjectCard> = {
  title: 'Components/ProjectCard',
  component: ProjectCard,
  args: {
    onUpdate: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 900, margin: '20px auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const GitHub: Story = {
  args: { project: githubProject },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check project title
    await expect(canvas.getByText('facebook/react')).toBeInTheDocument();

    // Check metrics
    await expect(canvas.getByText('220000')).toBeInTheDocument();
    await expect(canvas.getByText('45000')).toBeInTheDocument();
    await expect(canvas.getByText('1200')).toBeInTheDocument();

    // Check buttons exist
    await expect(canvas.getByRole('button', { name: /open insights/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /update/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /delete/i })).toBeInTheDocument();

    // Check repo link
    const link = canvas.getByRole('link');
    await expect(link).toHaveAttribute('href', 'https://github.com/facebook/react');
  },
};

export const GitLab: Story = {
  args: { project: gitlabProject },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('gitlab-org/gitlab')).toBeInTheDocument();
    await expect(canvas.getByText('8500')).toBeInTheDocument();
  },
};

export const Bitbucket: Story = {
  args: { project: bitbucketProject },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('atlassian/stash')).toBeInTheDocument();
    await expect(canvas.getByText('3200')).toBeInTheDocument();
  },
};

export const ToggleInsights: Story = {
  args: { project: githubProject },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const insightsBtn = canvas.getByRole('button', { name: /open insights/i });
    await userEvent.click(insightsBtn);

    // After click, button should say "Hide insights"
    await expect(canvas.getByRole('button', { name: /hide insights/i })).toBeInTheDocument();

    // Click again to hide
    await userEvent.click(canvas.getByRole('button', { name: /hide insights/i }));
    await expect(canvas.getByRole('button', { name: /open insights/i })).toBeInTheDocument();
  },
};

export const ZeroMetrics: Story = {
  args: {
    project: {
      ...githubProject,
      id: 'proj-zero',
      owner: 'new-user',
      name: 'empty-repo',
      stars: 0,
      forks: 0,
      issues: 0,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('new-user/empty-repo')).toBeInTheDocument();
    const zeros = canvas.getAllByText('0');
    await expect(zeros.length).toBeGreaterThanOrEqual(3);
  },
};
