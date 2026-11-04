// Shared rules for the quote-based services UI. They mirror the server's checks
// (services/validators.py) so people get instant feedback; the server stays the
// authority and its messages are shown when it disagrees.

export const SUPPORT_PHONE = { display: '+91 80747 51370', tel: '+918074751370' };

export const BUDGET_CEILING = 1000000;

export const QUOTE_STATUS = {
  submitted: { label: 'Submitted', bg: '#e0f2fe', fg: '#075985' },
  in_review: { label: 'In review', bg: '#fef9c3', fg: '#854d0e' },
  awaiting_payment: { label: 'Awaiting payment', bg: '#ffedd5', fg: '#9a3412' },
  paid: { label: 'Paid', bg: '#dcfce7', fg: '#166534' },
  delivered: { label: 'Delivered', bg: '#e0e7ff', fg: '#3730a3' },
  expired: { label: 'Expired', bg: '#fee2e2', fg: '#b91c1c' },
  declined: { label: 'Declined', bg: '#fee2e2', fg: '#991b1b' },
  cancelled: { label: 'Cancelled', bg: '#f1f5f9', fg: '#475569' },
};

// How request lists are split; mirrors QUOTE_SECTIONS on the server.
export const QUOTE_SECTIONS = [
  { id: 'active', label: 'Active', statuses: ['submitted', 'in_review', 'awaiting_payment', 'expired', 'paid'] },
  { id: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { id: 'closed', label: 'Cancelled & declined', statuses: ['declined', 'cancelled'] },
];

export const FIELD_TYPES = [
  { id: 'text', label: 'Short text' },
  { id: 'textarea', label: 'Long text' },
  { id: 'number', label: 'Number' },
  { id: 'select', label: 'Choose one' },
  { id: 'multiselect', label: 'Choose several' },
  { id: 'date', label: 'Date' },
];

export function normalisePhone(value) {
  const digits = String(value || '').replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function validateName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120 || !/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
    return 'Enter your name (letters only, at least 2 characters).';
  }
  return null;
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim()) ? null : 'Enter a valid email address.';
}

export function validatePincode(value) {
  return /^[1-9]\d{5}$/.test(String(value || '').trim()) ? null : 'Enter a valid 6-digit pincode.';
}

export function validateBudget(min, max) {
  const low = Number(min);
  const high = Number(max);
  if (!min || !max || Number.isNaN(low) || Number.isNaN(high)) return 'Enter your expected budget range.';
  if (low <= 0) return 'Budget must be more than zero.';
  if (high < low) return 'Maximum budget cannot be below the minimum.';
  if (high > BUDGET_CEILING) return `Budget cannot exceed ₹${BUDGET_CEILING.toLocaleString('en-IN')}.`;
  return null;
}

const isBlank = (value) => value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);

/** Validate dynamic-form answers against the offering's questions. Returns { key: message }. */
export function validateAnswers(fields, answers) {
  const errors = {};
  const today = new Date().toISOString().slice(0, 10);
  for (const field of fields) {
    const value = answers[field.key];
    if (isBlank(value)) {
      if (field.required) errors[field.key] = 'This is required.';
      continue;
    }
    if (field.field_type === 'number') {
      const number = Number(value);
      if (Number.isNaN(number)) errors[field.key] = 'Enter a number.';
      else if (field.min_value != null && number < Number(field.min_value)) errors[field.key] = `Must be at least ${Number(field.min_value)}.`;
      else if (field.max_value != null && number > Number(field.max_value)) errors[field.key] = `Must be at most ${Number(field.max_value)}.`;
    } else if (field.field_type === 'date' && String(value) < today) {
      errors[field.key] = 'Date cannot be in the past.';
    } else if ((field.field_type === 'text' || field.field_type === 'textarea') && String(value).length > (field.max_length || 2000)) {
      errors[field.key] = `Keep this under ${field.max_length || 2000} characters.`;
    }
  }
  return errors;
}

/** Drop blank answers so the server only sees what the customer filled in. */
export function compactAnswers(answers) {
  return Object.fromEntries(Object.entries(answers).filter(([, value]) => !isBlank(value)));
}

/** Item price + shipping, as the server computes it (display only). */
export function quoteTotal(itemPrice, shippingFee) {
  const price = Number(itemPrice);
  if (!price || Number.isNaN(price)) return null;
  return price + (Number(shippingFee) || 0);
}

export function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export function fieldKeyFrom(label) {
  const key = slugify(label).replace(/-/g, '_');
  return /^[a-z]/.test(key) ? key : `q_${key}`;
}

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Consecutive items grouped by local calendar day, keeping their order: [{ key, label, items }]. */
export function groupByDay(items, field = 'created_at') {
  const groups = [];
  for (const item of items) {
    const date = new Date(item[field]);
    const key = dayKey(date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), items: [item] });
  }
  return groups;
}

const SHORT_STATE_LIST = 3;

/** "Karnataka, Tamil Nadu" (or "A, B, C +2 more" when short). Null when there is no restriction. */
export function deliveryAreaText(stateNames, { short = false } = {}) {
  if (!stateNames?.length) return null;
  if (!short || stateNames.length <= SHORT_STATE_LIST) return stateNames.join(', ');
  return `${stateNames.slice(0, SHORT_STATE_LIST).join(', ')} +${stateNames.length - SHORT_STATE_LIST} more`;
}

const roundBudget = (value) => {
  const step = value >= 10000 ? 1000 : 500;
  return Math.max(step, Math.round(value / step) * step);
};

/** Quick budget ranges built around the service's usual starting price. */
export function budgetPresets(suggestedMin) {
  const base = roundBudget(Number(suggestedMin) || 2000);
  return [
    { min: base, max: roundBudget(base * 2) },
    { min: roundBudget(base * 2), max: roundBudget(base * 4) },
    { min: roundBudget(base * 4), max: roundBudget(base * 8) },
  ];
}

const HOUR_MS = 60 * 60 * 1000;

/** "Pay by Tue, 28 Oct, 5:30 pm" plus how urgent it is; null when there is no deadline. */
export function payByInfo(payBy, now = new Date()) {
  if (!payBy) return null;
  const deadline = new Date(payBy);
  const hoursLeft = (deadline - now) / HOUR_MS;
  const when = deadline.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  let left;
  if (hoursLeft <= 0) left = 'expired';
  else if (hoursLeft < 1) left = 'less than an hour left';
  else if (hoursLeft < 24) left = `${Math.floor(hoursLeft)} hour${Math.floor(hoursLeft) === 1 ? '' : 's'} left`;
  else {
    const days = Math.round(hoursLeft / 24); // just-renewed 71.9 hours reads as 3 days, not 2
    left = `${days} day${days === 1 ? '' : 's'} left`;
  }
  return { when, left, urgent: hoursLeft < 24, overdue: hoursLeft <= 0 };
}
