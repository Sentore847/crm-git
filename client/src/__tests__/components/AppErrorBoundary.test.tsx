import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppErrorBoundary from '@/components/AppErrorBoundary';

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <AppErrorBoundary>
        <div>Normal content</div>
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should render fallback UI on error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError message="Test error" />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Application error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show reload button on error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError message="crash" />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('should show default message for error without message', () => {
    const ThrowEmptyError = () => {
      throw new Error('');
    };

    render(
      <AppErrorBoundary>
        <ThrowEmptyError />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Application error')).toBeInTheDocument();
  });
});
