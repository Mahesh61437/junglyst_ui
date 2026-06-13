import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Award, Sparkles, Gift, Heart, ChevronLeft, Clock, AtSign } from 'lucide-react';
import SEO from '../components/SEO';
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
      <div style={{ position: 'relative', aspectRatio: isHero ? '4 / 3' : '4 / 3', overflow: 'hidden' }}>
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

export default function CompetitionWinners() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWinners()
      .then(setData)
      .catch(() => setError('Could not load winners. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const winners = data?.winners || [];
  const published = data?.published;
  const announcementDate = formatAnnouncementDate(data?.result_announcement_date);

  return (
    <div style={{ backgroundColor: '#060f0d', minHeight: '100vh', color: 'white' }}>
      <SEO
        title="Aquascape Competition Winners | Junglyst"
        description="Meet the winners of the Junglyst Aquascape Competition — the most stunning builds, picked from hundreds of entries."
        path="/competition/winners"
      />

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
    </div>
  );
}
