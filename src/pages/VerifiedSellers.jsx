import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Star, MapPin, ArrowRight,
  ChevronLeft, ChevronRight, Leaf, Users, Package
} from 'lucide-react';
import { SellerService } from '../services/SellerService';
import { getImageUrl } from '../utils/imageUtils';

// ─── Spotlight Hero (featured sellers only) ───────────────────────────────────
function SpotlightHero({ sellers }) {
  const [idx, setIdx] = useState(0);
  const total = sellers.length;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return (
    <section style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-deep)', color: 'white', textAlign: 'center', padding: '4rem 2rem'
    }}>
      <div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
          The Curator Registry
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Our sanctuary is refreshing its list of verified growers. Check back soon.
        </p>
      </div>
    </section>
  );

  const s = sellers[idx];

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: 'clamp(480px, 70vh, 700px)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Background image */}
          <img
            src={getImageUrl(s.banner_url) || '/assets/default-banner.jpg'}
            alt={s.store_name}
            onError={e => { e.target.src = '/assets/default-banner.jpg'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Dark overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(10,20,18,0.85) 0%, rgba(10,20,18,0.4) 100%)'
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container" style={{
        position: 'relative', zIndex: 10,
        height: '100%', minHeight: 'clamp(480px, 70vh, 700px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(3rem, 6vw, 6rem) 1.5rem',
        color: 'white'
      }}>
        <motion.span
          key={`label-${idx}`}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.3em', color: 'var(--brand-gold)', marginBottom: '1.25rem', display: 'block'
          }}
        >
          Featured Sanctuary
        </motion.span>

        <motion.h1
          key={`name-${idx}`}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            fontSize: 'clamp(2rem, 6vw, 5.5rem)',
            fontFamily: 'var(--font-serif)', lineHeight: 1,
            marginBottom: '1.25rem', maxWidth: '700px'
          }}
        >
          {s.store_name}
        </motion.h1>

        <motion.p
          key={`tag-${idx}`}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
            opacity: 0.82, lineHeight: 1.7,
            maxWidth: '520px', marginBottom: '2.5rem', fontWeight: 300
          }}
        >
          {s.tagline || s.bio || 'Excellence in botanical curation.'}
        </motion.p>

        <motion.div
          key={`cta-${idx}`}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Link to={`/store/${s.slug}`} style={{
            padding: '0.875rem 2.5rem',
            backgroundColor: 'white', color: '#1a1a1a',
            fontWeight: 800, fontSize: '0.8rem',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textDecoration: 'none', display: 'inline-block'
          }}>
            Explore Studio
          </Link>
          {s.location_city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6, fontSize: '0.85rem' }}>
              <MapPin size={14} /> {s.location_city}
            </span>
          )}
        </motion.div>
      </div>

      {/* Carousel controls */}
      {total > 1 && (
        <>
          <button onClick={prev} aria-label="Previous" style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 20
          }}><ChevronLeft size={20} /></button>
          <button onClick={next} aria-label="Next" style={{
            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 20
          }}><ChevronRight size={20} /></button>

          {/* Dot indicators */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '0.5rem', zIndex: 20
          }}>
            {sellers.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} style={{
                width: i === idx ? '28px' : '8px', height: '8px', borderRadius: '4px',
                backgroundColor: i === idx ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0
              }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  return (
    <section style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container" style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', gap: '0',
        padding: 0
      }}>
        {[
          { icon: <Users size={20} />, value: stats.total_sellers, label: 'Verified Curators' },
          { icon: <Package size={20} />, value: stats.total_products, label: 'Rare Specimens' },
          { icon: <ShieldCheck size={20} />, value: `${stats.survival_rate}%`, label: 'Survival Rate' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            flex: '1 1 120px', textAlign: 'center',
            padding: 'clamp(1.5rem, 3vw, 2.5rem) 1.5rem',
            borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <div style={{ color: 'var(--brand-gold)', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              {item.icon}
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', marginBottom: '0.25rem' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Seller Card ──────────────────────────────────────────────────────────────
function SellerCard({ seller }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '20px', overflow: 'hidden',
        backgroundColor: 'white',
        border: '1px solid var(--border-subtle)',
        boxShadow: hovered ? '0 20px 48px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Banner */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#e2e8e0' }}>
        <img
          src={getImageUrl(seller.banner_url) || '/assets/default-banner.jpg'}
          alt={seller.store_name}
          onError={e => { e.target.src = '/assets/default-banner.jpg'; }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: hovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        {/* Logo */}
        <div style={{
          position: 'absolute', bottom: '-24px', left: '1.25rem',
          width: '52px', height: '52px', borderRadius: '14px',
          backgroundColor: 'white', padding: '5px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden',
          border: '2px solid white'
        }}>
          <img
            src={getImageUrl(seller.logo_url) || '/assets/default-logo.jpg'}
            alt={seller.store_name}
            onError={e => { e.target.src = '/assets/default-logo.jpg'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }}
          />
        </div>
        {/* Featured badge */}
        {seller.is_featured && (
          <div style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            backgroundColor: 'var(--brand-gold)', color: 'white',
            fontSize: '0.6rem', fontWeight: 900, padding: '0.3rem 0.7rem',
            borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Featured
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '2rem 1.25rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
          <Star size={13} fill="var(--brand-gold)" color="var(--brand-gold)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {seller.rating || '5.0'}
          </span>
          {seller.location_city && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <MapPin size={11} /> {seller.location_city}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.6rem', lineHeight: 1.2 }}>
          {seller.store_name}
        </h3>

        <p style={{
          fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          flexGrow: 1, marginBottom: '1.25rem',
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {seller.bio || 'Curating rare botanical specimens and aquascape essentials.'}
        </p>

        {/* Tags */}
        {seller.expertise_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {seller.expertise_tags.slice(0, 3).map((tag, i) => (
              <span key={i} style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                borderRadius: '50px', backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{tag}</span>
            ))}
          </div>
        )}

        <Link
          to={`/store/${seller.slug}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem', borderRadius: '10px',
            border: '1.5px solid var(--border-subtle)',
            color: 'var(--text-primary)', textDecoration: 'none',
            fontSize: '0.8rem', fontWeight: 700,
            transition: 'all 0.2s',
            backgroundColor: hovered ? 'var(--bg-deep)' : 'transparent',
            color: hovered ? 'white' : 'var(--text-primary)',
            borderColor: hovered ? 'var(--bg-deep)' : 'var(--border-subtle)',
          }}
        >
          View Boutique <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VerifiedSellers() {
  const [sellers, setSellers] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [stats, setStats] = useState({ total_sellers: '—', total_products: '—', survival_rate: 98 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sellersData, statsData] = await Promise.all([
          SellerService.getVerifiedDirectory(),
          SellerService.getPlatformStats(),
        ]);

        const all = sellersData.results || sellersData || [];
        setSellers(all);
        setStats(statsData);

        const featured = all.filter(s => s.is_featured);
        setFeaturedSellers(featured.length ? featured : all.slice(0, 3));
      } catch (err) {
        console.error('VerifiedSellers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f8f4', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>

      {/* Hero Spotlight */}
      {!loading && <SpotlightHero sellers={featuredSellers} />}
      {loading && (
        <div style={{ minHeight: '60vh', backgroundColor: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Directory */}
      <section style={{ padding: 'clamp(3.5rem, 8vw, 8rem) 0' }}>
        <div className="container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 5rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
              <span style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Master Curators</span>
              <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)', marginBottom: '1rem' }}>
              The Verified Registry
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: 'clamp(0.875rem, 2vw, 1rem)', lineHeight: 1.7 }}>
              Every grower on Junglyst is individually vetted for quality, expertise, and sustainable practices.
            </p>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: '20px', overflow: 'hidden', backgroundColor: 'white', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ aspectRatio: '16/9', backgroundColor: '#e8ede9' }} />
                  <div style={{ padding: '2rem 1.25rem 1.5rem' }}>
                    <div style={{ height: '12px', backgroundColor: '#e8ede9', borderRadius: '6px', marginBottom: '0.75rem', width: '60%' }} />
                    <div style={{ height: '10px', backgroundColor: '#e8ede9', borderRadius: '6px', marginBottom: '0.5rem', width: '90%' }} />
                    <div style={{ height: '10px', backgroundColor: '#e8ede9', borderRadius: '6px', width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Leaf size={40} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
              <p>No verified sellers found yet.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '1.5rem'
            }}>
              {sellers.map(seller => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          )}
        </div>
      </section>


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
