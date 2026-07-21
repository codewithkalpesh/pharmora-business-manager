// src/components/common/FormField.jsx
// Reusable compact form field component for light-mode modals
import React from 'react';

export const fieldLabelStyle = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 5,
};

export const inputBase = {
  width: '100%',
  height: 38,
  padding: '0 10px',
  background: '#f8fafc',
  border: '1.5px solid rgba(148,163,184,0.2)',
  borderRadius: 10,
  color: '#0f172a',
  fontSize: '0.875rem',
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export const inputFocus = {
  borderColor: '#10b981',
  boxShadow: '0 0 0 3px rgba(16,185,129,0.1)',
};

export const inputError = {
  borderColor: '#ef4444',
  boxShadow: '0 0 0 3px rgba(239,68,68,0.08)',
};

export const selectBase = {
  ...inputBase,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 32,
};

export const cancelBtnStyle = {
  padding: '0 18px',
  height: 38,
  borderRadius: 10,
  cursor: 'pointer',
  background: '#f1f5f9',
  border: '1px solid rgba(148,163,184,0.2)',
  color: '#475569',
  fontSize: '0.875rem',
  fontWeight: 600,
  fontFamily: 'inherit',
};

export const submitBtnStyle = {
  padding: '0 22px',
  height: 38,
  borderRadius: 10,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  border: 'none',
  color: 'white',
  fontSize: '0.875rem',
  fontWeight: 700,
  fontFamily: 'inherit',
  boxShadow: '0 4px 14px rgba(16,185,129,0.28)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export const sectionLabelStyle = (color = '#10b981') => ({
  fontSize: '0.6875rem',
  fontWeight: 700,
  color,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: 10,
  marginTop: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
});

export const errorBannerStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  marginBottom: 14,
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.18)',
  color: '#dc2626',
  fontSize: '0.8125rem',
};

export const formFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  paddingTop: 16,
  marginTop: 14,
  borderTop: '1px solid rgba(148,163,184,0.1)',
};

/**
 * Compact labeled form field wrapper
 */
export function FormField({ label, error, children, span = 1, style = {} }) {
  return (
    <div style={{ gridColumn: `span ${span}`, ...style }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
      {error && (
        <p style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: 3, margin: '3px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Use with react-hook-form's register() to auto-wire focus/blur styles
 */
export function useInputStyle(errors, name) {
  return (extraStyle = {}) => ({
    style: {
      ...inputBase,
      ...(errors?.[name] ? inputError : {}),
      ...extraStyle,
    },
    onFocus: (e) => {
      if (!errors?.[name]) {
        e.target.style.borderColor = '#10b981';
        e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
      }
    },
    onBlur: (e) => {
      if (!errors?.[name]) {
        e.target.style.borderColor = 'rgba(148,163,184,0.2)';
        e.target.style.boxShadow = 'none';
      }
    },
  });
}
