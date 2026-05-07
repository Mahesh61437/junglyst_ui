const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

function fbq(...args) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export function initPixel() {
  if (!PIXEL_ID) return;
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

export function trackPageView() {
  fbq('track', 'PageView');
}

export function trackViewContent({ productId, name, price, currency = 'INR' }) {
  fbq('track', 'ViewContent', {
    content_ids: [productId],
    content_name: name,
    content_type: 'product',
    value: parseFloat(price) || 0,
    currency,
  });
}

export function trackAddToCart({ productId, name, price, currency = 'INR' }) {
  fbq('track', 'AddToCart', {
    content_ids: [productId],
    content_name: name,
    content_type: 'product',
    value: parseFloat(price) || 0,
    currency,
  });
}

export function trackAddToWishlist({ productId, name, price, currency = 'INR' }) {
  fbq('track', 'AddToWishlist', {
    content_ids: [productId],
    content_name: name,
    value: parseFloat(price) || 0,
    currency,
  });
}

export function trackInitiateCheckout({ value, numItems, currency = 'INR' }) {
  fbq('track', 'InitiateCheckout', {
    value: parseFloat(value) || 0,
    num_items: numItems || 1,
    currency,
  });
}

export function trackPurchase({ orderId, value, currency = 'INR' }) {
  fbq('track', 'Purchase', {
    content_type: 'product',
    value: parseFloat(value) || 0,
    currency,
    order_id: orderId,
  });
}
