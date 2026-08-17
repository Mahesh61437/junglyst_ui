// Turn an axios/DRF error into something a human can act on.
//
// DRF returns validation errors in several shapes:
//   { "name": ["This field may not be blank."] }
//   { "variants": [ { "base_price": ["This field is required."] } ] }
//   { "non_field_errors": ["..."] }        { "detail": "Not found." }
//   { "error": "Custom message" }
// This flattens all of them into a readable string, and also exposes a
// per-field map so forms can highlight individual inputs.

const PLAIN_KEYS = new Set(['non_field_errors', 'detail', 'error', 'message']);

function humanizeKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Recursively collect "Label: message" strings from a DRF error body.
function flatten(data, label = '') {
  const out = [];
  if (data == null) return out;

  if (typeof data === 'string') {
    out.push(label ? `${label}: ${data}` : data);
    return out;
  }
  if (Array.isArray(data)) {
    for (const item of data) out.push(...flatten(item, label));
    return out;
  }
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      const childLabel = PLAIN_KEYS.has(key) ? label : humanizeKey(key);
      out.push(...flatten(value, childLabel));
    }
    return out;
  }
  out.push(label ? `${label}: ${data}` : String(data));
  return out;
}

// Per-field error map: { fieldName: "combined message" }. Handy for inline
// highlighting next to inputs.
export function getFieldErrors(error) {
  const data = error?.response?.data;
  const map = {};
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (PLAIN_KEYS.has(key)) continue;
      const msgs = flatten(value);
      if (msgs.length) map[key] = msgs.map((m) => m.replace(/^[^:]+:\s*/, '')).join(' ');
    }
  }
  return map;
}

// Best human-readable message for a toast / form banner.
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  // No response = network error, timeout, CORS, or request never sent.
  if (!error.response) {
    if (error.code === 'ERR_NETWORK') return 'Network error — please check your connection and try again.';
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    return error.message || fallback;
  }

  const { status, data } = error.response;

  if (typeof data === 'string' && data.trim()) {
    // Guard against dumping a raw HTML 500 page at the user.
    if (data.trim().startsWith('<')) return `${fallback} (error ${status})`;
    return data.slice(0, 300);
  }

  if (data && typeof data === 'object') {
    const msgs = flatten(data);
    if (msgs.length) return msgs.slice(0, 6).join(' · ').slice(0, 500);
  }

  if (status === 404) return 'Not found.';
  if (status === 403) return "You don't have permission to do that.";
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return `${fallback} (error ${status})`;
}
