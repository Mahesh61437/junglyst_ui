import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search, ChevronRight, ArrowRight, Leaf, Microscope, Clock } from 'lucide-react';
import { blogs } from '../data/blogs';
import SEO from '../components/SEO';

const DIFFICULTY_COLOR = { Easy: '#16a34a', Medium: '#d97706', Advanced: '#dc2626' };
const DIFFICULTY_BG   = { Easy: '#f0fdf4', Medium: '#fffbeb', Advanced: '#fef2f2' };

const ALL_CATEGORIES = ['All', ...Array.from(new Set(blogs.map(b => b.category)))];

export default function CareGuides() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const generalGuides = blogs.filter(b => b.isGeneralGuide);

  const regularGuides = blogs
    .filter(b => !b.isGeneralGuide)
    .filter(b => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      const matchesCat = activeCategory === 'All' || b.category === activeCategory;
      return matchesSearch && matchesCat;
    });

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <SEO
        title="Plant Journal — Care Guides & Grower's Knowledge | Junglyst"
        description="In-depth care guides for aquatic plants, terrariums, aquascaping, and tropical botanicals. Learn from expert growers at Junglyst."
        path="/guides"
      />

      {/* ── Page Header ── */}
      <div style={{ backgroundColor: '#0A3029', padding: 'clamp(3rem,6vw,5.5rem) 0 clamp(2rem,4vw,3.5rem)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,151,43,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>
                <Microscope size={14} /> Botanical Intelligence
              </div>
              <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, fontFamily: 'serif', color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Plant Journal
              </h1>
              <p style={{ fontSize: 'clamp(0.9rem,2vw,1.05rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
                Expert care guides for aquatic plants, terrariums, and rare botanicals — each with hand-picked products you can add to cart directly.
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search articles…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.9rem 1.25rem 0.9rem 3rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,151,43,0.6)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              />
              <Search size={17} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: 'clamp(2.5rem,5vw,5rem) 1.5rem' }}>

        {/* ── General / Family Guides ── */}
        {!searchTerm && (activeCategory === 'All') && generalGuides.length > 0 && (
          <section style={{ marginBottom: 'clamp(3rem,6vw,5rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c9972b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
              <BookOpen size={13} /> Plant Family Guides
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', margin: '0 0 1.75rem', color: '#0A3029', fontFamily: 'serif' }}>
              Start Here — Complete Overviews
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,380px),1fr))', gap: '1.5rem' }}>
              {generalGuides.map((guide, i) => (
                <motion.div key={guide.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link to={`/blog/${guide.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', transition: 'transform 0.25s, box-shadow 0.25s' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.18)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
                    >
                      {/* Image */}
                      <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={guide.image}
                          alt={guide.title}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,48,41,0.9) 0%, rgba(10,48,41,0.2) 60%, transparent 100%)' }} />
                        {/* Badges */}
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.4rem' }}>
                          <span style={{ backgroundColor: '#c9972b', color: '#0A3029', padding: '0.25rem 0.65rem', borderRadius: '100px', fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Family Guide</span>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.25rem 0.65rem', borderRadius: '100px', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase' }}>{guide.difficulty}</span>
                        </div>
                        {/* Title over image */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem 1.5rem' }}>
                          <h3 style={{ margin: '0 0 0.4rem', fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', fontFamily: 'serif', color: 'white', lineHeight: 1.25 }}>{guide.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c9972b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Read Full Guide <ArrowRight size={13} />
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem 1.4rem' }}>
                        <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.84rem', lineHeight: 1.6 }}>{guide.description}</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} /> {guide.readTime}</span>
                          <span>By {guide.author}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Category Filter Tabs ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c9972b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>
            <Leaf size={13} /> Individual Species & Topic Guides
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '100px', border: `1.5px solid ${activeCategory === cat ? '#0A3029' : '#e2e8f0'}`,
                  backgroundColor: activeCategory === cat ? '#0A3029' : 'white',
                  color: activeCategory === cat ? 'white' : '#64748b',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Regular Guide Grid ── */}
        {regularGuides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
            <BookOpen size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>No articles match your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,320px),1fr))', gap: '1.75rem' }}>
            {regularGuides.map((guide, i) => (
              <motion.div key={guide.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link to={`/blog/${guide.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div
                    style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.22s, box-shadow 0.22s' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                  >
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
                      <img
                        src={guide.image}
                        alt={guide.title}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                        onMouseOver={e => { e.target.style.transform = 'scale(1.06)'; }}
                        onMouseOut={e => { e.target.style.transform = 'scale(1)'; }}
                      />
                      {/* Category */}
                      <div style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', backgroundColor: 'rgba(10,48,41,0.8)', backdropFilter: 'blur(6px)', padding: '0.22rem 0.6rem', borderRadius: '100px' }}>
                        <span style={{ fontSize: '0.58rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{guide.category}</span>
                      </div>
                      {/* Difficulty */}
                      <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', backgroundColor: DIFFICULTY_BG[guide.difficulty] || 'white', padding: '0.22rem 0.6rem', borderRadius: '100px' }}>
                        <span style={{ fontSize: '0.58rem', color: DIFFICULTY_COLOR[guide.difficulty] || '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{guide.difficulty}</span>
                      </div>
                    </div>

                    <div style={{ padding: '1.1rem 1.2rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                        <Clock size={11} /> {guide.readTime}
                      </div>
                      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#0A3029', lineHeight: 1.3, fontFamily: 'serif' }}>{guide.title}</h3>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{guide.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c9972b', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Read &amp; Shop <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Newsletter CTA ── */}
        <div style={{ marginTop: 'clamp(4rem,8vw,7rem)', backgroundColor: '#0A3029', borderRadius: '32px', padding: 'clamp(2.5rem,5vw,4.5rem) clamp(1.5rem,4vw,4rem)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,151,43,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Leaf size={40} color="#c9972b" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontFamily: 'serif', marginBottom: '0.75rem' }}>Deeper Botanical Insights</h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Join collectors receiving our bi-weekly deep dives into rare species and high-end cultivation techniques.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder="Your email address…"
                style={{ padding: '0.9rem 1.5rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.9rem', outline: 'none', width: '100%', maxWidth: '300px', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,151,43,0.6)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              />
              <button style={{ backgroundColor: '#c9972b', color: '#0A3029', padding: '0.9rem 2rem', borderRadius: '100px', border: 'none', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
