import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Phone, Sprout, Wallet } from 'lucide-react';
import SEO from '../components/SEO';
import QuoteRequestForm from '../components/services/QuoteRequestForm';
import { ServiceQuoteService } from '../services/ServiceQuoteService';
import { SUPPORT_PHONE } from '../utils/serviceQuotes';
import { formatINR } from '../utils/workshops';
import './Services.css';

export default function ServiceOffering() {
  const { groupSlug, offeringSlug } = useParams();
  const { data: offering, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-offering', offeringSlug],
    queryFn: () => ServiceQuoteService.offering(offeringSlug),
    staleTime: 60_000,
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  });

  if (isLoading) {
    return (
      <div className="container sv-page" aria-busy="true">
        <div className="sv-layout">
          <div className="sv-skeleton" style={{ height: 380 }} />
          <div className="sv-skeleton" style={{ height: 620 }} />
        </div>
      </div>
    );
  }

  if (isError) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="container sv-page">
        <div className="sv-banner sv-banner--error" role="alert">
          {notFound ? 'This service is not available right now.' : 'Could not load this service.'}{' '}
          {notFound
            ? <Link to="/services" style={{ color: 'inherit', fontWeight: 700 }}>See all custom orders</Link>
            : <button type="button" onClick={refetch} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', font: 'inherit', minHeight: 44 }}>Try again</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="sv-offer">
      <SEO
        title={`${offering.name} | ${offering.group_name} | Junglyst`}
        description={offering.description || `Get a quote for ${offering.name} from Junglyst growers.`}
        path={`/services/${groupSlug}/${offeringSlug}`}
      />
      <section className="sv-offer-hero" style={offering.image_url ? { '--sv-hero-image': `url("${offering.image_url}")` } : undefined}>
        <div className="container sv-offer-hero-inner">
          <nav className="sv-crumbs sv-crumbs--light" aria-label="Breadcrumb">
            <Link to="/services">Custom orders</Link> /
            <Link to={`/services/${offering.group_slug}`}>{offering.group_name}</Link> /
            <span aria-current="page">{offering.name}</span>
          </nav>
          <span className="svh-eyebrow">Made to order · Free quote</span>
          <h1>{offering.name}</h1>
          {offering.description && <p className="sv-offer-lead">{offering.description}</p>}
          <ul className="sv-offer-trust">
            <li><BadgeCheck size={16} aria-hidden="true" /> Free, no-obligation quote</li>
            <li><Wallet size={16} aria-hidden="true" /> Pay only after you approve</li>
            <li><Sprout size={16} aria-hidden="true" /> Made by verified growers</li>
          </ul>
          {offering.suggested_min_budget && (
            <p className="sv-offer-price"><small>Usually from</small> {formatINR(offering.suggested_min_budget)}</p>
          )}
        </div>
      </section>

      <div className="container sv-offer-body">
        <QuoteRequestForm offering={offering} />
        <aside className="sv-offer-aside" aria-label="How it works">
          <div className="sv-offer-card">
            <h2>How it works</h2>
            <ol className="sv-next">
              <li><strong>Share your idea</strong><span>Answer a few questions. Takes about 2 minutes.</span></li>
              <li><strong>Get your quote</strong><span>A clear price, size and what is included, by email.</span></li>
              <li><strong>Pay &amp; we build it</strong><span>Only if you are happy. Delivered ready to display.</span></li>
            </ol>
          </div>
          <a className="sv-call" href={`tel:${SUPPORT_PHONE.tel}`}>
            <Phone size={22} aria-hidden="true" />
            <div><strong>Call us: {SUPPORT_PHONE.display}</strong><span>Talk through your idea, then we will send a written quote.</span></div>
          </a>
        </aside>
      </div>
    </div>
  );
}
