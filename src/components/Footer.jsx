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
