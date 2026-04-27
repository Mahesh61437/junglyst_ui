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
  const MAX_ITEM_QUANTITY = 10;

  // Internal helper to calculate financials from a raw items list
  const calculateFinancials = useCallback((items = []) => {
    if (!Array.isArray(items)) return { items: [], total_items: 0, subtotal: 0, tax_total: 0, shipping_total: 0, grand_total: 0 };
    
    // Auto-adjust items based on current stock/limits
    const adjustedItems = items.map(item => {
      const stock = item.variant?.stock ?? 999;
      const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);
      if (item.quantity > maxAllowed) {
        return { ...item, quantity: maxAllowed, note: stock === 0 ? "Out of stock" : "Quantity adjusted to available stock" };
      }
      return item;
    }).filter(item => item.quantity > 0 || item.note === "Out of stock");

    const subtotal = adjustedItems.reduce((acc, curr) => {
      const itemPrice = parseFloat(curr?.variant?.price || curr?.product?.price || curr?.price || 0);
      const itemQty = curr?.quantity || 0;
      return acc + (itemPrice * itemQty);
    }, 0);

    const tax_total = Math.round(subtotal * GST_RATE);
    const shipping_total = (subtotal >= SHIPPING_THRESHOLD || subtotal === 0) ? 0 : FLAT_SHIPPING;
    const grand_total = subtotal + tax_total + shipping_total;
    const total_items = adjustedItems.reduce((acc, curr) => acc + (curr?.quantity || 0), 0);

    return {
      items: adjustedItems,
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
    // Check local limit first
    const existing = cart.items.find(i => i.product.id === productId && (!variantId || i.variant?.id === variantId));
    const currentQty = existing ? existing.quantity : 0;
    
    if (currentQty + quantity > MAX_ITEM_QUANTITY) {
      alert(`Policy Limit: You can only acquire up to ${MAX_ITEM_QUANTITY} units of this specimen.`);
      return false;
    }

    // OPTIMISTIC UPDATE
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
          quantity: quantity,
          price: 0
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
    
    // Enforcement
    const stock = item.variant?.stock ?? 999;
    const maxAllowed = Math.min(MAX_ITEM_QUANTITY, stock);

    if (newQuantity > maxAllowed) {
      alert(`Availability Limit: Only ${maxAllowed} units can be acquired.`);
      return;
    }
    
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
