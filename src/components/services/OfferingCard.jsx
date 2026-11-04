import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Leaf } from 'lucide-react';
import { formatINR } from '../../utils/workshops';
import DeliveryAreaNote from './DeliveryAreaNote';
import '../../pages/Services.css';

export default function OfferingCard({ offering }) {
  return (
    <Link to={`/services/${offering.group_slug}/${offering.slug}`} className="sv-card" aria-label={`Get a quote for ${offering.name}`}>
      <div className="sv-card-media">
        {offering.image_url
          ? <img src={offering.image_url} alt="" loading="lazy" />
          : <div className="sv-card-art" aria-hidden="true"><Leaf size={44} strokeWidth={1.2} /></div>}
        <span className="sv-card-badge"><BadgeCheck size={13} aria-hidden="true" /> Free quote</span>
        {offering.suggested_min_budget && (
          <span className="sv-card-price"><small>From</small> {formatINR(offering.suggested_min_budget)}</span>
        )}
      </div>
      <div className="sv-card-body">
        <h3 className="sv-card-title">{offering.name}</h3>
        {offering.description && <p className="sv-card-text">{offering.description}</p>}
        <DeliveryAreaNote stateNames={offering.delivery_state_names} compact />
        <div className="sv-card-foot">
          <span className="sv-card-assure">No payment until you approve the quote</span>
          <span className="sv-cta">Get a quote <ArrowRight size={15} aria-hidden="true" /></span>
        </div>
      </div>
    </Link>
  );
}
