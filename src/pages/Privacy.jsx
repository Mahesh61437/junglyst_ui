import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="container" style={{ padding: '8rem 1.5rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--bg-deep)', marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Last Updated: April 21, 2026</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>1. Collection of Data</h2>
          <p>We collect botanical acquisition history, shipping coordinates, and communication logs with master growers solely to enhance your curation experience and ensure successful specimen transitions.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>2. Identity Security</h2>
           <p>Your authentication data is managed through secure tokens and industry-standard encryption. Junglyst never stores raw nursery access credentials or sensitive financial vault data on our primary servers.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>3. Marketplace Transparency</h2>
           <p>Seller information is shared with buyers only to the extent necessary for acquisition and support. We do not sell your personal botanical interests to third-party data harvesters.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>4. Specimen Tracking</h2>
           <p>Aggregate data on specimen popularity and regional shipping success rates may be used anonymously to optimize our logistics vault and provide better care guides for the community.</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              If you wish to purge your collection data or request an identity audit, please contact <strong>privacy@junglyst.com</strong>.
           </p>
        </div>
      </section>
      
      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
         <Link to="/" style={{ color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>← Return to Sanctuary</Link>
      </div>
    </div>
  );
}
