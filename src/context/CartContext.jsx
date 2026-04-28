import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    total_items: 0,
    subtotal: 0,
    tax_total: 0,
    shipping_total: 0,
    grand_total: 0
  });
  const [loading, setLoading] = useState(true);

  // Constants for complex logistics
  const GST_RATE = 0.18;
  const GLOBAL_FREE_SHIPPING = 1500;
  const PLANT_SINGLE_SELLER_FREE = 699;
  const PLANT_MULTI_SELLER_FREE = 1000;
  const ACCESSORY_FREE = 500;
  const FLAT_SHIPPING_FEE = 49;
  const MAX_SELLERS = 3;
  const HEAVY_WEIGHT_THRESHOLD = 3; // 3kg

  // Internal helper to calculate financials from a raw items list
  const calculateFinancials = useCallback((items = []) => {
    if (!Array.isArray(items)) return { items: [], total_items: 0, subtotal: 0, tax_total: 0, shipping_total: 0, grand_total: 0, seller_groups: {} };

    // 1. Enforce Specimen Policy (Stock and Max Quantity)
    let adjustedItems = items.map(item => {
      const stock = item.variant?.stock ?? 999;
      const maxAllowed = Math.min(10, stock);
      if (item.quantity > maxAllowed) {
        return { ...item, quantity: maxAllowed, note: stock === 0 ? "Out of stock" : "Quantity adjusted" };
      }
      return item;
    }).filter(item => item.quantity > 0 || item.note === "Out of stock");

    // 2. Group by Seller for Logistics Analysis
    const seller_groups = {};
    adjustedItems.forEach(item => {
      const sellerId = item.product?.seller?.id || 'unknown';
      if (!seller_groups[sellerId]) {
        seller_groups[sellerId] = {
          seller: item.product?.seller || {},
          items: [],
          subtotal: 0,
          weight: 0,
          has_plants: false,
          has_accessories: false
        };
      }
      const price = parseFloat(item.variant?.price || item.product?.price || 0);
      const weight = parseFloat(item.variant?.weight || 0.5) * item.quantity;

      seller_groups[sellerId].items.push(item);
      seller_groups[sellerId].subtotal += (price * item.quantity);
      seller_groups[sellerId].weight += weight;

      // Determine category types for shipping rules
      const catType = item.product?.categories?.[0]?.shipping_type || 'plant';
      if (catType === 'plant') seller_groups[sellerId].has_plants = true;
      if (catType === 'accessory') seller_groups[sellerId].has_accessories = true;
    });

    // Enforce 3 Seller Limit
    const sellerIds = Object.keys(seller_groups);
    if (sellerIds.length > MAX_SELLERS) {
      alert(`AOV Policy: Curated collections are limited to ${MAX_SELLERS} unique studios. Please refine your selection.`);
      // We could auto-remove or just warn. For now, we allow but keep the alert.
    }

    const subtotal = adjustedItems.reduce((acc, curr) => acc + (parseFloat(curr.variant?.price || curr.product?.price || 0) * curr.quantity), 0);
    const tax_total = Math.round(subtotal * GST_RATE);

    // 3. Calculate Global Logistics Fee
    let shipping_total = 0;

    if (subtotal >= GLOBAL_FREE_SHIPPING || subtotal === 0) {
      shipping_total = 0;
    } else {
      // Calculate per seller or aggregate based on user rules
      const isMultiSeller = sellerIds.length > 1;
      let allRulesMet = true;

      sellerIds.forEach(id => {
        const group = seller_groups[id];
        let sellerShippingMet = false;

        if (group.weight >= HEAVY_WEIGHT_THRESHOLD) sellerShippingMet = true;
        else if (group.has_accessories && group.subtotal >= ACCESSORY_FREE) sellerShippingMet = true;
        else if (group.has_plants) {
          if (!isMultiSeller && group.subtotal >= PLANT_SINGLE_SELLER_FREE) sellerShippingMet = true;
          else if (isMultiSeller && subtotal >= PLANT_MULTI_SELLER_FREE) sellerShippingMet = true;
        }

        if (!sellerShippingMet) allRulesMet = false;
      });

      shipping_total = allRulesMet ? 0 : FLAT_SHIPPING_FEE;
    }

    const grand_total = subtotal + tax_total + shipping_total;
    const total_items = adjustedItems.reduce((acc, curr) => acc + (curr?.quantity || 0), 0);

    return {
      items: adjustedItems,
      total_items,
      subtotal,
      tax_total,
      shipping_total,
      grand_total,
      seller_groups,
      remaining_for_free: Math.max(0, GLOBAL_FREE_SHIPPING - subtotal)
    };
  }, []);

  // Save to localStorage whenever cart changes (for guest persistence)
  useEffect(() => {
    if (cart.items.length > 0 || !loading) {
      localStorage.setItem('junglyst_cart', JSON.stringify(cart.items));
    }
  }, [cart.items, loading]);

  // Sync Logic
  const syncCartWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const backendData = await CartService.getCart();
      const backendItems = backendData.items || [];

      // Merge Strategy: Local items take precedence if they exist
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');

      if (localItems.length > 0) {
        for (const item of localItems) {
          // Verify against stock if possible before adding
          await CartService.addToCart(item.product.id, item.quantity, item.variant?.id);
        }
        localStorage.removeItem('junglyst_cart');
      }

      // Fetch fresh merged/adjusted cart
      const finalData = await CartService.getCart();
      setCart(calculateFinancials(finalData.items || []));
    } catch (error) {
      console.error("Cart sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, calculateFinancials]);

  // Initial Load
  useEffect(() => {
    const initCart = async () => {
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');
      if (localItems.length > 0) {
        setCart(calculateFinancials(localItems));
      }

      if (isAuthenticated) {
        await syncCartWithBackend();
      } else {
        setLoading(false);
      }
    };
    initCart();
  }, [isAuthenticated, syncCartWithBackend, calculateFinancials]);

  const addItemToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      const updatedCart = await CartService.addToCart(productId, quantity, variantId);
      setCart(calculateFinancials(updatedCart.items || []));
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return false;
    }
  };

  const updateItemQuantity = async (itemIndex, change) => {
    const item = cart.items[itemIndex];
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      try {
        const updatedCart = await CartService.updateItem(item.id, newQuantity);
        setCart(calculateFinancials(updatedCart.items || []));
      } catch (error) {
        console.error("Failed to update quantity:", error);
      }
    }
  };

  const removeItem = async (itemIndex) => {
    const item = cart.items[itemIndex];
    if (!item) return;

    // Optimistic Update
    setCart(prev => {
      const newItems = prev.items.filter((_, i) => i !== itemIndex);
      return calculateFinancials(newItems);
    });

    if (isAuthenticated && !item.id.toString().startsWith('temp-')) {
      try {
        const updatedCart = await CartService.updateItem(item.id, 0);
        setCart(calculateFinancials(updatedCart.items || []));
      } catch (error) {
        console.error("Failed to sync removal:", error);
      }
    }
  };

  const clearCart = async () => {
    localStorage.removeItem('junglyst_cart');
    setCart(calculateFinancials([]));
    if (isAuthenticated) {
      // Backend clear logic if needed
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addItemToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      fetchCart: syncCartWithBackend,
      GST_RATE,
      SHIPPING_THRESHOLD,
      FLAT_SHIPPING
    }}>
      {children}
    </CartContext.Provider>
  );
}
