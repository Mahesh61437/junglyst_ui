import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageUtils';
import { ShieldCheck, ArrowRight, Leaf, Award, Truck, MapPin, Trophy, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import api from '../services/api';
import { useCompetitionStatus, getLaunchDate, formatAnnouncementDate } from '../services/CompetitionService';
import { blogs } from '../data/blogs';

function useCompetitionCountdown(target) {
  const getLeft = () => {
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
  const [timeLeft, setTimeLeft] = useState(getLeft);
  useEffect(() => {
    setTimeLeft(getLeft());
    const t = setInterval(() => setTimeLeft(getLeft()), 1000);
    return () => clearInterval(t);
  }, [target?.getTime()]);
  return timeLeft;
}

function CompetitionPromo() {
  const status = useCompetitionStatus();
  const launchDate = getLaunchDate(status);
  const timeLeft = useCompetitionCountdown(launchDate);
  const announcementDate = formatAnnouncementDate(status?.result_announcement_date);
  if (!timeLeft) return null;

  const pad = n => String(n).padStart(2, '0');

  return (
    <section style={{
      background: 'linear-gradient(135deg, #060f0d 0%, #071823 50%, #060f0d 100%)',
      padding: 'clamp(2.5rem,5vw,4.5rem) 1.5rem',
      borderTop: '1px solid rgba(201,151,43,0.15)',
      borderBottom: '1px solid rgba(201,151,43,0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '300px', background: 'radial-gradient(ellipse, rgba(201,151,43,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>

          {/* Left: text */}
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(201,151,43,0.12)', border: '1px solid rgba(201,151,43,0.3)', borderRadius: '100px', padding: '0.35rem 0.85rem', marginBottom: '1rem' }}>
              <Trophy size={12} color="#c9972b" />
              <span style={{ fontSize: '0.65rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Now Open — 500 Slots Only
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem,3.5vw,2.75rem)',
              margin: '0 0 0.75rem',
              color: 'white',
              fontFamily: 'var(--font-serif)',
              lineHeight: 1.2,
            }}>
              Aquascape<br />Competition 2026
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.88rem', margin: '0 0 1.5rem', maxWidth: '380px' }}>
              Show off the aquascape you've built. Submit photos, tell your story, and win <strong style={{ color: '#c9972b' }}>₹1,000</strong>.{announcementDate ? <> Winner announced on {announcementDate}.</> : ''}
            </p>
            <Link
              to="/competition"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Enter Now <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right: countdown */}
          <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
              Closes in
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              {[
                { val: timeLeft.days, label: 'Days' },
                { val: timeLeft.hours, label: 'Hrs' },
                { val: timeLeft.minutes, label: 'Min' },
                { val: timeLeft.seconds, label: 'Sec' },
              ].map(({ val, label }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(201,151,43,0.25)',
                    borderRadius: '10px',
                    padding: '0.75rem 0.5rem',
                    marginBottom: '0.4rem',
                  }}>
                    <span style={{ display: 'block', fontSize: 'clamp(1.4rem,3vw,2.25rem)', fontWeight: 800, color: '#c9972b', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      {pad(val)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

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
// Horizontal scroll carousel on a dark green background — showcases all growers.
function FeaturedSellers({ sellers }) {
  const [trackEl, setTrackEl] = useState(null);
  if (!sellers.length) return null;

  const scroll = dir => {
    if (!trackEl) return;
    trackEl.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section style={{ backgroundColor: '#071a14', padding: 'clamp(3rem,6vw,5.5rem) 0', overflow: 'hidden' }}>
      {/* Header */}
      <div className="container" style={{ marginBottom: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={13} color="#c9972b" />
              <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Meet the growers</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', margin: 0, color: 'white', fontFamily: 'var(--font-serif)' }}>
              Featured Sanctuaries
            </h2>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '380px' }}>
              Verified botanical specialists curated for quality, expertise, and passion.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Scroll arrows */}
            {[{ dir: -1, Icon: ChevronLeft }, { dir: 1, Icon: ChevronRight }].map(({ dir, Icon }) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(201,151,43,0.35)', backgroundColor: 'rgba(201,151,43,0.1)', color: '#c9972b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(201,151,43,0.25)'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(201,151,43,0.1)'; }}
              >
                <Icon size={18} />
              </button>
            ))}
            <Link to="/sellers" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c9972b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
              All growers <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={setTrackEl}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingLeft: 'max(1.5rem, calc((100vw - 1200px) / 2))',
          paddingRight: 'max(1.5rem, calc((100vw - 1200px) / 2))',
          paddingBottom: '0.75rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sellers.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', damping: 28, stiffness: 260 }}
            style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 'clamp(240px, 28vw, 300px)' }}
          >
            <Link to={`/store/${s.slug}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                }}
              >
                {/* Full-bleed banner with gradient overlay */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden', backgroundColor: s.brand_color || '#0A3029' }}>
                  <img
                    src={getImageUrl(s.banner_url) || '/assets/default-banner.jpg'}
                    alt={s.store_name}
                    onError={e => { e.target.src = '/assets/default-banner.jpg'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  />
                  {/* Gradient — rich at bottom for text legibility */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,26,20,0.92) 0%, rgba(7,26,20,0.4) 45%, transparent 100%)' }} />

                  {/* Verified badge */}
                  <div style={{ position: 'absolute', top: '0.85rem', left: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(10,31,28,0.8)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.65rem', borderRadius: '100px', border: '1px solid rgba(201,151,43,0.3)' }}>
                    <ShieldCheck size={10} color="#c9972b" />
                    <span style={{ fontSize: '0.58rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verified</span>
                  </div>

                  {/* Logo badge */}
                  <div style={{ position: 'absolute', bottom: '0.85rem', right: '0.85rem', width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'white', padding: '2px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.9)' }}>
                    <img
                      src={getImageUrl(s.icon_url) || '/assets/default-logo.jpg'}
                      alt={s.store_name}
                      onError={e => { e.target.src = '/assets/default-logo.jpg'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                  </div>

                  {/* Store name overlaid on image bottom */}
                  <div style={{ position: 'absolute', bottom: '0.9rem', left: '1rem', right: '3.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.25, fontFamily: 'var(--font-serif)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                      {s.store_name}
                    </h3>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '1rem 1.15rem 1.25rem' }}>
                  {s.tagline && (
                    <p style={{ margin: '0 0 0.9rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.tagline}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {s.location_city ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                        <MapPin size={10} /> {s.location_city}
                      </span>
                    ) : <span />}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Visit <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Hide webkit scrollbar via inline style injection */}
      <style>{`.seller-track::-webkit-scrollbar{display:none}`}</style>
    </section>
  );
}

// ─── Plant Journal ────────────────────────────────────────────────────────────
// Shows the 2 general guides + 1 top article — each links to a full article
// that has shoppable products embedded.
function PlantJournalSection() {
  const generalGuides = blogs.filter(b => b.isGeneralGuide);
  const topArticle = blogs.filter(b => !b.isGeneralGuide)[0];
  const featured = [...generalGuides.slice(0, 2), ...(topArticle ? [topArticle] : [])].slice(0, 3);

  const difficultyColor = {
    Easy: '#16a34a',
    Medium: '#d97706',
    Advanced: '#dc2626',
  };

  return (
    <section style={{ backgroundColor: '#f8fafc', padding: 'clamp(3rem,6vw,5.5rem) 0', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1.75rem,3.5vw,3rem)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BookOpen size={14} color="var(--brand-gold)" />
              <span style={{ color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Read · Learn · Shop</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', margin: 0 }}>Plant Journal</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '420px' }}>
              Expert care guides for every species — with hand-picked products you can add to cart right from the article.
            </p>
          </div>
          <Link
            to="/guides"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            All articles <ArrowRight size={13} />
          </Link>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))', gap: '1.5rem' }}>
          {featured.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block', height: '100%' }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.22s, box-shadow 0.22s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 18px 40px rgba(0,0,0,0.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={post.image}
                      alt={post.title}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                    {/* Category badge */}
                    <div style={{ position: 'absolute', top: '0.85rem', left: '0.85rem', backgroundColor: 'rgba(10,31,28,0.75)', backdropFilter: 'blur(6px)', padding: '0.28rem 0.7rem', borderRadius: '100px' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--brand-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{post.category}</span>
                    </div>
                    {/* Difficulty */}
                    <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', backgroundColor: 'white', padding: '0.28rem 0.7rem', borderRadius: '100px' }}>
                      <span style={{ fontSize: '0.6rem', color: difficultyColor[post.difficulty] || '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{post.difficulty}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.25rem 1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}>
                      <Clock size={11} color="var(--text-secondary)" />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{post.readTime}</span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', lineHeight: 1.3, fontFamily: 'var(--font-serif)' }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1.1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Read &amp; Shop <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(2rem,4vw,3rem)' }}>
          <Link
            to="/guides"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1.5px solid var(--brand-gold)', color: 'var(--brand-gold)',
              padding: '0.8rem 2.25rem', borderRadius: '100px',
              fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              textDecoration: 'none', transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--brand-gold)'; e.currentTarget.style.color = '#0a1f1c'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--brand-gold)'; }}
          >
            Browse All Articles <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await api.post('/notifications/newsletter/subscribe/', { email });
      setMsg(res.data.message || 'Successfully subscribed!');
      setState('success');
      setEmail('');
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      setMsg(errMsg);
      setState('error');
    }
  };

  return (
    <section style={{ padding: 'clamp(3rem,6vw,6rem) 0', textAlign: 'center', backgroundColor: 'white' }}>
      <div className="container">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', marginBottom: '0.65rem' }}>Join the Registry</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
            First to know about new arrivals, rare specimens, and expert care guides.
          </p>
          {state === 'success' ? (
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>{msg}</p>
          ) : (
            <form style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }} onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="collector@example.com"
                required
                disabled={state === 'loading'}
                style={{ padding: '0.85rem 1.3rem', borderRadius: '100px', border: '1.5px solid var(--border-subtle)', flex: '1 1 190px', minWidth: '170px', maxWidth: '260px', outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-gold)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', flexShrink: 0 }} disabled={state === 'loading'}>
                {state === 'loading' ? 'Subscribing…' : 'Register'}
              </button>
            </form>
          )}
          {state === 'error' && (
            <p style={{ marginTop: '0.75rem', color: '#dc2626', fontSize: '0.82rem' }}>{msg}</p>
          )}
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
      <SEO
        title="Junglyst — Rare Aquatic Botanicals"
        description="Discover and buy rare aquatic plants, aquarium moss, and tropical botanicals from verified growers across India. Curated for hobbyists and collectors."
        path="/"
      />

      {/* Promoted seller slides — sort_order + is_featured controls which sellers appear */}
      <HeroCarousel sellers={featuredSellers} />

      {/* Platform stats — builds instant trust below the fold */}
      <StatsBar stats={stats} />

      {/* Competition promotion — shown until launch date */}
      <CompetitionPromo />

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
                variants={p.variants} seller={p.seller} category={p.category} />
            ))}
          </div>
        )}

        {!loading && products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(2rem,4vw,3rem)' }}>
            <Link
              to="/shop"
              className="btn btn-primary"
              style={{ padding: '0.85rem 2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              View All Products <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      {/* Plant Journal — editorial section with shoppable care guides */}
      <PlantJournalSection />

      {/* Featured seller cards — horizontal scroll carousel after editorial content */}
      {!loading && <FeaturedSellers sellers={featuredSellers} />}

      {/* Trust badges — reinforces credibility after content engagement */}
      <TrustStrip />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
