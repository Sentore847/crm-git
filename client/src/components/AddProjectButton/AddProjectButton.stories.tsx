import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect, userEvent } from '@storybook/test';
import AddProjectModal from './AddProjectButton';

const meta: Meta<typeof AddProjectModal> = {
  title: 'Components/AddProjectModal',
  component: AddProjectModal,
  args: {
    onClose: fn(),
    onAdd: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AddProjectModal>;

export const EmptyForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Add Repository')).toBeInTheDocument();

    const input = canvas.getByPlaceholderText(/facebook\/react/);
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveValue('');

    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    const addBtn = canvas.getByRole('button', { name: 'Add' });
    await expect(addBtn).toBeDisabled();
  },
};

export const WithValidInput: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByPlaceholderText(/facebook\/react/);
    await userEvent.type(input, 'owner/repo');

    const addBtn = canvas.getByRole('button', { name: 'Add' });
    await expect(addBtn).toBeEnabled();
  },
};

export const WithInvalidInput: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByPlaceholderText(/facebook\/react/);
    await userEvent.type(input, 'invalid-no-slash');
    await userEvent.tab();

    await expect(canvas.getByText(/Invalid path/)).toBeInTheDocument();
  },
};

export const CancelButton: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
