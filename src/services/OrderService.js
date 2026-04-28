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

  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders/checkout/', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
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
