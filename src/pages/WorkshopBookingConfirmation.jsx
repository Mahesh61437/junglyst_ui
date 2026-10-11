import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Clock, MapPin, Users, Ticket, Wallet, CalendarPlus, Navigation } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { WorkshopService } from '../services/WorkshopService';
import { EMAIL_PATTERN, formatDate, formatINR, formatTime, googleCalendarUrl } from '../utils/workshops';
import './Workshops.css';

const LAST_BOOKING_KEY = 'junglyst_last_workshop_booking';

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
    details: `Booking ref ${reference}. ${booking.participants} seat(s), ${booking.option_name}.`,
  });
  const paid = booking.status !== 'pending_payment' && booking.status !== 'payment_failed';

  return (
    <div className="container ws-page ws-confirm">
      <SEO title="You're booked! | Junglyst Workshops" description="Your Junglyst workshop booking is confirmed." path={location.pathname} />
      <div className="ws-confirm-card">
        <div className="ws-confirm-head">
          <CheckCircle2 size={48} color="#a3e4b8" />
          <h1>{paid ? "You're booked!" : 'Booking received'}</h1>
          <p style={{ opacity: 0.8 }}>
            {paid ? 'A confirmation has been sent to ' : 'We are confirming your payment. Updates go to '}
            <strong>{booking.attendee_email}</strong>
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
            <div><div className="ws-fact-label">Seats</div><div style={{ fontWeight: 600 }}>{booking.participants} · {booking.attendee_name}</div></div>
          </div>
          <div className="ws-ticket-item">
            <Wallet size={18} />
            <div><div className="ws-fact-label">Paid</div><div style={{ fontWeight: 600 }}>{formatINR(booking.total_amount)}</div></div>
          </div>
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
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><CalendarPlus size={16} style={{ marginRight: 6 }} /> Add to calendar</a>
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
