import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// ── Shipping fee constants (SHIP-002 spec) ───────────────────────────────────
const MAX_SELLERS = 3;
const MIN_SELLER_SUBTOTAL = 500;
const MAX_ITEM_QUANTITY = 10;

const LIGHT_TIERS = [
  { max: 699, fee: 99 },
  { max: 999, fee: 49 },
  { max: Infinity, fee: 0 },
];
const HEAVY_TIERS = [
  { max: 999, fee: 99 },
  { max: 2499, fee: 49 },
  { max: Infinity, fee: 0 },
];
const LIGHT_FREE_THRESHOLD = 999;
const HEAVY_FREE_THRESHOLD = 2499;

function sellerShippingFee(subtotal, hasHeavy) {
  const tiers = hasHeavy ? HEAVY_TIERS : LIGHT_TIERS;
  for (const tier of tiers) {
    if (subtotal < tier.max) return tier.fee;
  }
  return 0;
}

function nudgeForSeller(subtotal, hasHeavy, sellerName) {
  const threshold = hasHeavy ? HEAVY_FREE_THRESHOLD : LIGHT_FREE_THRESHOLD;
  const remaining = threshold - subtotal;
  if (remaining <= 0) return { type: 'free', message: `✓ Free shipping from ${sellerName}` };
  if (remaining <= 200) return { type: 'nudge', message: `Add ₹${Math.ceil(remaining)} more from ${sellerName} for free shipping` };
  return null;
}

// ── Main financials engine ────────────────────────────────────────────────────
function calculateFinancials(items = [], deliveryZone = null) {
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
      seller_groups[sellerId] = {
        seller: product.seller || {},
        items: [],
        subtotal: 0,
        has_heavy: false,
        below_minimum: false,
        shipping_fee: 0,
        nudge: null,
      };
    }

    const price = parseFloat(variant.price || product.price || 0);
    seller_groups[sellerId].items.push(item);
    seller_groups[sellerId].subtotal += price * item.quantity;

    // item_category on the variant drives light/heavy classification
    const cat = variant.item_category || 'light';
    if (cat === 'heavy') seller_groups[sellerId].has_heavy = true;
  }

  // 3. Per-seller shipping fee + nudge + min-order flag
  let shipping_total = 0;
  const sellerIds = Object.keys(seller_groups);

  for (const id of sellerIds) {
    const g = seller_groups[id];
    const storeName = g.seller?.seller_profile?.store_name || g.seller?.full_name || 'this seller';
    const blocked = deliveryZone === 'E';

    if (!blocked) {
      g.shipping_fee = sellerShippingFee(g.subtotal, g.has_heavy);
      g.nudge = nudgeForSeller(g.subtotal, g.has_heavy, storeName);
    }
    g.below_minimum = g.subtotal < MIN_SELLER_SUBTOTAL;
    shipping_total += g.shipping_fee;
  }

  const subtotal = adjustedItems.reduce((acc, item) => {
    return acc + parseFloat(item.variant?.price || item.product?.price || 0) * item.quantity;
  }, 0);
  const total_items = adjustedItems.reduce((acc, item) => acc + item.quantity, 0);

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

  const recalc = useCallback((items, zone) => {
    setCart(calculateFinancials(items, zone));
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
      setCart(prev => calculateFinancials(prev.items, zone));
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
      recalc(normalizeItems(finalData.items || []), deliveryZoneRef.current);
    } catch (error) {
      console.error('Cart sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, recalc]);

  useEffect(() => {
    const init = async () => {
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');
      if (localItems.length > 0) recalc(localItems, null);
      if (isAuthenticated) {
        await syncCartWithBackend();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [isAuthenticated, syncCartWithBackend, recalc]);

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
      return calculateFinancials(newItems, deliveryZoneRef.current);
    });

    if (isAuthenticated) {
      try {
        const updatedCart = await CartService.addToCart(productId, quantity, variantId);
        if (updatedCart.id) setCartId(updatedCart.id);
        const newItems = normalizeItems(updatedCart.items || []);
        // SHIP-003: real check after backend confirms
        const realGroups = Object.keys(calculateFinancials(newItems, null).seller_groups);
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
      return calculateFinancials(newItems, deliveryZoneRef.current);
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
    setCart(prev => calculateFinancials(prev.items.filter((_, i) => i !== itemIndex), deliveryZoneRef.current));
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
      MIN_SELLER_SUBTOTAL,
      MAX_ITEM_QUANTITY,
      LIGHT_FREE_THRESHOLD,
      HEAVY_FREE_THRESHOLD,
    }}>
      {children}
    </CartContext.Provider>
  );
};
