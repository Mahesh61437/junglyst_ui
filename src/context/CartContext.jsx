import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';
import { useRegion } from './RegionContext';

import {
  calculateFinancials, _empty,
  MAX_SELLERS, MAX_ITEM_QUANTITY, SHIPPING_CONFIG_RETRY_DELAYS_MS,
} from '../utils/cartFinancials';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

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
  // Tracks the previous auth state so we can detect a logout transition
  const wasAuthenticated = useRef(isAuthenticated);
  // Shipping configs keyed by seller_id → { light: TierConfig, heavy: TierConfig }
  const shippingConfigsRef = useRef({});

  // Delivery area { region, stateCode, stateName }: the delivery address (region
  // from its pincode, state from its State field) wins over the area picked in
  // the navbar — that is where the order actually ships.
  const { deliveryArea: selectedArea } = useRegion();
  const selectedAreaRef = useRef(selectedArea);
  const addressAreaRef = useRef(null);
  const deliveryAreaRef = useRef(selectedArea);

  const refreshDeliveryArea = useCallback(() => {
    const address = addressAreaRef.current;
    const selected = selectedAreaRef.current;
    deliveryAreaRef.current = address
      ? { region: address.region || selected?.region || null, stateCode: address.stateCode || null, stateName: address.stateName || null }
      : selected;
    setCart(prev => calculateFinancials(prev.items, deliveryZoneRef.current, shippingConfigsRef.current, deliveryAreaRef.current));
  }, []);

  useEffect(() => {
    selectedAreaRef.current = selectedArea;
    refreshDeliveryArea();
  }, [selectedArea, refreshDeliveryArea]);

  const recalc = useCallback((items, zone) => {
    setCart(calculateFinancials(items, zone, shippingConfigsRef.current, deliveryAreaRef.current));
  }, []);

  const fetchShippingConfigs = useCallback(async (items) => {
    const sellerIds = [...new Set(
      items.map(i => i.product?.seller?.id).filter(Boolean)
    )];
    if (sellerIds.length === 0) return;
    // Product ids let the server report category-restricted products' own regions.
    const productIds = [...new Set(items.map(i => i.product?.id).filter(Boolean))];
    const query = `seller_ids=${sellerIds.join(',')}&product_ids=${productIds.join(',')}`;
    // Retry briefly: without these configs the cart can't tell which sellers
    // deliver to the buyer's area and would show everything as orderable.
    for (let attempt = 0; attempt <= SHIPPING_CONFIG_RETRY_DELAYS_MS.length; attempt++) {
      try {
        const res = await api.get(`/cart/shipping-configs/?${query}`);
        shippingConfigsRef.current = res.data || {};
        return;
      } catch {
        const delay = SHIPPING_CONFIG_RETRY_DELAYS_MS[attempt];
        // Out of retries — fees fall back to 0; checkout re-validates delivery server-side.
        if (delay === undefined) return;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Checkout sets this from the delivery address; null falls back to the picked area.
  const setAddressArea = useCallback((area) => {
    addressAreaRef.current = area || null;
    refreshDeliveryArea();
  }, [refreshDeliveryArea]);

  const checkPincode = useCallback(async (pincode) => {
    if (!pincode || pincode.length !== 6) return null;
    setPincodeChecking(true);
    try {
      const res = await api.get(`/shipping/pincode-check/?pincode=${pincode}`);
      const data = res.data;
      const zone = data.deliverable ? data.zone : 'E';
      deliveryZoneRef.current = zone;
      // The pincode decides the region; keep any state the address already gave.
      addressAreaRef.current = { ...(addressAreaRef.current || {}), region: data.region || null };
      setDeliveryZoneState(zone);
      setPincodeResult(data);
      refreshDeliveryArea();
      return data;
    } catch {
      return null;
    } finally {
      setPincodeChecking(false);
    }
  }, [refreshDeliveryArea]);

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
      // On logout the previous user's server-backed rows are still sitting in
      // localStorage. They belong to an account we can no longer act on, so
      // carrying them into the guest session only produces a cart the buyer
      // can't edit and a checkout that 400s.
      if (!isAuthenticated && wasAuthenticated.current) {
        localStorage.removeItem('junglyst_cart');
        setCartId(null);
        setCart(_empty());
        setLoading(false);
        wasAuthenticated.current = false;
        return;
      }
      wasAuthenticated.current = isAuthenticated;

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
      return calculateFinancials(newItems, deliveryZoneRef.current, shippingConfigsRef.current, deliveryAreaRef.current);
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
        const serverMsg = error?.response?.data?.error;
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
    const stock = item.variant?.stock ?? 999;
    const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);
    let newQuantity = item.quantity + change;
    if (newQuantity > maxAllowed) {
      // Increases past the cap are refused. A row that already sits above the cap
      // (stock dropped after it was added) must still be reducible, and it has to
      // land on a value the backend will accept — otherwise update_item 400s and
      // the buyer stays stuck with an item checkout rejects.
      if (change > 0) {
        showToast(`Only ${maxAllowed} units available for this specimen.`, 'warning');
        return;
      }
      newQuantity = maxAllowed;
    }
    if (newQuantity < 1) return;
    setCart(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex] = { ...newItems[itemIndex], quantity: newQuantity };
      return calculateFinancials(newItems, deliveryZoneRef.current, shippingConfigsRef.current, deliveryAreaRef.current);
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
    setCart(prev => calculateFinancials(prev.items.filter((_, i) => i !== itemIndex), deliveryZoneRef.current, shippingConfigsRef.current, deliveryAreaRef.current));
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
    addressAreaRef.current = null;
    deliveryAreaRef.current = selectedAreaRef.current;
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
      setAddressArea,
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
