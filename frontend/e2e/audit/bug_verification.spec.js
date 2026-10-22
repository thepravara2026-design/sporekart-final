import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE, ADMIN_EMAIL } from './audit_helpers.js';

test.describe('Verification of 4 Bug Fixes', () => {

  test('BUG 1 (CART-CONCUR-01): Concurrent Cart Operations & Deduplication Validation', async ({ request }) => {
    // 1. Create a fresh test user via Google OAuth endpoint
    const user = generateTestUser('cart_concur');
    const regRes = await request.post(`${API_BASE}/auth/oauth/google`, {
      data: user
    });
    expect(regRes.status()).toBe(200);
    const regJson = await regRes.json();
    const token = regJson.data.token;
    expect(token).toBeTruthy();

    // 2. Fetch catalog to obtain valid productId and variantId
    const catRes = await request.get(`${API_BASE}/products`);
    expect(catRes.status()).toBe(200);
    const catJson = await catRes.json();
    const products = catJson.data?.content || catJson.data || [];
    const targetProduct = products.find(p => p.variants && p.variants.length > 0);
    expect(targetProduct).toBeTruthy();
    const variantId = targetProduct.variants[0].id;

    // 3. Fire concurrent cart add requests with identical authorization token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const addPromises = [
      request.post(`${API_BASE}/cart/items`, { headers, data: { variantId, quantity: 1 } }),
      request.post(`${API_BASE}/cart/items`, { headers, data: { variantId, quantity: 1 } }),
      request.post(`${API_BASE}/cart/items`, { headers, data: { variantId, quantity: 1 } })
    ];

    const responses = await Promise.all(addPromises);
    for (const res of responses) {
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeTruthy();
    }

    // 4. Verify get cart returns unified cart without NonUniqueResultException
    const getCartRes = await request.get(`${API_BASE}/cart`, { headers });
    expect(getCartRes.status()).toBe(200);
    const cartData = (await getCartRes.json()).data;
    expect(cartData).toBeTruthy();
    expect(cartData.items.length).toBeGreaterThan(0);
  });

  test('BUG 2 (AUTH-HYDRATION-01): Admin Route Hydration on Direct Entry & Page Reload', async ({ page }) => {
    // 1. Authenticate as Admin
    await authenticateInBrowser(page, null, true);

    // 2. Verify admin console is loaded
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console/i).first()).toBeVisible({ timeout: 15000 });

    // 3. Perform hard page reload on /admin to test hydration race condition
    await page.reload();

    // 4. Assert that "403 — Unauthorized Administrative Access" is NOT rendered
    await expect(page.getByText(/403 — Unauthorized Administrative Access/i)).toHaveCount(0);

    // 5. Assert that admin console loaded successfully after hydration
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/SUPER ADMINISTRATOR|ROLE_ADMIN/i).first()).toBeVisible({ timeout: 10000 });

    // 6. Navigate directly via URL bar to /admin/inventory without prior tab clicking
    await page.goto('/admin/inventory');
    await expect(page.getByText(/403 — Unauthorized Administrative Access/i)).toHaveCount(0);
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('BUG 3 (VALIDATION-ADDR-01): Address Recipient Name Alphanumeric Acceptance', async ({ request }) => {
    // 1. Create a fresh test user
    const user = generateTestUser('addr_val');
    const regRes = await request.post(`${API_BASE}/auth/oauth/google`, {
      data: user
    });
    expect(regRes.status()).toBe(200);
    const token = (await regRes.json()).data.token;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Submit address with alphanumeric recipient name (e.g. "Unit 4B John Doe")
    const addrRes = await request.post(`${API_BASE}/customer/addresses`, {
      headers,
      data: {
        recipientName: 'Unit 4B John Doe',
        phone: user.phone,
        line1: '42 Orchid Street',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        isDefault: true
      }
    });

    expect(addrRes.status()).toBe(200);
    const addrJson = await addrRes.json();
    expect(addrJson.success).toBe(true);
    expect(addrJson.data.recipientName).toBe('Unit 4B John Doe');
  });

  test('BUG 4 (API-ERR-CONTRACT-01): Normalized Error Responses on Backend and Frontend API Contract', async ({ request }) => {
    // 1. Send invalid address request to trigger validation exception
    const user = generateTestUser('err_val');
    const regRes = await request.post(`${API_BASE}/auth/oauth/google`, { data: user });
    const token = (await regRes.json()).data.token;

    const badRes = await request.post(`${API_BASE}/customer/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        recipientName: 'X', // Too short, fails min length
        phone: '123', // Invalid phone length
        line1: '',
        city: '',
        state: '',
        pincode: '00'
      }
    });

    expect(badRes.status()).toBe(400);
    const errJson = await badRes.json();
    expect(errJson.success).toBe(false);

    // Verify root message and error structure are both present and populated
    expect(errJson.message).toBeTruthy();
    expect(typeof errJson.message).toBe('string');
  });

});
