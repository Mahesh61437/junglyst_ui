import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';

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

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// ── Cart policy constants ─────────────────────────────────────────────────────
const MAX_SELLERS = 3;
const MAX_ITEM_QUANTITY = 10;

// Shipping fee and nudge are driven by per-seller DB config fetched from the API.
// configs shape: { [sellerId]: { light?: TierConfig, heavy?: TierConfig } }
// TierConfig: { tier1_max, tier1_fee, tier2_max, tier2_fee, show_nudge_products }

function sellerShippingFee(subtotal, config) {
  if (!config) return 0;
  if (subtotal < config.tier1_max) return config.tier1_fee;
  if (subtotal < config.tier2_max) return config.tier2_fee;
  return 0;
}

function nudgeForSeller(subtotal, config, sellerName) {
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

// ── Main financials engine ────────────────────────────────────────────────────
function calculateFinancials(items = [], deliveryZone = null, configs = {}) {
  if (!Array.isArray(items)) return _empty();

  // 1. Clamp quantities to stock / policy max
  const adjustedItems = items.map(item => {
    const stock = item.variant?.stock ?? 999;
    const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);
    if (item.quantity > maxAllowed) {
      return { ...item, quantity: maxAllowed, note: stock === 0 ? 'Out of stock' : 'Quantity adjusted' };
    }
    return item;
  }).filter(item => item.quantity > 0 || item.note === 'Out of stock');

  // 2. Group by seller
  const seller_groups = {};
  for (const item of adjustedItems) {
    if (item.note === 'Out of stock') continue;
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

    if (!blocked) {
      g.shipping_fee = sellerShippingFee(g.subtotal, sellerConfig);
      g.nudge = nudgeForSeller(g.subtotal, sellerConfig, storeName);
    } else {
      g.shipping_fee = 0;
      g.nudge = null;
    }
  }

  const subtotal = adjustedItems.reduce((acc, item) => {
    return acc + parseFloat(item.variant?.price || item.product?.price || 0) * item.quantity;
  }, 0);
  const total_items = adjustedItems.reduce((acc, item) => acc + item.quantity, 0);
  // Sum each seller's individual shipping fee (calculated per-seller above)
  shipping_total = sellerIds.reduce((sum, id) => sum + (seller_groups[id].shipping_fee || 0), 0);

  return {
    items: adjustedItems,
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

function _empty() {
  return {
    items: [], total_items: 0, subtotal: 0, shipping_total: 0, grand_total: 0,
    seller_groups: {}, seller_count: 0, sellers_at_limit: false,
    delivery_zone: null, delivery_blocked: false,
  };
}

// ── Combo cart lines ──────────────────────────────────────────────────────────
// Combos are kept in a SEPARATE list from per-variant `cart.items` so the existing
// per-seller shipping engine and 3-seller cap stay untouched. A combo is one line
// with ONE flat shipping fee, regardless of how many growers ship its components.
const COMBO_STORAGE_KEY = 'junglyst_combo_cart';
const MAX_COMBO_QTY = 10;

function loadComboLines() {
  try {
    const raw = JSON.parse(localStorage.getItem(COMBO_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// Build a persistable combo line from a detail-combo payload + chosen qty.
// Only in-stock components are included (partial-availability rule).
function buildComboLine(combo, qty) {
  const available = (combo.items || []).filter((it) => it.in_stock);
  const unitPrice = available.reduce((s, it) => s + Number(it.line_total || 0), 0);
  const growerIds = [...new Set(available.map((it) => it.seller_id))];
  return {
    lineId: `combo-${combo.id}-${Date.now()}`,
    comboId: combo.id,
    slug: combo.slug,
    name: combo.name,
    type: combo.type,
    image_url: combo.image_url || null,
    qty: Math.min(MAX_COMBO_QTY, Math.max(1, qty)),
    shipping_fee: Number(combo.shipping_fee || 0),
    unit_price: unitPrice,
    grower_count: growerIds.length,
    sellers: combo.sellers || [],
    items: available.map((it) => ({
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_name: it.variant_name,
      product_slug: it.product_slug,
      image_url: it.image_url || null,
      unit_price: Number(it.unit_price || 0),
      line_total: Number(it.line_total || 0),
      quantity: it.quantity,
      seller_id: it.seller_id,
    })),
  };
}

// Normalize backend cart items: map product_details/variant_details → product/variant
function normalizeItems(items = []) {
  return items.map(item => ({
    ...item,
    product: item.product_details || item.product,
    variant: item.variant_details || item.variant,
  }));
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState(_empty());
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryZone, setDeliveryZoneState] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const deliveryZoneRef = useRef(null);
  // Shipping configs keyed by seller_id → { light: TierConfig, heavy: TierConfig }
  const shippingConfigsRef = useRef({});
  // Combo cart lines (separate from per-variant items; client-side persisted).
  const [comboLines, setComboLines] = useState(loadComboLines);

  const recalc = useCallback((items, zone) => {
    setCart(calculateFinancials(items, zone, shippingConfigsRef.current));
  }, []);

  const fetchShippingConfigs = useCallback(async (items) => {
    const sellerIds = [...new Set(
      items.map(i => i.product?.seller?.id).filter(Boolean)
    )];
    if (sellerIds.length === 0) return;
    try {
      const res = await api.get(`/cart/shipping-configs/?seller_ids=${sellerIds.join(',')}`);
      shippingConfigsRef.current = res.data || {};
    } catch {
      // fail silently — shipping defaults to 0 when configs unavailable
    }
  }, []);

  const checkPincode = useCallback(async (pincode) => {
    if (!pincode || pincode.length !== 6) return null;
    setPincodeChecking(true);
    try {
      const res = await api.get(`/shipping/pincode-check/?pincode=${pincode}`);
      const data = res.data;
      const zone = data.deliverable ? data.zone : 'E';
      deliveryZoneRef.current = zone;
      setDeliveryZoneState(zone);
      setPincodeResult(data);
      setCart(prev => calculateFinancials(prev.items, zone, shippingConfigsRef.current));
      return data;
    } catch {
      return null;
    } finally {
      setPincodeChecking(false);
    }
  }, []);

  const syncCartWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');
      // Only sync items that were added while unauthenticated (temp IDs)
      const pendingItems = localItems.filter(i => String(i.id).startsWith('temp-'));
      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          try {
            await CartService.addToCart(item.product.id, item.quantity, item.variant?.id);
          } catch {
            // skip items that fail (e.g. out of stock, variant removed)
          }
        }
      }
      localStorage.removeItem('junglyst_cart');
      const finalData = await CartService.getCart();
      if (finalData.id) setCartId(finalData.id);
      const freshItems = normalizeItems(finalData.items || []);
      await fetchShippingConfigs(freshItems);
      recalc(freshItems, deliveryZoneRef.current);
    } catch (error) {
      console.error('Cart sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, recalc, fetchShippingConfigs]);

  useEffect(() => {
    const init = async () => {
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');
      if (localItems.length > 0) {
        await fetchShippingConfigs(localItems);
        recalc(localItems, null);
      }
      if (isAuthenticated) {
        await syncCartWithBackend();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [isAuthenticated, syncCartWithBackend, recalc, fetchShippingConfigs]);

  useEffect(() => {
    if (cart.items.length > 0 || !loading) {
      localStorage.setItem('junglyst_cart', JSON.stringify(cart.items));
    }
  }, [cart.items, loading]);

  const addItemToCart = async (productId, quantity = 1, variantId = null, productData = null, variantData = null) => {
    const existing = cart.items.find(i =>
      i.product.id === productId && (!variantId || i.variant?.id === variantId)
    );

    if (existing && existing.quantity + quantity > MAX_ITEM_QUANTITY) {
      showToast(`You can only acquire up to ${MAX_ITEM_QUANTITY} units of this specimen.`, 'warning');
      return false;
    }

    // SHIP-003: block 4th seller (optimistic check using known seller IDs).
    // Only block when the incoming product comes from a seller NOT already in the cart.
    // If we don't know the incoming seller (no productData), defer to the backend check below.
    if (!existing && cart.sellers_at_limit) {
      const incomingSellerId = productData?.seller?.id;
      const cartSellerIds = new Set(Object.keys(cart.seller_groups || {}));
      if (incomingSellerId && !cartSellerIds.has(incomingSellerId)) {
        showToast('Your cart supports up to 3 sellers. Remove an item to add from a new seller.', 'warning');
        return false;
      }
    }

    // Optimistic update — use rich product/variant data when provided (guest local cart)
    setCart(prev => {
      const idx = prev.items.findIndex(i =>
        i.product.id === productId && (!variantId || i.variant?.id === variantId)
      );
      const newItems = [...prev.items];
      if (idx > -1) {
        newItems[idx] = { ...newItems[idx], quantity: Math.min(MAX_ITEM_QUANTITY, newItems[idx].quantity + quantity) };
      } else {
        const localProduct = productData ? { ...productData, id: productId } : { id: productId };
        const localVariant = variantData ? { ...variantData, id: variantId ?? variantData.id } : (variantId ? { id: variantId } : null);
        newItems.push({ id: `temp-${Date.now()}`, product: localProduct, variant: localVariant, quantity });
      }
      return calculateFinancials(newItems, deliveryZoneRef.current, shippingConfigsRef.current);
    });

    if (isAuthenticated) {
      try {
        const updatedCart = await CartService.addToCart(productId, quantity, variantId);
        if (updatedCart.id) setCartId(updatedCart.id);
        const newItems = normalizeItems(updatedCart.items || []);
        await fetchShippingConfigs(newItems);
        recalc(newItems, deliveryZoneRef.current);
      } catch (error) {
        // Roll back the optimistic update by re-syncing with server.
        // Surface the server's error message (e.g. SHIP-003 3-seller cap, stock) as a toast.
        const serverMsg = error.userMessage;
        try {
          const revertedCart = await CartService.getCart();
          recalc(normalizeItems(revertedCart.items || []), deliveryZoneRef.current);
        } catch {
          // ignore — leave optimistic state; next sync will reconcile
        }
        if (serverMsg) {
          showToast(serverMsg, 'warning');
        } else {
          console.error('Backend sync failed:', error);
        }
        return false;
      }
    }
    return true;
  };

  const updateItemQuantity = async (itemIndex, change) => {
    const item = cart.items[itemIndex];
    if (!item) return;
    const newQuantity = item.quantity + change;
    const stock = item.variant?.stock ?? 999;
    const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);
    if (newQuantity > maxAllowed) {
      showToast(`Only ${maxAllowed} units available for this specimen.`, 'warning');
      return;
    }
    if (newQuantity < 1) return;
    setCart(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex] = { ...newItems[itemIndex], quantity: newQuantity };
      return calculateFinancials(newItems, deliveryZoneRef.current, shippingConfigsRef.current);
    });
    if (isAuthenticated) {
      try {
        const updatedCart = await CartService.updateItem(item.id, newQuantity);
        recalc(normalizeItems(updatedCart.items || []), deliveryZoneRef.current);
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    }
  };

  const removeItem = async (itemIndex) => {
    const item = cart.items[itemIndex];
    if (!item) return;
    setCart(prev => calculateFinancials(prev.items.filter((_, i) => i !== itemIndex), deliveryZoneRef.current, shippingConfigsRef.current));
    if (isAuthenticated && !item.id?.toString().startsWith('temp-')) {
      try {
        const updatedCart = await CartService.updateItem(item.id, 0);
        recalc(normalizeItems(updatedCart.items || []), deliveryZoneRef.current);
      } catch (error) {
        console.error('Failed to sync removal:', error);
      }
    }
  };

  const clearCart = async () => {
    localStorage.removeItem('junglyst_cart');
    localStorage.removeItem(COMBO_STORAGE_KEY);
    setCart(_empty());
    setComboLines([]);
    deliveryZoneRef.current = null;
    setDeliveryZoneState(null);
    setPincodeResult(null);
  };

  // ── Combo line actions ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(COMBO_STORAGE_KEY, JSON.stringify(comboLines));
  }, [comboLines]);

  const addComboToCart = useCallback(async (combo, qty = 1) => {
    if (!combo?.id) return false;
    const line = buildComboLine(combo, qty);
    if (line.items.length === 0) {
      showToast('This combo is currently sold out.', 'warning');
      return false;
    }
    setComboLines((prev) => {
      const idx = prev.findIndex((l) => l.comboId === combo.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(MAX_COMBO_QTY, next[idx].qty + line.qty) };
        return next;
      }
      return [...prev, line];
    });
    return true;
  }, [showToast]);

  const updateComboQty = useCallback((lineId, change) => {
    setComboLines((prev) => prev.map((l) => {
      if (l.lineId !== lineId) return l;
      const next = Math.min(MAX_COMBO_QTY, Math.max(1, l.qty + change));
      return { ...l, qty: next };
    }));
  }, []);

  const removeCombo = useCallback((lineId) => {
    setComboLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const comboSubtotal = comboLines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  const comboShipping = comboLines.reduce((s, l) => s + Number(l.shipping_fee || 0), 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartId,
      loading,
      deliveryZone,
      pincodeChecking,
      pincodeResult,
      checkPincode,
      addItemToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      fetchCart: syncCartWithBackend,
      MAX_SELLERS,
      MAX_ITEM_QUANTITY,
      // Combos
      comboLines,
      comboSubtotal,
      comboShipping,
      addComboToCart,
      updateComboQty,
      removeCombo,
    }}>
      {children}
    </CartContext.Provider>
  );
};
