import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="container" style={{ padding: '8rem 1.5rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--bg-deep)', marginBottom: '1rem' }}>Terms & Conditions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Last Updated: April 21, 2026</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>1. Botanical Acquisition</h2>
          <p>By purchasing from Junglyst, you acknowledge that you are acquiring live biological specimens. While we guarantee "Live Arrival" for all studio-certified specimens, the long-term health of the plant is subject to the conditions of your specific aquatic environment.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>2. Marketplace Role</h2>
           <p>Junglyst acts as a curated boutique marketplace connecting certified master growers with collectors. We perform rigorous quality audits on all sellers, but specific specimen variations (leaf count, rhizome size) are natural and expected.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>3. Shipping & Logistics</h2>
           <p>All specimens are shipped using moisture-locking botanical wraps and professional padding. Risk of loss passes to the buyer upon delivery of the specimen by the carrier to the specified address. We strongly recommend immediate unboxing upon arrival.</p>
        </div>

        <div>
           <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>4. Seller Obligations</h2>
           <p>Sellers on Junglyst must maintain "Pest-Free" certification for their nurseries. Failure to adhere to quality standards results in immediate removal from the platform and suspension of acquisition rights.</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              For specific legal inquiries or resolution of specimen disputes, please contact our curation team at <strong>legal@junglyst.com</strong>.
           </p>
        </div>
      </section>
      
      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
         <Link to="/" style={{ color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>← Return to Sanctuary</Link>
      </div>
    </div>
  );
}
