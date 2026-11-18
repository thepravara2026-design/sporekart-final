import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 5: Customer Wallet Formal Retirement Verification (V41 & Business Rule Compliance)', () => {

  test('WALLET-01: Navigating to /dashboard?tab=wallet safely redirects to active orders / tracking', async ({ page }) => {
    const testUser = generateTestUser('wallet_dash');
    await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard?tab=wallet');
    await page.waitForLoadState('domcontentloaded');

    // Verify wallet tab redirect away from obsolete wallet controls
    await expect(page.getByRole('button', { name: /\+ Add Money|Add Money/i })).not.toBeVisible();
    await expect(page.getByText('Sporekart Agri-Wallet')).not.toBeVisible();
  });

  test('WALLET-02: Direct Top-Up API Call is Permanently Rejected with HTTP 410 GONE', async ({ page }) => {
    const testUser = generateTestUser('wallet_topup');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Attempt to call retired add-money endpoint
    const addMoneyRes = await page.request.post(`${API_BASE}/wallet/add-money`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { amount: 500.00 }
    });
    expect(addMoneyRes.status()).toBe(410);
    const body = await addMoneyRes.json();
    expect(body.message).toContain('WALLET_RETIRED');
  });

  test('WALLET-03: Wallet Checkout Payment Endpoint is Rejected with HTTP 410 GONE', async ({ page }) => {
    const testUser = generateTestUser('wallet_spend');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const spendRes = await page.request.post(`${API_BASE}/wallet/checkout-pay`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        type: 'order',
        orderId: null,
        amountFromWallet: 100.00,
        amountFromGateway: 0.00
      }
    });
    expect(spendRes.status()).toBe(410);
    const body = await spendRes.json();
    expect(body.message).toContain('WALLET_RETIRED');
  });

  test('WALLET-04: Wallet Withdrawal Endpoint is Rejected with HTTP 410 GONE', async ({ page }) => {
    const testUser = generateTestUser('wallet_withdraw');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const wdRes = await page.request.post(`${API_BASE}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        amount: 500.00,
        bankName: 'HDFC Bank',
        accountNumber: '50100123456789',
        ifscCode: 'HDFC0001234',
        accountHolderName: testUser.fullName
      }
    });
    expect(wdRes.status()).toBe(410);
    const body = await wdRes.json();
    expect(body.message).toContain('WALLET_RETIRED');
  });
});
