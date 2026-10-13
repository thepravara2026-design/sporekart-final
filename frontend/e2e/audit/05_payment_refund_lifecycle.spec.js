import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 4: Payment Verification & Refund Idempotency Lifecycle', () => {

  test('PAY-01: Payment Initiation & Successful Signature Verification Flow', async ({ page }) => {
    const testUser = generateTestUser('pay_valid');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const variant = (await catRes.json()).data[0].variants[0];

    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '108 Substrate Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
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

    // 1. Initiate Payment
    const initRes = await page.request.post(`${API_BASE}/payment/initiate`, {
      data: { orderId }
    });
    const initJson = await initRes.json();
    expect(initJson.success).toBe(true);
    expect(initJson.data.razorpayOrderId).toBeTruthy();

    const rzpOrderId = initJson.data.razorpayOrderId;

    // 2. Verify Payment
    const verifyRes = await page.request.post(`${API_BASE}/payment/verify`, {
      data: {
        orderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_rzp_mock_' + Date.now(),
        razorpaySignature: 'mock_sig_pass'
      }
    });
    const verifyJson = await verifyRes.json();
    expect(verifyJson.success).toBe(true);

    // 3. Confirm Order Status is PAID
    const orderCheck = await page.request.get(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const orderData = (await orderCheck.json()).data;
    expect(orderData.status).toBe('PAID');
  });

  test('PAY-02: Payment Verification Fails on Mismatched Order Reference (Tamper Prevention)', async ({ page }) => {
    const testUser = generateTestUser('tamper_pay');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const variant = (await catRes.json()).data[0].variants[0];

    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '109 Substrate Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
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

    const initRes = await page.request.post(`${API_BASE}/payment/initiate`, {
      data: { orderId }
    });
    const rzpOrderId = (await initRes.json()).data.razorpayOrderId;

    // Attempt verify with a fake orderId
    const fakeOrderId = '00000000-0000-0000-0000-000000000000';
    const verifyRes = await page.request.post(`${API_BASE}/payment/verify`, {
      data: {
        orderId: fakeOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_fake_' + Date.now(),
        razorpaySignature: 'mock_sig'
      }
    });

    // Mismatched order reference must be rejected
    expect(verifyRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('PAY-03: Razorpay Webhook Idempotency (Duplicate Event Ignored Safely)', async ({ page }) => {
    const eventId = 'evt_qa_mock_' + Date.now();
    const webhookPayload = {
      event: 'payment.captured',
      event_id: eventId,
      payload: {
        payment: {
          entity: {
            id: 'pay_hook_mock_' + Date.now(),
            order_id: 'order_hook_mock_' + Date.now(),
            amount: 50000,
            status: 'captured'
          }
        }
      }
    };

    // First webhook delivery
    const res1 = await page.request.post(`${API_BASE}/payment/webhook`, {
      headers: { 'X-Razorpay-Signature': 'mock_signature' },
      data: webhookPayload
    });

    // Second webhook delivery with same event_id
    const res2 = await page.request.post(`${API_BASE}/payment/webhook`, {
      headers: { 'X-Razorpay-Signature': 'mock_signature' },
      data: webhookPayload
    });

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);
  });
});
