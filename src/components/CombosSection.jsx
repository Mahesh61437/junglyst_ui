import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { getImageUrl } from '../utils/imageUtils';

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

// ─── Combo definitions ────────────────────────────────────────────────────────
const COMBOS = [
  {
    id: 'aquarium',
    label: 'Aquarium Combo',
    tagline: 'Plants · Fertilizers · CO2 · Equipment',
    type: 'aquarium',
    accent: '#00c2e0',
    bgGrad: 'linear-gradient(160deg, #071a2e 0%, #0c2d4a 100%)',
    waterColor: 'rgba(0,140,200,0.16)',
    substrateColor: '#3a2808',
    keywords: ['aquatic', 'aquarium', 'fertilizer', 'co2', 'carbon', 'moss', 'fern', 'java', 'substrate', 'plant'],
    filterTags: [
      { key: 'all',        label: 'All' },
      { key: 'plant',      label: 'Aquatic Plants', match: ['aquatic', 'moss', 'fern', 'java', 'plant'] },
      { key: 'fertilizer', label: 'Fertilizers',    match: ['fertilizer', 'fert', 'nutrient'] },
      { key: 'co2',        label: 'CO2',            match: ['co2', 'carbon', 'diffuser'] },
      { key: 'equipment',  label: 'Equipment',      match: ['aquarium', 'tank', 'filter', 'pump', 'light'] },
    ],
  },
  {
    id: 'terrarium',
    label: 'Terrarium Combo',
    tagline: 'Plants · Substrate · Decor · Botanicals',
    type: 'terrarium',
    accent: '#4ade80',
    bgGrad: 'linear-gradient(160deg, #0d2010 0%, #1a3a16 100%)',
    waterColor: 'rgba(20,80,20,0.18)',
    substrateColor: '#4a2d08',
    keywords: ['terrarium', 'tropical', 'fern', 'moss', 'botanical', 'substrate', 'vivarium', 'orchid', 'bromeliad', 'plant'],
    filterTags: [
      { key: 'all',       label: 'All' },
      { key: 'plant',     label: 'Plants',    match: ['fern', 'moss', 'orchid', 'bromeliad', 'tropical', 'plant'] },
      { key: 'substrate', label: 'Substrate', match: ['substrate', 'soil', 'mix', 'peat', 'coco'] },
      { key: 'decor',     label: 'Decor',     match: ['botanical', 'wood', 'rock', 'stone', 'decor'] },
    ],
  },
  {
    id: 'aquarium-fert',
    label: 'Aquarium Fertilizers',
    tagline: 'Root Tabs · Liquid Ferts · CO2 Boosters',
    type: 'aquarium',
    accent: '#38bdf8',
    bgGrad: 'linear-gradient(160deg, #061422 0%, #0c2840 100%)',
    waterColor: 'rgba(0,120,190,0.16)',
    substrateColor: '#2a1c04',
    keywords: ['aquarium', 'aquatic', 'fertilizer', 'fert', 'root', 'tab', 'liquid', 'co2', 'carbon', 'nutrient'],
    filterTags: [
      { key: 'all',    label: 'All' },
      { key: 'root',   label: 'Root Tabs',    match: ['root', 'tab', 'capsule'] },
      { key: 'liquid', label: 'Liquid Ferts', match: ['liquid', 'solution', 'micro', 'macro'] },
      { key: 'co2',    label: 'CO2 / Carbon', match: ['co2', 'carbon', 'excel', 'boost'] },
    ],
  },
  {
    id: 'terrarium-fert',
    label: 'Terrarium Fertilizers',
    tagline: 'Boosters · Tonics · Foliar Sprays',
    type: 'terrarium',
    accent: '#a3e635',
    bgGrad: 'linear-gradient(160deg, #111a05 0%, #203010 100%)',
    waterColor: 'rgba(40,90,10,0.18)',
    substrateColor: '#3d2205',
    keywords: ['fertilizer', 'fert', 'nutrient', 'booster', 'tonic', 'foliar', 'terrarium', 'tropical', 'plant'],
    filterTags: [
      { key: 'all',    label: 'All' },
      { key: 'liquid', label: 'Liquid',       match: ['liquid', 'solution', 'tonic'] },
      { key: 'powder', label: 'Powder / Dry', match: ['powder', 'dry', 'granule', 'slow'] },
      { key: 'foliar', label: 'Foliar Spray', match: ['foliar', 'spray', 'mist'] },
    ],
  },
];

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

