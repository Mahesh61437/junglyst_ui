import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Trophy, ArrowRight } from 'lucide-react';

const LAUNCH_DATE = new Date('2026-05-25T00:00:00+05:30');
const STORAGE_KEY = 'junglyst_competition_banner_dismissed';

function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  function getTimeLeft() {
    const diff = target - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

export default function CompetitionBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const timeLeft = useCountdown(LAUNCH_DATE);

  if (dismissed || !timeLeft) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setDismissed(true);
  }

  const pad = n => String(n).padStart(2, '0');

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
          <Trophy size={14} color="#c9972b" />
          <span style={{ color: '#c9972b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Aquascape Competition 2026
          </span>
        </div>

        {/* Divider */}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>

        {/* Prize */}
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>
          ₹1,000 Prize
        </span>

        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Closes in</span>
          <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', display: 'none' }} className="banner-divider">|</span>

        {/* CTA */}
        <Link to="/competition" style={{
          display: 'flex',
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
        }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          Enter Now <ArrowRight size={11} />
        </Link>
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
        onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
        onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
      >
        <X size={14} />
      </button>
    </div>
  );
}
