import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';

// ── Shipping window helpers ───────────────────────────────────────────────────
// shipping_days uses Python/ISO convention: 0=Mon … 6=Sun
// JS Date.getDay() uses: 0=Sun, 1=Mon … 6=Sat → convert via (jsDay + 6) % 7
function getNextShippingDate(shippingDays) {
  if (!shippingDays || shippingDays.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jsDay = today.getDay();
  const currentWeekday = (jsDay + 6) % 7; // convert to ISO Mon=0
  const sorted = [...new Set(shippingDays)].sort((a, b) => a - b);
  for (const day of sorted) {
    if (day >= currentWeekday) {
      const next = new Date(today);
      next.setDate(today.getDate() + (day - currentWeekday));
      return next;
    }
  }
  // Wrap to next week
  const next = new Date(today);
  next.setDate(today.getDate() + (7 - currentWeekday + sorted[0]));
  return next;
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

export function buildShippingWindow(shippingDays, zone = null) {
  const next = getNextShippingDate(shippingDays);
  if (!next) return null;
  const { min: minDays, max: maxDays } = transitDays(zone);
  const min = new Date(next); min.setDate(next.getDate() + minDays);
  const max = new Date(next); max.setDate(next.getDate() + maxDays);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const minStr = `${min.getDate()} ${MON[min.getMonth()]}`;
  const maxStr = `${max.getDate()} ${MON[max.getMonth()]}`;
  return {
    ships_on: formatShipDate(next),
    ships_date: next,
    estimated_delivery: `${minStr} – ${maxStr}`,
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
      // shipping_days may come nested (core serializer) or flat (cart serializer)
      const shippingDays = sellerProfile.shipping_days ?? product.seller?.shipping_days;
      seller_groups[sellerId] = {
        seller: product.seller || {},
        items: [],
        subtotal: 0,
        has_heavy: false,
        shipping_fee: 0,
        nudge: null,
        shipping_window: buildShippingWindow(shippingDays, deliveryZone),
      };
    }

    const price = parseFloat(variant.price || product.price || 0);
    seller_groups[sellerId].items.push(item);
    seller_groups[sellerId].subtotal += price * item.quantity;

    // item_category on the variant drives light/heavy classification
    const cat = variant.item_category || 'light';
    if (cat === 'heavy') seller_groups[sellerId].has_heavy = true;
  }

  // 3. Per-seller shipping + nudge using DB-driven configs
  let shipping_total = 0;
  const sellerIds = Object.keys(seller_groups);

  for (const id of sellerIds) {
    const g = seller_groups[id];
    const storeName = g.seller?.store_name || g.seller?.seller_profile?.store_name || g.seller?.full_name || 'this seller';
    const blocked = deliveryZone === 'E';
    const cat = g.has_heavy ? 'heavy' : 'light';
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

    // SHIP-003: block 4th seller (optimistic check using known seller IDs)
    if (!existing && cart.sellers_at_limit) {
      const knownSellerItems = cart.items.some(i => i.product.id === productId);
      if (!knownSellerItems) {
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
        // SHIP-003: real check after backend confirms
        const realGroups = Object.keys(calculateFinancials(newItems, null, shippingConfigsRef.current).seller_groups);
        if (realGroups.length > MAX_SELLERS) {
          const addedItem = newItems.find(i =>
            i.product?.id === productId && (!variantId || i.variant?.id === variantId)
          );
          if (addedItem) {
            await CartService.updateItem(addedItem.id, existing ? existing.quantity : 0);
          }
          const revertedCart = await CartService.getCart();
          recalc(normalizeItems(revertedCart.items || []), deliveryZoneRef.current);
          showToast('Your cart supports up to 3 sellers. Remove an item to add from a new seller.', 'warning');
          return false;
        }
        recalc(newItems, deliveryZoneRef.current);
      } catch (error) {
        console.error('Backend sync failed:', error);
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
    setCart(_empty());
    deliveryZoneRef.current = null;
    setDeliveryZoneState(null);
    setPincodeResult(null);
  };

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
    }}>
      {children}
    </CartContext.Provider>
  );
};
