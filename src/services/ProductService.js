import api from './api';

export const ProductService = {
  // Get all products
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/core/products/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product details
  getProduct: async (idOrSlug) => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const path = isUUID ? `/core/products/id/${idOrSlug}/` : `/core/products/${idOrSlug}/`;
      const response = await api.get(path);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${idOrSlug}:`, error);
      throw error;
    }
  },

  // Create active product (Seller dashboard)
  createProduct: async (productData) => {
    try {
      const response = await api.post('/core/products/create/', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product details (full update)
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/core/products/id/${id}/`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  // Partial update (e.g. archive: { is_active: false })
  patchProduct: async (id, partialData) => {
    try {
      const response = await api.patch(`/core/products/id/${id}/`, partialData);
      return response.data;
    } catch (error) {
      console.error(`Error patching product ${id}:`, error);
      throw error;
    }
  },

  // Bulk-update stock across many variants (and many products) in a single request
  // updates: [{ variant_id, stock }, ...]
  bulkUpdateStock: async (updates) => {
    try {
      const response = await api.post('/core/products/bulk-stock-update/', { updates });
      return response.data;
    } catch (error) {
      console.error('Error bulk-updating stock:', error);
      throw error;
    }
  },

  // Archive a product (soft delete)
  archiveProduct: async (id) => {
    try {
      const response = await api.delete(`/core/products/id/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error archiving product ${id}:`, error);
      throw error;
    }
  },

  // Upload image to Firebase
  uploadImage: async (file, type = 'asset') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      const response = await api.post('/core/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Get all categories with nested subcategories
  getCategories: async () => {
    try {
      const response = await api.get('/core/categories/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get subcategories (optionally filtered by category)
  getSubCategories: async (categoryId = null) => {
    try {
      const params = categoryId ? { category: categoryId } : {};
      const response = await api.get('/core/subcategories/', { params });
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  },

  getRecommendations: async (slug) => {
    try {
      const response = await api.get(`/core/products/${slug}/recommendations/`);
      return response.data;
    } catch {
      return { similar: [], complementary: [] };
    }
  },
};
