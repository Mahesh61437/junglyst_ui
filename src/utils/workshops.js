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

// Registration state shown on cards / detail page.
export function registrationState(workshop, now = new Date()) {
  if (!workshop) return { open: false, label: '' };
  const opens = workshop.registration_opens_at ? new Date(workshop.registration_opens_at) : null;
  const closes = workshop.registration_closes_at ? new Date(workshop.registration_closes_at) : null;
  if (opens && now < opens) {
    return { open: false, label: `Registrations open ${opens.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` };
  }
  if ((closes && now > closes) || workshop.registration_open === false) {
    return { open: false, label: 'Registrations closed' };
  }
  if (closes) {
    return { open: true, label: `Register by ${closes.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` };
  }
  return { open: true, label: 'Registrations open' };
}

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
