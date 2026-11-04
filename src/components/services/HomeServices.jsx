import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, MessageSquareText, PackageCheck, ReceiptText, Wallet } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import OfferingCard from './OfferingCard';
import '../../pages/Services.css';

const HOME_OFFERINGS_PER_GROUP = 4;

const PROMISES = [
  { icon: BadgeCheck, text: 'Free, no-obligation quote' },
  { icon: Wallet, text: 'Pay only after you approve' },
  { icon: PackageCheck, text: 'Made by verified growers' },
];

const STEPS = [
  { icon: MessageSquareText, title: 'Share your idea', text: 'Size, style, budget' },
  { icon: ReceiptText, title: 'Get your quote', text: 'Clear price, what is included' },
  { icon: PackageCheck, title: 'We build & deliver', text: 'Ready to display' },
];

function GroupBand({ group }) {
  const offerings = group.offerings.slice(0, HOME_OFFERINGS_PER_GROUP);
  const first = group.offerings[0];
  const quoteLink = group.offerings.length === 1 && first ? `/services/${group.slug}/${first.slug}` : `/services/${group.slug}`;

  return (
    <section className="svh" aria-labelledby={`home-service-${group.slug}`}>
      <div className="container svh-inner">
        <div className="svh-intro">
          <span className="svh-eyebrow">Made to order · Custom design</span>
          <h2 id={`home-service-${group.slug}`}>{group.name}</h2>
          {group.description && <p className="svh-lead">{group.description}</p>}
          <ul className="svh-promises">
            {PROMISES.map(promise => (
              <li key={promise.text}><promise.icon size={17} aria-hidden="true" /> {promise.text}</li>
            ))}
          </ul>
          <ol className="svh-steps" aria-label="How it works">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="svh-step-num" aria-hidden="true">{index + 1}</span>
                <span><strong><step.icon size={14} aria-hidden="true" /> {step.title}</strong><small>{step.text}</small></span>
              </li>
            ))}
          </ol>
          <div className="svh-actions">
            <Link to={quoteLink} className="svh-btn svh-btn--gold">Get a free quote <ArrowRight size={16} aria-hidden="true" /></Link>
            {group.offerings.length > 1 && (
              <Link to={`/services/${group.slug}`} className="svh-btn svh-btn--ghost">See all {group.offerings.length}</Link>
            )}
          </div>
        </div>
        <div className={`svh-cards${offerings.length === 1 ? ' svh-cards--single' : ''}`} role="list" aria-label={`${group.name} services`}>
          {offerings.map(offering => (
            <div role="listitem" key={offering.slug} className="svh-card-slot"><OfferingCard offering={offering} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}

// One band per service group the admin switched on for the home page. Each group
// stays separate, so a new group (maintenance, design, ...) appears as its own band.
export default function HomeServices() {
  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ['service-groups', 'home'],
    queryFn: () => ServiceQuoteService.groups({ home: 1 }),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <section className="container" style={{ padding: '2rem 1rem' }} aria-busy="true">
        <div className="sv-skeleton" style={{ height: 360 }} />
      </section>
    );
  }
  if (isError || !groups?.length) return null;
  return groups.map(group => <GroupBand key={group.slug} group={group} />);
}
