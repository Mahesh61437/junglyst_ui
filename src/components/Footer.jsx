import { Link } from 'react-router-dom';
import NaturalLogo from './NaturalLogo';

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: 'var(--bg-secondary)', 
      padding: '6rem 0 3rem',
      borderTop: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)'
    }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '4rem',
          marginBottom: '5rem'
        }}>
          {/* Brand Identity */}
          <div style={{ maxWidth: '320px' }}>
            <NaturalLogo size={42} />
            <p style={{ 
              marginTop: '1.5rem', 
              fontSize: '0.925rem', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.7,
              fontStyle: 'italic'
            }}>
              Junglyst is a curated marketplace connecting discerning collectors with verified growers of rare botanical specimens. Each plant is a piece of living art.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>The Collection</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/shop" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>All Specimens</Link>
              <Link to="/sellers" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Verified Sellers</Link>
              <Link to="/guides" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Care Guides</Link>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>Marketplace</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/seller/onboarding" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>Become a Seller</Link>
              <Link to="/seller/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Seller Login</Link>
              <Link to="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Partner Inquiry</Link>
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          opacity: 0.5
        }}>
          <p>&copy; 2026 Junglyst Botanical. Cultivating excellence in India.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
             <Link to="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
