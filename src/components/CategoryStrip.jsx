import { useRef } from 'react';

/**
 * Horizontal scrollable row of circular category cards.
 * Images come from cat.image_url set via the Super Admin Dashboard.
 */

export default function CategoryStrip({ categories = [], selected = null, onSelect }) {
  const scrollRef = useRef(null);

  const items = [{ id: null, name: 'All' }, ...categories];

  return (
    <div style={{ position: 'relative' }}>
      {/* Fade edges hint that there's more to scroll */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '48px',
        background: 'linear-gradient(to left, var(--bg-page, white), transparent)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '0.5rem',
          // hide scrollbar cross-browser
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="cat-strip-scroll"
      >
        {items.map(cat => {
          const isActive = selected === cat.id;
          const img = cat.image_url || null;

          return (
            <button
              key={cat.id ?? 'all'}
              onClick={() => onSelect(cat.id === selected ? null : cat.id, cat.name)}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0',
              }}
            >
              {/* Circle */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2.5px solid ${isActive ? 'var(--brand-gold, #b5932a)' : 'transparent'}`,
                outline: isActive ? '2px solid rgba(181,147,42,0.25)' : '2px solid transparent',
                outlineOffset: '2px',
                transition: 'border-color 0.18s, outline-color 0.18s, transform 0.18s',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                background: img ? 'transparent' : 'var(--bg-muted, #f3f4f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {img ? (
                  <img
                    src={img}
                    alt={cat.name}
                    loading="lazy"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : null}
                {/* Fallback initial — hidden when img loads, shown for "All" or missing images */}
                <span style={{
                  display: img ? 'none' : 'flex',
                  width: '100%', height: '100%',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  background: isActive
                    ? 'var(--brand-gold, #b5932a)'
                    : 'var(--bg-deep, #0a1f1c)',
                  color: isActive ? '#fff' : 'var(--brand-gold, #b5932a)',
                  fontWeight: 800,
                  transition: 'background 0.18s, color 0.18s',
                }}>
                  {cat.name === 'All' ? '✦' : cat.name[0]}
                </span>
              </div>

              {/* Label */}
              <span style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--brand-gold, #b5932a)' : 'var(--text-secondary, #6b7280)',
                textAlign: 'center',
                maxWidth: '76px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.18s',
                letterSpacing: '0.02em',
              }}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        .cat-strip-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
