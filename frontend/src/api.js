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

// Helper to completely clear authentication tokens & session ID on logout
export const clearSessionAndTokens = () => {
  localStorage.removeItem('sporekart_token');
  localStorage.removeItem('sporekart_session_id');
  return getOrCreateSessionId();
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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
  loginWithGoogle: (googleData) => api.post('/auth/oauth/google', googleData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const catalogApi = {
  getProducts: (type, category) => api.get('/catalog/products', { params: { type, category } }),
  searchProducts: (params) => api.get('/products/search', { params }),
  getProductBySlug: (slug) => api.get(`/catalog/products/${slug}`),
  getCategories: () => api.get('/catalog/categories'),
};

export const searchApi = {
  globalSearch: (query) => api.get('/search', { params: { q: query } }),
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
  bookSlot: (slotId) => api.post('/training/enroll', { batchId: slotId, slotId }),
  getUserBookings: () => api.get('/training/my-bookings'),
  getEnrollmentById: (enrollmentId) => api.get(`/training/enrollments/${enrollmentId}`),
  cancelEnrollment: (enrollmentId, reason) => api.post(`/training/enrollments/${enrollmentId}/cancel`, null, { params: { reason } }),
};

export const orderApi = {
  createOrder: (data, idempotencyKey) =>
    api.post('/orders', data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),
  getUserOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, null, { params: { reason } }),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};


export const paymentApi = {
  initiatePayment: (orderId) => api.post('/payment/initiate', { orderId }),
  verifyPayment: (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    api.post('/payment/verify', { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  getPaymentSummary: (type, id) => api.get('/payment/summary', { params: { type, id } }),
  verifyEnrollmentPayment: (enrollmentId, paymentMethod, transactionReference) =>
    api.post('/payment/verify-enrollment', { enrollmentId, paymentMethod, transactionReference }),
};

export const shippingApi = {
  checkPincode: (pincode) => api.get(`/shipping/check-pincode/${pincode}`),
};

export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  getUserTickets: () => api.get('/support/tickets'),
  getTicketById: (id) => api.get(`/support/tickets/${id}`),
  addMessage: (id, message) => api.post(`/support/tickets/${id}/messages`, { message }),
};

export const adminApi = {
  requestAdminOtp: (identifier) => api.post('/admin/auth/request-otp', { identifier }),
  verifyAdminOtp: (identifier, otpCode) => api.post('/admin/auth/verify-otp', { identifier, otpCode }),
  getBlogPosts: (status) => api.get('/admin/content/posts', { params: { status } }),
  createBlogPost: (data) => api.post('/admin/content/posts', data),
  publishBlogPost: (id) => api.post(`/admin/content/posts/${id}/publish`),
  scheduleBlogPost: (id, scheduleTime) => api.post(`/admin/content/posts/${id}/schedule`, null, { params: { scheduleTime } }),
  deleteBlogPost: (id) => api.delete(`/admin/content/posts/${id}`),
  createCategory: (data) => api.post('/admin/catalog/categories', data),
  createProduct: (data) => api.post('/admin/catalog/products', data),
  updateProductInformation: (productId, data) => api.post(`/admin/catalog/products/${productId}/information`, data),
  publishProduct: (productId) => api.post(`/admin/catalog/products/${productId}/publish`),
  addVariant: (productId, data) => api.post(`/admin/catalog/products/${productId}/variants`, data),
  createOffer: (data) => api.post('/admin/catalog/offers', data),
  addMedia: (data) => api.post('/admin/catalog/media', data),
  reorderMedia: (productId, items) => api.put(`/admin/catalog/products/${productId}/media/reorder`, { items }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (orderId, status, reason) => api.put(`/admin/orders/${orderId}/status`, { status, reason }),
  createCourse: (data) => api.post('/admin/training/courses', data),
  createBatch: (data) => api.post('/admin/training/batches', data),
  addBatchSchedule: (data) => api.post('/admin/training/schedules', data),
  markAttendance: (data) => api.post('/admin/training/attendance', data),
  completeCourse: (data) => api.post('/admin/training/complete-course', data),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  grantCapability: (userId, capability) => api.post(`/admin/customers/${userId}/capability`, { capability }),
  getTickets: (params) => api.get('/admin/support/tickets', { params }),
  getTicketById: (ticketId) => api.get(`/admin/support/tickets/${ticketId}`),
  replyToTicket: (ticketId, message) => api.post(`/admin/support/tickets/${ticketId}/messages`, { message }),
  updateTicketStatus: (ticketId, status, priority) => api.put(`/admin/support/tickets/${ticketId}/status`, { status, priority }),
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const analyticsApi = {
  trackProductView: (productId, productSlug, productTitle) => api.post('/analytics/track-product-view', { productId, productSlug, productTitle }),
  getFunnelSummary: () => api.get('/analytics/funnel'),
  getRecentEvents: () => api.get('/analytics/events'),
};

export default api;

