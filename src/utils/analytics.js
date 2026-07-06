/**
 * Junglyst Unified Analytics
 * --------------------------
 * Single entry point for all tracking events.
 * Fires PostHog (product analytics / session recording) and
 * Meta Pixel (ad retargeting / funnel reporting) in parallel.
 *
 * PostHog  → granular custom events, user identity, session recording
 * Meta Pixel → standard events for retargeting & conversion reporting in Ads Manager
 */

import posthog from 'posthog-js';

// ─── Meta Pixel helpers ────────────────────────────────────────────────────────

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

/** Fire a Meta Pixel standard event — silently no-ops if pixel not loaded/configured. */
function mpTrack(event, params = {}) {
  if (!PIXEL_ID || typeof window.fbq !== 'function') return;
  window.fbq('track', event, params);
}

/** Fire a Meta Pixel custom event. */
function mpTrackCustom(event, params = {}) {
  if (!PIXEL_ID || typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', event, params);
}

// ─── PostHog helpers ──────────────────────────────────────────────────────────

const PH_KEY = import.meta.env.VITE_POSTHOG_KEY;

function phTrack(event, props = {}) {
  if (!PH_KEY) return;
  posthog.capture(event, props);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Call once at app boot (main.jsx).
 * PostHog is already initialised via posthog.js; this initialises the Pixel.
 */
export function initAnalytics() {
  if (!PIXEL_ID || typeof window.fbq !== 'function') return;
  window.fbq('init', PIXEL_ID);
  // PageView is fired per-navigation via trackPageView() called from App.jsx router listener.
}

// ─── Identity ─────────────────────────────────────────────────────────────────

const INTERNAL_ROLES = new Set(['grower', 'admin', 'super_admin']);

export function identifyUser(user) {
  if (!user?.id) return;

  // PostHog identity
  if (PH_KEY) {
    posthog.identify(String(user.id), {
      // $set: latest values on the person (for cohorts / retention / growth).
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: user.role,
      username: user.username,
      is_seller: user.role === 'grower',
    }, {
      // $set_once: first-touch attributes — never overwritten (acquisition date).
      first_identified_at: new Date().toISOString(),
    });
    // Super property → attached to EVERY event, so funnels/metrics can be
    // filtered/segmented by role without a person join.
    posthog.register({ user_role: user.role || 'collector' });
    if (INTERNAL_ROLES.has(user.role)) {
      posthog.stopSessionRecording();
    }
  }

  // Meta Pixel — send user data for advanced matching (hashed server-side by Meta)
  if (PIXEL_ID && typeof window.fbq === 'function') {
    window.fbq('init', PIXEL_ID, { em: user.email });
  }
}

export function resetUser() {
  if (PH_KEY) posthog.reset();
}

// ─── Page views ───────────────────────────────────────────────────────────────

// Collapse high-cardinality ids so page funnels/paths group cleanly, e.g.
// /product/monstera-abc123 → /product/:slug, /orders/42 → /orders/:id
function normalizePath(pathname = '') {
  return pathname
    // Named slug routes first, so their values don't get mangled by id rules.
    .replace(/\/product\/[^/]+/g, '/product/:slug')
    .replace(/\/combos\/[^/]+/g, '/combos/:slug')
    .replace(/\/store\/[^/]+/g, '/store/:slug')
    // Then generic ids: dashed UUID, long hex (uuid-no-dash / mongo), numeric.
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/[0-9a-f]{24,}/gi, '/:id')
    .replace(/\/\d+/g, '/:id') || '/';
}

export function trackPageView(url) {
  // SPA pageview — auto-capture is off (see initPostHog), so this is the single
  // source. Meta Pixel needs a manual call on navigation too.
  mpTrack('PageView');
  const pathname = (typeof window !== 'undefined' && window.location.pathname) || '';
  // PostHog enriches with $referrer/UTMs/device automatically; we add a
  // normalized route for grouped path funnels.
  phTrack('$pageview', {
    ...(url ? { $current_url: url } : {}),
    $pathname: pathname,
    route: normalizePath(pathname),
  });
}

// ─── Marketplace events ───────────────────────────────────────────────────────

/**
 * Product detail page viewed.
 * PostHog: product_viewed | Meta: ViewContent
 */
export function trackProductViewed({ productId, name, price, category, seller }) {
  phTrack('product_viewed', { product_id: productId, name, price, category, seller });
  mpTrack('ViewContent', {
    content_ids: [productId],
    content_name: name,
    content_category: category,
    content_type: 'product',
    value: parseFloat(price) || 0,
    currency: 'INR',
  });
}

/**
 * Item added to cart.
 * PostHog: add_to_cart | Meta: AddToCart
 */
export function trackAddToCart({ productId, name, price, quantity = 1 }) {
  phTrack('add_to_cart', { product_id: productId, name, price, quantity });
  mpTrack('AddToCart', {
    content_ids: [productId],
    content_name: name,
    content_type: 'product',
    value: parseFloat(price) * quantity || 0,
    currency: 'INR',
    num_items: quantity,
  });
}

/**
 * Item added to wishlist.
 * PostHog: add_to_wishlist | Meta: AddToWishlist
 */
export function trackAddToWishlist({ productId, name, price }) {
  phTrack('add_to_wishlist', { product_id: productId, name, price });
  mpTrack('AddToWishlist', {
    content_ids: [productId],
    content_name: name,
    content_type: 'product',
    value: parseFloat(price) || 0,
    currency: 'INR',
  });
}

/**
 * Checkout flow started.
 * PostHog: checkout_initiated | Meta: InitiateCheckout
 */
export function trackCheckoutInitiated({ value, numItems }) {
  phTrack('checkout_initiated', { value, num_items: numItems });
  mpTrack('InitiateCheckout', {
    value: parseFloat(value) || 0,
    currency: 'INR',
    num_items: numItems,
  });
}

/**
 * Order placed successfully.
 * PostHog: order_placed | Meta: Purchase
 */
export function trackOrderPlaced({ orderId, value, numItems }) {
  phTrack('order_placed', { order_id: orderId, value, num_items: numItems });
  mpTrack('Purchase', {
    value: parseFloat(value) || 0,
    currency: 'INR',
    num_items: numItems,
    content_type: 'product',
  });
}

/**
 * User signed up.
 * PostHog: signed_up | Meta: CompleteRegistration
 */
export function trackSignup({ method = 'email' }) {
  phTrack('signed_up', { method });
  mpTrack('CompleteRegistration', { content_name: 'Signup', method });
}

/**
 * User logged in (PostHog only — no standard Pixel event).
 */
export function trackLogin({ method = 'email' }) {
  phTrack('logged_in', { method });
}

/**
 * Search performed (PostHog only).
 */
export function trackSearch({ query, resultsCount }) {
  phTrack('search', { query, results_count: resultsCount });
}

/**
 * Generic custom event — fires PostHog only unless you pass `pixel: true`.
 */
export function trackEvent(event, properties = {}, { pixel = false } = {}) {
  phTrack(event, properties);
  if (pixel) mpTrackCustom(event, properties);
}
