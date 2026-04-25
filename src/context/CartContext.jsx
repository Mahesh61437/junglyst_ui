import { createContext, useState, useEffect, useContext } from 'react';
import { CartService } from '../services/CartService';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
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

  // Initialize cart from backend/local on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const calculateFinancials = (items = []) => {
    if (!Array.isArray(items)) return { items: [], total_items: 0, subtotal: 0, tax_total: 0, shipping_total: 0, grand_total: 0 };
    
    const subtotal = items.reduce((acc, curr) => {
      const itemPrice = curr?.product?.price || 0;
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
  };

  const fetchCart = async () => {
    try {
      const data = await CartService.getCart();
      // Ensure data has the required structure
      const items = data.items || [];
      setCart(calculateFinancials(items));
    } catch (error) {
      console.error("Failed to load global cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToCart = async (productId, quantity = 1) => {
    try {
      const updatedCart = await CartService.addToCart(productId, quantity);
      setCart(calculateFinancials(updatedCart.items || []));
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return false;
    }
  };

  const updateItemQuantity = async (itemIndex, change) => {
    const newItems = [...cart.items];
    const item = { ...newItems[itemIndex] };
    
    if (item.quantity + change > 0) {
      item.quantity += change;
      newItems[itemIndex] = item;
      const updatedCartState = calculateFinancials(newItems);
      setCart(updatedCartState); // Optimistic update
      await CartService.updateCart(updatedCartState);
    }
  };

  const removeItem = async (itemIndex) => {
    const newItems = [...cart.items];
    newItems.splice(itemIndex, 1);
    const updatedCartState = calculateFinancials(newItems);
    setCart(updatedCartState); // Optimistic update
    await CartService.updateCart(updatedCartState);
  };

  const clearCart = async () => {
    const updatedCartState = calculateFinancials([]);
    setCart(updatedCartState);
    await CartService.updateCart(updatedCartState);
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItemToCart, updateItemQuantity, removeItem, clearCart, fetchCart, GST_RATE, SHIPPING_THRESHOLD, FLAT_SHIPPING }}>
      {children}
    </CartContext.Provider>
  );
}
