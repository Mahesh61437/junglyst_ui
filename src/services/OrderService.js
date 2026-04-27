import api from './api';

export const OrderService = {
  getOrders: async () => {
    try {
      const response = await api.get('/orders/');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  checkout: async (checkoutData) => {
    try {
      const response = await api.post('/orders/checkout/', checkoutData);
      return response.data;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/orders/checkout/verify/', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put('/orders/', { id, status });
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
};
