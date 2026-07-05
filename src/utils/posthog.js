import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Internal roles — don't record their sessions or count their events toward customer funnels
const INTERNAL_ROLES = new Set(['seller', 'admin', 'super_admin']);

export function initPostHog() {
  if (!KEY) return;
  posthog.init(KEY, {
    api_host: HOST,

    // Pageviews only — no pageleave (halves pageview event count)
    capture_pageview: true,
    capture_pageleave: false,

    // Autocapture off — we track manually; autocapture fires 20-50 events/session
    autocapture: false,

    // Capture unhandled JS errors and promise rejections
    capture_exceptions: true,

    // Record 30% of buyer sessions → ~3x runway on the 5K/month limit
    session_recording: {
      sample_rate: 0.3,
      minimum_duration_milliseconds: 3000, // skip sub-3s bounces and bots
      maskAllInputs: true,                 // mask form fields for privacy
    },

    // Silence retry spam — ad blockers (e.g. Brave shields) block the PostHog
    // domain. Without this, PostHog retries indefinitely and floods the network
    // tab with failed XHRs. 1 retry is enough to confirm the block; after that
    // we give up silently rather than hammering a blocked endpoint.
    on_request_error: (err) => {
      // suppress console noise from blocked requests
      void err;
    },
    request_timeout_ms: 3000,
  });
}

export function identifyUser(user) {
  if (!KEY || !user?.id) return;
  posthog.identify(String(user.id), {
    email: user.email,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    role: user.role,
    username: user.username,
  });
  // Don't record sessions for sellers/admins — not customer journeys we need to analyse
  if (INTERNAL_ROLES.has(user.role)) {
    posthog.stopSessionRecording();
  }
}

export function resetUser() {
  if (!KEY) return;
  posthog.reset();
}

export function trackEvent(event, properties = {}) {
  if (!KEY) return;
  posthog.capture(event, properties);
}

// --- API performance & error metrics ---
// Client-perceived latency, status, and network failures. Captured under the
// same `api_request` event as the backend middleware (source distinguishes them).
// Cost control: errors and slow requests are always sent; fast successes are
// sampled (default 10%, tunable via env) since the backend already records
// every request's true server latency.
const API_SAMPLE_RATE = Number(import.meta.env.VITE_POSTHOG_API_SAMPLE_RATE ?? 0.1);
const API_SLOW_MS = Number(import.meta.env.VITE_POSTHOG_API_SLOW_MS ?? 1500);

// Redact credentials/PII before anything leaves the browser.
const SENSITIVE_RE = /pass|token|secret|auth|card|cvv|cvc|otp|\bpin\b|signature|refresh|access|api[_-]?key|\bkey\b/i;
function scrubData(value, depth = 0) {
  if (depth > 6) return '…';
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => scrubData(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = SENSITIVE_RE.test(k) ? '[REDACTED]' : scrubData(v, depth + 1);
    return out;
  }
  if (typeof value === 'string') return value.slice(0, 500);
  return value;
}
function coerceBody(data) {
  if (data == null) return null;
  if (typeof data === 'string') { try { return JSON.parse(data); } catch { return data.slice(0, 2000); } }
  return data;
}

// `errorDetail` = the server's error body (what went wrong); `requestPayload` =
// what was sent. Both are scrubbed and only attached on failures.
export function trackApiMetric({ method, route, status, durationMs, success, error, errorDetail, requestPayload }) {
  if (!KEY) return;
  const isSlow = durationMs >= API_SLOW_MS;
  if (success && !isSlow && API_SAMPLE_RATE < 1 && Math.random() > API_SAMPLE_RATE) return;
  const props = {
    source: 'client',
    method,
    route,
    status_code: status,
    duration_ms: Math.round(durationMs),
    success,
    slow: isSlow,
  };
  if (error) props.error = String(error).slice(0, 500);
  if (!success) {
    if (requestPayload != null) props.request_payload = scrubData(coerceBody(requestPayload));
    if (errorDetail != null) props.error_detail = scrubData(coerceBody(errorDetail));
  }
  posthog.capture('api_request', props);
}

// --- Errors & console logs ---
// Unhandled errors + promise rejections are already captured by
// `capture_exceptions: true`, and React render errors by PostHogErrorBoundary.
// This adds (a) a manual helper for try/catch blocks and (b) forwarding of
// console.error / console.warn so nothing logged slips past PostHog.

export function captureError(error, context = {}) {
  if (!KEY) return;
  try {
    if (error instanceof Error) {
      posthog.captureException(error, context);
    } else {
      posthog.capture('frontend_error', { message: String(error).slice(0, 1000), ...context });
    }
  } catch { /* telemetry must never throw */ }
}

function safeStringify(obj) {
  try { return JSON.stringify(obj); } catch { return String(obj); }
}

let _consolePatched = false;
let _inForward = false; // re-entrancy guard against capture→console→capture loops

export function initErrorCapture() {
  if (!KEY || _consolePatched || typeof window === 'undefined') return;
  _consolePatched = true;

  const forward = (level, args) => {
    if (_inForward) return;
    _inForward = true;
    try {
      const message = args
        .map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'object' ? safeStringify(a) : String(a)))
        .join(' ')
        .slice(0, 2000);
      // Skip PostHog's own noise (e.g. blocked-request warnings) to avoid loops.
      if (/posthog/i.test(message)) return;
      const firstError = args.find((a) => a instanceof Error);
      if (firstError) {
        posthog.captureException(firstError, { level, source: 'console', message });
      } else {
        posthog.capture('frontend_log', { level, source: 'console', message });
      }
    } catch { /* swallow */ } finally {
      _inForward = false;
    }
  };

  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args) => { forward('error', args); origError(...args); };
  console.warn = (...args) => { forward('warning', args); origWarn(...args); };
}

// --- Marketplace-specific events ---

export function trackProductViewed({ productId, name, price, category, seller }) {
  trackEvent('product_viewed', { product_id: productId, name, price, category, seller });
}

export function trackAddToCart({ productId, name, price, quantity = 1 }) {
  trackEvent('add_to_cart', { product_id: productId, name, price, quantity });
}

export function trackAddToWishlist({ productId, name, price }) {
  trackEvent('add_to_wishlist', { product_id: productId, name, price });
}

export function trackCheckoutInitiated({ value, numItems }) {
  trackEvent('checkout_initiated', { value, num_items: numItems });
}

export function trackOrderPlaced({ orderId, value, numItems }) {
  trackEvent('order_placed', { order_id: orderId, value, num_items: numItems });
}

export function trackSignup({ method = 'email' }) {
  trackEvent('signed_up', { method });
}

export function trackLogin({ method = 'email' }) {
  trackEvent('logged_in', { method });
}

export function trackSearch({ query, resultsCount }) {
  trackEvent('search', { query, results_count: resultsCount });
}
