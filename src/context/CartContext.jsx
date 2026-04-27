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
      // Use variant price if available, fallback to product price
      const itemPrice = parseFloat(curr?.variant?.price || curr?.product?.price || 0);
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
      const items = data.items || [];
      setCart(calculateFinancials(items));
    } catch (error) {
      console.error("Failed to load global cart:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getItemStockLimit = (item) => {
    const raw =
      item?.variant?.stock ??
      item?.variant?.inventory ??
      item?.product_variant?.stock ??
      item?.product_variant?.inventory ??
      item?.product?.stock ??
      item?.product?.inventory ??
      item?.product?.variants?.[0]?.stock ??
      item?.product?.variants?.[0]?.inventory;
    const parsed = typeof raw === 'number' ? raw : parseInt(raw ?? '', 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const updateItemQuantity = async (itemIndex, change) => {
    const item = cart.items[itemIndex];
    if (!item) return;
    
    const stockLimit = getItemStockLimit(item);
    const unclamped = (item.quantity || 0) + change;
    const clampedLower = Math.max(0, unclamped);
    const newQuantity = stockLimit === null ? clampedLower : Math.min(stockLimit, clampedLower);
    if (newQuantity === item.quantity) return;

    try {
      const updatedCart = await CartService.updateItem(item.id, newQuantity);
      setCart(calculateFinancials(updatedCart.items || []));
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (itemIndex) => {
    const item = cart.items[itemIndex];
    if (!item) return;
    
    try {
      const updatedCart = await CartService.updateItem(item.id, 0);
      setCart(calculateFinancials(updatedCart.items || []));
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const clearCart = async () => {
    // This might need a backend implementation or just loop through items
    for (const item of cart.items) {
      await CartService.updateItem(item.id, 0);
    }
    setCart(calculateFinancials([]));
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItemToCart, updateItemQuantity, removeItem, clearCart, fetchCart, GST_RATE, SHIPPING_THRESHOLD, FLAT_SHIPPING }}>
      {children}
    </CartContext.Provider>
  );
}
