import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, expect, userEvent } from '@storybook/test';
import IntroGuide from './IntroGuide';

const meta: Meta<typeof IntroGuide> = {
  title: 'Components/IntroGuide',
  component: IntroGuide,
  args: {
    onDismiss: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IntroGuide>;

export const FirstStep: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Step 1 of 4')).toBeInTheDocument();
    await expect(canvas.getByText('Your Projects Dashboard')).toBeInTheDocument();

    const prevBtn = canvas.getByRole('button', { name: 'Previous' });
    await expect(prevBtn).toBeDisabled();

    const nextBtn = canvas.getByRole('button', { name: 'Next' });
    await expect(nextBtn).toBeEnabled();

    await expect(canvas.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  },
};

export const NavigateSteps: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Step 1
    await expect(canvas.getByText('Step 1 of 4')).toBeInTheDocument();
    await expect(canvas.getByText('Your Projects Dashboard')).toBeInTheDocument();

    // Go to step 2
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('Step 2 of 4')).toBeInTheDocument();
    await expect(canvas.getByText('Adding a Repository')).toBeInTheDocument();

    // Go to step 3
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('Step 3 of 4')).toBeInTheDocument();
    await expect(canvas.getByText('Repository Insights')).toBeInTheDocument();

    // Go to step 4 (last)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('Step 4 of 4')).toBeInTheDocument();
    await expect(canvas.getByText('Configure Your AI Key')).toBeInTheDocument();

    // Last step should show "Get Started" and checkbox
    await expect(canvas.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    await expect(canvas.getByText("Don't show this guide again")).toBeInTheDocument();

    // Go back
    await userEvent.click(canvas.getByRole('button', { name: 'Previous' }));
    await expect(canvas.getByText('Step 3 of 4')).toBeInTheDocument();
  },
};

export const SkipButton: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};
