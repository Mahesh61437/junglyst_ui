import api from './api';

export const ReviewService = {
  getReviews: async (productId) => {
    try {
      const response = await api.get(`/reviews?productId=${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews/', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }
};
