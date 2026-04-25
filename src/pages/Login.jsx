import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import NaturalLogo from '../components/NaturalLogo';

export default function Login() {
  const [method, setMethod] = useState('email'); // email, phone
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', email: '', password: '' });
  const { login, loginWithOTP } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (method === 'phone') {
        await loginWithOTP(formData.phone);
      } else {
        await login(formData);
      }
      navigate('/');
    } catch (err) {
      alert("Authenticity check failed. Please verify credentials.");
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
          <NaturalLogo textColor="var(--bg-deep)" size="2rem" />
        </Link>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Access your botanical collection and secure specimens.</p>

        {/* Method Toggles */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--bg-secondary)', 
          padding: '0.3rem', 
          borderRadius: '12px', 
          marginBottom: '2rem' 
        }}>
          {['email', 'phone'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: method === m ? 'white' : 'transparent',
                color: method === m ? 'var(--bg-deep)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                boxShadow: method === m ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          {method === 'phone' ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="tel" 
                  placeholder="+91 00000 00000"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Email or Username</label>
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
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Password</label>
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
            </>
          )}

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
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Verifying...' : (method === 'phone' ? 'Request OTP' : 'Enter Collection')}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ margin: '2.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Specimen Social</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
        </div>

        <button 
          onClick={() => alert("Simulation: Redirecting to Secure Google Auth...")}
          style={{ 
            width: '100%', 
            padding: '0.85rem', 
            backgroundColor: 'white', 
            color: 'var(--bg-deep)', 
            border: '1.5px solid var(--border-subtle)', 
            borderRadius: '12px', 
            fontWeight: 700, 
            cursor: 'pointer', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}
        >
          <img src="https://www.google.com/favicon.ico" alt="google" style={{ width: '18px' }} />
          Secure Gmail Login
        </button>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          New to the sanctuary? <Link to="/signup" style={{ color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none' }}>Join Junglyst</Link>
        </p>
      </div>
    </div>
  );
}
