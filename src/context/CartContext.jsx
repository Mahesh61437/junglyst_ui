import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartService } from '../services/CartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Global Policy Constants
const GST_RATE = 0.18;
const GLOBAL_FREE_SHIPPING = 1500;
const PLANT_SINGLE_SELLER_FREE = 699;
const PLANT_MULTI_SELLER_FREE = 1000;
const ACCESSORY_FREE = 500;
const FLAT_SHIPPING_FEE = 49;
const MAX_SELLERS = 3;
const HEAVY_WEIGHT_THRESHOLD = 3; // 3kg
const MAX_ITEM_QUANTITY = 10;

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    total_items: 0,
    subtotal: 0,
    tax_total: 0,
    shipping_total: 0,
    grand_total: 0,
    seller_groups: {},
    remaining_for_free: 0
  });
  const [loading, setLoading] = useState(true);

  // High-Performance Logistics Engine
  const calculateFinancials = useCallback((items = []) => {
    if (!Array.isArray(items)) return { items: [], total_items: 0, subtotal: 0, tax_total: 0, shipping_total: 0, grand_total: 0, seller_groups: {}, remaining_for_free: 0 };

    // 1. Enforce Specimen Policy (Stock and Max Quantity)
    let adjustedItems = items.map(item => {
      const product = item.product || {};
      const variant = item.variant || {};
      const stock = variant.stock ?? 999;
      const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);

      if (item.quantity > maxAllowed) {
        return { ...item, quantity: maxAllowed, note: stock === 0 ? "Out of stock" : "Quantity adjusted" };
      }
      return item;
    }).filter(item => item.quantity > 0 || item.note === "Out of stock");

    // 2. Group by Seller for Logistics Analysis
    const seller_groups = {};
    adjustedItems.forEach(item => {
      if (item.note === "Out of stock") return;

      const product = item.product || {};
      const variant = item.variant || {};
      const sellerId = product.seller?.id || 'unknown';

      if (!seller_groups[sellerId]) {
        seller_groups[sellerId] = {
          seller: product.seller || {},
          items: [],
          subtotal: 0,
          weight: 0,
          has_plants: false,
          has_accessories: false
        };
      }

      const price = parseFloat(variant.price || product.price || 0);
      const weight = parseFloat(variant.weight || 0.5) * item.quantity;

      seller_groups[sellerId].items.push(item);
      seller_groups[sellerId].subtotal += (price * item.quantity);
      seller_groups[sellerId].weight += weight;

      // Category Detection
      const catType = product.categories?.[0]?.shipping_type || 'plant';
      if (catType === 'plant') seller_groups[sellerId].has_plants = true;
      if (catType === 'accessory') seller_groups[sellerId].has_accessories = true;
    });

    const subtotal = adjustedItems.reduce((acc, curr) => {
      const p = parseFloat(curr.variant?.price || curr.product?.price || 0);
      return acc + (p * curr.quantity);
    }, 0);

    // Internal GST Component
    const tax_total = Math.round((subtotal * 18) / 118);

    // 3. Multi-Tier Logistics Calculation
    let shipping_total = 0;
    const sellerIds = Object.keys(seller_groups);

    if (subtotal >= GLOBAL_FREE_SHIPPING || subtotal === 0) {
      shipping_total = 0;
    } else {
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

    const grand_total = subtotal + shipping_total;
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

  // Sync Strategy
  const syncCartWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const backendData = await CartService.getCart();
      const localItems = JSON.parse(localStorage.getItem('junglyst_cart') || '[]');

      if (localItems.length > 0) {
        for (const item of localItems) {
          await CartService.addToCart(item.product.id, item.quantity, item.variant?.id);
        }
        localStorage.removeItem('junglyst_cart');
      }

      const finalData = await CartService.getCart();
      setCart(calculateFinancials(finalData.items || []));
    } catch (error) {
      console.error("Cart sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, calculateFinancials]);

  // Initial Load & Persistence
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

  useEffect(() => {
    if (cart.items.length > 0 || !loading) {
      localStorage.setItem('junglyst_cart', JSON.stringify(cart.items));
    }
  }, [cart.items, loading]);

  const addItemToCart = async (productId, quantity = 1, variantId = null) => {
    const existing = cart.items.find(i => i.product.id === productId && (!variantId || i.variant?.id === variantId));
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + quantity > MAX_ITEM_QUANTITY) {
      alert(`Policy Limit: You can only acquire up to ${MAX_ITEM_QUANTITY} units of this specimen.`);
      return false;
    }

    setCart(prev => {
      const existingIndex = prev.items.findIndex(i =>
        i.product.id === productId && (!variantId || i.variant?.id === variantId)
      );

      let newItems = [...prev.items];
      if (existingIndex > -1) {
        newItems[existingIndex].quantity = Math.min(MAX_ITEM_QUANTITY, newItems[existingIndex].quantity + quantity);
      } else {
        newItems.push({
          id: `temp-${Date.now()}`,
          product: { id: productId },
          variant: variantId ? { id: variantId } : null,
          quantity: quantity
        });
      }
      return calculateFinancials(newItems);
    });

    if (isAuthenticated) {
      try {
        const updatedCart = await CartService.addToCart(productId, quantity, variantId);
        setCart(calculateFinancials(updatedCart.items || []));
      } catch (error) {
        console.error("Backend sync failed:", error);
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
      alert(`Availability Limit: Only ${maxAllowed} units can be acquired.`);
      return;
    }

    if (newQuantity < 1) return;

    setCart(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex].quantity = newQuantity;
      return calculateFinancials(newItems);
    });

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
      // Logistical Constants
      GLOBAL_FREE_SHIPPING,
      PLANT_SINGLE_SELLER_FREE,
      PLANT_MULTI_SELLER_FREE,
      ACCESSORY_FREE,
      FLAT_SHIPPING_FEE,
      MAX_SELLERS,
      MAX_ITEM_QUANTITY
    }}>
      {children}
    </CartContext.Provider>
  );
};
