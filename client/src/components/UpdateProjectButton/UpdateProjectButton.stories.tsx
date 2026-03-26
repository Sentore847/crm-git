import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect } from '@storybook/test';
import UpdateProjectButton from './UpdateProjectButton';

const meta: Meta<typeof UpdateProjectButton> = {
  title: 'Components/UpdateProjectButton',
  component: UpdateProjectButton,
  args: {
    projectId: 'proj-1',
    onUpdate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof UpdateProjectButton>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /update/i });

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveClass('btn-secondary');
    await expect(button).toHaveClass('btn-sm');
  },
};
