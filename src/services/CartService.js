import api from './api';

export const CartService = {
  // Get cart for current session/user
  getCart: async () => {
    try {
      const response = await api.get('/cart/');
      return response.data; // This is the serialized cart object
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, variantId = null) => {
    try {
      // If variantId is not provided, we might need a default one or a change in API
      // But for now, we expect variantId from the caller
      const response = await api.post('/cart/add_item/', { productId, quantity, variant_id: variantId });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Update item quantity
  updateItem: async (itemId, quantity) => {
    try {
      const response = await api.post('/cart/update_item/', { item_id: itemId, quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  getCheckoutNudge: async () => {
    try {
      const response = await api.get('/cart/checkout-nudge/');
      return response.data;
    } catch {
      return { recommendations: [] };
    }
  },
};
