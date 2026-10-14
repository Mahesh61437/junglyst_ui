import api from './api';

const unwrap = (promise) => promise.then(res => res.data);

export const WorkshopService = {
  // Storefront
  list: (params = {}) => unwrap(api.get('/workshops/', { params })),
  get: (slug) => unwrap(api.get(`/workshops/${encodeURIComponent(slug)}/`)),
  book: (slug, payload) => unwrap(api.post(`/workshops/${encodeURIComponent(slug)}/book/`, payload)),
  bookingByOrder: (orderNumber, email) => unwrap(api.get(
    `/workshops/bookings/by-order/${encodeURIComponent(orderNumber)}/`,
    { params: email ? { email } : {} },
  )),
  releaseHold: (orderNumber, email) => unwrap(api.post(
    `/workshops/bookings/by-order/${encodeURIComponent(orderNumber)}/release/`, { email },
  )),

  // Seller (organiser)
  sellerBookings: (params = {}) => unwrap(api.get('/workshops/seller/bookings/', { params })),
  sellerSummary: () => unwrap(api.get('/workshops/seller/summary/')),

  // Super admin
  admin: {
    list: () => unwrap(api.get('/workshops/admin/workshops/')),
    get: (id) => unwrap(api.get(`/workshops/admin/workshops/${id}/`)),
    create: (payload) => unwrap(api.post('/workshops/admin/workshops/', payload)),
    update: (id, payload) => unwrap(api.patch(`/workshops/admin/workshops/${id}/`, payload)),
    remove: (id) => api.delete(`/workshops/admin/workshops/${id}/`),
    organisers: () => unwrap(api.get('/workshops/admin/organisers/')),
    bookings: (params = {}) => unwrap(api.get('/workshops/admin/bookings/', { params })),
    updateBooking: (id, payload) => unwrap(api.patch(`/workshops/admin/bookings/${id}/`, payload)),
    financials: () => unwrap(api.get('/workshops/admin/financials/')),
    workshopFinancials: (id) => unwrap(api.get(`/workshops/admin/workshops/${id}/financials/`)),
    recordPayout: (payload) => unwrap(api.post('/workshops/admin/payouts/', payload)),
    deletePayout: (id) => api.delete(`/workshops/admin/payouts/${id}/`),
    uploadImage: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'workshop');
      return unwrap(api.post('/core/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
    },
  },
};
