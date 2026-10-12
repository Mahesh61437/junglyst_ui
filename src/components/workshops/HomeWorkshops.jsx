import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Hand, Gift } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import WorkshopCard from './WorkshopCard';
import { registrationState } from '../../utils/workshops';
import '../../pages/Workshops.css';

// The section is one swipeable row, so showing more workshops never makes it taller.
const HOME_WORKSHOP_LIMIT = 8;
// Fetch a few extra so past/date-less ones can be skipped and still fill the row.
const FETCH_SIZE = 12;
const STATE_RANK = { open: 0, opens_later: 1, sold_out: 2 };

const eyebrowStyle = {
  color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.2em',
};
const viewAllStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold)', fontWeight: 700,
  fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none',
  whiteSpace: 'nowrap', minHeight: 44,
};

// Arrow buttons for the rail (desktop/tablet). Touch users swipe; the next
// card peeking in from the edge shows there's more.
function useRail(itemCount) {
  const railRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({
      atStart: rail.scrollLeft <= 4,
      atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    // Measure now (layout is ready), then on any size change: rotation, window
    // resize. No rAF or observer-only timing, which hidden tabs pause.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    rail.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener('scroll', measure);
    };
  }, [measure, itemCount]);

  const scrollByPage = (direction) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.9, behavior: 'smooth' });
  };
  return { railRef, edges, scrollByPage };
}

// Home-page entry point to workshops: upcoming ones in a swipeable row, or a
// compact banner linking to /workshops when nothing is scheduled yet.
export default function HomeWorkshops() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['workshops', 'home'],
    queryFn: () => WorkshopService.list({ page_size: FETCH_SIZE }),
    staleTime: 5 * 60_000,
  });
  // Bookable first, then ones opening soon, sold-out last (stable within each group).
  const upcoming = (data?.results || [])
    .filter(w => w.upcoming_session_count > 0)
    .map((w, i) => ({ w, i, rank: STATE_RANK[registrationState(w).state] ?? 3 }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(({ w }) => w)
    .slice(0, HOME_WORKSHOP_LIMIT);
  const { railRef, edges, scrollByPage } = useRail(upcoming.length);
  const scrollable = !(edges.atStart && edges.atEnd);

  return (
    <section className="container" style={{ paddingTop: 'clamp(2rem,5vw,3.5rem)', paddingBottom: 'clamp(2rem,5vw,3.5rem)' }} aria-labelledby="home-workshops-title" aria-busy={isLoading}>
      {/* Placeholder keeps the page below from jumping when the section loads. */}
      {isLoading ? (
        <div className="ws-skeleton" style={{ height: 200 }} />
      ) : upcoming.length > 0 && !isError ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1rem,3vw,2rem)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--brand-gold)' }} />
                <span style={eyebrowStyle}>Learn with our growers</span>
              </div>
              <h2 id="home-workshops-title" style={{ fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', margin: 0 }}>Terrarium & Aquarium Workshops</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {scrollable && (
                <div className="ws-rail-arrows">
                  <button type="button" className="ws-rail-arrow" aria-label="Previous workshops" disabled={edges.atStart} onClick={() => scrollByPage(-1)}><ChevronLeft size={18} /></button>
                  <button type="button" className="ws-rail-arrow" aria-label="More workshops" disabled={edges.atEnd} onClick={() => scrollByPage(1)}><ChevronRight size={18} /></button>
                </div>
              )}
              <Link to="/workshops" style={viewAllStyle}>All workshops <ArrowRight size={13} /></Link>
            </div>
          </div>
          <div className="ws-rail" ref={railRef} role="list" aria-label="Upcoming workshops">
            {upcoming.map(w => (
              <div className="ws-rail-item" role="listitem" key={w.id}><WorkshopCard workshop={w} /></div>
            ))}
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