// ─── Aquarium tile — video-based ─────────────────────────────────────────────
function AquariumVideoTile({ combo, hovered }) {
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);
  const a = combo.accent;

  const video  = combo.id === 'aquarium-fert' ? AQUARIUM_FERT_VIDEO  : AQUARIUM_VIDEO;
  const poster = combo.id === 'aquarium-fert' ? AQUARIUM_FERT_POSTER : AQUARIUM_POSTER;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      setEnded(false);
      v.currentTime = 0;
      v.play().catch(() => {});
    } else if (!ended) {
      v.pause();
    }
  }, [hovered]);

  // keep video visible once it reaches the last frame
  const showVideo = hovered || ended;

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '17/10',
      borderRadius: '10px', overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Poster image — shown by default, fades out on hover */}
      <img
        src={poster}
        alt={combo.label}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 1,
          opacity: showVideo ? 0 : 1,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Video — plays once; stays on last frame via `ended` state */}
      <video
        ref={videoRef}
        src={video}
        muted
        playsInline
        preload="metadata"
        onEnded={() => setEnded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 2,
          opacity: showVideo ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        background: 'linear-gradient(to top, rgba(7,26,46,0.55) 0%, transparent 45%)',
        pointerEvents: 'none',
      }} />

      {/* Accent border glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4,
        borderRadius: '10px',
        boxShadow: hovered ? `inset 0 0 0 2px ${a}60` : `inset 0 0 0 1.5px ${a}25`,
        transition: 'box-shadow 0.3s ease',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Terrarium tile — video-based ────────────────────────────────────────────
function TerrariumVideoTile({ combo, hovered }) {
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);

  const video  = combo.id === 'terrarium-fert' ? TERRARIUM_FERT_VIDEO  : TERRARIUM_VIDEO;
  const poster = combo.id === 'terrarium-fert' ? TERRARIUM_FERT_POSTER : TERRARIUM_POSTER;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      setEnded(false);
      v.currentTime = 0;
      v.play().catch(() => {});
    } else if (!ended) {
      v.pause();
    }
  }, [hovered]);

  const showVideo = hovered || ended;

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '17/10',
      borderRadius: '10px', overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Poster image */}
      <img
        src={poster}
        alt={combo.label}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 35%',
          zIndex: 1,
          opacity: showVideo ? 0 : 1,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Video — plays once, holds last frame */}
      <video
        ref={videoRef}
        src={video}
        muted
        playsInline
        preload="metadata"
        onEnded={() => setEnded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 2,
          opacity: showVideo ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        background: 'linear-gradient(to top, rgba(7,26,46,0.55) 0%, transparent 45%)',
        pointerEvents: 'none',
      }} />

      {/* Accent border glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4,
        borderRadius: '10px',
        boxShadow: hovered
          ? `inset 0 0 0 2px ${combo.accent}60`
          : `inset 0 0 0 1.5px ${combo.accent}25`,
        transition: 'box-shadow 0.3s ease',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Unified illustration dispatcher ─────────────────────────────────────────
function TankIllustration({ combo, hovered }) {
  if (combo.type === 'aquarium') {
    return <AquariumVideoTile combo={combo} hovered={hovered} />;
  }
  return <TerrariumVideoTile combo={combo} hovered={hovered} />;
}

// ─── Single combo tile ────────────────────────────────────────────────────────
function ComboTile({ combo, slotProducts, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(combo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`Open ${combo.label}`}
      style={{
        background: combo.bgGrad, border: `1.5px solid ${combo.accent}28`,
        borderRadius: '22px', padding: 0, cursor: 'pointer',
        textAlign: 'left', width: '100%', overflow: 'hidden',
        transition: 'transform 0.25s, box-shadow 0.25s',
        transform: hovered ? 'translateY(-5px) scale(1.015)' : 'none',
        boxShadow: hovered
          ? `0 22px 50px rgba(0,0,0,0.45), 0 0 0 1px ${combo.accent}30`
          : '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '0.85rem 0.85rem 0.3rem' }}>
        <TankIllustration combo={combo} hovered={hovered} />
      </div>
      <div style={{
        padding: '0.7rem 1rem 0.9rem',
        borderTop: `1px solid ${combo.accent}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: 'clamp(0.85rem,1.8vw,0.98rem)', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
            {combo.label}
          </div>
          <div style={{ fontSize: '0.67rem', color: `${combo.accent}99`, fontWeight: 600, marginTop: '0.18rem' }}>
            {combo.tagline}
          </div>
        </div>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: hovered ? `${combo.accent}28` : `${combo.accent}14`,
          border: `1px solid ${combo.accent}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color 0.2s',
        }}>
          <ArrowRight size={12} color={combo.accent} />
        </div>
      </div>
    </button>
  );
}

// ─── Combo panel (slide-up) ───────────────────────────────────────────────────
const PAGE_SIZE = 12;

function ComboPanel({ combo, allProducts, onClose }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const scrollRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
        <div ref={scrollRef} style={{ overflowY: 'auto', flex: 1, padding: 'clamp(1rem,3vw,1.5rem) clamp(1rem,3vw,1.75rem)' }}>
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
              Hover to watch your setup assemble. Tap to browse products.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 'clamp(0.85rem,2vw,1.5rem)' }}>
            {COMBOS.map(combo => {
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
