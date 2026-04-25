import api from './api';

export const CartService = {
  // Get cart for current session/user
  getCart: async () => {
    try {
      const response = await api.get('/cart/');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await api.post('/cart/', { productId, quantity });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Update cart item (quantities)
  updateCart: async (cartData) => {
    try {
      const response = await api.put('/cart/', cartData);
      return response.data;
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }
};
