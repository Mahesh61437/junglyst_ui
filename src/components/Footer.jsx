import { Link } from 'react-router-dom';
import NaturalLogo from './NaturalLogo';
import SocialLinks from './SocialLinks';

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '5rem'
        }}>
          {/* Brand Identity */}
          <div style={{ maxWidth: '300px', gridColumn: 'span 1' }}>
            <NaturalLogo size={42} />
            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              fontStyle: 'italic'
            }}>
              Junglyst is a curated marketplace connecting discerning collectors with verified growers of rare botanical specimens. Each plant is a piece of living art.
            </p>
            <div style={{ marginTop: '1.75rem' }}>
              <SocialLinks variant="light" size={16} buttonSize={36} gap={0.6} />
            </div>
          </div>

          {/* The Collection */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>The Collection</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/shop">All Specimens</FooterLink>
              <FooterLink to="/combos">Combos</FooterLink>
              <FooterLink to="/sellers">Verified Sellers</FooterLink>
              <FooterLink to="/guides">Care Guides</FooterLink>
              <FooterLink to="/about">About Junglyst</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>Marketplace</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/seller/dashboard">Seller Login</FooterLink>
              <FooterLink to="/seller-policy">Seller Policy</FooterLink>
              {/* <FooterLink to="/shipping-policy">Shipping Info</FooterLink> */}
              <FooterLink to="/refund-policy">Refunds & Returns</FooterLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/terms">Terms & Conditions</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              {/* <FooterLink to="/shipping-policy">Shipping Policy</FooterLink> */}
              <FooterLink to="/refund-policy">DOA Policy</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          opacity: 0.6,
        }}>
          <p>&copy; 2026 Junglyst Botanical Private Limited. Bengaluru, India.</p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/shipping-policy">Shipping</FooterLink>
            <FooterLink to="/refund-policy">Refunds</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterButton onClick={() => window.dispatchEvent(new Event('openBugReport'))}>Report a Bug</FooterButton>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </Link>
  );
}

function FooterButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.15s',
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit'
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </button>
  );
}
