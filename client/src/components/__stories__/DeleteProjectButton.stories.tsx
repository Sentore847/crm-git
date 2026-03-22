import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect } from '@storybook/test';
import DeleteProjectButton from '../DeleteProjectButton';

const meta: Meta<typeof DeleteProjectButton> = {
  title: 'Components/DeleteProjectButton',
  component: DeleteProjectButton,
  args: {
    projectId: 'proj-1',
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DeleteProjectButton>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /delete/i });

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveClass('btn-danger');
    await expect(button).toHaveClass('btn-sm');
  },
};
