import axios from 'axios';

const API_BASE = '/api/v1';

// Helper to get or generate guest session ID
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('sporekart_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('sporekart_session_id', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sporekart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const sessionId = getOrCreateSessionId();
  config.headers['X-Session-ID'] = sessionId;
  
  return config;
});

export const authApi = {
  requestOtp: (identifier) => api.post('/auth/otp/request', { identifier }),
  verifyOtp: (identifier, otpCode, fullName) => api.post('/auth/otp/verify', { identifier, otpCode, fullName }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const catalogApi = {
  getProducts: (type, category) => api.get('/catalog/products', { params: { type, category } }),
  getProductBySlug: (slug) => api.get(`/catalog/products/${slug}`),
  getCategories: () => api.get('/catalog/categories'),
};

export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (variantId, quantity) => api.post('/cart/items', { variantId, quantity }),
  updateItemQuantity: (variantId, quantity) => api.put(`/cart/items/${variantId}`, { quantity }),
  removeItem: (variantId) => api.delete(`/cart/items/${variantId}`),
  mergeGuestCart: () => api.post('/cart/merge'),
  clearCart: () => api.delete('/cart'),
  validateCart: () => api.post('/cart/validate'),
};

export const customerApi = {
  getProfile: () => api.get('/customer/profile'),
  updateProfile: (data) => api.put('/customer/profile', data),
  getAddresses: () => api.get('/customer/addresses'),
  addAddress: (address) => api.post('/customer/addresses', address),
  updateAddress: (id, address) => api.put(`/customer/addresses/${id}`, address),
  deleteAddress: (id) => api.delete(`/customer/addresses/${id}`),
};

export const trainingApi = {
  getCourses: (category) => api.get('/training/courses', { params: { category } }),
  getCourseBySlug: (slug) => api.get(`/training/courses/${slug}`),
  bookSlot: (slotId) => api.post('/training/bookings', { slotId }),
  getUserBookings: () => api.get('/training/my-bookings'),
};

export const orderApi = {
  createOrder: (data, idempotencyKey) =>
    api.post('/orders', data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),
  getUserOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, null, { params: { reason } }),
};

export const paymentApi = {
  initiatePayment: (orderId) => api.post('/payment/initiate', { orderId }),
  verifyPayment: (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    api.post('/payment/verify', { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
};

export const shippingApi = {
  checkPincode: (pincode) => api.get(`/shipping/check-pincode/${pincode}`),
};

export default api;
