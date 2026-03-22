import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect, userEvent } from '@storybook/test';
import LogoutButton from '../LogoutButton';

const meta: Meta<typeof LogoutButton> = {
  title: 'Components/LogoutButton',
  component: LogoutButton,
  args: {
    onLogout: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof LogoutButton>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /log out/i });

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveClass('btn-outline-danger');

    await userEvent.click(button);
    await expect(args.onLogout).toHaveBeenCalledTimes(1);
  },
};
