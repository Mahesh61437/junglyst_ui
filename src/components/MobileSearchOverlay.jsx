import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  'Salvinia', 'Java Moss', 'Anubias', 'Buce', 'Cryptocoryne',
  'Aquatic Plants', 'Hardscape', 'Driftwood', 'Stones',
];

export default function MobileSearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync query with URL when opening
  useEffect(() => {
    if (open) {
      const q = new URLSearchParams(location.search).get('search') || '';
      setQuery(q);
      // Focus input after transition
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close and navigate on search submit
  const commit = (q) => {
    const trimmed = q.trim();
    if (trimmed) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    commit(query);
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    // Full-screen overlay
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3500,
        backgroundColor: 'rgba(10,31,28,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Search panel — stop click propagation so tapping inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.85rem 1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Search icon */}
          <Search size={18} color="var(--brand-gold)" style={{ flexShrink: 0 }} />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            placeholder="Search plants, hardscape…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            style={{
              flex: 1,
              border: 'none', outline: 'none',
              fontSize: '1rem', color: 'var(--text-primary)',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          />

          {/* Clear */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                width: '26px', height: '26px', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}
            >
              <X size={13} />
            </button>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: '4px', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              fontSize: '0.72rem', fontWeight: 700, gap: '0.25rem',
            }}
          >
            <X size={18} />
          </button>
        </form>
      </div>

      {/* Quick suggestions panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '0 0 20px 20px',
          padding: '1rem',
          margin: '0 8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 0.75rem' }}>
          {query ? 'Press enter to search' : 'Popular searches'}
        </p>

        {query ? (
          // Show "Search for X" suggestion
          <button
            onClick={() => commit(query)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-deep)', color: 'white',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 700,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Search size={15} /> Search for "{query}"
            </span>
            <ArrowRight size={16} />
          </button>
        ) : (
          // Show tag suggestions
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => commit(s)}
                style={{
                  padding: '0.4rem 0.9rem',
                  backgroundColor: '#f8faf8', border: '1px solid #edf2ed',
                  borderRadius: '100px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                  transition: 'all 0.15s',
                }}
                onTouchStart={e => { e.currentTarget.style.backgroundColor = '#e1fde0'; e.currentTarget.style.borderColor = 'var(--brand-gold)'; }}
                onTouchEnd={e => { e.currentTarget.style.backgroundColor = '#f8faf8'; e.currentTarget.style.borderColor = '#edf2ed'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tap-outside hint */}
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '1.5rem', fontWeight: 600 }}>
        Tap outside to close
      </p>
    </div>
  );
}
