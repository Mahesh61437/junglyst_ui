import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, Trophy, ChevronLeft, ChevronRight, Camera, AtSign, ArrowLeft, LogIn,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCompetitionStatus, fetchEntry, toggleVote } from '../services/CompetitionService';

function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
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

export default function CompetitionEntryDetail() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const status = useCompetitionStatus();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [voteToast, setVoteToast] = useState('');

  const phase = status?.phase || 'submission';
  const votingDisabled = phase !== 'voting';
  const votingDisabledReason =
    phase === 'submission' ? 'Voting opens after submissions close.'
    : phase === 'results' ? 'Voting has ended — winners are live.'
    : '';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fetchEntry(id)
      .then((d) => { if (alive) { setEntry(d); setActiveImg(0); } })
      .catch((e) => { if (alive) setError(e?.response?.status === 404 ? 'This entry could not be found.' : 'Could not load this entry. Please try again.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  // Keyboard arrows navigate photos
  useEffect(() => {
    const onKey = (e) => {
      if (!entry?.image_urls?.length) return;
      const n = entry.image_urls.length;
      if (e.key === 'ArrowLeft') setActiveImg((i) => (i - 1 + n) % n);
      if (e.key === 'ArrowRight') setActiveImg((i) => (i + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entry]);

  const handleVote = async () => {
    if (votingDisabled) {
      setVoteToast(votingDisabledReason);
      setTimeout(() => setVoteToast(''), 2500);
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const prev = entry;
    setEntry((e) => ({ ...e, has_voted: !e.has_voted, vote_count: Math.max(0, e.vote_count + (e.has_voted ? -1 : 1)) }));
    try {
      const res = await toggleVote(id);
      setEntry((e) => ({ ...e, has_voted: res.voted, vote_count: res.vote_count }));
    } catch (err) {
      setEntry(prev);
      setVoteToast(err?.response?.data?.error || 'Could not record your vote. Try again.');
      setTimeout(() => setVoteToast(''), 2500);
    }
  };

  const images = entry?.image_urls || [];
  const multi = images.length > 1;
  const safe = Math.min(activeImg, Math.max(0, images.length - 1));
  const prevPhoto = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextPhoto = () => setActiveImg((i) => (i + 1) % images.length);

  const backLink = (
    <Link to="/competition/entries" style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
    }}>
      <ArrowLeft size={15} /> All entries
    </Link>
  );

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={shell}>
        <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading entry…</div>
      </div>
    );
  }
  if (error || !entry) {
    return (
      <div style={shell}>
        <div style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
          <Camera size={36} color="rgba(201,151,43,0.4)" style={{ marginBottom: '0.85rem' }} />
          <p style={{ color: '#fca5a5', marginBottom: '1.25rem' }}>{error || 'Entry not found.'}</p>
          <Link to="/competition/entries" style={primaryBtn}><ArrowLeft size={14} /> Back to gallery</Link>
        </div>
      </div>
    );
  }

  const imagePane = (
    <div style={{
      position: 'relative', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flex: isMobile ? '0 0 auto' : '1 1 auto', minHeight: 0, minWidth: 0,
      maxHeight: isMobile ? '56vh' : '82vh',
    }}>
      <img
        src={images[safe]}
        alt={`${entry.name} — photo ${safe + 1} of ${images.length}`}
        decoding="async"
        style={{ maxWidth: '100%', maxHeight: isMobile ? '56vh' : '82vh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
      />
      {multi && (
        <>
          <button onClick={prevPhoto} aria-label="Previous photo" style={navBtnStyle('left')}><ChevronLeft size={22} /></button>
          <button onClick={nextPhoto} aria-label="Next photo" style={navBtnStyle('right')}><ChevronRight size={22} /></button>
          <span style={counterStyle}>{safe + 1} / {images.length}</span>
        </>
      )}
    </div>
  );

  const captionPane = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: isMobile ? '1 1 auto' : '0 0 380px', width: isMobile ? '100%' : '380px',
      minHeight: 0, borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <h1 style={{ color: 'white', margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.5rem', lineHeight: 1.15 }}>{entry.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {entry.instagram_handle && (
            <a href={`https://instagram.com/${entry.instagram_handle}`} target="_blank" rel="noopener noreferrer"
              style={{ color: '#c9972b', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <AtSign size={12} /> {entry.instagram_handle}
            </a>
          )}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Camera size={12} /> {images.length} {images.length === 1 ? 'photo' : 'photos'}
          </span>
          {entry.prize_tier && (
            <span style={{ background: 'rgba(201,151,43,0.95)', color: '#0a1f1c', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.18rem 0.55rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Trophy size={10} /> {entry.prize_tier_label}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: '1 1 auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '1.1rem 1.5rem 1.4rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {entry.about_aquarium}
        </p>
      </div>

      {/* Vote + thumbnails */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.9rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <button
          onClick={handleVote}
          disabled={votingDisabled}
          title={votingDisabled ? votingDisabledReason : (entry.has_voted ? 'Remove your vote' : 'Vote for this entry')}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: entry.has_voted ? 'rgba(220,38,38,0.15)' : 'linear-gradient(135deg, #c9972b, #e8b84b)',
            border: `1px solid ${entry.has_voted ? 'rgba(220,38,38,0.5)' : 'transparent'}`,
            color: entry.has_voted ? '#fca5a5' : '#0a1f1c',
            padding: '0.8rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800,
            cursor: votingDisabled ? 'not-allowed' : 'pointer', opacity: votingDisabled ? 0.55 : 1,
            letterSpacing: '0.03em',
          }}
        >
          <Heart size={16} fill={entry.has_voted ? '#fca5a5' : 'none'} />
          {entry.has_voted ? 'Voted' : 'Vote'} · {entry.vote_count}
        </button>

        {multi && (
          <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto' }}>
            {images.map((url, i) => (
              <button key={url + i} onClick={() => setActiveImg(i)} aria-label={`View photo ${i + 1}`}
                style={{ flex: '0 0 auto', width: '52px', height: '52px', padding: 0, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'none',
                  border: `2px solid ${i === safe ? '#c9972b' : 'rgba(255,255,255,0.15)'}`, opacity: i === safe ? 1 : 0.55, transition: 'opacity 0.15s, border-color 0.15s' }}>
                <img src={url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={shell}>
      <SEO
        title={`${entry.name}'s Aquascape — Junglyst Competition`}
        description={(entry.about_aquarium || '').slice(0, 155)}
        image={images[0]}
        path={`/competition/entries/${id}`}
      />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '0.75rem' }}>
        {backLink}
        {!isAuthenticated && phase === 'voting' && (
          <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#c9972b', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
            <LogIn size={14} /> Sign in to vote
          </Link>
        )}
      </div>

      {/* Full view */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: isMobile ? '0' : '1.5rem' }}>
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          background: '#0c1512', borderRadius: isMobile ? '0' : '16px', overflow: 'hidden',
          boxShadow: isMobile ? 'none' : '0 25px 60px -12px rgba(0,0,0,0.6)',
          width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : '1200px',
          maxHeight: isMobile ? 'none' : '82vh', minWidth: 0,
        }}>
          {imagePane}
          {captionPane}
        </div>
      </div>

      {voteToast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(220,38,38,0.92)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, zIndex: 1100 }}>
          {voteToast}
        </div>
      )}
    </div>
  );
}

const shell = { backgroundColor: '#060f0d', minHeight: '100vh', color: 'white' };

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
  padding: '0.75rem 1.5rem', borderRadius: '10px',
  background: 'linear-gradient(135deg, #c9972b, #e8b84b)', color: '#0a1f1c',
  textDecoration: 'none', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
};

function navBtnStyle(side) {
  return {
    position: 'absolute', [side]: '0.6rem', top: '50%', transform: 'translateY(-50%)', zIndex: 5,
    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '42px', height: '42px',
    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
  };
}

const counterStyle = {
  position: 'absolute', bottom: '0.7rem', left: '50%', transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.72rem', fontWeight: 600,
  padding: '0.2rem 0.65rem', borderRadius: '999px', backdropFilter: 'blur(4px)',
};
