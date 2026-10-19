// Pure helpers shared by the workshop storefront, seller tab and admin console.

export const WORKSHOP_CATEGORIES = [
  { id: 'terrarium', label: 'Terrarium' },
  { id: 'aquarium', label: 'Aquarium' },
  { id: 'aquascaping', label: 'Aquascaping' },
  { id: 'paludarium', label: 'Paludarium' },
  { id: 'kokedama', label: 'Kokedama' },
  { id: 'other', label: 'Other' },
];

export const SKILL_LEVELS = [
  { id: 'all_levels', label: 'All levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const BOOKING_STATUS_META = {
  pending_payment: { label: 'Awaiting payment', color: '#92400e', bg: '#fef3c7' },
  confirmed:       { label: 'Confirmed',        color: '#1d4ed8', bg: '#dbeafe' },
  attended:        { label: 'Attended',         color: '#14532d', bg: '#dcfce7' },
  no_show:         { label: 'No-show',          color: '#6b21a8', bg: '#f3e8ff' },
  cancelled:       { label: 'Cancelled',        color: '#991b1b', bg: '#fee2e2' },
  payment_failed:  { label: 'Payment failed',   color: '#475569', bg: '#f1f5f9' },
};

export const LOW_SEATS_THRESHOLD = 5;

export const labelFor = (list, id) => list.find(item => item.id === id)?.label || id || '';

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

export function formatINR(value, { decimals = 0 } = {}) {
  return `₹${toNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  })}`;
}

// "14:30" or "14:30:00" → "2:30 PM"
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// "2026-10-18" → Date at local midnight (avoids the UTC shift of new Date(iso)).
export function parseLocalDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDate(isoDate, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = parseLocalDate(isoDate);
  return date ? date.toLocaleDateString('en-IN', options) : '';
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(toNumber(minutes)));
  if (!total) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`;
}

export function seatsLabel(seatsLeft) {
  if (seatsLeft <= 0) return { text: 'Sold out', tone: 'soldout' };
  if (seatsLeft <= LOW_SEATS_THRESHOLD) return { text: `Only ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`, tone: 'low' };
  return { text: `${seatsLeft} seats available`, tone: 'ok' };
}

// Platform keeps `commissionPercent` of what the buyer pays; organiser gets the rest.
// Mirrors orders.bookings.split_commission (rounded to paise).
export function splitCommission(gross, commissionPercent) {
  const grossValue = toNumber(gross);
  const commission = Math.round(grossValue * toNumber(commissionPercent)) / 100;
  return { commission, sellerPayout: Math.round((grossValue - commission) * 100) / 100 };
}

// What-if revenue for the admin calculator.
export function projectRevenue({ price, seats, commissionPercent }) {
  const gross = toNumber(price) * Math.max(0, Math.floor(toNumber(seats)));
  return { gross, ...splitCommission(gross, commissionPercent) };
}

export function bookingTotal(price, participants) {
  return toNumber(price) * Math.max(0, Math.floor(toNumber(participants)));
}

const shortDate = (date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const dateTime = (date) => `${shortDate(date)}, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;

// Registration state for cards / detail page. The server decides
// (`registration_state`: time window + seats left); the clock only matters
// for working out when it will next change, so an open page can refresh then.
export function registrationState(workshop, now = new Date()) {
  if (!workshop) return { state: 'closed', open: false, label: '', badge: null, nextChangeAt: null };
  const opens = workshop.registration_opens_at ? new Date(workshop.registration_opens_at) : null;
  const closes = workshop.registration_closes_at ? new Date(workshop.registration_closes_at) : null;
  let state = workshop.registration_state;
  if (!state) { // older payloads: time window only
    if (opens && now < opens) state = 'opens_later';
    else if ((closes && now > closes) || workshop.registration_open === false) state = 'closed';
    else state = 'open';
  }
  const future = (date) => (date && date > now ? date : null);
  const nextChangeAt = state === 'opens_later' ? future(opens) : state === 'open' ? future(closes) : null;

  switch (state) {
    case 'opens_later':
      return { state, open: false, nextChangeAt, label: opens ? `Registrations open ${dateTime(opens)}` : 'Registrations open soon', badge: opens ? `Opens ${shortDate(opens)}` : 'Opening soon' };
    case 'sold_out':
      return { state, open: false, nextChangeAt, label: 'All sessions are full', badge: 'Sold out' };
    case 'no_dates':
      return { state, open: false, nextChangeAt, label: 'New dates coming soon', badge: null };
    case 'closed':
      return { state, open: false, nextChangeAt, label: 'Registrations closed', badge: 'Closed' };
    default:
      return { state: 'open', open: true, nextChangeAt, label: closes ? `Register by ${dateTime(closes)}` : 'Registrations open', badge: null };
  }
}

// Milliseconds until `date`, capped to what setTimeout accepts (~24.8 days).
export const msUntil = (date, now = Date.now()) => Math.min(Math.max(0, date.getTime() - now), 2 ** 31 - 1);

export const PHONE_PATTERN = /^\+?[0-9 ]{10,15}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAttendee({ attendee_name, attendee_phone, attendee_email }) {
  const errors = {};
  if (!attendee_name?.trim()) errors.attendee_name = 'Please enter the attendee name.';
  if (!PHONE_PATTERN.test((attendee_phone || '').trim())) errors.attendee_phone = 'Enter a valid 10-digit mobile number.';
  if (!EMAIL_PATTERN.test((attendee_email || '').trim())) errors.attendee_email = 'Enter a valid email address.';
  return errors;
}

// Text-area friendly list editing: one bullet per line.
export const linesToList = (text) => String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
export const listToLines = (list) => (Array.isArray(list) ? list.join('\n') : '');

export function toCsv(rows, columns) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map(c => escape(c.label)).join(',');
  const body = rows.map(row => columns.map(c => escape(c.value(row))).join(','));
  return [header, ...body].join('\n');
}

