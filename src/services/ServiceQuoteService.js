import api from './api';

const unwrap = (promise) => promise.then(res => res.data);
const encode = encodeURIComponent;

export const ServiceQuoteService = {
  // Storefront
  groups: (params = {}) => unwrap(api.get('/services/groups/', { params })),
  group: (slug) => unwrap(api.get(`/services/groups/${encode(slug)}/`)),
  offering: (slug) => unwrap(api.get(`/services/offerings/${encode(slug)}/`)),
  requestQuote: (slug, payload) => unwrap(api.post(`/services/offerings/${encode(slug)}/request/`, payload)),
  uploadReference: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return unwrap(api.post('/services/uploads/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },

  // Customer
  my: {
    list: () => unwrap(api.get('/services/my-requests/')),
    pay: (reference, address) => unwrap(api.post(`/services/my-requests/${encode(reference)}/pay/`, address)),
    cancel: (reference, reason) => unwrap(api.post(`/services/my-requests/${encode(reference)}/cancel/`, { reason })),
    payCharge: (reference, chargeId) => unwrap(api.post(`/services/my-requests/${encode(reference)}/charges/${chargeId}/pay/`)),
  },

  // Assigned seller
  seller: {
    list: (params = {}) => unwrap(api.get('/services/seller/requests/', { params })),
    get: (id) => unwrap(api.get(`/services/seller/requests/${id}/`)),
    update: (id, payload) => unwrap(api.patch(`/services/seller/requests/${id}/`, payload)),
    requestCharge: (id, payload) => unwrap(api.post(`/services/seller/requests/${id}/charges/`, payload)),
    cancelCharge: (id, chargeId) => unwrap(api.post(`/services/seller/requests/${id}/charges/${chargeId}/cancel/`)),
  },

  // Super admin
  admin: {
    summary: () => unwrap(api.get('/services/admin/summary/')),
    groups: () => unwrap(api.get('/services/admin/groups/')),
    saveGroup: (id, payload) => unwrap(id
      ? api.patch(`/services/admin/groups/${id}/`, payload)
      : api.post('/services/admin/groups/', payload)),
    offerings: () => unwrap(api.get('/services/admin/offerings/')),
    saveOffering: (id, payload) => unwrap(id
      ? api.patch(`/services/admin/offerings/${id}/`, payload)
      : api.post('/services/admin/offerings/', payload)),
    sellers: () => unwrap(api.get('/services/admin/sellers/')),
    requests: (params = {}) => unwrap(api.get('/services/admin/requests/', { params })),
    request: (id) => unwrap(api.get(`/services/admin/requests/${id}/`)),
    updateRequest: (id, payload) => unwrap(api.patch(`/services/admin/requests/${id}/`, payload)),
    createRequest: (payload) => unwrap(api.post('/services/admin/requests/', payload)),
    assign: (id, sellerId) => unwrap(api.post(`/services/admin/requests/${id}/assign/`, { seller_id: sellerId })),
    sendPayRequest: (id) => unwrap(api.post(`/services/admin/requests/${id}/send-pay-request/`)),
    decline: (id, reason) => unwrap(api.post(`/services/admin/requests/${id}/decline/`, { reason })),
    markDelivered: (id) => unwrap(api.post(`/services/admin/requests/${id}/mark-delivered/`)),
    extraPayoutDone: (id, chargeId) => unwrap(api.post(`/services/admin/requests/${id}/charges/${chargeId}/payout-done/`)),
    renew: (id) => unwrap(api.post(`/services/admin/requests/${id}/renew/`)),
    cancel: (id, reason) => unwrap(api.post(`/services/admin/requests/${id}/cancel/`, { reason })),
    requestCharge: (id, payload) => unwrap(api.post(`/services/admin/requests/${id}/charges/`, payload)),
    cancelCharge: (id, chargeId) => unwrap(api.post(`/services/admin/requests/${id}/charges/${chargeId}/cancel/`)),
    uploadImage: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'service');
      return unwrap(api.post('/core/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
    },
  },
};
