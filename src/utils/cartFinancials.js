// Pure cart rules — no React, so they can be unit tested with node --test.
import { deliveryForProduct, undeliverableAreaLabel } from './deliveryRegion.js';

// ── Shipping window helpers ───────────────────────────────────────────────────
// shipping_days uses Python/ISO convention: 0=Mon … 6=Sun
// JS Date.getDay() uses: 0=Sun, 1=Mon … 6=Sat → convert via (jsDay + 6) % 7
//
// Source of truth is the backend `next_shipping_date` (already honors cutoff +
// blackouts). The client-side calculator below is a fallback when the value
// isn't present in the payload (e.g. local guest cart with stale snapshot).
function parseIsoDate(s) {
  if (!s || typeof s !== 'string') return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function buildBlackoutSet(blackouts) {
  const set = new Set();
  if (!Array.isArray(blackouts)) return set;
  for (const b of blackouts) {
    const start = parseIsoDate(b.start_date);
    const end = parseIsoDate(b.end_date);
    if (!start || !end) continue;
    const cur = new Date(start);
    while (cur <= end) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

function getNextShippingDate(shippingDays, { cutoff = '12:00', blackouts = [], asOf = null } = {}) {
  if (!shippingDays || shippingDays.length === 0) return null;
  const days = new Set(shippingDays);
  const blackoutSet = buildBlackoutSet(blackouts);
  const [cutH, cutM] = (cutoff || '12:00').split(':').map(Number);

  const now = asOf ? new Date(asOf) : new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const cutoffMins = (cutH || 0) * 60 + (cutM || 0);

  for (let offset = 0; offset < 90; offset++) {
    const cand = new Date(today);
    cand.setDate(today.getDate() + offset);
    const wd = (cand.getDay() + 6) % 7;
    if (!days.has(wd)) continue;
    const iso = cand.toISOString().slice(0, 10);
    if (blackoutSet.has(iso)) continue;
    if (offset === 0 && nowMins >= cutoffMins) continue;
    return cand;
  }
  return null;
}

function formatShipDate(date) {
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return `${DAY[date.getDay()]}, ${date.getDate()} ${MON[date.getMonth()]}`;
}

// Zone-based transit days after dispatch
function transitDays(zone) {
  if (zone === 'A') return { min: 1, max: 2 };
  if (zone === 'B') return { min: 2, max: 3 };
  if (zone === 'D_whitelisted') return { min: 4, max: 6 };
  return { min: 3, max: 5 }; // C and unknown
}

export function buildShippingWindow(shippingDays, zone = null, opts = {}) {
  // Prefer the backend-supplied next_shipping_date (already honors cutoff + blackouts).
  // Fall back to client-side computation when not provided.
  const serverNext = parseIsoDate(opts.nextShippingDate);
  const next = serverNext || getNextShippingDate(shippingDays, {
    cutoff: opts.cutoff,
    blackouts: opts.blackouts,
  });
  if (!next) {
    return shippingDays && shippingDays.length === 0
      ? { ships_on: 'Schedule not set', estimated_delivery: '—', unavailable: true }
      : null;
  }
  const { min: minDays, max: maxDays } = transitDays(zone);
  const min = new Date(next); min.setDate(next.getDate() + minDays);
  const max = new Date(next); max.setDate(next.getDate() + maxDays);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const minStr = `${min.getDate()} ${MON[min.getMonth()]}`;
  const maxStr = `${max.getDate()} ${MON[max.getMonth()]}`;

  // "On a break" indicator — true if the seller has an active blackout covering today
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const blackoutSet = buildBlackoutSet(opts.blackouts || []);
  const onBreak = blackoutSet.has(todayIso);

  return {
    ships_on: formatShipDate(next),
    ships_date: next,
    estimated_delivery: `${minStr} – ${maxStr}`,
    on_break: onBreak,
  };
}

// ── Cart policy constants ─────────────────────────────────────────────────────
export const MAX_SELLERS = 3;
export const MAX_ITEM_QUANTITY = 10;
export const SHIPPING_CONFIG_RETRY_DELAYS_MS = [1000, 3000];

// Shipping fee and nudge are driven by per-seller DB config fetched from the API.
// configs shape: { [sellerId]: { light?: TierConfig, heavy?: TierConfig, delivery?: DeliveryConfig } }
// TierConfig: { tier1_max, tier1_fee, tier2_max, tier2_fee, show_nudge_products }
// DeliveryConfig: { service_regions: string[], excluded_states: string[], region_fees: { [region]: number | null },
//                   product_regions: { [productId]: string[] } }  ← narrower regions for category-restricted products

export function sellerShippingFee(subtotal, config) {
  if (!config) return 0;
  if (subtotal < config.tier1_max) return config.tier1_fee;
  if (subtotal < config.tier2_max) return config.tier2_fee;
  return 0;
}

export function nudgeForSeller(subtotal, config, sellerName) {
  if (!config) return { type: 'free', message: `✓ Free shipping from ${sellerName}`, show_products: false };

  const currentFee = sellerShippingFee(subtotal, config);

  if (currentFee === 0) {
    return { type: 'free', message: `✓ Free shipping from ${sellerName}`, show_products: false, current_fee: 0 };
  }

  let message = null;
  let secondary_message = null;
  let to_next_tier = null;
  let next_fee = null;

  // In tier-1 (highest fee): show how much to add to reach tier-2
  if (subtotal < config.tier1_max && config.tier2_fee < config.tier1_fee) {
    to_next_tier = Math.ceil(config.tier1_max - subtotal);
    next_fee = config.tier2_fee;
    message = `Add ₹${to_next_tier} from ${sellerName} to drop shipping ₹${config.tier1_fee} → ₹${config.tier2_fee}`;
  }

  // Show distance to free shipping
  const to_free = Math.ceil(config.tier2_max - subtotal);
  if (to_free > 0) {
    if (!message) {
      message = `Add ₹${to_free} from ${sellerName} for free shipping`;
    } else {
      secondary_message = `Add ₹${to_free} for free shipping`;
    }
  }

  return {
    type: to_next_tier ? 'tier_upgrade' : 'free_shipping',
    message,
    secondary_message,
    current_fee: currentFee,
    to_next_tier,
    next_fee,
    to_free: to_free > 0 ? to_free : 0,
    show_products: config.show_nudge_products || false,
  };
}

// eslint-disable-next-line no-unused-vars -- destructured only to drop the flags
function withoutAvailabilityFlags({ unavailable, area_blocked, area_label, available_stock, note, ...item }) {
  return item;
}

// ── Main financials engine ────────────────────────────────────────────────────
export function calculateFinancials(items = [], deliveryZone = null, configs = {}, deliveryArea = null) {
  if (!Array.isArray(items)) return _empty();
  const deliveryRegion = deliveryArea?.region || null;

  // 1. Flag items that can't be ordered: the seller doesn't deliver to the
  //    buyer's region or has excluded their state, or stock can't fulfil the quantity.
  //
  // These are NOT clamped locally. The backend cart row still holds the original
  // quantity, so clamping here only hides the mismatch: the item vanishes from
  // the UI while checkout keeps rejecting it with a 400 ("out of stock" /
  // "only N units available") and the buyer has nothing to remove. Flag instead,
  // keep the real quantity, and let the UI ask the buyer to fix it.
  // Flags are re-derived every time (items round-trip through localStorage), so
  // an item becomes orderable again once the delivery area or stock allows it.
  const adjustedItems = items
    .filter(item => item.quantity > 0)
    .map(withoutAvailabilityFlags)
    .map(item => {
      const delivery = deliveryForProduct(configs[item.product?.seller?.id]?.delivery, item.product?.id);
      const blockedLabel = undeliverableAreaLabel(delivery, deliveryArea);
      if (blockedLabel) {
        return {
          ...item,
          unavailable: true,
          area_blocked: true,
          area_label: blockedLabel,
          note: `Doesn't deliver to ${blockedLabel}`,
        };
      }
      const stock = item.variant?.stock ?? 999;
      if (item.quantity > stock) {
        return {
          ...item,
          unavailable: true,
          available_stock: stock,
          note: stock < 1 ? 'Out of stock' : 'Quantity adjusted',
        };
      }
      if (item.quantity > MAX_ITEM_QUANTITY) {
        return { ...item, quantity: MAX_ITEM_QUANTITY, note: 'Quantity adjusted' };
      }
      return item;
    });

  const availableItems = adjustedItems.filter(item => !item.unavailable);
  const unavailable_items = adjustedItems.filter(item => item.unavailable);

  // 2. Group by seller
  const seller_groups = {};
  for (const item of adjustedItems) {
    if (item.unavailable) continue;
    const product = item.product || {};
    const variant = item.variant || {};
    const sellerId = product.seller?.id || 'unknown';

    if (!seller_groups[sellerId]) {
      const sellerProfile = product.seller?.seller_profile || {};
      // shipping_days / cutoff / blackouts may come nested (core serializer) or flat (cart serializer)
      const shippingDays = sellerProfile.shipping_days ?? product.seller?.shipping_days ?? [];
      const cutoff = sellerProfile.daily_cutoff_time ?? product.seller?.daily_cutoff_time ?? '12:00';
      const blackouts = sellerProfile.blackout_dates ?? product.seller?.blackout_dates ?? [];
      const nextShippingDate = sellerProfile.next_shipping_date ?? product.seller?.next_shipping_date ?? null;
      seller_groups[sellerId] = {
        seller: product.seller || {},
        items: [],
        subtotal: 0,
        has_heavy: false,
        has_light: false,
        shipping_fee: 0,
        nudge: null,
        shipping_window: buildShippingWindow(shippingDays, deliveryZone, {
          cutoff,
          blackouts,
          nextShippingDate,
        }),
      };
    }

    const price = parseFloat(variant.price || product.price || 0);
    seller_groups[sellerId].items.push(item);
    seller_groups[sellerId].subtotal += price * item.quantity;

    // item_category on the variant drives light/heavy classification
    const cat = variant.item_category || 'light';
    if (cat === 'heavy') seller_groups[sellerId].has_heavy = true;
    if (cat === 'light') seller_groups[sellerId].has_light = true;
  }

  // 3. Per-seller shipping + nudge using DB-driven configs
  let shipping_total = 0;
  const sellerIds = Object.keys(seller_groups);

  for (const id of sellerIds) {
    const g = seller_groups[id];
    const storeName = g.seller?.store_name || g.seller?.seller_profile?.store_name || g.seller?.full_name || 'this seller';
    const blocked = deliveryZone === 'E';
    let cat = 'light';
    if (g.has_heavy && g.has_light) cat = 'hybrid';
    else if (g.has_heavy) cat = 'heavy';
    const sellerConfig = (configs[id] || {})[cat] || null;
    // A flat fee the seller set for the buyer's region replaces the slab fee.
    const regionFee = configs[id]?.delivery?.region_fees?.[deliveryRegion] ?? null;

    if (blocked) {
      g.shipping_fee = 0;
      g.nudge = null;
    } else if (regionFee !== null) {
      g.shipping_fee = regionFee;
      g.nudge = regionFee === 0 ? nudgeForSeller(g.subtotal, null, storeName) : null;
    } else {
      g.shipping_fee = sellerShippingFee(g.subtotal, sellerConfig);
      g.nudge = nudgeForSeller(g.subtotal, sellerConfig, storeName);
    }
  }

  const subtotal = availableItems.reduce((acc, item) => {
    return acc + parseFloat(item.variant?.price || item.product?.price || 0) * item.quantity;
  }, 0);
  const total_items = availableItems.reduce((acc, item) => acc + item.quantity, 0);
  // Sum each seller's individual shipping fee (calculated per-seller above)
  shipping_total = sellerIds.reduce((sum, id) => sum + (seller_groups[id].shipping_fee || 0), 0);

  return {
    items: adjustedItems,
    unavailable_items,
    total_items,
    subtotal,
    shipping_total,
    grand_total: subtotal + shipping_total,
    seller_groups,
    seller_count: sellerIds.length,
    sellers_at_limit: sellerIds.length >= MAX_SELLERS,
    delivery_zone: deliveryZone,
    delivery_blocked: deliveryZone === 'E',
  };
}

export function _empty() {
  return {
    items: [], unavailable_items: [], total_items: 0, subtotal: 0, shipping_total: 0, grand_total: 0,
    seller_groups: {}, seller_count: 0, sellers_at_limit: false,
    delivery_zone: null, delivery_blocked: false,
  };
}
