import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Users, Ticket, Navigation } from 'lucide-react';
import BookingStatusPill from './BookingStatusPill';
import { formatDate, formatTime, partyLabel } from '../../utils/workshops';
import '../../pages/Workshops.css';

// Public order tracking for a workshop order. The API sends a public-safe
// summary (no attendee or organiser contact); the full ticket needs the
// booking email or the buyer's account.
export default function WorkshopTrackCard({ orderNumber, booking }) {
  const venue = [booking.venue_name, booking.city].filter(Boolean).join(', ');
  return (
    <section className="ws-confirm-card" style={{ maxWidth: 640, margin: '0 auto' }} aria-label="Workshop booking status">
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div className="ws-fact-label">Workshop booking</div>
          <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', margin: '0.25rem 0' }}>{booking.title}</h2>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{booking.option_name} · Ref {orderNumber}</div>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>
      <div className="ws-ticket">
        <div className="ws-ticket-item"><CalendarDays size={18} /><div><div className="ws-fact-label">Date</div><div style={{ fontWeight: 600 }}>{formatDate(booking.session_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div></div>
        <div className="ws-ticket-item"><Clock size={18} /><div><div className="ws-fact-label">Time</div><div style={{ fontWeight: 600 }}>{formatTime(booking.session_start)} – {formatTime(booking.session_end)}</div></div></div>
        <div className="ws-ticket-item"><Users size={18} /><div><div className="ws-fact-label">Group</div><div style={{ fontWeight: 600 }}>{partyLabel(booking)}</div></div></div>
        {venue && (
          <div className="ws-ticket-item">
            <MapPin size={18} />
            <div>
              <div className="ws-fact-label">Venue</div>
              <div style={{ fontWeight: 600 }}>{venue}</div>
              {booking.map_url && <a href={booking.map_url} target="_blank" rel="noopener noreferrer" className="ws-map-link"><Navigation size={14} /> Get directions</a>}
            </div>
          </div>
        )}
      </div>
      <div className="ws-actions">
        <Link to={`/workshops/booking/${encodeURIComponent(orderNumber)}`} className="btn btn-primary"><Ticket size={16} style={{ marginRight: 6 }} /> View full ticket</Link>
        {booking.slug && <Link to={`/workshops/${booking.slug}`} className="btn btn-outline">Workshop details</Link>}
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', padding: '0 1.5rem 1.5rem' }}>
        The full ticket, including the organiser's contact, opens with the email you booked with.
      </p>
    </section>
  );
}
