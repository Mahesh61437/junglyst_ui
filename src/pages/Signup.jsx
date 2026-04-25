import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import NaturalLogo from '../components/NaturalLogo';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'collector' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!register) {
        throw new Error("Registration service is temporarily unavailable.");
      }
      
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.name, 
        role: formData.role
      });
      
      if (formData.role === 'grower') {
        navigate('/seller/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.email?.[0] || 
                  err.response?.data?.username?.[0] || 
                  err.response?.data?.error || 
                  "Registration failed. Please check your details.";
      setError(msg);
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
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Join the Sanctuary</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Begin your journey into rare aquatic botanicals.</p>

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

        <form onSubmit={handleSignup} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Inderpal Singh"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                placeholder="collector@junglyst.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Security Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
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

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>I am joining as a</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'collector'})}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: formData.role === 'collector' ? '2px solid var(--bg-deep)' : '1px solid var(--border-subtle)', backgroundColor: formData.role === 'collector' ? 'var(--bg-secondary)' : 'transparent', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Collector
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'grower'})}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: formData.role === 'grower' ? '2px solid var(--bg-deep)' : '1px solid var(--border-subtle)', backgroundColor: formData.role === 'grower' ? 'var(--bg-secondary)' : 'transparent', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Grower
              </button>
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
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Processing...' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', gap: '1rem', alignItems: 'flex-start', textAlign: 'left' }}>
            <Heart size={20} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Joining the sanctuary gives you exclusive access to limited-edition specimens and certified studio-safe shipping.
            </p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          Already a botanist? <Link to="/login" style={{ color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none' }}>Enter Profile</Link>
        </p>
      </div>
    </div>
  );
}
