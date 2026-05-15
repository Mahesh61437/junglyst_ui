import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageUtils';
import { ShieldCheck, ArrowRight, Leaf, Award, Truck, MapPin } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import api from '../services/api';

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  const items = [
    { value: stats?.total_sellers ?? '—', label: 'Verified Growers' },
    { value: stats?.total_products ?? '—', label: 'Species Listed' },
    { value: stats?.total_users ?? '—', label: 'Collectors' },
    { value: '100%', label: 'Pest-Free Guarantee' },
  ];
  return (
    <div style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(48%, 130px), 1fr))' }}>
          {items.map((item, i) => (
            <div key={i} style={{
              padding: 'clamp(1rem,2.5vw,1.75rem) 1rem',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: 'clamp(1.25rem,2.5vw,2rem)', fontWeight: 800, color: 'var(--brand-gold)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontSize: 'clamp(0.6rem,1.2vw,0.72rem)', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginTop: '0.35rem' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: <Award size={24} strokeWidth={1.5} />, title: 'Verified Growers Only', body: 'Every plant sourced from vetted experts with proven cultivation standards.' },
    { icon: <Truck size={24} strokeWidth={1.5} />, title: 'Expert Packaging', body: 'Moisture-lock methods ensure your delivery arrives in pristine condition.' },
    { icon: <ShieldCheck size={24} strokeWidth={1.5} />, title: 'Pest-Free Guarantee', body: 'All specimens treated and inspected for quality before leaving the farm.' },
  ];
  return (
    <section style={{ backgroundColor: 'white', padding: 'clamp(2.5rem,5vw,4.5rem) 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,220px),1fr))', gap: 'clamp(1.5rem,3vw,2.5rem)' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: '0.1rem' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem', fontWeight: 700 }}>{item.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Sellers ─────────────────────────────────────────────────────────
// Shows up to 3 featured growers as cards — promotes sellers, drives store visits.
// On mobile: full-width stacked. On tablet+: 3-column grid.
function FeaturedSellers({ sellers }) {
  const visible = sellers.slice(0, 3);
  if (!visible.length) return null;

  return (
    <section style={{ backgroundColor: '#f8fafc', padding: 'clamp(3rem,6vw,5.5rem) 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1.5rem,3vw,2.5rem)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.4rem' }}>Meet the growers</span>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2.25rem)', margin: 0 }}>Featured Sanctuaries</h2>
          </div>
          <Link to="/sellers" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            All growers <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
        }}>
          {visible.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={`/store/${s.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ borderRadius: '20px', overflow: 'hidden', backgroundColor: 'white', border: '1px solid var(--border-subtle)', transition: 'transform 0.22s, box-shadow 0.22s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                >
                  {/* Banner */}
                  <div style={{ position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: s.brand_color || 'var(--bg-deep)' }}>
                    <img
                      src={getImageUrl(s.banner_url) || '/assets/default-banner.jpg'}
                      alt={s.store_name}
                      onError={e => { e.target.src = '/assets/default-banner.jpg'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />

                    {/* Icon / logo badge */}
                    <div style={{ position: 'absolute', bottom: '-20px', left: '1.25rem', width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'white', padding: '3px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', overflow: 'hidden', border: '2px solid white' }}>
                      <img
                        src={getImageUrl(s.icon_url || s.logo_url) || '/assets/default-logo.jpg'}
                        alt={s.store_name}
                        onError={e => { e.target.src = '/assets/default-logo.jpg'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }}
                      />
                    </div>

                    {/* Verified badge */}
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(10,31,28,0.75)', backdropFilter: 'blur(6px)', padding: '0.3rem 0.6rem', borderRadius: '100px' }}>
                      <ShieldCheck size={11} color="var(--brand-gold)" />
                      <span style={{ fontSize: '0.6rem', color: 'var(--brand-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Verified</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '1.75rem 1.25rem 1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.store_name}</h3>
                    {s.tagline && (
                      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.tagline}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {s.location_city && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={11} /> {s.location_city}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 700 }}>
                        Visit <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const fetchHomeData = async () => {
  const { data } = await api.get('/core/home/');
  return data;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['home'],
    queryFn: fetchHomeData,
    staleTime: 1000 * 60 * 5,
  });

  const products = data?.products || [];
  const featuredSellers = data?.featured_sellers || [];
  const stats = data?.stats || null;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Promoted seller slides — sort_order + is_featured controls which sellers appear */}
      <HeroCarousel sellers={featuredSellers} />

      {/* Platform stats — builds instant trust below the fold */}
      <StatsBar stats={stats} />

      {/* Products — direct path to purchase */}
      <section className="container" style={{ padding: 'clamp(3.5rem,7vw,6.5rem) 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1.75rem,3.5vw,3rem)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
              <span style={{ color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Current Curation</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', margin: 0 }}>Seasonal Exhibitions</h2>
          </div>
          <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Curating your collection…
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <Leaf size={36} color="var(--border-subtle)" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p>No specimens available right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid-responsive">
            {products.map(p => (
              <ProductCard key={p.id} id={p.id} slug={p.slug} name={p.name} scientific_name={p.scientific_name}
                care_level={p.care_level} origin={p.origin} growth_rate={p.growth_rate}
                price={p.price} originalPrice={p.compare_at_price} image={p.image}
                trending={p.is_trending} reviews={p.rating} stock={p.stock}
                variants={p.variants} seller={p.seller} />
            ))}
          </div>
        )}
      </section>

      {/* Trust badges */}
      <TrustStrip />

      {/* Featured seller cards — promotes growers, drives store visits */}
      {!loading && <FeaturedSellers sellers={featuredSellers} />}

      {/* Newsletter */}
      <section style={{ padding: 'clamp(3rem,6vw,6rem) 0', textAlign: 'center', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', marginBottom: '0.65rem' }}>Join the Registry</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
              First to know about new arrivals, rare specimens, and expert care guides.
            </p>
            <form style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }} onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="collector@example.com"
                style={{ padding: '0.85rem 1.3rem', borderRadius: '100px', border: '1.5px solid var(--border-subtle)', flex: '1 1 190px', minWidth: '170px', maxWidth: '260px', outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-gold)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', flexShrink: 0 }}>Register</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
