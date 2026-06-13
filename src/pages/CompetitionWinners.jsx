import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Award, Sparkles, Gift, Heart, ChevronLeft, Clock, AtSign,
  ChevronRight, Play, FastForward,
} from 'lucide-react';
import SEO from '../components/SEO';
import Confetti from '../components/Confetti';
import { fetchWinners, formatAnnouncementDate, PRIZE_LABELS, PRIZE_COLORS } from '../services/CompetitionService';

const TIER_ICONS = {
  first: Trophy,
  second: Award,
  third: Award,
  consolation: Sparkles,
  mystery: Gift,
};

const TIER_SIZE = {
  first: 'hero',
  second: 'large',
  third: 'large',
  consolation: 'normal',
  mystery: 'normal',
};

const TIER_TAGLINES = {
  first: 'Grand Prize — The Best of the Best',
  second: 'Runner-up',
  third: 'Third Place',
  consolation: 'Consolation Prize',
  mystery: 'Mystery Box — Surprise Pick',
};

// Spoken-word lead-in shown above each card as it is unveiled.
const TIER_ANNOUNCE = {
  first: 'And the Grand Prize goes to…',
  second: 'In second place…',
  third: 'Taking third place…',
  consolation: 'A consolation prize for…',
  mystery: 'The Mystery Box surprise goes to…',
};

const REVEAL_SEEN_KEY = 'junglyst_winners_revealed';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

/* ───────────────────────── Gallery card (finale) ─────────────────────── */

