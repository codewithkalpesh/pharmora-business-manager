// src/pages/auth/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Pill, UserPlus, ChevronDown, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const FEATURES = [
  { icon: BarChart3,   text: 'Real-time financial dashboard' },
  { icon: TrendingUp,  text: 'Sales & profit analytics' },
  { icon: ShieldCheck, text: 'Role-based access control' },
];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['OWNER', 'MANAGER', 'ACCOUNTANT', 'STAFF']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ROLES = [
  { value: 'OWNER', label: 'Owner', desc: 'Full access' },
  { value: 'MANAGER', label: 'Manager', desc: 'Operations & purchases' },
  { value: 'ACCOUNTANT', label: 'Accountant', desc: 'Finance & reports' },
  { value: 'STAFF', label: 'Staff', desc: 'Limited data entry' },
];

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'OWNER' },
  });

  const getErrorMessage = (err) => {
    console.error('Registration error details:', err);
    if (err?.message === 'Network Error' || !err?.response) {
      return 'Network Error: Unable to reach the server at http://localhost:5000. Please verify the backend server is running.';
    }
    const response = err?.response?.data;
    if (response?.message) return response.message;
    if (Array.isArray(response?.errors) && response.errors.length) {
      const firstErr = response.errors[0];
      return typeof firstErr === 'string' ? firstErr : firstErr.message || 'Validation failed';
    }
    if (err?.message) return err.message;
    return 'Registration failed. Please try again.';
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password, role: data.role });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

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

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Pill size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pharmo<span style={{ color: '#10b981' }}>ra</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Business Manager</div>
            </div>
          </div>

          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Set up Pharmora for your medical shop</p>

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

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} id="register-form">
            {/* Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-name">
                Full name <span className="required">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Rajesh Sharma"
                autoComplete="name"
                {...register('name')}
              />
              {errors.name && <span className="input-error-msg">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-email">
                Email address <span className="required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <span className="input-error-msg">{errors.email.message}</span>}
            </div>

            {/* Role */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-role">
                Your role <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="reg-role"
                  className={`input ${errors.role ? 'input-error' : ''}`}
                  style={{ appearance: 'none', paddingRight: 36 }}
                  {...register('role')}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-password">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  style={{ paddingLeft: 12, paddingRight: 40 }}
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button type="button" className="input-suffix" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="input-error-msg">{errors.password.message}</span>}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-confirm">
                Confirm password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Re-enter your password"
                  style={{ paddingLeft: 12, paddingRight: 40 }}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                <button type="button" className="input-suffix" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="input-error-msg">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              id="register-submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isLoading}
              style={{ marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" id="go-to-login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
