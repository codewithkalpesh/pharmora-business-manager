// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Pill } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(16,185,129,0.05)', filter: 'blur(80px)',
        top: -150, left: -150,
      }} />

      <div style={{ marginBottom: 24, opacity: 0.3 }}>
        <Pill size={48} color="#10b981" />
      </div>

      <div style={{
        fontSize: '7rem', fontWeight: 800, color: 'var(--text-primary)',
        lineHeight: 1, letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        404
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 360, marginBottom: 32 }}>
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Go back
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          <Home size={16} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
