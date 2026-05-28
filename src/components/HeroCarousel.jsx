import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, MapPin, Trophy, Clock } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import { useCompetitionStatus, getLaunchDate, DEFAULT_LAUNCH_DATE } from '../services/CompetitionService';

const COMPETITION_SLIDE = {
  id: '__competition',
  banner_url: 'https://images.unsplash.com/photo-1570166308836-9a88fdab7028?w=1600&q=80',
  brand_color: '#060f0d',
  slug: '__competition',
};

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
    slug: null,
  },
];

function buildSlides(sellers, launchDate) {
  const base = (sellers && sellers.length > 0) ? sellers : FALLBACK_SLIDES;
  // Prepend competition slide only if the competition is still open
  if (Date.now() < launchDate.getTime()) {
    return [COMPETITION_SLIDE, ...base];
  }
  return base;
}

function useCountdown(target) {
  const calc = () => {
    if (!target) return null;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target?.getTime()]);
  return t;
}

function CompetitionSlideContent({ transitioning, launchDate }) {
  const tl = useCountdown(launchDate);
  const pad = n => String(n).padStart(2, '0');

  return (
    <div style={{
      maxWidth: '640px',
      textAlign: 'center',
      opacity: transitioning ? 0 : 1,
      transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
      transition: 'opacity 0.5s, transform 0.5s',
    }}>
      {/* Eyebrow badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,151,43,0.15)', border: '1px solid rgba(201,151,43,0.4)', borderRadius: '100px', padding: '0.35rem 0.85rem', marginBottom: '1.4rem' }}>
        <Trophy size={13} color="#c9972b" />
        <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          Aquascape Competition 2026
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
        fontFamily: 'var(--font-serif)',
        color: 'white',
        lineHeight: 1.08,
        marginBottom: '1rem',
        letterSpacing: '-0.02em',
      }}>
        Build.<br />Photograph.<br />Win.
      </h1>

      {/* Sub-copy */}
      <p style={{ fontSize: 'clamp(0.88rem, 1.6vw, 1rem)', color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, marginBottom: '1rem', maxWidth: '440px', margin: '0 auto 1rem' }}>
        Submit photos of your aquascape. The most stunning build wins{' '}
        <strong style={{ color: '#c9972b', fontWeight: 700 }}>₹1,000 cash</strong>.
        500 slots only — winner announced on launch day.
      </p>

      {/* Live countdown */}
      {tl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Clock size={13} color="rgba(255,255,255,0.4)" />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Closes in</span>
          {[
            { val: tl.days, label: 'days' },
            { val: tl.hours, label: 'hrs' },
            { val: tl.minutes, label: 'min' },
            { val: tl.seconds, label: 'sec' },
          ].map(({ val, label }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>:</span>}
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {pad(val)}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/competition"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.875rem 2.25rem', borderRadius: '100px', backgroundColor: '#c9972b', color: '#0a1f1c', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Enter Competition <ArrowRight size={15} />
        </Link>
        <Link
          to="/competition"
          style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function HeroCarousel({ sellers = [] }) {
  const status = useCompetitionStatus();
  const launchDate = getLaunchDate(status);
  const slides = buildSlides(sellers, launchDate);
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
  const isCompetition = slide?.id === '__competition';
  const isReal = Boolean(slide?.slug) && !isCompetition; // real sellers always have a slug
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

      {/* Gradient overlay — competition slide gets a solid dark cover; seller slides reveal image on right */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: isCompetition
          ? 'linear-gradient(135deg, rgba(6,15,13,0.97) 0%, rgba(7,24,35,0.92) 50%, rgba(6,15,13,0.85) 100%)'
          : 'linear-gradient(105deg, rgba(10,31,28,0.92) 0%, rgba(10,31,28,0.55) 55%, rgba(10,31,28,0.2) 100%)',
      }} />

      {/* Content */}
      <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: isCompetition ? 'center' : 'flex-start' }}>

        {slide.id === '__competition' ? (
          <CompetitionSlideContent transitioning={transitioning} launchDate={launchDate} />
        ) : (
        <div style={{ maxWidth: '620px', opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(12px)' : 'translateY(0)', transition: 'opacity 0.5s, transform 0.5s' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={14} color="var(--brand-gold)" />
            <span style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {isReal ? 'Featured Store' : 'Welcome to Junglyst'}
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
              {isReal ? 'Visit Store' : 'Shop Now'} <ArrowRight size={15} />
            </Link>
            {isReal && (
              <Link to="/sellers" style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                All Growers
              </Link>
            )}
          </div>
        </div>
        )}

        {/* Brand icon badge — bottom-right of content area (seller slides only) */}
        {!isCompetition && slide.store_name && (
          <div style={{ position: 'absolute', bottom: '2.5rem', right: '1rem', width: '72px', height: '72px', borderRadius: '18px', backgroundColor: slide.brand_color || 'var(--bg-deep)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {slide.icon_url ? (
              <img src={getImageUrl(slide.icon_url)} alt={slide.store_name}
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span style="color:white;font-family:var(--font-serif);font-size:1.75rem;font-weight:600">${(slide.store_name || '?').charAt(0).toUpperCase()}</span>`; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600 }}>
                {(slide.store_name || '?').charAt(0).toUpperCase()}
              </span>
            )}
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
