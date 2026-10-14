import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Users, Leaf, Hand, Gift } from 'lucide-react';
import SEO from '../components/SEO';
import Pagination from '../components/Pagination';
import WorkshopCard from '../components/workshops/WorkshopCard';
import { WorkshopService } from '../services/WorkshopService';
import { WORKSHOP_CATEGORIES, labelFor } from '../utils/workshops';
import './Workshops.css';

const PAGE_SIZE = 20; // backend default page size

function CardSkeleton() {
  return <div className="ws-skeleton" style={{ height: 380 }} aria-hidden="true" />;
}

export default function Workshops() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['workshops', category, page],
    queryFn: () => WorkshopService.list({ ...(category ? { category } : {}), page }),
    staleTime: 60_000,
  });
  const workshops = data?.results || [];
  const total = data?.count || 0;

  const pickCategory = (id) => { setCategory(id); setPage(1); };

  return (
    <div className="container ws-page">
      <SEO
        title="Terrarium & Aquarium Workshops | Junglyst"
        description="Hands-on terrarium, aquarium and aquascaping workshops hosted by Junglyst's verified growers. Pick a date, reserve your seat and take your creation home."
        path="/workshops"
      />

      <section className="ws-hero">
        <span className="ws-eyebrow"><Sparkles size={12} /> Junglyst Workshops</span>
        <h1>Build a living world with your own hands</h1>
        <p>Guided terrarium and aquarium sessions hosted by our verified growers. All materials provided. You leave with your own creation.</p>
        <div className="ws-hero-points">
          <span><Hand size={15} /> Hands-on, small batches</span>
          <span><Gift size={15} /> Take your art home</span>
          <span><Users size={15} /> Book for friends & family</span>
        </div>
      </section>

      <div className="ws-chips" role="group" aria-label="Filter workshops by type">
        <button type="button" className="ws-chip" aria-pressed={category === ''} onClick={() => pickCategory('')}>All workshops</button>
        {WORKSHOP_CATEGORIES.filter(c => c.id !== 'other').map(c => (
          <button key={c.id} type="button" className="ws-chip" aria-pressed={category === c.id} onClick={() => pickCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="ws-empty">
          <h3>We couldn't load workshops</h3>
          <p>Please check your connection and try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => refetch()}>Retry</button>
        </div>
      ) : isLoading ? (
        <div className="ws-grid">{[0, 1, 2].map(i => <CardSkeleton key={i} />)}</div>
      ) : workshops.length === 0 ? (
        <div className="ws-empty">
          <Leaf size={48} strokeWidth={1.2} color="#9fb5ad" />
          <h3>{category ? `No ${labelFor(WORKSHOP_CATEGORIES, category).toLowerCase()} workshops yet` : 'New workshops are on the way'}</h3>
          <p>We're lining up fresh dates with our growers. Meanwhile, explore the collection.</p>
          {category
            ? <button type="button" className="btn btn-outline" onClick={() => pickCategory('')}>See all workshops</button>
            : <Link to="/shop" className="btn btn-primary">Explore the shop</Link>}
        </div>
      ) : (
        <>
          <div className="ws-grid">
            {workshops.map(w => <WorkshopCard key={w.id} workshop={w} />)}
          </div>
          {total > PAGE_SIZE && (
            <div style={{ marginTop: '2rem' }}>
              <Pagination
                page={page}
                totalPages={Math.ceil(total / PAGE_SIZE)}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
