import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import NaturalLogo from './NaturalLogo';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return (
      <div style={{
        minHeight: '70vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '4rem 1.5rem'
      }}>
        <div className="slide-up" style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 2rem', color: 'var(--brand-gold)'
          }}>
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '2.5rem',
            color: 'var(--bg-deep)', marginBottom: '1rem'
          }}>
            Sign in required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            This page is only available to registered collectors. Sign in or create a free account to continue.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.5rem', borderRadius: '100px' }}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              state={{ from: location.pathname }}
              className="btn btn-outline"
              style={{ padding: '0.9rem 2.5rem', borderRadius: '100px' }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
