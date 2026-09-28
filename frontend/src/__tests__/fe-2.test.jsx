import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';

describe('FE-2: 401 Response Handling Interceptor Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('verifies token removal and session clearance when 401 error response is returned', async () => {
    localStorage.setItem('sporekart_token', 'mock_expired_token');
    localStorage.setItem('sporekart_session_id', 'sess_old_123');

    const unauthorizedEventSpy = vi.fn();
    window.addEventListener('sporekart_unauthorized', unauthorizedEventSpy);

    const interceptorError = {
      response: { status: 401, data: { success: false, message: 'Unauthorized' } },
    };

    const responseInterceptor = api.interceptors.response.handlers.find(
      (h) => h.rejected !== null
    );

    expect(responseInterceptor).toBeDefined();

    try {
      await responseInterceptor.rejected(interceptorError);
    } catch (err) {
      expect(err).toBe(interceptorError);
    }

    // Token is cleared from localStorage
    expect(localStorage.getItem('sporekart_token')).toBeNull();

    // Session ID is reset (cleared and refreshed)
    expect(localStorage.getItem('sporekart_session_id')).not.toBe('sess_old_123');
    expect(localStorage.getItem('sporekart_session_id')).toMatch(/^sess_/);

    // Window event for application logout / auth reset was dispatched
    expect(unauthorizedEventSpy).toHaveBeenCalled();
  });

  it('handles admin route redirection when 401 error occurs on admin paths', async () => {
    localStorage.setItem('sporekart_token', 'mock_expired_admin_token');

    delete window.location;
    window.location = { pathname: '/admin/products', href: '/admin/products' };

    const interceptorError = {
      response: { status: 401, data: { success: false, message: 'Admin Session Expired' } },
    };

    const responseInterceptor = api.interceptors.response.handlers.find(
      (h) => h.rejected !== null
    );

    try {
      await responseInterceptor.rejected(interceptorError);
    } catch (err) {
      // expected rejection
    }

    expect(window.location.href).toBe('/admin/login');
  });
});
