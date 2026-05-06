import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { ProductService } from '../services/ProductService';
import { SellerService } from '../services/SellerService';
import { getImageUrl } from '../utils/imageUtils';
import {
  ShieldCheck, ArrowRight, Leaf, Award, Truck,
  ChevronLeft, ChevronRight, Star, MapPin
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';

// ─── Featured Sellers Carousel ────────────────────────────────────────────────
function FeaturedSellersCarousel({ sellers }) {
  const [idx, setIdx] = useState(0);
  const total = sellers.length;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const s = sellers[idx];

  return (
    <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            alignItems: 'stretch',
            minHeight: '480px',
          }}
        >
          {/* Image */}
          <div style={{ position: 'relative', minHeight: '300px', overflow: 'hidden' }}>
            <img
              src={getImageUrl(s.banner_url) || '/assets/default-banner.jpg'}
              alt={s.store_name}
              onError={e => { e.target.src = '/assets/default-banner.jpg'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(27,45,42,0.5) 0%, transparent 60%)'
            }} />
            {/* Logo badge */}
            {s.logo_url && (
              <div style={{
                position: 'absolute', bottom: '1.5rem', left: '1.5rem',
                width: '64px', height: '64px', borderRadius: '16px',
                backgroundColor: 'white', padding: '6px', overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <img
                  src={getImageUrl(s.logo_url)}
                  alt={s.store_name}
                  onError={e => { e.target.src = '/assets/default-logo.jpg'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                />
              </div>
            )}
          </div>

          {/* Text */}
          <div style={{
            padding: 'clamp(2.5rem, 5vw, 5rem) clamp(1.5rem, 5vw, 5rem)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <span style={{
              color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.7rem',
              textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '1rem', display: 'block'
            }}>Featured Grower</span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              marginBottom: '1rem', lineHeight: 1.1
            }}>{s.tagline || 'Cultivating the Extraordinary'}</h2>
            <p style={{
              opacity: 0.75, lineHeight: 1.8, marginBottom: '2rem',
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 300,
              maxWidth: '480px'
            }}>{s.bio}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <Link to={`/store/${s.slug}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                color: 'var(--brand-gold)', fontWeight: 700,
                fontSize: '0.85rem', letterSpacing: '0.08em',
                textTransform: 'uppercase', textDecoration: 'none'
              }}>
                Visit Sanctuary <ArrowRight size={16} />
              </Link>
              {s.location_city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.5, fontSize: '0.8rem' }}>
                  <MapPin size={12} /> {s.location_city}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        {total > 1 && (
          <>
            <button onClick={prev} aria-label="Previous" style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 10
            }}><ChevronLeft size={18} /></button>
            <button onClick={next} aria-label="Next" style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 10
            }}><ChevronRight size={18} /></button>

            {/* Dots */}
            <div style={{
              position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '0.5rem', zIndex: 10
            }}>
              {sellers.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} style={{
                  width: i === idx ? '24px' : '8px', height: '8px', borderRadius: '4px',
                  backgroundColor: i === idx ? 'var(--brand-gold)' : 'rgba(255,255,255,0.35)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0
                }} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Category Chips ────────────────────────────────────────────────────────────
function CategoryRail({ categories }) {
  if (!categories.length) return null;
  return (
    <section style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border-subtle)', padding: '0' }}>
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div style={{
          display: 'flex', gap: '0.75rem', overflowX: 'auto',
          paddingBottom: '0.25rem', scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Link to="/shop" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1.25rem', borderRadius: '100px',
            backgroundColor: 'var(--bg-deep)', color: 'white',
            fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
            textDecoration: 'none', flexShrink: 0
          }}>
            <Leaf size={13} /> All Plants
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} to={`/shop/${cat.name}`} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.5rem 1.25rem', borderRadius: '100px',
              border: '1.5px solid var(--border-subtle)',
              backgroundColor: 'white', color: 'var(--text-primary)',
              fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
              textDecoration: 'none', flexShrink: 0,
              transition: 'all 0.2s'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.color = 'var(--brand-gold)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: <Award size={28} strokeWidth={1.5} />, title: 'Verified Growers Only', body: 'Every plant is sourced from vetted experts with proven cultivation standards.' },
    { icon: <Truck size={28} strokeWidth={1.5} />, title: 'Expert Packaging', body: 'Proprietary moisture-lock methods ensure your delivery arrives in pristine condition.' },
    { icon: <ShieldCheck size={28} strokeWidth={1.5} />, title: 'Pest-Free Guarantee', body: 'All specimens are treated and inspected for quality before leaving the farm.' },
  ];
  return (
    <section style={{ backgroundColor: 'white', padding: 'clamp(3rem, 6vw, 6rem) 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: 'clamp(2rem, 4vw, 3.5rem)'
        }}>
          {items.map((item, i) => (
            <div key={i} className="slide-up" style={{ display: 'flex', gap: '1.25rem', animationDelay: `${i * 0.1}s` }}>
              <div style={{ color: 'var(--brand-gold)', flexShrink: 0, paddingTop: '0.15rem' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productData, sellersData, catData] = await Promise.all([
          ProductService.getProducts({ page: 1 }),
          SellerService.getVerifiedDirectory(),
          ProductService.getCategories(),
        ]);

        const products = (productData.results || productData || []).filter(p => p?.is_active !== false);
        setProducts(products.slice(0, 8));

        const sellers = (sellersData.results || sellersData || []);
        const featured = sellers.filter(s => s.is_featured);
        // Fallback: if nobody is featured, show top 3 by rating
        setFeaturedSellers(featured.length ? featured : sellers.slice(0, 3));

        setCategories(catData.results || catData || []);
      } catch (err) {
        console.error('Home data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Category quick-nav */}
      <CategoryRail categories={categories} />

      {/* Trust badges */}
      <TrustStrip />

      {/* Featured Sellers Carousel */}
      {!loading && <FeaturedSellersCarousel sellers={featuredSellers} />}

      {/* Seasonal Products */}
      <section className="container" style={{ padding: 'clamp(4rem, 8vw, 8rem) 1.5rem' }}>
        <div className="slide-up" style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
            <span style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Current Curation</span>
            <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>Seasonal Exhibitions</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>
            A curated selection of the finest specimens currently in peak health.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Curating your collection…
            </p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <Leaf size={40} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
            <p>No specimens available right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid-responsive slide-up" style={{ animationDelay: '0.2s' }}>
            {products.map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                scientific_name={p.scientific_name}
                care_level={p.care_level}
                origin={p.origin}
                growth_rate={p.growth_rate}
                price={p.price}
                originalPrice={p.compare_at_price}
                image={p.image}
                trending={p.is_trending}
                reviews={p.rating}
                stock={p.stock}
                variants={p.variants}
                seller={p.seller}
              />
            ))}
          </div>
        )}

        <div className="slide-up" style={{ marginTop: 'clamp(2.5rem, 5vw, 5rem)', textAlign: 'center', animationDelay: '0.4s' }}>
          <Link to="/shop" className="btn btn-outline" style={{ padding: '1.125rem 3rem' }}>
            Explore the full gallery
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: 'clamp(3.5rem, 8vw, 8rem) 0', textAlign: 'center' }}>
        <div className="container slide-up">
          <div style={{ maxWidth: '540px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>Join the Registry</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem' }}>
              Be the first to know about new exhibitions, rare specimens, and expert care guides.
            </p>
            <form
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
              onSubmit={e => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="collector@example.com"
                style={{
                  padding: '1rem 1.5rem', borderRadius: '100px',
                  border: '1.5px solid var(--border-subtle)',
                  flex: '1 1 220px', minWidth: '200px', maxWidth: '300px',
                  outline: 'none', fontSize: '0.95rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-gold)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2.5rem', flexShrink: 0 }}>
                Register
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
