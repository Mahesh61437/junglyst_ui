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
