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

  // Constants for financial logic
  const GST_RATE = 0.18;
  const SHIPPING_THRESHOLD = 999;
  const FLAT_SHIPPING = 99;

  // Internal helper to calculate financials from a raw items list
  const calculateFinancials = useCallback((items = []) => {
    if (!Array.isArray(items)) return { items: [], total_items: 0, subtotal: 0, tax_total: 0, shipping_total: 0, grand_total: 0 };
    
    const subtotal = items.reduce((acc, curr) => {
      const itemPrice = parseFloat(curr?.variant?.price || curr?.product?.price || curr?.price || 0);
      const itemQty = curr?.quantity || 0;
      return acc + (itemPrice * itemQty);
    }, 0);

    const tax_total = Math.round(subtotal * GST_RATE);
    const shipping_total = (subtotal >= SHIPPING_THRESHOLD || subtotal === 0) ? 0 : FLAT_SHIPPING;
    const grand_total = subtotal + tax_total + shipping_total;
    const total_items = items.reduce((acc, curr) => acc + (curr?.quantity || 0), 0);

    return {
      items,
      total_items,
      subtotal,
      tax_total,
      shipping_total,
      grand_total
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
        // Simple merge: Add local items to backend
        for (const item of localItems) {
          await CartService.addToCart(item.product.id, item.quantity, item.variant?.id);
        }
        // Clear local after successful merge
        localStorage.removeItem('junglyst_cart');
        // Fetch fresh merged cart
        const mergedData = await CartService.getCart();
        setCart(calculateFinancials(mergedData.items || []));
      } else {
        setCart(calculateFinancials(backendItems));
      }
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
    // OPTIMISTIC UPDATE: Update local state immediately
    setCart(prev => {
      const existingIndex = prev.items.findIndex(i => 
        i.product.id === productId && (!variantId || i.variant?.id === variantId)
      );
      
      let newItems = [...prev.items];
      if (existingIndex > -1) {
        newItems[existingIndex].quantity += quantity;
      } else {
        // Minimal item structure for local display
        newItems.push({
          id: `temp-${Date.now()}`,
          product: { id: productId }, // Full product details usually come from props
          variant: variantId ? { id: variantId } : null,
          quantity: quantity,
          price: 0 // Will be updated when sync happens or from context
        });
      }
      return calculateFinancials(newItems);
    });

    // Background Backend Sync
    if (isAuthenticated) {
      try {
        const updatedCart = await CartService.addToCart(productId, quantity, variantId);
        setCart(calculateFinancials(updatedCart.items || []));
      } catch (error) {
        console.error("Backend sync failed:", error);
        // We keep local state for now, it will re-sync on next full fetch
      }
    }
    return true;
  };

  const updateItemQuantity = async (itemIndex, change) => {
    const item = cart.items[itemIndex];
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    // Optimistic Update
    setCart(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex].quantity = newQuantity;
      return calculateFinancials(newItems);
    });

    if (isAuthenticated && !item.id.toString().startsWith('temp-')) {
      try {
        const updatedCart = await CartService.updateItem(item.id, newQuantity);
        setCart(calculateFinancials(updatedCart.items || []));
      } catch (error) {
        console.error("Failed to sync quantity:", error);
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
