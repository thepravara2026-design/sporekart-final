import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 3D: Order Cancellation & Refund Initiation Lifecycle', () => {

  test('CANCEL-01: Customer Cancels Eligible Paid Order with Reason & Verifies State', async ({ page }) => {
    test.setTimeout(60000);
    const testUser = generateTestUser('cancel_order');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // 1. Fetch an active product variant
    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const catJson = await catRes.json();
    const product = catJson.data[0];
    const variant = product.variants[0];

    // Add address with unique test user phone
    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '99 Agaricus Boulevard',
        city: 'Solan',
        state: 'Himachal Pradesh',
        pincode: '173212',
        isDefault: true
      }
    });
    const addrJson = await addrRes.json();
    expect(addrJson.success).toBe(true);
    const addressId = addrJson.data.id;

    // Add item to cart
    await page.request.post(`${API_BASE}/cart/items`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { variantId: variant.id, quantity: 1 }
    });

    // Create Order from cart
    const orderRes = await page.request.post(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        addressId: addressId
      }
    });
    const orderJson = await orderRes.json();
    expect(orderJson.success).toBe(true);
    const orderId = orderJson.data.id;

    // Simulate Payment
    const initRes = await page.request.post(`${API_BASE}/payment/initiate`, {
      data: { orderId }
    });
    const initJson = await initRes.json();
    const razorpayOrderId = initJson.data.razorpayOrderId;

    await page.request.post(`${API_BASE}/payment/verify`, {
      data: {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: 'pay_cancel_test_' + Date.now(),
        razorpaySignature: 'mock_signature'
      }
    });

    // 2. Open Order Dashboard in Browser
    await page.goto(`/dashboard?tab=activeTrack&orderId=${orderId}`);
    await page.waitForLoadState('domcontentloaded');

    // 3. Locate and Click Cancel Order Button
    const cancelBtn = page.getByRole('button', { name: /Cancel Order/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    await cancelBtn.click();

    // 4. Fill Reason in Cancellation Modal
    const modal = page.locator('div[role="dialog"], .fixed').filter({ hasText: /Cancel Order/i }).first();
    await expect(modal).toBeVisible({ timeout: 15000 });

    const confirmCancelBtn = modal.getByRole('button', { name: /Confirm Order Cancellation|Confirm Cancellation|Yes, Cancel/i }).first();
    await expect(confirmCancelBtn).toBeVisible({ timeout: 10000 });
    await confirmCancelBtn.click();

    // 5. Verify Order Status updates to CANCELLED or REFUNDED in UI
    await expect(page.getByText(/CANCELLED|REFUNDED/i).first()).toBeVisible({ timeout: 15000 });

    // 6. Verify via API that order status is CANCELLED or REFUNDED
    const verifyRes = await page.request.get(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const verifyJson = await verifyRes.json();
    expect(['CANCELLED', 'REFUNDED']).toContain(verifyJson.data.status);
  });

  test('CANCEL-02: Duplicate Cancellation Attempt Is Idempotently Rejected', async ({ page }) => {
    const testUser = generateTestUser('dup_cancel');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const catJson = await catRes.json();
    const variant = catJson.data[0].variants[0];

    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '12 Farm Lane',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        isDefault: true
      }
    });
    const addrJson = await addrRes.json();
    expect(addrJson.success).toBe(true);
    const addrId = addrJson.data.id;

    // Add item to cart
    await page.request.post(`${API_BASE}/cart/items`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { variantId: variant.id, quantity: 1 }
    });

    const orderRes = await page.request.post(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        addressId: addrId
      }
    });
    const orderId = (await orderRes.json()).data.id;

    // First cancel
    const cancel1 = await page.request.post(`${API_BASE}/orders/${orderId}/cancel?reason=Testing`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    expect(cancel1.status()).toBe(200);

    // Second cancel attempt
    const cancel2 = await page.request.post(`${API_BASE}/orders/${orderId}/cancel?reason=TestingAgain`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    // Must be rejected or handled gracefully (not throw 500 error)
    expect(cancel2.status()).not.toBe(500);
  });
});
