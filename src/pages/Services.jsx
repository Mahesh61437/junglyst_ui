import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import OfferingCard from '../components/services/OfferingCard';
import { ServiceQuoteService } from '../services/ServiceQuoteService';
import './Services.css';

function GridSkeleton() {
  return (
    <div className="sv-grid" aria-busy="true">
      {[0, 1, 2].map(i => <div key={i} className="sv-skeleton" style={{ height: 320 }} />)}
    </div>
  );
}

function ErrorNotice({ onRetry }) {
  return (
    <div className="sv-banner sv-banner--error" role="alert">
      Could not load services. <button type="button" onClick={onRetry} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', font: 'inherit', minHeight: 44 }}>Try again</button>
    </div>
  );
}

// /services — every active group; /services/:groupSlug — one group's offerings.
export default function Services() {
  const { groupSlug } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['service-groups', groupSlug || 'all'],
    queryFn: () => (groupSlug ? ServiceQuoteService.group(groupSlug).then(group => [group]) : ServiceQuoteService.groups()),
    staleTime: 60_000,
    retry: (count, error) => error?.response?.status !== 404 && count < 2,
  });
  const groups = data || [];
  const single = groupSlug ? groups[0] : null;

  if (groupSlug && !isLoading && !isError && !single) return null;

  return (
    <div className="container sv-page">
      <SEO
        title={`${single ? single.name : 'Custom Orders'} | Junglyst`}
        description={single?.description || 'Custom terrariums and made-to-order projects from Junglyst growers. Tell us what you want and get a quote.'}
        path={groupSlug ? `/services/${groupSlug}` : '/services'}
      />

      <section className="sv-hero">
        <span className="sv-eyebrow"><Sparkles size={12} aria-hidden="true" /> Made to order</span>
        <h1>{single ? single.name : 'Custom orders, designed around you'}</h1>
        <p>{single?.description || 'Tell us what you have in mind. We match you with a grower, send a clear quote, and you pay only when you are happy with it.'}</p>
      </section>

      {isError ? (
        <ErrorNotice onRetry={refetch} />
      ) : isLoading ? (
        <GridSkeleton />
      ) : groups.length === 0 ? (
        <div className="sv-banner sv-banner--ok" role="status">No custom services are open right now. Please check back soon.</div>
      ) : (
        groups.map(group => (
          <section key={group.slug} className="sv-group" aria-labelledby={`sv-group-${group.slug}`}>
            {!single && (
              <div className="sv-group-head">
                <h2 id={`sv-group-${group.slug}`}><Link to={`/services/${group.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{group.name}</Link></h2>
              </div>
            )}
            <div className="sv-grid">
              {group.offerings.map(offering => <OfferingCard key={offering.slug} offering={offering} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
