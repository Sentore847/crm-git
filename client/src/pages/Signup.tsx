import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import type { SignupFormData } from '@/types/auth.types';
import api from '@/services/api';
import axios from 'axios';

const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({ mode: 'onChange' });

  const password = watch('password');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: SignupFormData) => {
    setServerError('');
    setSuccess('');
    try {
      await api.post('/auth/signup', {
        email: data.email,
        password: data.password,
      });
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.message || 'Signup failed');
      } else {
        setServerError('Signup failed');
      }
    }
  };

  return (
    <main
      className="auth-page d-flex vh-100 justify-content-center align-items-center"
      id="main-content"
    >
      <section
        className="auth-card p-4 rounded shadow"
        style={{ maxWidth: 400, width: '100%' }}
        aria-label="Sign up"
      >
        <h1 className="h2 mb-4 text-center">Sign Up</h1>

        {serverError && (
          <div className="alert alert-danger" role="alert">
            {serverError}
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Registration form">
          <div className="mb-2">
            <label htmlFor="signup-email" className="form-label visually-hidden">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format',
                },
              })}
            />
            {errors.email && (
              <div id="signup-email-error" className="invalid-feedback d-block" role="alert">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="mb-2">
            <label htmlFor="signup-password" className="form-label visually-hidden">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'signup-password-error' : undefined}
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/,
                  message: 'Must contain letters and numbers',
                },
              })}
            />
            {errors.password && (
              <div id="signup-password-error" className="invalid-feedback d-block" role="alert">
                {errors.password.message}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="signup-confirm-password" className="form-label visually-hidden">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Confirm Password"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={errors.confirmPassword ? 'true' : undefined}
              aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined}
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <div id="signup-confirm-error" className="invalid-feedback d-block" role="alert">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <button className="btn btn-primary w-100" type="submit" disabled={!isValid}>
            Sign Up
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
};

export default Signup;
