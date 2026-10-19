import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, CalendarDays, Clock, MapPin, Users, Ticket, Wallet, CalendarPlus, Navigation } from 'lucide-react';
import SEO from '../components/SEO';
import OrganiserContact from '../components/workshops/OrganiserContact';
import { useAuth } from '../context/AuthContext';
import { WorkshopService } from '../services/WorkshopService';
import { EMAIL_PATTERN, partyLabel, formatDate, formatINR, formatTime, googleCalendarUrl } from '../utils/workshops';
import './Workshops.css';

const LAST_BOOKING_KEY = 'junglyst_last_workshop_booking';

// Header per booking status. Only live bookings get the calendar button.
const TICKET_HEADS = {
  confirmed: { active: true, title: "You're booked!", note: 'A confirmation has been sent to', showEmail: true },
  attended: { active: true, title: 'Thanks for joining us!', note: 'Hope you enjoyed the workshop. Booking details were sent to', showEmail: true },
  no_show: { active: false, title: 'We missed you', note: 'This booking was marked as not attended. Contact the organiser below about another session.', showEmail: false },
  pending_payment: { active: true, title: 'Booking received', note: 'We are confirming your payment. Updates go to', showEmail: true },
  cancelled: { active: false, title: 'This booking was cancelled', note: 'Your seat is no longer reserved. Refunds go back to your original payment method. Questions? Contact the organiser below.', showEmail: false },
  payment_failed: { active: false, title: "Payment didn't go through", note: 'No seat was reserved and no money was taken. You can book again from the workshop page.', showEmail: false },
};

function readCachedBooking(orderNumber) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(LAST_BOOKING_KEY) || 'null');
    return cached && (cached.order_number === orderNumber || cached.reference === orderNumber) ? cached : null;
  } catch {
    return null;
  }
}

function GuestLookup({ orderNumber, onFound }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) { setError('Enter the email you booked with.'); return; }
    setLoading(true);
    setError(null);
    try {
      onFound(await WorkshopService.bookingByOrder(orderNumber, email.trim()));
    } catch {
      setError("We couldn't find a booking with that email.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="ws-confirm-card" style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Find your booking</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Booking <strong>{orderNumber}</strong>. Enter the email you used to view your ticket.
      </p>
      <div className="ws-field">
        <label htmlFor="ws-lookup-email">Email</label>
        <input id="ws-lookup-email" className="ws-input" type="email" inputMode="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!error} />
        {error && <div className="ws-field-error" role="alert">{error}</div>}
      </div>
      <button type="submit" className="btn btn-primary ws-pay-btn" disabled={loading}>{loading ? 'Looking up…' : 'View booking'}</button>
    </form>
  );
}

export default function WorkshopBookingConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState(() => location.state?.booking || readCachedBooking(orderNumber));
  const [lookupFailed, setLookupFailed] = useState(false);

  useEffect(() => {
    if (booking || authLoading || !user) return;
    WorkshopService.bookingByOrder(orderNumber).then(setBooking).catch(() => setLookupFailed(true));
  }, [booking, authLoading, user, orderNumber]);

  if (!booking) {
    const needsGuestLookup = !authLoading && (!user || lookupFailed);
    return (
      <div className="container ws-page ws-confirm">
        <SEO title="Your workshop booking | Junglyst" description="Your Junglyst workshop booking." path={location.pathname} />
        {needsGuestLookup
          ? <GuestLookup orderNumber={orderNumber} onFound={setBooking} />
          : <div className="ws-skeleton" style={{ height: 420 }} aria-label="Loading booking" />}
      </div>
    );
  }

  const venue = booking.venue || {};
  const venueLine = [venue.name, venue.city].filter(Boolean).join(', ');
  const reference = booking.reference || booking.order_number;
  const calendarUrl = googleCalendarUrl({
    title: `Junglyst workshop: ${booking.workshop_title}`,
    date: booking.session_date, start: booking.session_start, end: booking.session_end,
    location: [venueLine, venue.address].filter(Boolean).join(' – '),
    details: `Booking ref ${reference}. ${partyLabel(booking)}, ${booking.option_name}.`,
  });
  const head = TICKET_HEADS[booking.status] || TICKET_HEADS.confirmed;
  const active = head.active;

  return (
    <div className="container ws-page ws-confirm">
      <SEO title={`${head.title} | Junglyst Workshops`} description="Your Junglyst workshop booking." path={location.pathname} />
      <div className="ws-confirm-card">
        <div className="ws-confirm-head" style={active ? undefined : { background: 'linear-gradient(135deg, #475569, #64748b)' }}>
          {active ? <CheckCircle2 size={48} color="#a3e4b8" /> : <XCircle size={48} color="#fecaca" />}
          <h1>{head.title}</h1>
          <p style={{ opacity: 0.85 }}>
            {head.note} {head.showEmail && <strong>{booking.attendee_email}</strong>}
          </p>
        </div>

        <div className="ws-ticket">
          <div className="ws-ticket-item" style={{ gridColumn: '1 / -1' }}>
            <Ticket size={18} />
            <div>
              <div className="ws-fact-label">Booking reference</div>
              <div className="ws-ref">{reference}</div>
            </div>
          </div>
          <div className="ws-ticket-item" style={{ gridColumn: '1 / -1' }}>
            <CheckCircle2 size={18} />
            <div>
              <div className="ws-fact-label">Workshop</div>
              <div style={{ fontWeight: 700 }}>{booking.workshop_title}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{booking.option_name}</div>
            </div>
          </div>
          <div className="ws-ticket-item">
            <CalendarDays size={18} />
            <div><div className="ws-fact-label">Date</div><div style={{ fontWeight: 600 }}>{formatDate(booking.session_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
          </div>
          <div className="ws-ticket-item">
            <Clock size={18} />
            <div><div className="ws-fact-label">Time</div><div style={{ fontWeight: 600 }}>{formatTime(booking.session_start)} – {formatTime(booking.session_end)}</div></div>
          </div>
          <div className="ws-ticket-item">
            <Users size={18} />
            <div><div className="ws-fact-label">Your group</div><div style={{ fontWeight: 600 }}>{partyLabel(booking)} · {booking.attendee_name}</div></div>
          </div>
          <div className="ws-ticket-item">
            <Wallet size={18} />
            <div><div className="ws-fact-label">Paid</div><div style={{ fontWeight: 600 }}>{formatINR(booking.total_amount)}</div></div>
          </div>
          {booking.organiser_contact && (
            <div className="ws-ticket-item" style={{ gridColumn: '1 / -1' }}>
              <OrganiserContact contact={booking.organiser_contact} />
            </div>
          )}
          {(venueLine || venue.address) && (
            <div className="ws-ticket-item" style={{ gridColumn: '1 / -1' }}>
              <MapPin size={18} />
              <div>
                <div className="ws-fact-label">Venue</div>
                <div style={{ fontWeight: 600 }}>{venueLine}</div>
                {venue.address && <div style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'pre-line' }}>{venue.address}</div>}
                {venue.map_url && (
                  <a href={venue.map_url} target="_blank" rel="noopener noreferrer" className="ws-map-link"><Navigation size={14} /> Get directions</a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ws-actions">
          {active && <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><CalendarPlus size={16} style={{ marginRight: 6 }} /> Add to calendar</a>}
          {user
            ? <Link to="/orders" className="btn btn-outline">My orders</Link>
            : <Link to="/workshops" className="btn btn-outline">More workshops</Link>}
        </div>
      </div>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '1.25rem' }}>
        Please arrive 10 minutes early. Questions? Write to admin@junglyst.com with your booking reference.
      </p>
    </div>
  );
}
