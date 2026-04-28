import api from './api';

export const ReviewService = {
  getReviews: async (productId) => {
    try {
      // Return mock data since backend endpoint is not yet implemented
      return {
        results: [
          {
            id: 1,
            author: "Plant Enthusiast",
            date: new Date().toLocaleDateString(),
            plants: 5,
            packaging: 4,
            responsiveness: 5,
            comment: "Amazing specimen! It arrived in perfect condition and is already showing new growth."
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    try {
      // Mock successful submission
      return {
        id: Math.floor(Math.random() * 10000),
        author: reviewData.author,
        date: new Date().toLocaleDateString(),
        plants: reviewData.plants,
        packaging: reviewData.packaging,
        responsiveness: reviewData.responsiveness,
        comment: reviewData.comment
      };
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }
};
