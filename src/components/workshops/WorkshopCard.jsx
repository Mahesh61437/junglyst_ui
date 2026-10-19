import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Clock, Sparkles, Leaf, Users } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import FramedImage from './FramedImage';
import {
  WORKSHOP_CATEGORIES, formatDate, formatDuration, formatINR, hostNames, labelFor, registrationState, seatsLabel,
} from '../../utils/workshops';
import '../../pages/Workshops.css';

export default function WorkshopCard({ workshop }) {
  const seats = seatsLabel(workshop.seats_left);
  const hasUpcoming = workshop.upcoming_session_count > 0;
  const registration = registrationState(workshop);
  return (
    <Link to={`/workshops/${workshop.slug}`} className="ws-card">
      <div className="ws-card-media">
        {workshop.cover_image
          ? <FramedImage src={getImageUrl(workshop.cover_image)} alt={workshop.title} loading="lazy" />
          : <div className="ws-card-placeholder ws-fill"><Leaf size={48} strokeWidth={1.2} /></div>}
        <div className="ws-card-badges">
          <span className="ws-badge">{labelFor(WORKSHOP_CATEGORIES, workshop.category)}</span>
          {registration.badge ? (
            <span className={`ws-badge ws-badge--${registration.state === 'opens_later' ? 'upcoming' : 'soldout'}`}>{registration.badge}</span>
          ) : hasUpcoming && seats.tone !== 'ok' ? (
            <span className={`ws-badge ws-badge--${seats.tone}`}>{seats.text}</span>
          ) : hasUpcoming && workshop.is_featured ? (
            <span className="ws-badge ws-badge--gold"><Sparkles size={10} /> Featured</span>
          ) : null}
        </div>
      </div>
      <div className="ws-card-body">
        <h3 className="ws-card-title">{workshop.title}</h3>
        {workshop.tagline && <p className="ws-card-tagline">{workshop.tagline}</p>}
        <div className="ws-meta">
          <span><CalendarDays size={13} />
            {hasUpcoming
              ? `${formatDate(workshop.next_session_date, { day: 'numeric', month: 'short' })}${workshop.upcoming_session_count > 1 ? ` +${workshop.upcoming_session_count - 1} more` : ''}`
              : 'Dates coming soon'}
          </span>
          {workshop.city && <span><MapPin size={13} />{workshop.city}</span>}
          {workshop.duration_minutes > 0 && <span><Clock size={13} />{formatDuration(workshop.duration_minutes)}</span>}
          {workshop.has_group_option && <span className="ws-group-tag" style={{ marginLeft: 0 }}><Users size={11} /> Group booking</span>}
        </div>
        <div className="ws-card-foot">
          <div>
            <div className="ws-price-label">From</div>
            <div className="ws-price">{workshop.price_from ? formatINR(workshop.price_from) : '—'}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}> /{workshop.price_from_pricing === 'per_build' ? 'terrarium' : 'person'}</span></div>
          </div>
          <div className="ws-organiser">with<br /><strong style={{ color: 'var(--text-primary)' }}>{hostNames(workshop)}</strong></div>
        </div>
      </div>
    </Link>
  );
}
