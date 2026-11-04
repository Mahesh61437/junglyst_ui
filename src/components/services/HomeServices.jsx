import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Leaf, MapPin, MessageSquareText, PackageCheck, ReceiptText, Wallet } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { formatINR } from '../../utils/workshops';
import { deliveryAreaText } from '../../utils/serviceQuotes';
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

function Steps() {
  return (
    <ol className="svh-steps" aria-label="How it works">
      {STEPS.map((step, index) => (
        <li key={step.title}>
          <span className="svh-step-num" aria-hidden="true">{index + 1}</span>
          <span><strong><step.icon size={14} aria-hidden="true" /> {step.title}</strong><small>{step.text}</small></span>
        </li>
      ))}
    </ol>
  );
}

// A group with one service is a single feature banner with one button, so there is only
// one place to click (the old layout showed the same service twice).
function SingleServiceBand({ group, offering }) {
  const area = deliveryAreaText(offering.delivery_state_names);
  return (
    <section className="svh svh--single" aria-labelledby={`home-service-${group.slug}`}>
      <div className="container">
        <div className="svh-feature">
          <div className="svh-feature-media" style={offering.image_url ? { backgroundImage: `url("${offering.image_url}")` } : undefined}>
            {!offering.image_url && <Leaf size={52} strokeWidth={1.1} aria-hidden="true" />}
            <span className="svh-feature-badge"><BadgeCheck size={13} aria-hidden="true" /> Free quote</span>
          </div>
          <div className="svh-feature-body">
            <span className="svh-eyebrow">{group.name} · Made to order</span>
            <h2 id={`home-service-${group.slug}`}>{offering.name}</h2>
            {(offering.description || group.description) && <p className="svh-lead">{offering.description || group.description}</p>}
            <ul className="svh-chips">
              {offering.suggested_min_budget && <li className="svh-chip svh-chip--price">From {formatINR(offering.suggested_min_budget)}</li>}
              {PROMISES.map(promise => (
                <li key={promise.text} className="svh-chip"><promise.icon size={14} aria-hidden="true" /> {promise.text}</li>
              ))}
              {area && <li className="svh-chip"><MapPin size={14} aria-hidden="true" /> Delivers to {area}</li>}
            </ul>
            <Steps />
            <Link to={`/services/${group.slug}/${offering.slug}`} className="svh-btn svh-btn--gold svh-btn--wide">
              Get a free quote <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function GroupBand({ group }) {
  if (group.offerings.length === 1) return <SingleServiceBand group={group} offering={group.offerings[0]} />;
  const offerings = group.offerings.slice(0, HOME_OFFERINGS_PER_GROUP);

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
          <Steps />
          <div className="svh-actions">
            <Link to={`/services/${group.slug}`} className="svh-btn svh-btn--gold">
              See all {group.offerings.length} services <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="svh-cards" role="list" aria-label={`${group.name} services`}>
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