function WinnerCard({ winner }) {
  const Icon = TIER_ICONS[winner.prize_tier] || Trophy;
  const color = PRIZE_COLORS[winner.prize_tier] || '#c9972b';
  const size = TIER_SIZE[winner.prize_tier] || 'normal';
  const isHero = size === 'hero';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${color}55`,
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isHero ? `0 25px 60px -20px ${color}66` : `0 12px 30px -15px ${color}44`,
        gridColumn: isHero ? '1 / -1' : 'auto',
        display: 'grid',
        gridTemplateColumns: isHero ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : '1fr',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
        {winner.image_urls?.[0] ? (
          <img
            src={winner.image_urls[0]}
            alt={winner.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: color, color: '#0a1f1c',
          fontSize: isHero ? '0.85rem' : '0.7rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          padding: '0.4rem 0.85rem', borderRadius: '999px',
        }}>
          <Icon size={isHero ? 16 : 13} /> {PRIZE_LABELS[winner.prize_tier]}
        </div>
      </div>

      <div style={{
        padding: isHero ? '2rem clamp(1.5rem, 3vw, 2.5rem)' : '1.4rem 1.5rem 1.6rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.6rem',
      }}>
        <span style={{ fontSize: '0.65rem', color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          {TIER_TAGLINES[winner.prize_tier]}
        </span>
        <h3 style={{
          margin: 0, color: 'white',
          fontFamily: 'var(--font-serif)', fontWeight: 800,
          fontSize: isHero ? 'clamp(1.5rem, 3.5vw, 2.5rem)' : '1.15rem',
          lineHeight: 1.15,
        }}>{winner.name}</h3>
        {winner.instagram_handle && (
          <a
            href={`https://instagram.com/${winner.instagram_handle}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              color: '#c9972b', fontSize: '0.78rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}
          ><AtSign size={12} /> @{winner.instagram_handle}</a>
        )}
        <p style={{
          margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.65)',
          fontSize: isHero ? '0.95rem' : '0.8rem', lineHeight: 1.7,
          display: '-webkit-box', WebkitLineClamp: isHero ? 6 : 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{winner.about_aquarium}</p>
        <div style={{
          marginTop: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem',
        }}>
          <Heart size={13} fill="#fca5a5" color="#fca5a5" />
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
            {winner.vote_count}
          </span>
          community votes
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────── Reveal stage (controlled) ───────────────────── */

function RevealCard({ winner, isMobile }) {
  const Icon = TIER_ICONS[winner.prize_tier] || Trophy;
  const color = PRIZE_COLORS[winner.prize_tier] || '#c9972b';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, filter: 'blur(14px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: '100%',
        maxWidth: isMobile ? '340px' : '440px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.04)',
        border: `2px solid ${color}`,
        borderRadius: '26px',
        overflow: 'hidden',
        boxShadow: `0 0 0 1px ${color}33, 0 30px 80px -28px ${color}, 0 0 120px -40px ${color}`,
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
        {winner.image_urls?.[0] ? (
          <motion.img
            src={winner.image_urls[0]}
            alt={winner.name}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.82) 100%)',
        }} />
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            position: 'absolute', top: '1rem', left: '1rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            background: color, color: '#0a1f1c',
            fontSize: '0.78rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '0.45rem 0.95rem', borderRadius: '999px',
          }}
        >
          <Icon size={15} /> {PRIZE_LABELS[winner.prize_tier]}
        </motion.div>
      </div>

      <div style={{ padding: '1.5rem 1.6rem 1.8rem', textAlign: 'center' }}>
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            margin: 0, color: 'white', fontFamily: 'var(--font-serif)', fontWeight: 800,
            fontSize: isMobile ? '1.6rem' : '2rem', lineHeight: 1.1,
          }}
        >
          {winner.name}
        </motion.h3>
        {winner.instagram_handle && (
          <a
            href={`https://instagram.com/${winner.instagram_handle}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              color: '#c9972b', fontSize: '0.82rem', textDecoration: 'none', marginTop: '0.5rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}
          ><AtSign size={13} /> @{winner.instagram_handle}</a>
        )}
        <div style={{
          marginTop: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem',
        }}>
          <Heart size={14} fill="#fca5a5" color="#fca5a5" />
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'white' }}>
            {winner.vote_count}
          </span>
          community votes
        </div>
      </div>
    </motion.div>
  );
}

function RevealStage({ revealOrder, onComplete, onBurst }) {
  const isMobile = useIsMobile();
  // index of the winner currently shown; -1 means "ready to reveal the first".
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? revealOrder[index] : null;
  const color = current ? (PRIZE_COLORS[current.prize_tier] || '#c9972b') : '#c9972b';
  const isLastShown = index === revealOrder.length - 1;
  const nextTier = revealOrder[index + 1]?.prize_tier;

  const advance = () => {
    const next = index + 1;
    setIndex(next);
    onBurst(revealOrder[next]?.prize_tier);
  };

  const nextLabel = (() => {
    if (index === -1) return 'Begin the Reveal';
    if (nextTier === 'first') return 'Reveal the Grand Prize';
    return 'Reveal Next';
  })();

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(3.5rem,8vw,5rem) 1.25rem 3rem',
        overflow: 'hidden',
      }}
    >
      {/* Spotlight that takes on the current tier's colour */}
      <motion.div
        key={`glow-${index}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 70% 55% at 50% 38%, ${color}26, transparent 70%)`,
        }}
      />
      {/* Faint vertical spotlight beam */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 'min(90vw, 620px)', height: '60vh', pointerEvents: 'none',
        background: `linear-gradient(180deg, ${color}1f, transparent 75%)`,
        clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)',
        opacity: 0.7,
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '560px', textAlign: 'center' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
          {revealOrder.map((w, i) => {
            const c = PRIZE_COLORS[w.prize_tier] || '#c9972b';
            const done = i <= index;
            return (
              <span
                key={w.id}
                style={{
                  width: done ? '26px' : '9px', height: '9px', borderRadius: '999px',
                  background: done ? c : 'rgba(255,255,255,0.18)',
                  transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            );
          })}
        </div>

        {/* Announcement line */}
        <div style={{ minHeight: isMobile ? '2.2rem' : '2.8rem', marginBottom: '1.25rem' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={`announce-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              style={{
                margin: 0, fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                color: index === -1 ? 'rgba(255,255,255,0.85)' : color,
                fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              {index === -1
                ? 'The results are in. Ready?'
                : TIER_ANNOUNCE[current.prize_tier]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Card stage */}
        <div style={{ minHeight: isMobile ? '360px' : '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {current ? (
              <RevealCard key={current.id} winner={current} isMobile={isMobile} />
            ) : (
              <motion.div
                key="curtain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: isMobile ? '150px' : '180px', height: isMobile ? '150px' : '180px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(201,151,43,0.25), rgba(201,151,43,0.05) 70%)',
                  border: '1px solid rgba(201,151,43,0.4)',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Trophy size={isMobile ? 56 : 70} color="#e8b84b" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {!isLastShown ? (
            <button
              onClick={advance}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                padding: '0.95rem 2rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: '#0a1f1c', fontSize: '0.92rem', fontWeight: 800,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                boxShadow: `0 14px 36px -14px ${color}`,
              }}
            >
              {index === -1 ? <Play size={16} /> : <ChevronRight size={16} />} {nextLabel}
            </button>
          ) : (
            <button
              onClick={onComplete}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                padding: '0.95rem 2rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #c9972b, #e8b84b)',
                color: '#0a1f1c', fontSize: '0.92rem', fontWeight: 800,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                boxShadow: '0 14px 36px -14px #c9972b',
              }}
            >
              <Trophy size={16} /> See All Winners
            </button>
          )}

          {!isLastShown && (
            <button
              onClick={onComplete}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              <FastForward size={13} /> Skip the reveal
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Page ──────────────────────────────────── */

export default function CompetitionWinners() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('intro'); // 'intro' | 'reveal' | 'finale'
  const [burstKey, setBurstKey] = useState(0);
  const [finaleActive, setFinaleActive] = useState(false);
  const [burstColors, setBurstColors] = useState(undefined);

  useEffect(() => {
    fetchWinners()
      .then(setData)
      .catch(() => setError('Could not load winners. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const winners = useMemo(() => data?.winners || [], [data]);
  const published = data?.published;
  const announcementDate = formatAnnouncementDate(data?.result_announcement_date);

  // Reveal builds suspense from the lowest tier up to the Grand Prize, so we
  // play the published order (best → worst) in reverse.
  const revealOrder = useMemo(() => [...winners].reverse(), [winners]);

  // If the visitor has already watched the reveal this session, skip straight
  // to the finished gallery instead of replaying it.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!published || winners.length === 0) return;
    try {
      if (sessionStorage.getItem(REVEAL_SEEN_KEY) === '1') {
        setSeen(true);
        setMode('finale');
      }
    } catch { /* sessionStorage unavailable — keep the reveal */ }
  }, [published, winners.length]);

  const startReveal = () => {
    setMode('reveal');
    setBurstColors(undefined);
  };

  const handleBurst = (tier) => {
    if (!tier) return;
    setBurstColors([PRIZE_COLORS[tier] || '#c9972b', '#ffffff', '#e8b84b']);
    setBurstKey((k) => k + 1);
    if (tier === 'first') setFinaleActive(true);
  };

  const finishReveal = () => {
    try { sessionStorage.setItem(REVEAL_SEEN_KEY, '1'); } catch { /* ignore */ }
    setSeen(true);
    setFinaleActive(true);
    setBurstColors(undefined);
    setBurstKey((k) => k + 1);
    setMode('finale');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // The celebratory confetti rain is a moment, not a permanent state — let it
  // run for a few seconds, then stop so we aren't burning a rAF loop forever.
  useEffect(() => {
    if (!finaleActive) return;
    const t = setTimeout(() => setFinaleActive(false), 9000);
    return () => clearTimeout(t);
  }, [finaleActive]);

  const showReveal = published && winners.length > 0 && mode === 'reveal';
  const showFinaleGallery = !showReveal;

  return (
    <div style={{ backgroundColor: '#060f0d', minHeight: '100vh', color: 'white' }}>
      <SEO
        title="Aquascape Competition Winners | Junglyst"
        description="Meet the winners of the Junglyst Aquascape Competition — the most stunning builds, picked from hundreds of entries."
        path="/competition/winners"
      />

      <Confetti burstKey={burstKey} colors={burstColors} finale={finaleActive} />

      {/* ── Controlled reveal experience ── */}
      {showReveal && (
        <RevealStage
          revealOrder={revealOrder}
          onComplete={finishReveal}
          onBurst={handleBurst}
        />
      )}

      {/* ── Intro / finale hero + gallery ── */}
      {showFinaleGallery && (
        <>
          <section style={{
            background: 'radial-gradient(ellipse at top, rgba(201,151,43,0.12), transparent 60%), linear-gradient(160deg, #060f0d 0%, #071823 60%, #060f0d 100%)',
            padding: 'clamp(4rem,9vw,7rem) 1.5rem clamp(2.5rem,5vw,4rem)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(201,151,43,0.15)', border: '1px solid rgba(201,151,43,0.4)',
                borderRadius: '999px', padding: '0.4rem 1.1rem', marginBottom: '1.5rem',
              }}>
                <Trophy size={14} color="#c9972b" />
                <span style={{ fontSize: '0.7rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                  {published ? 'Winners Revealed' : 'Coming Soon'}
                </span>
              </div>
              <h1 style={{
                fontSize: 'clamp(2.2rem,6vw,4.5rem)', fontFamily: 'var(--font-serif)', fontWeight: 800,
                lineHeight: 1.05, margin: '0 0 1.25rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #c9972b 55%, #e8b84b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                The Winners
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.95rem,2vw,1.1rem)',
                maxWidth: '580px', margin: '0 auto', lineHeight: 1.75,
              }}>
                {published
                  ? 'Selected by the Junglyst team with help from the community. Congratulations to every contestant who shared their craft.'
                  : announcementDate
                    ? `Winners will be announced on ${announcementDate}. Keep voting for your favourites until then.`
                    : 'Winners will be announced soon. Keep voting for your favourites.'}
              </p>

              <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* When winners are published, let visitors (re)play the cinematic reveal. */}
                {published && winners.length > 0 && (
                  <button onClick={startReveal} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #c9972b, #e8b84b)', color: '#0a1f1c',
                    fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                    boxShadow: '0 12px 30px -12px #c9972b',
                  }}>
                    <Play size={14} /> {seen ? 'Replay the Reveal' : 'Watch the Reveal'}
                  </button>
                )}
                <Link to="/competition/entries" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.75rem 1.4rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <ChevronLeft size={14} /> All Entries
                </Link>
              </div>
            </motion.div>
          </section>

          <section style={{ padding: 'clamp(2.5rem,5vw,4.5rem) 1.5rem clamp(3rem,6vw,5rem)' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>
              {loading && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '2.5rem' }}>
                  Loading winners…
                </div>
              )}
              {error && (
                <div style={{ color: '#fca5a5', textAlign: 'center', padding: '2.5rem' }}>{error}</div>
              )}
              {!loading && !error && winners.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: 'clamp(2rem,5vw,4rem) 1rem',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '20px', maxWidth: '560px', margin: '0 auto',
                }}>
                  <Clock size={36} color="rgba(201,151,43,0.5)" style={{ marginBottom: '0.85rem' }} />
                  <h3 style={{ color: 'white', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem' }}>
                    Winners haven't been announced yet
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                    Voting is still in progress. Cast your votes for the entries you love — every vote counts towards the community's picks.
                  </p>
                  <Link to="/competition/entries" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.7rem 1.5rem', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #c9972b, #e8b84b)', color: '#0a1f1c',
                    textDecoration: 'none', fontSize: '0.82rem', fontWeight: 800,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    <Heart size={14} /> Vote for Entries
                  </Link>
                </div>
              )}
              {!loading && winners.length > 0 && (
                <div style={{
                  display: 'grid', gap: '1.5rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                }}>
                  {winners.map((w) => <WinnerCard key={w.id} winner={w} />)}
                </div>
              )}
            </div>
          </section>

          {/* Community CTA */}
          {!loading && (
            <section style={{
              padding: 'clamp(2.5rem,5vw,4rem) 1.5rem',
              background: 'rgba(201,151,43,0.04)', borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
                <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.5rem' }}>
                  Loved this?
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,3vw,2rem)', margin: '0 0 0.85rem' }}>
                  Join the Junglyst Community
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
                  Share your aquascape, swap tips with fellow growers, and stay in the loop on the next competition.
                </p>
                <Link to="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.85rem 1.75rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #c9972b, #e8b84b)', color: '#0a1f1c',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  Create an Account
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
