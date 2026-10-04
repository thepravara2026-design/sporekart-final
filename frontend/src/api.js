import axios from 'axios';

const API_BASE = '/api/v1';

// Helper to get or generate guest session ID
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('sporekart_session_id');
  if (!sessionId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      sessionId = 'sess_' + crypto.randomUUID();
    } else {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem('sporekart_session_id', sessionId);
  }
  return sessionId;
};

// Helper to clear token only on 401 unauthorized without wiping guest session cart
export const clearTokenOnly = () => {
  localStorage.removeItem('sporekart_token');
};

// Helper to completely clear authentication tokens & session ID on explicit logout
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearSessionAndTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sporekart_unauthorized'));
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  requestOtp: (identifier) => api.post('/auth/otp/request', { identifier }),
  verifyOtp: (identifier, otpCode, fullName) => api.post('/auth/otp/verify', { identifier, otpCode, fullName }),
  loginWithGoogle: (googleData) => api.post('/auth/oauth/google', googleData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const catalogApi = {
  getProducts: (type, category, page = 0, size = 24) => api.get('/catalog/products', { params: { type, category, page, size } }),
  getPopularProducts: (category, limit = 6) => api.get('/products/popular', { params: { category, limit } }),
  getBestSellingProducts: (category, limit = 6) => api.get('/products/bestsellers', { params: { category, limit } }),
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
  applyPromotion: (code) => api.post('/cart/apply-promotion', { code }),
  removePromotion: () => api.delete('/cart/remove-promotion'),
  getAvailablePromotions: (audience = 'CUSTOMER') => api.get('/promotions/available', { params: { audience } }),
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
  bookSlot: (slotId, promoCode) => api.post('/training/enroll', { batchId: slotId, slotId, promoCode }),
  validateBatchPromotion: (code, batchId, courseId) => api.post('/promotions/validate-batch', { code, batchId, courseId }),
  getAvailableBatchPromotions: () => api.get('/promotions/available', { params: { audience: 'TRAINEE' } }),
  getUserBookings: () => api.get('/training/my-bookings'),
  getEnrollmentById: (enrollmentId) => api.get(`/training/enrollments/${enrollmentId}`),
  cancelEnrollment: (enrollmentId, reason) => api.post(`/training/enrollments/${enrollmentId}/cancel`, null, { params: { reason } }),
  getCourseReviews: (courseId) => api.get(`/training/courses/${courseId}/reviews`),
  getCourseReviewSummary: (courseId) => api.get(`/training/courses/${courseId}/reviews/summary`),
  createReview: (data) => api.post('/training/reviews', data),
  getMyReviews: () => api.get('/training/my-reviews'),
  getPendingReviews: () => api.get('/training/pending-reviews'),
  getGlimpses: () => api.get('/training/glimpses'),
  getAdminGlimpses: () => api.get('/training/admin/glimpses'),
  saveGlimpse: (data) => api.post('/training/admin/glimpses', data),
  deleteGlimpse: (id) => api.delete(`/training/admin/glimpses/${id}`),
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

export const reviewApi = {
  getLatestReviews: (limit = 5) => api.get('/reviews/latest', { params: { limit } }),
  getAllPublishedReviews: (page = 0, size = 10) => api.get('/reviews', { params: { page, size } }),
  getProductReviews: (productId, page = 0, size = 10) => api.get(`/products/${productId}/reviews`, { params: { page, size } }),
  getProductReviewSummary: (productId) => api.get(`/products/${productId}/reviews/summary`),
  createReview: (data) => api.post('/customer/reviews', data),
  getCustomerReviews: (page = 0, size = 10) => api.get('/customer/reviews', { params: { page, size } }),
  getPendingReviews: () => api.get('/customer/reviews/pending'),
  skipInvitation: (orderItemId) => api.post(`/customer/reviews/invitations/${orderItemId}/skip`),
  updateReview: (reviewId, data) => api.put(`/customer/reviews/${reviewId}`, data),
  getAdminReviews: (params) => api.get('/admin/reviews', { params }),
  getAdminReviewSummary: () => api.get('/admin/reviews/summary'),
  getAdminReviewById: (id) => api.get(`/admin/reviews/${id}`),
  moderateReview: (id, status, reason) => api.patch(`/admin/reviews/${id}/status`, { status, moderationReason: reason }),
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
  requestAdminOtp: (identifier) => api.post('/admin/auth/otp/request', { identifier }),
  verifyAdminOtp: (identifier, otpCode) => api.post('/admin/auth/otp/verify', { identifier, otpCode }),
  getBlogPosts: (status) => api.get('/admin/content/posts', { params: { status } }),
  createBlogPost: (data) => api.post('/admin/content/posts', data),
  publishBlogPost: (id) => api.post(`/admin/content/posts/${id}/publish`),
  scheduleBlogPost: (id, scheduleTime) => api.post(`/admin/content/posts/${id}/schedule`, null, { params: { scheduleTime } }),
  deleteBlogPost: (id) => api.delete(`/admin/content/posts/${id}`),
  getAdminProducts: (params) => api.get('/admin/catalog/products', { params }),
  createCategory: (data) => api.post('/admin/catalog/categories', data),
  updateCategory: (id, data) => api.put(`/admin/catalog/categories/${id}`, data),
  createProduct: (data) => api.post('/admin/catalog/products', data),
  updateProductInformation: (productId, data) => api.post(`/admin/catalog/products/${productId}/information`, data),
  publishProduct: (productId) => api.post(`/admin/catalog/products/${productId}/publish`),
  addVariant: (productId, data) => api.post(`/admin/catalog/products/${productId}/variants`, data),
  replenishStock: (variantId, quantity, reason) => api.post(`/admin/catalog/inventory/${variantId}/replenish`, { quantity, reason }),
  createOffer: (data) => api.post('/admin/catalog/offers', data),
  addMedia: (data) => api.post('/admin/catalog/media', data),
  reorderMedia: (productId, items) => api.put(`/admin/catalog/products/${productId}/media/reorder`, { items }),
  getPromotions: (params) => api.get('/admin/promotions', { params }),
  createPromotion: (data) => api.post('/admin/promotions', data),
  updatePromotion: (id, data) => api.put(`/admin/promotions/${id}`, data),
  togglePromotionStatus: (id, status) => api.patch(`/admin/promotions/${id}/status`, null, { params: { status } }),
  deletePromotion: (id) => api.delete(`/admin/promotions/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (orderId, status, reason) => api.put(`/admin/orders/${orderId}/status`, { status, reason }),
  downloadPackingSlip: (id) => api.get(`/admin/orders/${id}/packing-slip`, { responseType: 'blob' }),
  createCourse: (data) => api.post('/admin/training/courses', data),
  createBatch: (data) => api.post('/admin/training/batches', data),
  addBatchSchedule: (data) => api.post('/admin/training/schedules', data),
  markAttendance: (data) => api.post('/admin/training/attendance', data),
  completeCourse: (data) => api.post('/admin/training/complete-course', data),
  getEnrollments: () => api.get('/admin/training/enrollments'),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  grantCapability: (userId, capability) => api.post(`/admin/customers/${userId}/capability`, { capability }),
  getTickets: (params) => api.get('/admin/support/tickets', { params }),
  getTicketById: (ticketId) => api.get(`/admin/support/tickets/${ticketId}`),
  replyToTicket: (ticketId, message) => api.post(`/admin/support/tickets/${ticketId}/messages`, { message }),
  updateTicketStatus: (ticketId, status, priority) => api.put(`/admin/support/tickets/${ticketId}/status`, { status, priority }),
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const walletApi = {
  getWallet: () => api.get('/wallet'),
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  requestWithdrawal: (data) => api.post('/wallet/withdraw', data),
  getWithdrawals: () => api.get('/wallet/withdrawals'),
  addMoney: (data) => api.post('/wallet/add-money', data),
  verifyAddMoney: (data, amount) => api.post('/wallet/verify-add-money', data, { params: { amount } }),
  checkoutPay: (data) => api.post('/wallet/checkout-pay', data),
};

export const adminFinanceApi = {
  getOverview: () => api.get('/admin/finance/overview'),
  getTransactions: (params) => api.get('/admin/finance/transactions', { params }),
  getWithdrawals: (params) => api.get('/admin/finance/withdrawals', { params }),
  approveWithdrawal: (id, notes) => api.post(`/admin/finance/withdrawals/${id}/approve`, { notes }),
  rejectWithdrawal: (id, rejectionReason) => api.post(`/admin/finance/withdrawals/${id}/reject`, { rejectionReason }),
  performManualAdjustment: (data) => api.post('/admin/finance/manual-adjustment', data),
};

export const analyticsApi = {
  trackProductView: (productId, productSlug, productTitle) => api.post('/analytics/track-product-view', { productId, productSlug, productTitle }),
  getFunnelSummary: () => api.get('/analytics/funnel'),
  getRecentEvents: () => api.get('/analytics/events'),
};

export default api;

