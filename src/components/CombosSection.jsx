import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCombosConfig } from '../config/combosConfig';

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

// ─── Media (in /public) ──────────────────────────────────────────────────────
// Filename contains a literal U+2026 HORIZONTAL ELLIPSIS character
const AQUARIUM_VIDEO        = '/assets/combos/aquarium/Aquarium_components_assembling_i…_202606141351.mp4';
const AQUARIUM_POSTER       = '/assets/combos/aquarium/aquarium tank.jpg';
const AQUARIUM_FERT_VIDEO   = '/assets/combos/aquarium fertilizers/aquarium_fertilizers.mp4';
const AQUARIUM_FERT_POSTER  = '/assets/combos/aquarium fertilizers/aquarium ferilizer.png';
const TERRARIUM_VIDEO       = '/assets/combos/terrarium/Glass_jar_terrarium_with_wooden_202606141405.mp4';
const TERRARIUM_POSTER      = '/assets/combos/terrarium/terraium tank.jpg';
const TERRARIUM_FERT_VIDEO  = '/assets/combos/terrarim fertlizers/Terrarium_jar_with_fertilizer_pr…_202606141445.mp4';
const TERRARIUM_FERT_POSTER = '/assets/combos/terrarim fertlizers/terrarium_fertilizers.png';

// Decorative video/poster per tile — purely visual, keyed by combo id.
const COMBO_MEDIA = {
  'complete-build': { video: AQUARIUM_VIDEO,      poster: AQUARIUM_POSTER,      objectPosition: 'center' },
  'plants-only':    { video: TERRARIUM_VIDEO,     poster: TERRARIUM_POSTER,     objectPosition: 'center 35%' },
  'hardscape':      { video: AQUARIUM_FERT_VIDEO, poster: AQUARIUM_FERT_POSTER, objectPosition: 'center' },
  'fertilizers':    { video: TERRARIUM_FERT_VIDEO, poster: TERRARIUM_FERT_POSTER, objectPosition: 'center' },
};

// ─── Single combo tile — circular ────────────────────────────────────────────
function ComboTile({ combo, onClick }) {
  const [hovered, setHovered]     = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const btnRef   = useRef(null);
  const a = combo.accent;
  const media = COMBO_MEDIA[combo.id] || COMBO_MEDIA['complete-build'];

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

  // On touch devices there is no hover, and a tap must navigate immediately — so we
  // can't use touch to drive the video. Instead we play the (muted, inline) video
  // only while the circle sits in the CENTRAL band of the screen (rootMargin
  // shrinks the active zone to the middle ~40%). This sequences playback by scroll
  // position — videos play as they pass the middle instead of all firing at once —
  // and a tap still navigates straight through (no tap/click conflict).
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

  const handleClick = () => { setHovered(false); onClick(combo); };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      aria-label={`Browse ${combo.label} combos`}
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
            src={media.poster}
            alt={combo.label}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: media.objectPosition,
              opacity: showVideo ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          <video
            ref={videoRef}
            src={media.video}
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

// ─── Public export ────────────────────────────────────────────────────────────
export default function CombosSection() {
  const combos = useCombos();
  const navigate = useNavigate();
  const handleOpen = useCallback((combo) => navigate(`/combos?type=${combo.type}`), [navigate]);

  return (
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
            Hover to play. Tap to browse combos for your setup.
          </p>
        </div>

        <style>{`
          .combos-circle-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(1rem,3vw,2rem); width: 100%; }
          @media (max-width: 560px) { .combos-circle-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
        `}</style>
        <div className="combos-circle-grid">
          {combos.map(combo => (
            <ComboTile key={combo.id} combo={combo} onClick={handleOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}
