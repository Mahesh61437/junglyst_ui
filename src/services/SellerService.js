import api from './api';

export const SellerService = {
  getVerifiedDirectory: async () => {
    try {
      const response = await api.get('/sellers/verified-directory/');
      return response.data;
    } catch (error) {
      console.error('Error fetching verified directory:', error);
      throw error;
    }
  },

  getFeaturedCurator: async () => {
    try {
      const response = await api.get('/sellers/featured-curator/');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured curator:', error);
      throw error;
    }
  },

  getPlatformStats: async () => {
    try {
      const response = await api.get('/sellers/platform-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  },

  getStoreDetails: async (slug) => {
    try {
      const response = await api.get(`/sellers/store/${slug}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching store details for ${slug}:`, error);
      throw error;
    }
  }
};
