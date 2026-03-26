import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import SettingsButton from './SettingsButton';

const meta: Meta<typeof SettingsButton> = {
  title: 'Components/SettingsButton',
  component: SettingsButton,
};

export default meta;
type Story = StoryObj<typeof SettingsButton>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /settings/i });

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveClass('btn-outline-secondary');
  },
};

export const OpenModal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /settings/i }));

    // Modal should open (settings loads with error since no API - that's fine)
    await expect(canvas.getByText('Settings')).toBeInTheDocument();
  },
};
