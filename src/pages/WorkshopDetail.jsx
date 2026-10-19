import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, CheckCircle2, Minus, Plus, ShieldCheck,
  Navigation, Store, GraduationCap, Baby, Leaf, AlertCircle, Backpack,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { WorkshopService } from '../services/WorkshopService';
import { launchGatewayPayment } from '../utils/paymentGateway';
import { trackEvent } from '../utils/analytics';
import { getImageUrl } from '../utils/imageUtils';
import FramedImage from '../components/workshops/FramedImage';
import {
  SKILL_LEVELS, WORKSHOP_CATEGORIES, bookingTotal, hostNames, formatDate, formatDuration, formatINR, formatTime,
  chargedUnits, isSharedOption, labelFor, msUntil, normaliseParty, optionUnitLabel,
  registrationState, seatsLabel, sharedNote, validateAttendee,
} from '../utils/workshops';
import './Workshops.css';

const LAST_BOOKING_KEY = 'junglyst_last_workshop_booking';

function Gallery({ images, title }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    // The frame keeps its 16:10 shape; the placeholder only fills it.
    return (
      <div className="ws-gallery-main" role="img" aria-label={`${title}: photos coming soon`}>
        <div className="ws-card-placeholder ws-fill"><Leaf size={64} strokeWidth={1} /></div>
      </div>
    );
  }
  return (
    <div>
      <div className="ws-gallery-main">
        <FramedImage src={getImageUrl(images[active])} alt={`${title}, photo ${active + 1} of ${images.length}`} />
      </div>
      {images.length > 1 && (
        <div className="ws-thumbs" role="list">
          {images.map((src, i) => (
            <button key={src} type="button" className="ws-thumb" aria-current={i === active} aria-label={`Show photo ${i + 1}`} onClick={() => setActive(i)}>
              <img src={getImageUrl(src)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Fact({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="ws-fact">
      <span style={{ color: 'var(--brand-green)' }}>{icon}</span>
      <div>
        <div className="ws-fact-label">{label}</div>
        <div className="ws-fact-value">{value}</div>
      </div>
    </div>
  );
}

function BookingPanel({ workshop, onBooked }) {
  const { user } = useAuth();
  const sessions = workshop.sessions || [];
  const options = workshop.options || [];
  const firstOpenSession = sessions.find(s => s.seats_left > 0);
  const [sessionId, setSessionId] = useState(firstOpenSession?.id ?? null);
  const [optionId, setOptionId] = useState(options[0]?.id ?? null);
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [requestedBuilds, setRequestedBuilds] = useState(1);
  // Prefilled from the account; the panel is keyed on the user so it re-seeds after login.
  const [form, setForm] = useState(() => ({
    attendee_name: user?.full_name || '',
    attendee_phone: user?.phone || '',
    attendee_email: user?.email || '',
    notes: '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const registration = registrationState(workshop);
  const session = sessions.find(s => s.id === sessionId);
  const option = options.find(o => o.id === optionId);
  const maxSeats = Math.max(1, Math.min(workshop.max_seats_per_booking || 1, session?.seats_left || 1));
  // Derived, not stored: switching session/option re-clamps the party instead
  // of resetting it (fewer seats left, smaller shared terrarium, ...).
  const shared = isSharedOption(option);
  const party = normaliseParty(option, requestedSeats, requestedBuilds, maxSeats);
  const participants = party.people;
  const units = chargedUnits(option, party);
  const total = option ? bookingTotal(option.price, units) : 0;

  const setField = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!session || !option) {
      setError('Please choose a date and a workshop option.');
      return;
    }
    const errors = validateAttendee(form);
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(`ws-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    trackEvent('workshop_booking_initiated', { workshop: workshop.slug, value: total, participants });
    let response = null;
    const finishBooked = () => {
      const booking = { ...response.booking, status: 'confirmed', order_number: response.order.order_number };
      try { sessionStorage.setItem(LAST_BOOKING_KEY, JSON.stringify(booking)); } catch { /* storage unavailable */ }
      trackEvent('workshop_booking_completed', { workshop: workshop.slug, value: total });
      onBooked(booking);
    };
    // Payment didn't complete: free the held seats now. The server checks the
    // gateway first, so a payment that actually went through is confirmed instead.
    const releaseHold = async () => {
      if (!response) return false;
      try {
        const { status } = await WorkshopService.releaseHold(response.order.order_number, form.attendee_email.trim());
        return status === 'confirmed';
      } catch {
        return false; // the hold still expires on its own
      }
    };
    try {
      response = await WorkshopService.book(workshop.slug, {
        session_id: session.id,
        option_id: option.id,
        participants,
        ...(shared ? { builds: party.builds } : {}),
        attendee_name: form.attendee_name.trim(),
        attendee_phone: form.attendee_phone.trim(),
        attendee_email: form.attendee_email.trim(),
        notes: form.notes.trim(),
      });
      const result = await launchGatewayPayment(response, {
        description: `Workshop: ${workshop.title}`,
        prefill: { name: form.attendee_name, email: form.attendee_email, contact: form.attendee_phone },
        onVerifying: () => setVerifying(true),
      });
      setVerifying(false);
      if (result.status === 'success' || await releaseHold()) {
        finishBooked();
        return;
      }
      trackEvent('workshop_booking_failed', { workshop: workshop.slug, reason: result.status });
      setError(result.message);
    } catch (err) {
      setVerifying(false);
      if (await releaseHold()) {
        finishBooked();
        return;
      }
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) setFieldErrors(err.fieldErrors);
      setError(err.response?.data?.error || err.userMessage || err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!registration.open) {
    const notes = {
      opens_later: 'Bookings open automatically at this time. Keep this page open, or come back then.',
      sold_out: 'Every upcoming session is fully booked. Seats freed by cancellations re-open bookings automatically.',
      no_dates: 'New sessions for this workshop will be announced shortly.',
      closed: 'Follow us for new dates, or browse other upcoming workshops.',
    };
    return (
      <aside className="ws-book" id="book">
        <h2>{registration.label}</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>{notes[registration.state] || notes.closed}</p>
        {registration.state === 'opens_later' && sessions.length > 0 && (
          <ul style={{ margin: '1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
            {sessions.map(sess => (
              <li key={sess.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CalendarDays size={14} color="var(--brand-green)" />
                {formatDate(sess.date)} · {formatTime(sess.start_time)} – {formatTime(sess.end_time)}
              </li>
            ))}
          </ul>
        )}
        <Link to="/workshops" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>See other workshops</Link>
      </aside>
    );
  }

  if (!sessions.length || !options.length) {
    return (
      <aside className="ws-book" id="book">
        <h2>Dates coming soon</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>New sessions for this workshop will be announced shortly.</p>
      </aside>
    );
  }

  return (
    <aside className="ws-book" id="book">
      {verifying && (
        <div className="ws-overlay" role="alertdialog" aria-live="assertive" aria-label="Verifying payment">
          <div className="ws-spinner" />
          <p style={{ fontWeight: 800, fontSize: '1.15rem' }}>Confirming your seat…</p>
          <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Please don't close this page.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <h2>Reserve your seat</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{registration.label}</p>

        <span className="ws-step-label" id="ws-date-label">1 · Choose a date</span>
        <div className="ws-choice-list" role="radiogroup" aria-labelledby="ws-date-label">
          {sessions.map(s => {
            const seats = seatsLabel(s.seats_left);
            return (
              <button
                key={s.id} type="button" role="radio" className="ws-choice"
                aria-checked={s.id === sessionId} disabled={s.seats_left <= 0}
                onClick={() => setSessionId(s.id)}
              >
                <span>
                  <span className="ws-choice-title">{formatDate(s.date)}</span><br />
                  <span className="ws-choice-sub">{formatTime(s.start_time)} – {formatTime(s.end_time)}{s.note ? ` · ${s.note}` : ''}</span>
                </span>
                <span className={`ws-choice-side ws-tone-${seats.tone}`}>{seats.text}</span>
              </button>
            );
          })}
        </div>

        <span className="ws-step-label" id="ws-option-label">2 · Pick your build</span>
        <div className="ws-choice-list" role="radiogroup" aria-labelledby="ws-option-label">
          {options.map(o => (
            <button key={o.id} type="button" role="radio" className="ws-choice" aria-checked={o.id === optionId} onClick={() => setOptionId(o.id)}>
              <span>
                <span className="ws-choice-title">{o.name}</span>
                {isSharedOption(o) && <span className="ws-group-tag"><Users size={11} /> Group</span>}<br />
                <span className="ws-choice-sub">{sharedNote(o) || [o.shape, o.size].filter(Boolean).join(' · ') || o.description}</span>
              </span>
              <span className="ws-choice-side" style={{ fontSize: '0.95rem', color: 'var(--bg-deep)' }}>
                {formatINR(o.price)}<br />
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>{optionUnitLabel(o)}</span>
              </span>
            </button>
          ))}
        </div>

        <span className="ws-step-label">{shared ? '3 · How many group slots?' : '3 · How many slots?'}</span>
        {shared ? (
          <div className="ws-party-row">
            <span className="ws-party-label">No. of group slots<small>Up to {option.max_people_per_build} people each · max {maxSeats}</small></span>
            <div className="ws-stepper">
              <button type="button" aria-label="Fewer group slots" disabled={party.builds <= 1} onClick={() => setRequestedBuilds(party.builds - 1)}><Minus size={16} /></button>
              <output aria-live="polite">{party.builds}</output>
              <button type="button" aria-label="More group slots" disabled={party.builds >= party.maxBuilds} onClick={() => setRequestedBuilds(party.builds + 1)}><Plus size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="ws-party-row">
            <span className="ws-party-label">No. of slots<small>Max {maxSeats} per booking</small></span>
            <div className="ws-stepper">
              <button type="button" aria-label="Fewer slots" disabled={participants <= party.minPeople} onClick={() => setRequestedSeats(participants - 1)}><Minus size={16} /></button>
              <output aria-live="polite">{participants}</output>
              <button type="button" aria-label="More slots" disabled={participants >= party.maxPeople} onClick={() => setRequestedSeats(participants + 1)}><Plus size={16} /></button>
            </div>
          </div>
        )}

        <span className="ws-step-label">4 · Your details</span>
        {[
          { field: 'attendee_name', label: 'Full name', type: 'text', autoComplete: 'name' },
          { field: 'attendee_phone', label: 'Mobile number', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
          { field: 'attendee_email', label: 'Email (for your ticket)', type: 'email', autoComplete: 'email', inputMode: 'email' },
        ].map(({ field, label, ...inputProps }) => (
          <div className="ws-field" key={field}>
            <label htmlFor={`ws-${field}`}>{label}</label>
            <input
              id={`ws-${field}`} className="ws-input" value={form[field]} onChange={setField(field)}
              aria-invalid={!!fieldErrors[field]} aria-describedby={fieldErrors[field] ? `ws-${field}-error` : undefined}
              required {...inputProps}
            />
            {fieldErrors[field] && <div className="ws-field-error" id={`ws-${field}-error`}>{fieldErrors[field]}</div>}
          </div>
        ))}
        <div className="ws-field">
          <label htmlFor="ws-notes">Anything we should know? (optional)</label>
          <textarea id="ws-notes" className="ws-input" rows={2} maxLength={500} value={form.notes} onChange={setField('notes')} placeholder="e.g. booking for a birthday group" />
        </div>

        <div className="ws-summary" aria-live="polite">
          {option && (
            <div className="ws-summary-row">
              <span>
                {option.name} × {units} {shared ? `group slot${units === 1 ? '' : 's'}` : `slot${units === 1 ? '' : 's'}`}
                {shared && <><br /><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Up to {participants} people</span></>}
              </span>
              <span>{formatINR(total)}</span>
            </div>
          )}
          <div className="ws-summary-row ws-summary-total">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Inclusive of all taxes. All materials provided.</span>
        </div>

        {error && <div className="ws-alert ws-alert--error" role="alert" style={{ marginTop: '1rem' }}><AlertCircle size={16} />{error}</div>}

        <button type="submit" className="btn btn-primary ws-pay-btn" disabled={submitting || !session || !option}>
          {submitting ? 'Opening secure payment…' : `Pay ${formatINR(total)} & book`}
        </button>
        <div className="ws-secure"><ShieldCheck size={13} /> Secure payment · Instant confirmation by email</div>
      </form>
    </aside>
  );
}

export default function WorkshopDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookRef = useRef(null);
  // The mobile "Book a seat" bar is redundant once the booking panel is on screen.
  const [panelInView, setPanelInView] = useState(false);
  const { data: workshop, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workshop', slug],
    queryFn: () => WorkshopService.get(slug),
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  });

  // Registrations open / close on a schedule: re-fetch the moment they flip so
  // a buyer waiting on the page sees the booking form appear (or close) without
  // reloading. Seat changes are picked up on focus by react-query.
  const nextChangeAt = registrationState(workshop).nextChangeAt?.getTime();
  useEffect(() => {
    if (!nextChangeAt) return undefined;
    const timer = setTimeout(() => refetch(), msUntil(new Date(nextChangeAt)) + 1000);
    return () => clearTimeout(timer);
  }, [nextChangeAt, refetch]);

  const hasWorkshop = Boolean(workshop);
  useEffect(() => {
    const panel = bookRef.current;
    if (!panel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setPanelInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [hasWorkshop]);

  const priceFrom = useMemo(() => {
    const prices = (workshop?.options || []).map(o => parseFloat(o.price));
    return prices.length ? Math.min(...prices) : null;
  }, [workshop]);

  if (isLoading) {
    return (
      <div className="container ws-page">
        <div className="ws-detail">
          <div className="ws-skeleton" style={{ aspectRatio: '16 / 10' }} />
          <div className="ws-skeleton" style={{ height: 480 }} />
        </div>
      </div>
    );
  }

  if (isError || !workshop) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="container ws-page">
        <div className="ws-empty">
          <h3>{notFound ? 'Workshop not found' : "We couldn't load this workshop"}</h3>
          <p>{notFound ? 'It may have ended or been moved.' : 'Please check your connection and try again.'}</p>
          <Link to="/workshops" className="btn btn-primary">Browse workshops</Link>
        </div>
      </div>
    );
  }

  const nextSession = workshop.sessions?.[0];
  const venueLine = [workshop.venue_name, workshop.city].filter(Boolean).join(', ');
  const hosts = (workshop.organisers?.length ? workshop.organisers : [workshop.organiser]).filter(Boolean);
  const hostLine = hostNames(workshop);

  return (
    <div className="container ws-page" style={{ paddingBottom: '8rem' }}>
      <SEO
        title={`${workshop.title} | Junglyst Workshops`}
        description={workshop.tagline || `Hands-on ${labelFor(WORKSHOP_CATEGORIES, workshop.category).toLowerCase()} workshop by ${hostLine}.`}
        path={`/workshops/${workshop.slug}`}
        image={workshop.images?.[0]}
        schemaType="Event"
        schemaData={nextSession ? {
          name: workshop.title,
          startDate: `${nextSession.date}T${nextSession.start_time}`,
          endDate: `${nextSession.date}T${nextSession.end_time}`,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'Place', name: workshop.venue_name || workshop.city, address: workshop.address || workshop.city },
          organizer: hosts.map(host => ({ '@type': 'Organization', name: host.name })),
          offers: priceFrom ? { '@type': 'Offer', price: priceFrom, priceCurrency: 'INR' } : undefined,
        } : undefined}
      />

      <Link to="/workshops" className="ws-back"><ArrowLeft size={16} /> All workshops</Link>

      <div className="ws-detail">
        <main>
          <Gallery images={workshop.images || []} title={workshop.title} />

          <span className="ws-eyebrow" style={{ marginTop: '1.5rem', color: 'var(--brand-green)' }}>
            {labelFor(WORKSHOP_CATEGORIES, workshop.category)} workshop
          </span>
          <h1 className="ws-title" style={{ marginTop: '0.4rem' }}>{workshop.title}</h1>
          {workshop.tagline && <p className="ws-tagline">{workshop.tagline}</p>}

          <div className="ws-facts">
            <Fact icon={<CalendarDays size={18} />} label="Next date" value={nextSession ? formatDate(nextSession.date, { day: 'numeric', month: 'short' }) : 'Soon'} />
            <Fact icon={<Clock size={18} />} label="Duration" value={formatDuration(workshop.duration_minutes)} />
            <Fact icon={<GraduationCap size={18} />} label="Level" value={labelFor(SKILL_LEVELS, workshop.skill_level)} />
            <Fact icon={workshop.min_age ? <Baby size={18} /> : <Users size={18} />} label={workshop.min_age ? 'Age' : 'Group'} value={workshop.min_age ? `${workshop.min_age}+ years` : `Up to ${workshop.max_seats_per_booking}/booking`} />
          </div>

          {workshop.highlights?.length > 0 && (
            <section className="ws-section" aria-labelledby="ws-included">
              <h2 id="ws-included">What's included</h2>
              <ul className="ws-checklist">
                {workshop.highlights.map(item => <li key={item}><CheckCircle2 size={18} />{item}</li>)}
              </ul>
            </section>
          )}

          {workshop.description && (
            <section className="ws-section" aria-labelledby="ws-about">
              <h2 id="ws-about">About this workshop</h2>
              <p className="ws-description">{workshop.description}</p>
            </section>
          )}

          {workshop.what_to_bring?.length > 0 && (
            <section className="ws-section" aria-labelledby="ws-bring">
              <h2 id="ws-bring">What to bring</h2>
              <ul className="ws-checklist">
                {workshop.what_to_bring.map(item => <li key={item}><Backpack size={18} />{item}</li>)}
              </ul>
            </section>
          )}

          {(venueLine || workshop.address) && (
            <section className="ws-section" aria-labelledby="ws-venue">
              <h2 id="ws-venue">Venue</h2>
              <div className="ws-venue">
                <MapPin size={22} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                <div>
                  {venueLine && <div style={{ fontWeight: 700 }}>{venueLine}</div>}
                  {workshop.address && <div style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{workshop.address}</div>}
                  {workshop.map_url && (
                    <a href={workshop.map_url} target="_blank" rel="noopener noreferrer" className="ws-map-link">
                      <Navigation size={14} /> Get directions
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="ws-section" aria-labelledby="ws-host">
            <h2 id="ws-host">{hosts.length > 1 ? 'Your hosts' : 'Your host'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hosts.map(host => (
                <div className="ws-organiser-card" key={host.slug || host.name}>
                  {host.logo_url
                    ? <img src={getImageUrl(host.logo_url)} alt="" />
                    : <div className="ws-organiser-fallback"><Store size={22} color="var(--brand-green)" /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{host.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Junglyst grower · hosted in partnership with Junglyst</div>
                  </div>
                  {host.slug && <Link to={`/store/${host.slug}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Visit store</Link>}
                </div>
              ))}
            </div>
          </section>

          {workshop.cancellation_policy && (
            <section className="ws-section" aria-labelledby="ws-policy">
              <h2 id="ws-policy">Cancellation policy</h2>
              <p className="ws-description" style={{ fontSize: '0.9rem' }}>{workshop.cancellation_policy}</p>
            </section>
          )}
        </main>

        <div ref={bookRef}>
          <BookingPanel
            key={user?.id || 'guest'}
            workshop={workshop}
            onBooked={(booking) => navigate(`/workshops/booking/${booking.order_number}`, { state: { booking } })}
          />
        </div>
      </div>

      <div className="ws-mobile-cta" hidden={panelInView}>
        <div>
          <div className="ws-price-label">From</div>
          <div className="ws-price">{priceFrom != null ? formatINR(priceFrom) : '—'}</div>
        </div>
        <button type="button" className="btn btn-primary" style={{ minHeight: 48 }} onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          Book a seat
        </button>
      </div>
    </div>
  );
}
