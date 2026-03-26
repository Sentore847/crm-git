import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../../pages/Signup';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import api from '@/services/api';

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSignup = () =>
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

  it('should render signup form', () => {
    renderSignup();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should render heading', () => {
    renderSignup();
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should render login link', () => {
    renderSignup();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByPlaceholderText('Email'), 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByPlaceholderText('Password'), 'ab1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error for password mismatch', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByPlaceholderText('Password'), 'password1');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'password2');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should have submit button disabled when form is invalid', () => {
    renderSignup();
    const submitBtn = screen.getByRole('button', { name: /sign up/i });
    expect(submitBtn).toBeDisabled();
  });

  it('should call API on valid form submission', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    renderSignup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password1');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'password1');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign up/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'test@test.com',
        password: 'password1',
      });
    });
  });

  it('should show success message after signup', async () => {
    const user = userEvent.setup();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    renderSignup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password1');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'password1');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('should display server error on signup failure', async () => {
    const user = userEvent.setup();
    const axiosError = new Error('err') as any;
    axiosError.response = { data: { message: 'User already exists' } };
    axiosError.isAxiosError = true;

    const axios = await import('axios');
    vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(axiosError);

    renderSignup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password1');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'password1');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });
});
