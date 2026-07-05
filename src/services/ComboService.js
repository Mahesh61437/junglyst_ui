import api from './api';

export const ComboService = {
  // List published combos. Optional params: { featured: 1, type: 'plants_only' }
  getCombos: async (params = {}) => {
    try {
      const response = await api.get('/combos/', { params });
      // DRF may paginate; normalise to an array.
      return response.data?.results ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching combos:', error);
      throw error;
    }
  },

  // Single combo by slug (full detail with components grouped by seller).
  getCombo: async (slug) => {
    try {
      const response = await api.get(`/combos/${slug}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching combo ${slug}:`, error);
      throw error;
    }
  },
};
