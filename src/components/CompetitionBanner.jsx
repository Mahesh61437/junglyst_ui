import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Trophy, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { useCompetitionStatus, getLaunchDate } from '../services/CompetitionService';

// Storage key is namespaced by phase, so dismissing the submission banner does
// NOT hide the voting or results banner that comes later — each phase shows
// its own message at least once per user.
const STORAGE_PREFIX = 'junglyst_competition_banner_dismissed_';

function useCountdown(target) {
  const getTimeLeft = () => {
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
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [target?.getTime()]);

  return timeLeft;
}

const pad = (n) => String(n).padStart(2, '0');

// ── Phase-aware banner content ──────────────────────────────────────────────
function getBannerContent(phase, timeLeft) {
  if (phase === 'results') {
    return {
      icon: <Sparkles size={14} color="#c9972b" />,
      label: 'Winners Announced',
      // Single highlight line in place of countdown
      secondary: 'The Aquascape Competition 2026 has wrapped — see who took home the prizes.',
      ctas: [
        { to: '/competition/winners', text: 'See Winners', primary: true },
        { to: '/competition/entries', text: 'Browse Entries', primary: false },
      ],
    };
  }
  if (phase === 'voting') {
    return {
      icon: <Heart size={14} color="#c9972b" />,
      label: 'Voting is Live',
      secondary: 'Vote for your favourite aquascape — every tap counts.',
      ctas: [
        { to: '/competition/entries', text: 'Vote Now', primary: true },
      ],
    };
  }
  // submission (default)
  return {
    icon: <Trophy size={14} color="#c9972b" />,
    label: 'Aquascape Competition 2026',
    secondary: timeLeft
      ? `Closes in ${timeLeft.days}d ${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`
      : '₹1,000 Prize',
    ctas: [{ to: '/competition', text: 'Enter Now', primary: true }],
  };
}

export default function CompetitionBanner() {
  const status = useCompetitionStatus();
  const phase = status?.phase || 'submission';

  // Per-phase dismissal: dismissing one phase doesn't suppress the next.
  const storageKey = `${STORAGE_PREFIX}${phase}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  // Re-check dismissal when phase changes (status loads async).
  useEffect(() => {
    try { setDismissed(localStorage.getItem(storageKey) === '1'); } catch {}
  }, [storageKey]);

  // Submission-phase fallback: hide the countdown banner once the timer hits zero,
  // because the `voting` content will take over on the next status fetch.
  const timeLeft = useCountdown(getLaunchDate(status));
  if (phase === 'submission' && !timeLeft) return null;
  if (dismissed) return null;

  const content = getBannerContent(phase, timeLeft);

  function dismiss() {
    try { localStorage.setItem(storageKey, '1'); } catch {}
    setDismissed(true);
  }

  const primaryCtaStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: '#c9972b',
    color: '#0a1f1c',
    padding: '0.3rem 0.9rem',
    borderRadius: '100px',
    fontSize: '0.68rem',
    fontWeight: 800,
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    transition: 'opacity 0.2s',
    flexShrink: 0,
  };

  const secondaryCtaStyle = {
    ...primaryCtaStyle,
    backgroundColor: 'transparent',
    color: '#c9972b',
    border: '1px solid rgba(201,151,43,0.5)',
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #0a1f1c 0%, #0d2d24 40%, #0a1a28 100%)',
      borderBottom: '1px solid rgba(184,143,32,0.3)',
      position: 'relative',
      zIndex: 200,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(0.5rem, 2vw, 1.5rem)',
        padding: '0.55rem 3rem 0.55rem 1rem',
        flexWrap: 'wrap',
        minHeight: '40px',
      }}>
        {/* Icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {content.icon}
          <span style={{ color: '#c9972b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {content.label}
          </span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>

        {/* Secondary line (countdown / description) */}
        <span style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: '0.72rem',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          // Allow soft wrap when the line is descriptive (results/voting phases)
          maxWidth: '420px',
          textAlign: 'center',
        }}>
          {content.secondary}
        </span>

        {/* CTA(s) — direct <Link>s, one click → destination */}
        {content.ctas.map((cta, i) => (
          <Link
            key={cta.to}
            to={cta.to}
            style={cta.primary ? primaryCtaStyle : secondaryCtaStyle}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {cta.text} <ArrowRight size={11} />
          </Link>
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss competition banner"
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.35rem',
          color: 'rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
