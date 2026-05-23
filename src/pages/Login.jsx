import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import NaturalLogo from '../components/NaturalLogo';
import api from '../services/api';

export default function Login() {
  const [view, setView] = useState('login'); // 'login', 'forgotPassword', 'resetPassword'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 60-second OTP cooldown timer
  const [otpCooldown, setOtpCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = (seconds = 60) => {
    setOtpCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const { login } = useAuth();
  const { syncAfterLogin } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await login(formData);
      syncAfterLogin().catch(() => null);
      const { trackLogin } = await import('../utils/analytics');
      trackLogin({ method: 'email' });
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/';
      navigate(redirectTo);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (otpCooldown > 0) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/core/forgot-password/', { email: resetEmail });
      setSuccessMsg(res.data.message || "OTP sent to email if account exists.");
      startCooldown(60);
      setTimeout(() => {
        setSuccessMsg(null);
        setView('resetPassword');
      }, 2000);
    } catch (err) {
      const retryAfter = err.response?.data?.retry_after;
      if (retryAfter) startCooldown(retryAfter);
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/core/reset-password/', { email: resetEmail, otp, new_password: newPassword });
      setSuccessMsg(res.data.message || "Password reset successfully.");
      setTimeout(() => {
        setSuccessMsg(null);
        setView('login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--bg-secondary)',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        padding: '3.5rem', 
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center'
      }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: '2.5rem' }}>
          <NaturalLogo textColor="var(--bg-deep)" size={24} vertical={false} />
        </Link>
        
        {view === 'login' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Access your botanical collection and secure specimens.</p>
          </>
        )}

        {view === 'forgotPassword' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Reset Password</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Enter your email to receive an OTP.</p>
          </>
        )}

        {view === 'resetPassword' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Set New Password</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Enter the OTP sent to your email and your new password.</p>
          </>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '1rem', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            marginBottom: '2rem',
            textAlign: 'left',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ 
            backgroundColor: '#dcfce7', 
            color: '#15803d', 
            padding: '1rem', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            marginBottom: '2rem',
            textAlign: 'left',
            border: '1px solid #bbf7d0'
          }}>
            {successMsg}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Email or Username <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="collector@junglyst.com or 'admin'"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => { setError(null); setSuccessMsg(null); setView('forgotPassword'); }} 
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '1.125rem', 
                backgroundColor: 'var(--bg-deep)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 800, 
                cursor: 'pointer', 
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s',
                marginBottom: '2rem'
              }}
            >
              {loading ? 'Verifying...' : 'Enter Collection'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {view === 'forgotPassword' && (
          <form onSubmit={handleForgotPassword} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  placeholder="collector@junglyst.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCooldown > 0}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: otpCooldown > 0 ? '#94a3b8' : 'var(--bg-deep)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s',
                marginBottom: '1rem'
              }}
            >
              {loading ? 'Sending…' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
              {!loading && otpCooldown === 0 && <ArrowRight size={18} />}
            </button>

            <button 
              type="button" 
              onClick={() => { setError(null); setSuccessMsg(null); setView('login'); }}
              style={{ 
                width: '100%', 
                padding: '1.125rem', 
                backgroundColor: 'transparent', 
                color: 'var(--text-secondary)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '12px', 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginBottom: '2rem'
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </form>
        )}

        {view === 'resetPassword' && (
          <form onSubmit={handleResetPassword} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                OTP <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                New Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: 'var(--bg-deep)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s',
                marginBottom: '1rem'
              }}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
              {!loading && <ArrowRight size={18} />}
            </button>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Didn't receive it?{' '}
              <button
                type="button"
                disabled={otpCooldown > 0}
                onClick={async () => {
                  if (otpCooldown > 0) return;
                  setError(null); setSuccessMsg(null);
                  try {
                    const res = await api.post('/core/forgot-password/', { email: resetEmail });
                    setSuccessMsg(res.data.message || 'OTP resent.');
                    startCooldown(60);
                  } catch (err) {
                    const retryAfter = err.response?.data?.retry_after;
                    if (retryAfter) startCooldown(retryAfter);
                    setError(err.response?.data?.error || 'Failed to resend OTP.');
                  }
                }}
                style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer', color: otpCooldown > 0 ? '#94a3b8' : 'var(--brand-gold)', fontSize: '0.85rem' }}
              >
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setError(null); setSuccessMsg(null); setView('login'); }}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginBottom: '2rem'
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </form>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          New to Junglyst? <Link to="/signup" style={{ color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
