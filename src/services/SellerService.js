import api from './api';

export const SellerService = {
  // GET /api/sellers/?featured=true|false
  getVerifiedDirectory: async (params = {}) => {
    const response = await api.get('/sellers/', { params });
    return response.data;
  },

  getFeaturedCurator: async () => {
    const response = await api.get('/sellers/featured-curator/');
    return response.data;
  },

  getPlatformStats: async () => {
    const response = await api.get('/sellers/platform-stats/');
    return response.data;
  },

  getStoreDetails: async (slug) => {
    const response = await api.get(`/sellers/store/${slug}/`);
    return response.data;
  },
};
