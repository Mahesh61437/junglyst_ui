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
      // Use pk lookup if id looks like a UUID, else slug
      const path = idOrSlug.length > 30 ? `/core/products/id/${idOrSlug}/` : `/core/products/${idOrSlug}/`;
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

  // Update product details
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/core/products/id/${id}/`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
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
  }
};
