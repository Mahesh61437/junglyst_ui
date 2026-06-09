import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trophy, ChevronLeft, ChevronRight, X, Sparkles, ArrowRight, Camera, LogIn, AtSign } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCompetitionStatus, fetchEntries, toggleVote, formatAnnouncementDate } from '../services/CompetitionService';

const SORT_OPTIONS = [
  { value: 'top', label: 'Most Voted' },
  { value: 'new', label: 'Newest' },
  { value: 'old', label: 'Oldest' },
];

const PHASE_BANNER = {
  submission: {
    title: 'Submissions Open',
    body: 'Voting begins once submissions close. Browse the entries pouring in now.',
    accent: '#22c55e',
  },
  voting: {
    title: 'Voting is Live',
    body: 'Tap the heart to back your favourites. Sign in to vote — one vote per entry.',
    accent: '#c9972b',
  },
  results: {
    title: 'Winners Announced',
    body: 'See who took home the prizes on the Winners page.',
    accent: '#a855f7',
  },
};

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ entry, imageIndex, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (!entry) return null;
  const images = entry.image_urls || [];
  const url = images[imageIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px', cursor: 'pointer', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><X size={20} /></button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '44px', height: '44px', cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><ChevronLeft size={22} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '44px', height: '44px', cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><ChevronRight size={22} /></button>
        </>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <img
          src={url}
          alt={entry.name}
          style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        />
        <div style={{ textAlign: 'center', maxWidth: '720px' }}>
          <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontFamily: 'var(--font-serif)' }}>{entry.name}</h3>
          {entry.instagram_handle && (
            <a
              href={`https://instagram.com/${entry.instagram_handle}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: '#c9972b', fontSize: '0.85rem', textDecoration: 'none' }}
            >@{entry.instagram_handle}</a>
          )}
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.7, marginTop: '0.75rem' }}>
            {entry.about_aquarium}
          </p>
          {images.length > 1 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              Photo {imageIndex + 1} of {images.length}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function EntryCard({ entry, onOpen, onVote, votingDisabled, votingDisabledReason }) {
  const images = entry.image_urls || [];
  const imageCount = images.length;
  // In-card active image so the whole entry's photo set is browsable in place,
  // making it obvious all photos belong to ONE entry (which gets ONE vote).
  const [activeImg, setActiveImg] = useState(0);
  const safeActive = Math.min(activeImg, Math.max(0, imageCount - 1));
  const mainImg = images[safeActive];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main image — clicking opens the lightbox at the active photo */}
      <button
        onClick={() => onOpen(entry, safeActive)}
        style={{
          padding: 0, border: 'none', background: 'none', cursor: 'pointer',
          aspectRatio: '4 / 3', overflow: 'hidden', position: 'relative',
        }}
      >
        {mainImg ? (
          <img
            src={mainImg}
            alt={`${entry.name} — photo ${safeActive + 1} of ${imageCount}`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
            <Camera size={28} color="rgba(255,255,255,0.2)" />
          </div>
        )}
        {/* Photo-count chip — signals this is a multi-photo entry */}
        {imageCount > 1 && (
          <span style={{
            position: 'absolute', top: '0.6rem', right: '0.6rem',
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: '0.68rem', fontWeight: 700,
            padding: '0.2rem 0.55rem', borderRadius: '999px',
            backdropFilter: 'blur(6px)',
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          }}>
            <Camera size={11} /> {safeActive + 1}/{imageCount}
          </span>
        )}
        {entry.prize_tier && (
          <span style={{
            position: 'absolute', top: '0.6rem', left: '0.6rem',
            background: 'rgba(201,151,43,0.95)', color: '#0a1f1c',
            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '0.25rem 0.6rem', borderRadius: '999px',
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <Trophy size={11} /> {entry.prize_tier_label}
          </span>
        )}
      </button>

      {/* Thumbnail strip — all photos for THIS entry, grouped together */}
      {imageCount > 1 && (
        <div style={{
          display: 'flex', gap: '0.4rem', padding: '0.55rem 0.6rem 0',
          overflowX: 'auto', scrollbarWidth: 'thin',
        }}>
          {images.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActiveImg(i)}
              onMouseEnter={() => setActiveImg(i)}
              aria-label={`View photo ${i + 1}`}
              style={{
                flex: '0 0 auto', width: '46px', height: '46px',
                padding: 0, borderRadius: '8px', cursor: 'pointer',
                overflow: 'hidden',
                border: `2px solid ${i === safeActive ? '#c9972b' : 'rgba(255,255,255,0.12)'}`,
                opacity: i === safeActive ? 1 : 0.6,
                transition: 'opacity 0.15s, border-color 0.15s',
                background: 'none',
              }}
            >
              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '0.85rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
        {/* Entrant identity — name + Instagram only; email/phone never sent by API */}
        <div>
          <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{entry.name}</h4>
          {entry.instagram_handle && (
            <a
              href={`https://instagram.com/${entry.instagram_handle}`}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: 'rgba(201,151,43,0.85)', fontSize: '0.72rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              }}
            >
              <AtSign size={11} /> {entry.instagram_handle}
            </a>
          )}
        </div>

        {/* "N photos in this entry" — reinforces grouping */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600,
        }}>
          <Camera size={11} /> {imageCount} {imageCount === 1 ? 'photo' : 'photos'} in this entry
        </span>

        <p style={{
          margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {entry.about_aquarium}
        </p>

        <div style={{ marginTop: 'auto', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          {/* ONE vote per entry (not per photo) */}
          <button
            onClick={() => onVote(entry)}
            disabled={votingDisabled}
            title={votingDisabled ? votingDisabledReason : (entry.has_voted ? 'Remove your vote from this entry' : 'Vote for this entry')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: entry.has_voted ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${entry.has_voted ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: entry.has_voted ? '#fca5a5' : 'rgba(255,255,255,0.75)',
              padding: '0.4rem 0.85rem', borderRadius: '999px',
              fontSize: '0.8rem', fontWeight: 700,
              cursor: votingDisabled ? 'not-allowed' : 'pointer',
              opacity: votingDisabled ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            <Heart size={14} fill={entry.has_voted ? '#fca5a5' : 'none'} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.vote_count}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>
              {entry.vote_count === 1 ? 'vote' : 'votes'}
            </span>
          </button>
          <button
            onClick={() => onOpen(entry, safeActive)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem', cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
            }}
          >View all <ArrowRight size={12} /></button>
        </div>
      </div>
    </motion.article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CompetitionEntries() {
  const status = useCompetitionStatus();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [sort, setSort] = useState('top');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEntry, setOpenEntry] = useState(null);
  const [openImageIdx, setOpenImageIdx] = useState(0);
  const [voteToast, setVoteToast] = useState('');

  const phase = status?.phase || 'submission';
  const banner = PHASE_BANNER[phase] || PHASE_BANNER.submission;
  const announcementDate = formatAnnouncementDate(status?.result_announcement_date);

  const votingDisabled = phase !== 'voting';
  const votingDisabledReason =
    phase === 'submission' ? 'Voting opens after submissions close.'
    : phase === 'results' ? 'Voting has ended — winners are live.'
    : '';

  const load = async (sortKey) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEntries({ sort: sortKey, limit: 500 });
      setEntries(data.results || []);
    } catch (e) {
      setError('Could not load entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(sort); }, [sort]);

  const handleVote = async (entry) => {
    if (votingDisabled) {
      setVoteToast(votingDisabledReason);
      setTimeout(() => setVoteToast(''), 2500);
      return;
    }
    if (!isAuthenticated) {
      navigate('/login?next=/competition/entries');
      return;
    }
    // Optimistic update
    setEntries((prev) => prev.map((e) => e.id === entry.id ? {
      ...e,
      has_voted: !e.has_voted,
      vote_count: Math.max(0, e.vote_count + (e.has_voted ? -1 : 1)),
    } : e));
    try {
      const res = await toggleVote(entry.id);
      setEntries((prev) => prev.map((e) => e.id === entry.id ? {
        ...e, has_voted: res.voted, vote_count: res.vote_count,
      } : e));
    } catch (err) {
      // Rollback
      setEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e));
      const msg = err?.response?.data?.error || 'Could not record your vote. Try again.';
      setVoteToast(msg);
      setTimeout(() => setVoteToast(''), 2500);
    }
  };

  const openLightbox = (entry, idx) => { setOpenEntry(entry); setOpenImageIdx(idx); };
  const closeLightbox = () => setOpenEntry(null);
  const lightboxPrev = () => {
    if (!openEntry) return;
    const total = openEntry.image_urls?.length || 1;
    setOpenImageIdx((i) => (i - 1 + total) % total);
  };
  const lightboxNext = () => {
    if (!openEntry) return;
    const total = openEntry.image_urls?.length || 1;
    setOpenImageIdx((i) => (i + 1) % total);
  };

  const totalVotes = useMemo(() => entries.reduce((s, e) => s + (e.vote_count || 0), 0), [entries]);

  return (
    <div style={{ backgroundColor: '#060f0d', minHeight: '100vh', color: 'white' }}>
      <SEO
        title="Aquascape Gallery — Vote for Your Favourite | Junglyst"
        description={`Browse every entry in the Junglyst Aquascape Competition. ${phase === 'voting' ? 'Vote for your favourite — voting is live.' : phase === 'results' ? 'Winners have been announced.' : 'Submissions are open.'}`}
        path="/competition/entries"
      />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #060f0d 0%, #071823 50%, #060f0d 100%)',
        padding: 'clamp(3rem,7vw,5.5rem) 1.5rem clamp(2rem,5vw,3.5rem)',
        textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: `${banner.accent}1f`, border: `1px solid ${banner.accent}55`,
            borderRadius: '999px', padding: '0.35rem 0.95rem', marginBottom: '1.25rem',
          }}>
            <Sparkles size={13} color={banner.accent} />
            <span style={{ fontSize: '0.68rem', color: banner.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {banner.title}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem,5vw,3.5rem)', fontFamily: 'var(--font-serif)', fontWeight: 800, lineHeight: 1.1,
            margin: '0 0 1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #c9972b 60%, #e8b84b 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Aquascape Gallery
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7, fontSize: 'clamp(0.9rem,2vw,1.05rem)' }}>
            {banner.body}
            {announcementDate && phase !== 'results' && (
              <> Winners announced on <strong style={{ color: '#c9972b' }}>{announcementDate}</strong>.</>
            )}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            <Stat label="Entries" value={entries.length} />
            <Stat label="Total Votes" value={totalVotes} />
            <Stat label="Phase" value={banner.title} />
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/competition" className="btn btn-secondary" style={btnSecondary}>
              <ChevronLeft size={14} /> Back to Competition
            </Link>
            {phase === 'results' && (
              <Link to="/competition/winners" className="btn btn-primary" style={btnPrimary}>
                <Trophy size={14} /> See the Winners
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Login nudge */}
      {!isAuthenticated && phase === 'voting' && (
        <div style={{
          background: 'rgba(201,151,43,0.08)', borderBottom: '1px solid rgba(201,151,43,0.2)',
          padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)',
        }}>
          <LogIn size={15} color="#c9972b" />
          Sign in to vote for your favourites.
          <Link to="/login?next=/competition/entries" style={{ color: '#c9972b', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
        </div>
      )}

      {/* Sort bar */}
      <section style={{ padding: '1.5rem 1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}`}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                style={{
                  padding: '0.45rem 0.95rem', borderRadius: '999px',
                  border: `1px solid ${sort === opt.value ? '#c9972b' : 'rgba(255,255,255,0.1)'}`,
                  background: sort === opt.value ? 'rgba(201,151,43,0.18)' : 'transparent',
                  color: sort === opt.value ? '#c9972b' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                  letterSpacing: '0.03em', transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '1.5rem 1.5rem 5rem' }}>
        <div className="container">
          {error && (
            <div style={{ color: '#fca5a5', textAlign: 'center', padding: '2rem' }}>{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(255,255,255,0.5)' }}>
              <Camera size={36} color="rgba(201,151,43,0.4)" style={{ marginBottom: '0.85rem' }} />
              <p>No entries yet. Be the first to submit yours!</p>
              <Link to="/competition" style={{ color: '#c9972b', fontWeight: 700, textDecoration: 'none' }}>
                Enter the competition →
              </Link>
            </div>
          )}
          <motion.div
            layout
            style={{
              display: 'grid', gap: '1.25rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            }}
          >
            <AnimatePresence>
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onOpen={openLightbox}
                  onVote={handleVote}
                  votingDisabled={votingDisabled}
                  votingDisabledReason={votingDisabledReason}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
              Loading entries…
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {openEntry && (
          <Lightbox
            entry={openEntry}
            imageIndex={openImageIdx}
            onClose={closeLightbox}
            onPrev={lightboxPrev}
            onNext={lightboxNext}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voteToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(220,38,38,0.92)', color: 'white',
              padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
              zIndex: 1100, boxShadow: '0 12px 25px rgba(0,0,0,0.3)',
            }}
          >{voteToast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c9972b', fontFamily: 'var(--font-serif)' }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
    </div>
  );
}

const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
  padding: '0.7rem 1.4rem', fontSize: '0.82rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'white', borderRadius: '10px', textDecoration: 'none',
};

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
  padding: '0.7rem 1.5rem', fontSize: '0.82rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none',
};
