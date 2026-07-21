// src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Pill, LogIn, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const FEATURES = [
  { icon: BarChart3,   text: 'Real-time financial dashboard' },
  { icon: TrendingUp,  text: 'Sales & profit analytics' },
  { icon: ShieldCheck, text: 'Role-based access control' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registered ? 'Account created successfully. Please sign in.' : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const getErrorMessage = (err) => {
    console.error('Login error details:', err);
    const response = err?.response?.data;
    if (response?.message) return response.message;
    if (Array.isArray(response?.errors) && response.errors.length) {
      const firstErr = response.errors[0];
      return typeof firstErr === 'string' ? firstErr : firstErr.message || 'Validation failed';
    }
    if (err?.message) return err.message;
    return 'Login failed. Please try again.';
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #10b981, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 32px rgba(16,185,129,0.35)',
          }}>
            <Pill size={34} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Pharmo<span style={{ color: '#10b981' }}>ra</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Business Manager
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color="#10b981" />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: 20, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            "Finally, a system that tells me exactly where my money goes — every single day."
          </p>
          <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: 8, fontWeight: 600 }}>
            — Medical Shop Owner
          </p>
        </div>
      </div>

      {/* Login form panel */}
      <div className="auth-panel">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Pill size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pharmo<span style={{ color: '#10b981' }}>ra</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Business Manager</div>
            </div>
          </div>

          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {successMessage && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#047857',
              fontSize: '0.875rem',
              marginBottom: 16,
            }}>
              {successMessage}
            </div>
          )}

          {serverError && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--error-bg)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '0.875rem',
              marginBottom: 16,
            }}>
              {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} id="login-form">
            {/* Email */}
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">
                Email address <span className="required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <span className="input-error-msg">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 40, paddingLeft: 12 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="input-error-msg">{errors.password.message}</span>
              )}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Forgot password support is not available yet.
              </span>
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" id="go-to-register">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