const compactDateTime = (isoDate, hhmm) => `${String(isoDate).replace(/-/g, '')}T${String(hhmm).slice(0, 5).replace(':', '')}00`;

// Google Calendar "add event" link. Times are wall-clock IST (ctz), matching the venue.
export function googleCalendarUrl({ title, date, start, end, location, details }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${compactDateTime(date, start)}/${compactDateTime(date, end)}`,
    ctz: 'Asia/Kolkata',
    location: location || '',
    details: details || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// <input type="datetime-local"> speaks local "YYYY-MM-DDTHH:MM"; the API speaks ISO/UTC.
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

// ── Co-hosting ──────────────────────────────────────────────────────────────
// Mirrors workshops.services.allocate_by_share: split a rupee amount by
// percentage shares, in paise, always summing exactly to the total.
export function allocateByShare(total, shares) {
  const totalPaise = Math.round(toNumber(total) * 100);
  const raw = shares.map(share => (totalPaise * toNumber(share)) / 100);
  const parts = raw.map(Math.floor);
  let leftover = totalPaise - parts.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - parts[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (leftover <= 0) break;
    parts[i] += 1;
    leftover -= 1;
  }
  return parts.map(p => p / 100);
}

// One booking amount split across co-hosts: [{ share, gross, commission, payout }].
export function splitAcrossCohosts(amount, organisers) {
  const parts = allocateByShare(amount, organisers.map(o => o.share_percent));
  return organisers.map((o, i) => {
    const { commission, sellerPayout } = splitCommission(parts[i], o.commission_percent);
    return { seller: o.seller, gross: parts[i], commission, payout: sellerPayout };
  });
}

export const sharesTotal = (organisers) =>
  Math.round(organisers.reduce((sum, o) => sum + toNumber(o.share_percent), 0) * 100) / 100;

// Equal shares that still total exactly 100 (the remainder goes to the first rows).
export function evenShares(count) {
  if (count <= 0) return [];
  return allocateByShare(100, Array(count).fill(100 / count));
}

// Comparable fingerprint of co-host terms, to detect edits that move money.
export const termsSignature = (organisers) => JSON.stringify(
  organisers.map(o => [String(o.seller), toNumber(o.share_percent), toNumber(o.commission_percent)]),
);

// "A", "A & B", "A, B & C" (older payloads only carry `organiser`).
export function hostNames(workshop) {
  const names = (workshop.organisers?.length ? workshop.organisers : [workshop.organiser]).filter(Boolean).map(o => o.name);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : (names[0] || '');
}

// tel: / WhatsApp links for an Indian mobile; a bare 10-digit number gets +91.
export function phoneLinks(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const international = digits.length === 10 ? `91${digits}` : digits;
  return { tel: `tel:+${international}`, whatsapp: `https://wa.me/${international}` };
}

// True when a session's start (local date + "HH:MM") is not in the future.
export function isPastSession(isoDate, startTime, now = new Date()) {
  const day = parseLocalDate(isoDate);
  if (!day || !startTime) return false;
  const [h, m] = String(startTime).split(':').map(Number);
  day.setHours(h || 0, m || 0, 0, 0);
  return day <= now;
}

// ── Group booking (shared terrarium) ────────────────────────────────────────
export const isSharedOption = (option) => option?.pricing === 'per_build';

export const optionUnitLabel = (option) => (isSharedOption(option) ? 'per terrarium' : 'per person');

// "Up to 4 people share one terrarium" for shared options, '' otherwise.
export const sharedNote = (option) => (isSharedOption(option)
  ? `Up to ${option.max_people_per_build} people share one terrarium` : '');

// Clamp the party to what the option and session allow. Per-person: one
// terrarium each. Shared: 1+ terrariums, each with 1..max_people_per_build people.
export function normaliseParty(option, people, builds, maxSeats) {
  const cap = Math.max(1, Math.floor(toNumber(maxSeats)) || 1);
  if (!isSharedOption(option)) {
    const p = Math.min(Math.max(1, Math.floor(toNumber(people)) || 1), cap);
    return { people: p, builds: p, minPeople: 1, maxPeople: cap, maxBuilds: cap };
  }
  // A group slot is one shared terrarium on one seat; its group is up to perBuild people.
  const perBuild = Math.max(1, Math.floor(toNumber(option.max_people_per_build)) || 1);
  const b = Math.min(Math.max(1, Math.floor(toNumber(builds)) || 1), cap);
  return { people: b * perBuild, builds: b, minPeople: b * perBuild, maxPeople: b * perBuild, maxBuilds: cap };
}

// What the unit price is charged on: terrariums for shared options, people otherwise.
export const chargedUnits = (option, party) => (isSharedOption(option) ? party.builds : party.people);

// "3 people · 1 shared terrarium" / "2 people"
export function partyLabel({ participants, builds }) {
  const people = `${participants} ${participants === 1 ? 'person' : 'people'}`;
  if (!builds || builds >= participants) return people;
  return `${people} · ${builds} shared terrarium${builds === 1 ? '' : 's'}`;
}
