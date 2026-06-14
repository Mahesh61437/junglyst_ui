import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { getImageUrl } from '../utils/imageUtils';
import { loadCombosConfig } from '../config/combosConfig';

// ─── Per-slot component definitions ──────────────────────────────────────────
// Each slot knows what TYPE of product it expects.
// The picker searches slot.keywords first; if nothing found, falls back to combo-wide keywords.
const COMBO_SLOTS = {
  aquarium: [
    // 0 – outside LEFT (CO2 cylinder / equipment)
    { label: 'CO₂ Cylinder',   keywords: ['co2', 'cylinder', 'carbon', 'canister', 'equipment'], from: 'left',   zone: 'outside-left'  },
    // 1,2,3 – inside tank (aquatic plants)
    { label: 'Aquatic Plant',   keywords: ['aquatic', 'plant', 'moss', 'fern', 'java', 'stem'],   from: 'bottom', zone: 'inside'        },
    { label: 'Aquatic Moss',    keywords: ['moss', 'java', 'aquatic', 'plant', 'fern', 'stem'],   from: 'bottom', zone: 'inside'        },
    { label: 'Aquatic Plant',   keywords: ['aquatic', 'plant', 'fern', 'stem', 'moss', 'java'],   from: 'bottom', zone: 'inside'        },
    // 4 – outside RIGHT (filter / fertilizer)
    { label: 'Filter / Fert',  keywords: ['filter', 'fertilizer', 'fert', 'nutrient', 'pump'],   from: 'right',  zone: 'outside-right' },
    // 5,6 – below tank (diffuser, tubing / accessories)
    { label: 'CO₂ Diffuser',   keywords: ['diffuser', 'co2', 'bubble', 'carbon', 'fertilizer'], from: 'bottom', zone: 'below'         },
    { label: 'Tubing / Fert',  keywords: ['tubing', 'fertilizer', 'fert', 'nutrient', 'plant'], from: 'bottom', zone: 'below'         },
  ],
  terrarium: [
    // 0 – outside LEFT (fertilizer / mister)
    { label: 'Fertilizer',      keywords: ['fertilizer', 'fert', 'nutrient', 'tonic', 'booster'], from: 'left',   zone: 'outside-left'  },
    // 1,2,3 – inside (plants)
    { label: 'Fern / Moss',     keywords: ['fern', 'moss', 'orchid', 'bromeliad', 'plant'],       from: 'bottom', zone: 'inside'        },
    { label: 'Tropical Plant',  keywords: ['tropical', 'plant', 'fern', 'moss', 'orchid'],        from: 'bottom', zone: 'inside'        },
    { label: 'Plant',           keywords: ['plant', 'bromeliad', 'fern', 'orchid', 'moss'],       from: 'bottom', zone: 'inside'        },
    // 4 – outside RIGHT (mister / substrate)
    { label: 'Mister / Spray', keywords: ['mist', 'spray', 'foliar', 'fertilizer', 'substrate'], from: 'right',  zone: 'outside-right' },
    // 5,6 – below (substrate, botanical decor)
    { label: 'Substrate',       keywords: ['substrate', 'soil', 'coco', 'peat', 'botanical'],     from: 'bottom', zone: 'below'         },
    { label: 'Botanicals',      keywords: ['botanical', 'wood', 'decor', 'rock', 'substrate'],    from: 'bottom', zone: 'below'         },
  ],
};

