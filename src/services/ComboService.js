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

  // ── SuperAdmin combo builder (auth required — IsAdminOrSuperAdmin) ────────

  // List every combo, including drafts/inactive ones.
  adminGetCombos: async () => {
    try {
      const response = await api.get('/combos/admin/');
      return response.data?.results ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching admin combos:', error);
      throw error;
    }
  },

  // comboData: { name, tagline, description, combo_type, image_url, price,
  //   shipping_fee, is_featured, is_active, is_draft, items: [{variant_id, quantity}] }
  adminCreateCombo: async (comboData) => {
    try {
      const response = await api.post('/combos/admin/', comboData);
      return response.data;
    } catch (error) {
      console.error('Error creating combo:', error);
      throw error;
    }
  },

  adminUpdateCombo: async (id, comboData) => {
    try {
      const response = await api.patch(`/combos/admin/${id}/`, comboData);
      return response.data;
    } catch (error) {
      console.error(`Error updating combo ${id}:`, error);
      throw error;
    }
  },

  adminDeleteCombo: async (id) => {
    try {
      const response = await api.delete(`/combos/admin/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting combo ${id}:`, error);
      throw error;
    }
  },
};
