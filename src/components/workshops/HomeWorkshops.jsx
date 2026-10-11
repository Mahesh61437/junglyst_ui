import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, Hand, Gift } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import WorkshopCard from './WorkshopCard';
import '../../pages/Workshops.css';

const HOME_WORKSHOP_LIMIT = 3;
// Fetch a few extra so past/date-less ones can be skipped and still fill the row.
const FETCH_SIZE = 6;

const eyebrowStyle = {
  color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.2em',
};
const viewAllStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 700,
  fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none',
  whiteSpace: 'nowrap', minHeight: 44,
};

// Home-page entry point to workshops: upcoming ones as cards, or a compact
// banner linking to /workshops when nothing is scheduled yet.
export default function HomeWorkshops() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['workshops', 'home'],
    queryFn: () => WorkshopService.list({ page_size: FETCH_SIZE }),
    staleTime: 5 * 60_000,
  });
  const upcoming = (data?.results || []).filter(w => w.upcoming_session_count > 0).slice(0, HOME_WORKSHOP_LIMIT);

  return (
    <section className="container" style={{ paddingTop: 'clamp(2rem,5vw,3.5rem)', paddingBottom: 'clamp(2rem,5vw,3.5rem)' }} aria-labelledby="home-workshops-title" aria-busy={isLoading}>
      {/* Placeholder keeps the page below from jumping when the section loads. */}
      {isLoading ? (
        <div className="ws-skeleton" style={{ height: 200 }} />
      ) : upcoming.length > 0 && !isError ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1.5rem,3vw,2.5rem)', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
                <span style={eyebrowStyle}>Learn with our growers</span>
              </div>
              <h2 id="home-workshops-title" style={{ fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', margin: 0 }}>Terrarium & Aquarium Workshops</h2>
            </div>
            <Link to="/workshops" style={viewAllStyle}>All workshops <ArrowRight size={13} /></Link>
          </div>
          <div className="ws-grid">
            {upcoming.map(w => <WorkshopCard key={w.id} workshop={w} />)}
          </div>
        </>
      ) : (
        <Link to="/workshops" className="ws-hero" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', marginBottom: 0 }}>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
            <span className="ws-eyebrow"><Sparkles size={12} /> Junglyst Workshops</span>
            <h2 id="home-workshops-title" style={{ fontSize: 'clamp(1.4rem,3.5vw,2.2rem)', margin: '0.5rem 0' }}>Build a terrarium with your own hands</h2>
            <div className="ws-hero-points" style={{ marginTop: '0.5rem' }}>
              <span><Hand size={15} /> Guided, hands-on sessions</span>
              <span><Gift size={15} /> Take your creation home</span>
            </div>
          </div>
          <span className="btn" style={{ position: 'relative', zIndex: 1, backgroundColor: 'var(--brand-gold)', color: '#0a1f1c', fontWeight: 700, minHeight: 48 }}>
            Explore workshops <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </span>
        </Link>
      )}
    </section>
  );
}