// ─── Combo definitions loaded from config (admin-editable via SuperAdminDashboard) ──
function useCombos() {
  const [combos, setCombos] = useState(() => loadCombosConfig());
  useEffect(() => {
    const handler = () => setCombos(loadCombosConfig());
    window.addEventListener('combos-config-updated', handler);
    return () => window.removeEventListener('combos-config-updated', handler);
  }, []);
  return combos;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchesKeywords(product, keywords) {
  const hay = [
    product.name, product.scientific_name, product.description,
    typeof product.category === 'string' ? product.category : product.category?.name,
    ...(product.categories || []).map(c => c.name),
    product.category_name, product.subcategory_name,
  ].filter(Boolean).join(' ').toLowerCase();
  return keywords.some(kw => hay.includes(kw.toLowerCase()));
}

function productMatchesFilter(product, filterTag) {
  if (!filterTag || filterTag.key === 'all') return true;
  const hay = [
    product.name, product.scientific_name,
    typeof product.category === 'string' ? product.category : product.category?.name,
    ...(product.categories || []).map(c => c.name),
    product.category_name,
  ].filter(Boolean).join(' ').toLowerCase();
  return filterTag.match.some(kw => hay.includes(kw.toLowerCase()));
}

// Pick one product per slot using per-slot keywords, then combo-wide fallback.
// Ensures no image is reused across slots.
function pickSlotProducts(slots, allProducts, comboKeywords) {
  const usedIds = new Set();
  const comboPool = allProducts.filter(p => matchesKeywords(p, comboKeywords));

  return slots.map(slot => {
    // Try slot-specific keywords first
    let candidate = comboPool.find(p =>
      !usedIds.has(p.id) && matchesKeywords(p, slot.keywords) && getImageUrl(p.image)
    );
    // Fallback: any combo product with an image not yet used
    if (!candidate) {
      candidate = comboPool.find(p => !usedIds.has(p.id) && getImageUrl(p.image));
    }
    if (candidate) usedIds.add(candidate.id);
    return candidate || null;
  });
}

// ─── Aquarium video (in /public) ─────────────────────────────────────────────
// Filename contains a literal U+2026 HORIZONTAL ELLIPSIS character
const AQUARIUM_VIDEO        = '/assets/combos/aquarium/Aquarium_components_assembling_i…_202606141351.mp4';
const AQUARIUM_POSTER       = '/assets/combos/aquarium/aquarium tank.jpg';
const AQUARIUM_FERT_VIDEO   = '/assets/combos/aquarium fertilizers/aquarium_fertilizers.mp4';
const AQUARIUM_FERT_POSTER  = '/assets/combos/aquarium fertilizers/aquarium ferilizer.png';
const TERRARIUM_VIDEO       = '/assets/combos/terrarium/Glass_jar_terrarium_with_wooden_202606141405.mp4';
const TERRARIUM_POSTER      = '/assets/combos/terrarium/terraium tank.jpg';
const TERRARIUM_FERT_VIDEO  = '/assets/combos/terrarim fertlizers/Terrarium_jar_with_fertilizer_pr…_202606141445.mp4';
const TERRARIUM_FERT_POSTER = '/assets/combos/terrarim fertlizers/terrarium_fertilizers.png';

// ─── Animation keyframe names ─────────────────────────────────────────────────
const ANIM = {
  bottom: 'ci-from-bottom',
  left:   'ci-from-left',
  right:  'ci-from-right',
  top:    'ci-from-top',
};

// ─── Slot layout positions (% of illustration container) ─────────────────────
// Container aspect ratio: 17/10
// Tank glass SVG rect: x=92 y=12 w=156 h=132  (viewBox 340×200)
//   left wall  = 92/340 = 27.1%
//   right wall = 248/340 = 72.9%
//   top        = 12/200 = 6%
//   bottom     = 144/200 = 72%
const ZONE_POSITIONS = [
  // 0 – outside LEFT
  { left: '1%',   top:    '14%', width: '22%', maxH: '50%' },
  // 1 – inside bottom-left
  { left: '30%',  bottom: '20%', width: '15%', maxH: '46%' },
  // 2 – inside bottom-centre
  { left: '43%',  bottom: '17%', width: '15%', maxH: '50%' },
  // 3 – inside bottom-right
  { left: '57%',  bottom: '20%', width: '15%', maxH: '46%' },
  // 4 – outside RIGHT
  { right: '1%',  top:    '14%', width: '22%', maxH: '50%' },
  // 5 – below tank left
  { left: '26%',  top:    '74%', width: '15%', maxH: '24%' },
  // 6 – below tank right
  { left: '56%',  top:    '74%', width: '15%', maxH: '24%' },
];

// ─── Single combo tile — circular ────────────────────────────────────────────
function ComboTile({ combo, slotProducts, onClick }) {
  const [hovered, setHovered]     = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const btnRef   = useRef(null);
  const a = combo.accent;

  const startPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setShowVideo(true);
    v.currentTime = 0;
    v.play().catch(() => {});
  }, []);

  const stopPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setShowVideo(false);
  }, []);

  // On touch devices there is no hover, and a tap must open the modal — so we
  // can't use touch to drive the video. Instead we play the (muted, inline) video
  // only while the circle sits in the CENTRAL band of the screen (rootMargin
  // shrinks the active zone to the middle ~40%). This sequences playback by scroll
  // position — videos play as they pass the middle instead of all firing at once —
  // and a tap still goes straight to the modal (no tap/click conflict).
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!isTouch) return; // desktop uses hover handlers, not visibility

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startPlay();
        else stopPlay();
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: 0 }
    );
    observer.observe(btn);
    return () => observer.disconnect();
  }, [startPlay, stopPlay]);

  // Desktop: hover plays video, mouse-out pauses
  const handleEnter = () => { setHovered(true);  startPlay(); };
  const handleLeave = () => { setHovered(false); stopPlay();  };

  const isAquarium = combo.type === 'aquarium';
  const videoSrc = isAquarium
    ? (combo.id === 'aquarium-fert' ? AQUARIUM_FERT_VIDEO  : AQUARIUM_VIDEO)
    : (combo.id === 'terrarium-fert' ? TERRARIUM_FERT_VIDEO : TERRARIUM_VIDEO);
  const posterSrc = isAquarium
    ? (combo.id === 'aquarium-fert' ? AQUARIUM_FERT_POSTER : AQUARIUM_POSTER)
    : (combo.id === 'terrarium-fert' ? TERRARIUM_FERT_POSTER : TERRARIUM_POSTER);

  const openModal = () => { setHovered(false); onClick(combo); };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openModal}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); } }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      aria-label={`Open ${combo.label}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem',
        cursor: 'pointer', outline: 'none',
      }}
    >
      {/* Circle */}
      <div
        ref={btnRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          transition: 'transform 0.3s cubic-bezier(0.34,1.45,0.64,1)',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute', inset: '-4px',
          borderRadius: '50%',
          background: hovered
            ? `conic-gradient(from 180deg, ${a}, ${a}88, ${a}22, ${a}88, ${a})`
            : `conic-gradient(from 180deg, ${a}55, ${a}18, ${a}08, ${a}18, ${a}55)`,
          transition: 'all 0.4s ease',
          filter: hovered ? `blur(1px) drop-shadow(0 0 10px ${a}80)` : 'blur(0.5px)',
          zIndex: 0,
        }} />

        {/* Inner circle clip — contains poster + video */}
        <div style={{
          position: 'absolute', inset: '4px',
          borderRadius: '50%', overflow: 'hidden', zIndex: 1,
          background: combo.bgGrad,
        }}>
          <img
            src={posterSrc}
            alt={combo.label}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: combo.id === 'terrarium' ? 'center 35%' : 'center',
              opacity: showVideo ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          <video
            ref={videoRef}
            src={videoSrc}
            muted playsInline preload="auto"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: showVideo ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
        </div>

        {/* Play indicator — hidden while playing */}
        <div style={{
          position: 'absolute', bottom: '14%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3, pointerEvents: 'none',
          opacity: hovered ? 0 : 0.75,
          transition: 'opacity 0.25s ease',
        }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '8px solid white',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
          }} />
        </div>
      </div>

      {/* Label below circle */}
      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{
          fontSize: 'clamp(0.78rem,1.6vw,0.95rem)', fontWeight: 800,
          color: hovered ? a : 'white',
          transition: 'color 0.25s ease',
        }}>
          {combo.label}
        </div>
        <div style={{
          fontSize: '0.65rem', color: `${a}88`, fontWeight: 600,
          marginTop: '0.2rem',
        }}>
          {combo.tagline}
        </div>
      </div>
    </div>
  );
}

// ─── Combo panel (slide-up) ───────────────────────────────────────────────────
const PAGE_SIZE = 12;

function ComboPanel({ combo, allProducts, onClose }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const scrollRef = useRef(null);

  // Full scroll lock while the modal is open: freeze the background page with
  // position:fixed (prevents background scroll + scroll-chaining on every device,
  // incl. iOS where overflow:hidden alone leaks) and restore scroll position on close.
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position, top: body.style.top,
      left: body.style.left, right: body.style.right,
      width: body.style.width, overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const comboProducts = allProducts.filter(p => matchesKeywords(p, combo.keywords));
  const activeFilterDef = combo.filterTags.find(f => f.key === activeFilter);
  const visibleProducts = comboProducts.filter(p => productMatchesFilter(p, activeFilterDef));
  const totalPages = Math.ceil(visibleProducts.length / PAGE_SIZE);
  const pageProducts = visibleProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (key) => { setActiveFilter(key); setPage(1); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const handlePage = (p) => { setPage(p); if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  const buildPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    if (page > 3) items.push('left-ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) items.push(i);
    if (page < totalPages - 2) items.push('right-ellipsis');
    items.push(totalPages);
    return items;
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      animation: 'cpanel-fade 0.2s ease',
    }}>
      <div style={{
        background: 'white', borderRadius: '28px 28px 0 0', maxHeight: '90dvh',
        display: 'flex', flexDirection: 'column',
        animation: 'cpanel-up 0.3s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: combo.bgGrad, padding: 'clamp(1rem,3vw,1.5rem) clamp(1rem,3vw,1.75rem)', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: 'clamp(1.1rem,3vw,1.45rem)', fontWeight: 800, color: 'white' }}>{combo.label}</h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: `${combo.accent}cc`, fontWeight: 600 }}>
                {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
                {totalPages > 1 && <> · Page {page} of {totalPages}</>}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0,
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0.85rem clamp(1rem,3vw,1.75rem)', borderBottom: '1px solid #f1f5f9', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', gap: '0.45rem', width: 'max-content' }}>
            {combo.filterTags.map(tag => {
              const count = tag.key === 'all' ? comboProducts.length : comboProducts.filter(p => productMatchesFilter(p, tag)).length;
              const active = activeFilter === tag.key;
              return (
                <button key={tag.key} onClick={() => handleFilterChange(tag.key)} style={{
                  padding: '0.38rem 0.9rem', borderRadius: '100px', fontSize: '0.74rem', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  border: active ? `1.5px solid ${combo.accent}` : '1.5px solid #e2e8f0',
                  backgroundColor: active ? `${combo.accent}18` : 'white',
                  color: active ? combo.accent : '#64748b',
                }}>
                  {tag.label} <span style={{ opacity: 0.6, fontSize: '0.67rem' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products */}
        <div ref={scrollRef} style={{ overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', flex: 1, padding: 'clamp(1rem,3vw,1.5rem) clamp(1rem,3vw,1.75rem)' }}>
          {visibleProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🪴</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No products for this filter.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>Try "All" or another category.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 155px), 1fr))', gap: 'clamp(0.65rem,2vw,1.1rem)' }}>
                {pageProducts.map(p => (
                  <ProductCard key={p.id} id={p.id} slug={p.slug} name={p.name}
                    scientific_name={p.scientific_name} care_level={p.care_level}
                    origin={p.origin} growth_rate={p.growth_rate}
                    price={p.price} originalPrice={p.compare_at_price}
                    image={p.image} trending={p.is_trending} reviews={p.rating}
                    stock={p.stock} variants={p.variants} seller={p.seller}
                    category={p.category} categories={p.categories}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handlePage(page - 1)} disabled={page === 1} style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #e2e8f0',
                    backgroundColor: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: page === 1 ? '#cbd5e1' : '#475569', fontSize: '1.1rem', fontWeight: 700,
                  }}>‹</button>

                  {buildPageItems().map((item) =>
                    typeof item === 'string'
                      ? <span key={item} style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0 0.1rem' }}>…</span>
                      : <button key={item} onClick={() => handlePage(item)} style={{
                          minWidth: '36px', height: '36px', borderRadius: '50%',
                          border: `1.5px solid ${item === page ? combo.accent : '#e2e8f0'}`,
                          backgroundColor: item === page ? `${combo.accent}18` : 'white',
                          color: item === page ? combo.accent : '#475569',
                          cursor: 'pointer', fontWeight: item === page ? 800 : 500, fontSize: '0.82rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                        }}>{item}</button>
                  )}

                  <button onClick={() => handlePage(page + 1)} disabled={page === totalPages} style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #e2e8f0',
                    backgroundColor: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: page === totalPages ? '#cbd5e1' : '#475569', fontSize: '1.1rem', fontWeight: 700,
                  }}>›</button>
                </div>
              )}
              <div style={{ height: '1.5rem' }} />
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes cpanel-fade { from{opacity:0} to{opacity:1} }
        @keyframes cpanel-up   { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export default function CombosSection({ allProducts = [] }) {
  const combos = useCombos();
  const [activeCombo, setActiveCombo] = useState(null);
  const handleOpen  = useCallback(combo => setActiveCombo(combo), []);
  const handleClose = useCallback(() => setActiveCombo(null), []);

  return (
    <>
      <section style={{
        backgroundColor: 'var(--bg-deep)',
        padding: 'clamp(3rem,6vw,5rem) 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="container">
          <div style={{ marginBottom: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
              <span style={{ color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Curated Bundles</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem,3.5vw,2.25rem)', margin: '0 0 0.45rem', color: 'white', fontFamily: 'var(--font-serif)' }}>Shop by Setup</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, maxWidth: '420px' }}>
              Hover to play. Tap to browse products for your setup.
            </p>
          </div>

          <style>{`
            .combos-circle-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(1rem,3vw,2rem); width: 100%; }
            @media (max-width: 560px) { .combos-circle-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
          `}</style>
          <div className="combos-circle-grid">
            {combos.map(combo => {
              const slots = COMBO_SLOTS[combo.type];
              const slotProducts = pickSlotProducts(slots, allProducts, combo.keywords);
              return <ComboTile key={combo.id} combo={combo} slotProducts={slotProducts} onClick={handleOpen} />;
            })}
          </div>
        </div>
      </section>

      {activeCombo && (
        <ComboPanel combo={activeCombo} allProducts={allProducts} onClose={handleClose} />
      )}
    </>
  );
}
