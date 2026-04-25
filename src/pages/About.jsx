import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '10rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '800px' }}>
            <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Our Philosophy</span>
            <h1 style={{ fontSize: '4.5rem', marginTop: '1.5rem', marginBottom: '2.5rem' }}>Cultivating a botanical renaissance.</h1>
            <p style={{ fontSize: '1.5rem', lineHeight: 1.6, opacity: 0.8, fontWeight: 300 }}>
              Junglyst is more than a marketplace. It is a curated gallery for the living arts, connecting discerning collectors with the world's most meticulous growers.
            </p>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '-10%', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }}>
          <Leaf size={600} strokeWidth={0.5} />
        </div>
      </section>

      {/* The Origin */}
      <section className="container" style={{ padding: '10rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8rem', alignItems: 'center' }}>
          <div className="slide-up">
            <h2 style={{ fontSize: '3rem', marginBottom: '2rem' }}>The Origin</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Born from a passion for high-fidelity aquatic scapes, Junglyst was founded to bridge the gap between anonymous mass production and the artisanal cultivation of rare specimens.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              We believe every plant is a masterpiece of evolution. Our mission is to ensure these specimens are treated with the respect they deserve, from the nutrient-rich waters of their origin to the curated scapes of their final home.
            </p>
          </div>
          <div className="slide-up" style={{ position: 'relative', animationDelay: '0.2s' }}>
             <img 
               src="https://images.unsplash.com/photo-1512411210168-5264b3879f4c?w=800&q=80" 
               alt="Botanical Art" 
               style={{ width: '100%', height: '600px', objectFit: 'cover', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }} 
             />
             <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', backgroundColor: 'var(--brand-gold)', padding: '2.5rem', color: 'white', borderRadius: '24px' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>0%</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Compromise Standards</p>
             </div>
          </div>
        </div>
      </section>

      {/* Our Standards */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '10rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h2 style={{ fontSize: '3rem' }}>The Junglyst Standards</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
            {[
              { icon: <Award size={32} />, title: "Verified Lineage", desc: "Every specimen's origin is tracked to ensure authenticity and ethical sourcing." },
              { icon: <ShieldCheck size={32} />, title: "Quarantine Protocol", desc: "Rigorous inspection and treatment cycles before any specimen enters our registry." },
              { icon: <Heart size={32} />, title: "Grower Direct", desc: "Removing middle-men to ensure specimens arrive faster and in peak health." }
            ].map((std, i) => (
              <div key={i} style={{ backgroundColor: 'white', padding: '4rem', borderRadius: '32px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                <div style={{ color: 'var(--brand-gold)', marginBottom: '2rem', display: 'inline-block' }}>{std.icon}</div>
                <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{std.title}</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{std.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section style={{ padding: '10rem 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>Ready to start your exhibition?</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '4rem' }}>Explore the finest collection of rare botanical specimens available today.</p>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <Link to="/shop" className="btn btn-primary" style={{ padding: '1.25rem 3.5rem' }}>Browse the Gallery</Link>
              <Link to="/contact" className="btn btn-outline" style={{ padding: '1.25rem 3.5rem' }}>Get in Touch</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
