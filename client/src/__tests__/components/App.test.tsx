import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    render(<App />);
    // App should render something
    expect(document.body).toBeTruthy();
  });

  it('should redirect to login when not authenticated', () => {
    render(<App />);
    // Login page should show
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('should show login page for unauthenticated users', () => {
    localStorage.removeItem('token');
    render(<App />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
