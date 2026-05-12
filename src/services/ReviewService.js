import api from './api';

export const ReviewService = {
  getReviews: async (productId) => {
    try {
      const response = await api.get(`/core/reviews/?productId=${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    try {
      const isFormData = reviewData instanceof FormData;
      const response = await api.post('/core/reviews/', reviewData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }
};
