import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import type { SignupFormData } from '../types/auth.types';
import api from '../services/api';
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
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="bg-white p-4 rounded shadow" style={{ maxWidth: 400, width: '100%' }}>
        <h2 className="mb-4 text-center">Sign Up</h2>

        {serverError && <div className="alert alert-danger">{serverError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input
            type="email"
            placeholder="Email"
            className={`form-control mb-2 ${errors.email ? 'is-invalid' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format',
              },
            })}
          />
          {errors.email && <div className="invalid-feedback d-block">{errors.email.message}</div>}

          <input
            type="password"
            placeholder="Password"
            className={`form-control mb-2 ${errors.password ? 'is-invalid' : ''}`}
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
          {errors.password && <div className="invalid-feedback d-block">{errors.password.message}</div>}

          <input
            type="password"
            placeholder="Confirm Password"
            className={`form-control mb-3 ${errors.confirmPassword ? 'is-invalid' : ''}`}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <div className="invalid-feedback d-block">{errors.confirmPassword.message}</div>
          )}

          <button className="btn btn-primary w-100" type="submit" disabled={!isValid}>
            Sign Up
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;