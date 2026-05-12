import { Link } from 'react-router-dom';

// Shared wrapper for all policy/legal pages
export default function PolicyLayout({ badge, title, updated, summary, children, relatedLinks = [] }) {
  return (
    <div style={{ backgroundColor: 'white', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>

      {/* Hero */}
      <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '7rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.25em' }}>{badge}</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-serif)', marginTop: '1rem', marginBottom: '1.5rem', lineHeight: 1.15 }}>{title}</h1>
          {summary && <p style={{ fontSize: '1.05rem', opacity: 0.75, lineHeight: 1.7, maxWidth: '600px' }}>{summary}</p>}
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', opacity: 0.45, fontWeight: 600 }}>Last updated: {updated}</p>
        </div>
      </section>

      {/* Body */}
      <div className="container" style={{ maxWidth: '820px', padding: '5rem 1.5rem 8rem' }}>
        {children}

        {/* Related policies */}
        {relatedLinks.length > 0 && (
          <div style={{ marginTop: '5rem', paddingTop: '3rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', marginBottom: '1rem' }}>Related Policies</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {relatedLinks.map(({ to, label }) => (
                <Link key={to} to={to} style={{ padding: '0.5rem 1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--bg-deep)', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >{label}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable building blocks ──────────────────────────────────────────────────

export function Section({ n, title, children }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--bg-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <span style={{ color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-sans)', minWidth: '24px' }}>{n}.</span>
        {title}
      </h2>
      <div style={{ color: '#334155', lineHeight: 1.85, fontSize: '0.95rem', paddingLeft: '2rem' }}>
        {children}
      </div>
    </section>
  );
}

export function Notice({ type = 'info', children }) {
  const styles = {
    info:    { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', color: '#14532d' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠', color: '#92400e' },
    danger:  { bg: '#fef2f2', border: '#fecaca', icon: '✕', color: '#991b1b' },
  };
  const s = styles[type];
  return (
    <div style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ color: s.color, fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>{s.icon}</span>
      <div style={{ color: s.color, fontSize: '0.875rem', lineHeight: 1.7, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

export function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '3rem 0' }} />;
}
