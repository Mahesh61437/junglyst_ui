import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

// Fallback slides shown when no sellers are marked is_featured yet.
// Replace/remove once real promoted sellers exist in the DB.
const FALLBACK_SLIDES = [
  {
    id: '__fallback_1',
    banner_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1600&q=80',
    store_name: 'Aquatic Exotica',
    tagline: 'Mastering rare Bucephalandra & moss cultivation for over two decades.',
    bio: 'Farm-direct specimens of unparalleled vitality, sourced from Kerala\'s finest private greenhouse.',
    brand_color: '#0A3029',
    location_city: 'Kerala',
    slug: null, // no real store page yet
  },
];

function buildSlides(sellers) {
  if (sellers && sellers.length > 0) return sellers;
  return FALLBACK_SLIDES;
}

export default function HeroCarousel({ sellers = [] }) {
  const slides = buildSlides(sellers);
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = (next) => {
    if (transitioning || slides.length <= 1) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(next);
      setTransitioning(false);
    }, 500);
  };

  const prev = () => go((current - 1 + slides.length) % slides.length);
  const next = () => go((current + 1) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [current, slides.length]);

  const slide = slides[current] || slides[0];
  const isReal = Boolean(slide?.slug); // real sellers always have a slug; fallbacks have slug: null
  const storeLink = isReal ? `/store/${slide.slug}` : '/shop';

  return (
    <section style={{ position: 'relative', backgroundColor: 'var(--bg-deep)', overflow: 'hidden', height: 'clamp(420px, 62vh, 720px)' }}>

      {/* Background images — layered, cross-fade */}
      {slides.map((s, i) => (
        <div key={s.id || i} style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `url(${getImageUrl(s.banner_url) || '/assets/default-banner.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: current === i ? 0.55 : 0,
          transition: 'opacity 1s ease-in-out',
          transform: current === i ? 'scale(1.04)' : 'scale(1)',
          transitionProperty: 'opacity, transform',
          transitionDuration: current === i ? '1s, 9s' : '1s, 0s',
        }} />
      ))}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'linear-gradient(105deg, rgba(10,31,28,0.92) 0%, rgba(10,31,28,0.55) 55%, rgba(10,31,28,0.2) 100%)',
      }} />

      {/* Content */}
      <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '620px', opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(12px)' : 'translateY(0)', transition: 'opacity 0.5s, transform 0.5s' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={14} color="var(--brand-gold)" />
            <span style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {isReal ? 'Featured Sanctuary' : 'Welcome to Junglyst'}
            </span>
            {slide.location_city && (
              <>
                <span style={{ width: '1px', height: '12px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
                  <MapPin size={11} /> {slide.location_city}
                </span>
              </>
            )}
          </div>

          {/* Store name */}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontFamily: 'var(--font-serif)', color: 'white', lineHeight: 1.08, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {slide.store_name}
          </h1>

          {/* Tagline / bio — tagline preferred; bio capped to keep carousel clean */}
          <p style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65,
            marginBottom: '2.25rem', maxWidth: '480px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {slide.tagline || (slide.bio ? slide.bio.replace(/\s+/g, ' ').trim().slice(0, 130) + (slide.bio.length > 130 ? '…' : '') : '')}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to={storeLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 2.25rem', borderRadius: '100px', backgroundColor: 'white', color: 'var(--bg-deep)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.04em' }}>
              {isReal ? 'Visit Sanctuary' : 'Shop Now'} <ArrowRight size={15} />
            </Link>
            {isReal && (
              <Link to="/sellers" style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                All Growers
              </Link>
            )}
          </div>
        </div>

        {/* Logo badge — bottom-right of content area */}
        {(slide.logo_url || slide.icon_url) && (
          <div style={{ position: 'absolute', bottom: '2.5rem', right: '1rem', width: '72px', height: '72px', borderRadius: '18px', backgroundColor: 'white', padding: '6px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s' }}>
            <img src={getImageUrl(slide.icon_url || slide.logo_url)} alt={slide.store_name}
              onError={e => { e.target.src = '/assets/default-logo.jpg'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
        )}
      </div>

      {/* Prev / Next — only when multiple slides */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '2rem', right: 'max(1.5rem, calc((100vw - 1280px)/2 + 1.5rem))', zIndex: 20, display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ color: 'white', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>0{current + 1}</span>
            <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>/ 0{slides.length}</span>
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[{ fn: prev, icon: <ChevronLeft size={20} /> }, { fn: next, icon: <ChevronRight size={20} /> }].map(({ fn, icon }, i) => (
              <button key={i} onClick={fn} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >{icon}</button>
            ))}
          </div>
        </div>
      )}

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{ width: i === current ? '22px' : '7px', height: '7px', borderRadius: '4px', backgroundColor: i === current ? 'var(--brand-gold)' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.35s', padding: 0 }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: 'var(--brand-gold)', width: `${((current + 1) / slides.length) * 100}%`, transition: 'width 0.6s ease-out', zIndex: 30 }} />
    </section>
  );
}
