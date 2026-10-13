import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE, ADMIN_EMAIL, ADMIN_SUB } from './audit_helpers.js';

test.describe('PHASE 10: Cross-Module Consistency & Negative Testing (Scenarios A-K)', () => {

  test('SCENARIO-A: Customer Places Order & Admin Sees Exactly Same Order Record', async ({ page }) => {
    const testUser = generateTestUser('scen_a_cust');
    const authRes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: testUser });
    const custAuth = (await authRes.json()).data;

    // 1. Create Address & Order
    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const variant = (await catRes.json()).data[0].variants[0];

    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${custAuth.token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '101 Consistent Way',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      }
    });
    const addrJson = await addrRes.json();
    expect(addrJson.success).toBe(true);
    const addrId = addrJson.data.id;

    // Add item to cart
    await page.request.post(`${API_BASE}/cart/items`, {
      headers: { Authorization: `Bearer ${custAuth.token}` },
      data: { variantId: variant.id, quantity: 1 }
    });

    const orderRes = await page.request.post(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${custAuth.token}` },
      data: {
        addressId: addrId
      }
    });
    const orderData = (await orderRes.json()).data;
    const orderId = orderData.id;

    // 2. Admin logs in and inspects the order via Admin API
    const adminRes = await page.request.post(`${API_BASE}/auth/oauth/google`, {
      data: {
        googleSub: ADMIN_SUB,
        email: ADMIN_EMAIL,
        firstName: 'Admin',
        lastName: 'QA',
        fullName: 'Admin QA'
      }
    });
    const adminToken = (await adminRes.json()).data.token;

    const adminOrderRes = await page.request.get(`${API_BASE}/admin/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(adminOrderRes.status()).toBe(200);
    const adminOrderData = (await adminOrderRes.json()).data;

    // Verify cross-layer integrity
    expect(adminOrderData.id).toBe(orderId);
    expect(adminOrderData.orderNumber).toBe(orderData.orderNumber);
    expect(Number(adminOrderData.totalAmountInr)).toBe(Number(orderData.totalAmountInr));
  });

  test('SCENARIO-C: Customer Wallet Top-Up & Spend Balance Reconciliation', async ({ page }) => {
    const testUser = generateTestUser('scen_c_cust');
    const authRes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: testUser });
    const token = (await authRes.json()).data.token;

    // 1. Initial balance is 0
    const bal0 = Number((await (await page.request.get(`${API_BASE}/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } })).json()).data);
    expect(bal0).toBe(0);

    // 2. Top-up 1000
    const topupInit = await page.request.post(`${API_BASE}/wallet/add-money`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { amount: 1000.00 }
    });
    const rzpId = (await topupInit.json()).data.razorpayOrderId;

    const topupVerify = await page.request.post(`${API_BASE}/wallet/verify-add-money?amount=1000.00`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        razorpayOrderId: rzpId,
        razorpayPaymentId: 'pay_scen_c_' + Date.now(),
        razorpaySignature: 'mock_sig'
      }
    });
    expect(Number((await topupVerify.json()).data.balanceAfter)).toBe(1000.00);

    // 3. Reconcile balance with transactions ledger
    const ledgerRes = await page.request.get(`${API_BASE}/wallet/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const txns = (await ledgerRes.json()).data.content;
    expect(txns.length).toBeGreaterThan(0);
    expect(Number(txns[0].amount)).toBe(1000.00);
  });

  test('SCENARIO-I: Failed Signature Never Marks Order As Paid (Financial Protection)', async ({ page }) => {
    const testUser = generateTestUser('scen_i_cust');
    const authRes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: testUser });
    const token = (await authRes.json()).data.token;

    const catRes = await page.request.get(`${API_BASE}/catalog/products`);
    const variant = (await catRes.json()).data[0].variants[0];

    const addrRes = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        recipientName: testUser.fullName,
        phone: testUser.phone,
        line1: '109 Security Dr',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      }
    });
    const addrJson = await addrRes.json();
    expect(addrJson.success).toBe(true);
    const addrId = addrJson.data.id;

    // Add item to cart
    await page.request.post(`${API_BASE}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { variantId: variant.id, quantity: 1 }
    });

    const orderRes = await page.request.post(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        addressId: addrId
      }
    });
    const orderId = (await orderRes.json()).data.id;

    // Initiate payment
    await page.request.post(`${API_BASE}/payment/initiate`, { data: { orderId } });

    // Submit invalid verification signature
    const verifyRes = await page.request.post(`${API_BASE}/payment/verify`, {
      data: {
        orderId,
        razorpayOrderId: 'order_nonexistent_fake',
        razorpayPaymentId: 'pay_fraud',
        razorpaySignature: 'mock_signature'
      }
    });

    // Verification must fail
    expect(verifyRes.status()).toBeGreaterThanOrEqual(400);

    // Order status must NOT be PAID
    const orderCheck = await page.request.get(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orderStatus = (await orderCheck.json()).data.status;
    expect(orderStatus).not.toBe('PAID');
  });

  test('SCENARIO-K: Two Accounts Operate Simultaneously with Strict Tenant Isolation', async ({ page }) => {
    const user1 = generateTestUser('tenant_1');
    const user2 = generateTestUser('tenant_2');

    const auth1 = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: user1 });
    const token1 = (await auth1.json()).data.token;

    const auth2 = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: user2 });
    const token2 = (await auth2.json()).data.token;

    // User 1 creates address
    const addr1 = await page.request.post(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${token1}` },
      data: {
        recipientName: 'User One Private Recipient',
        phone: user1.phone,
        line1: 'Private Lane 1',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      }
    });
    const addrId1 = (await addr1.json()).data.id;

    // User 2 cannot see or delete User 1's address
    const deleteAttempt = await page.request.delete(`${API_BASE}/customer/addresses/${addrId1}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    expect(deleteAttempt.status()).toBeGreaterThanOrEqual(400);
  });
});
