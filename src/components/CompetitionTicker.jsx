import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const LAUNCH_DATE = new Date('2026-06-01T00:00:00+05:30');

const ITEMS = [
  { type: 'icon' },
  { type: 'text', text: 'Aquascape Competition 2026' },
  { type: 'dot' },
  { type: 'text', text: '₹1,000 Cash Prize' },
  { type: 'dot' },
  { type: 'text', text: '500 Slots Only — Enter Early' },
  { type: 'dot' },
  { type: 'text', text: 'Submit Photos of Your Build' },
  { type: 'dot' },
  { type: 'text', text: 'Winner Announced June 1, 2026' },
  { type: 'dot' },
  { type: 'cta', text: 'Register Now →' },
  { type: 'dot' },
  { type: 'text', text: 'Open to All Aquascape Enthusiasts' },
  { type: 'dot' },
  { type: 'text', text: 'One Winner — Judged by Junglyst' },
  { type: 'dot' },
];

function TickerItem({ item }) {
  if (item.type === 'icon') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', margin: '0 1.5rem' }}>
        <Trophy size={12} color="#c9972b" />
      </span>
    );
  }
  if (item.type === 'dot') {
    return (
      <span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'rgba(201,151,43,0.4)', margin: '0 1.25rem', verticalAlign: 'middle' }} />
    );
  }
  if (item.type === 'cta') {
    return (
      <Link
        to="/competition"
        style={{
          display: 'inline-block',
          color: '#0a1f1c',
          backgroundColor: '#c9972b',
          padding: '0.2rem 0.8rem',
          borderRadius: '100px',
          fontSize: '0.68rem',
          fontWeight: 800,
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 1.5rem',
          verticalAlign: 'middle',
          flexShrink: 0,
        }}
      >
        {item.text}
      </Link>
    );
  }
  return (
    <span style={{ display: 'inline-block', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
      {item.text}
    </span>
  );
}

export default function CompetitionTicker() {
  if (Date.now() >= LAUNCH_DATE.getTime()) return null;

  // Duplicate items to create seamless loop
  const track = [...ITEMS, ...ITEMS];

  return (
    <div style={{
      backgroundColor: '#0a1f1c',
      borderBottom: '1px solid rgba(201,151,43,0.2)',
      overflow: 'hidden',
      height: '34px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 99,
    }}>
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #0a1f1c, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #0a1f1c, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        animation: 'competitionTicker 35s linear infinite',
        willChange: 'transform',
      }}>
        {track.map((item, i) => (
          <TickerItem key={i} item={item} />
        ))}
      </div>

      <style>{`
        @keyframes competitionTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .competition-ticker-wrap:hover > div {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
