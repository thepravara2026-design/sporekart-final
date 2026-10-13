import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 5: Customer Wallet & Ledger Lifecycle Validation', () => {

  test('WALLET-01: Wallet Dashboard Renders Initial Balance & Ledger UI', async ({ page }) => {
    const testUser = generateTestUser('wallet_dash');
    await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard?tab=wallet');
    await page.waitForLoadState('domcontentloaded');

    // Verify Wallet Balance Card
    await expect(page.getByText(/Wallet Balance|Available Balance/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Add Money|\+ Add Money/i })).toBeVisible({ timeout: 10000 });
  });

  test('WALLET-02: Wallet Top-Up Lifecycle (Add Money, Verify Payment & Ledger Credit)', async ({ page }) => {
    const testUser = generateTestUser('wallet_topup');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Initial balance should be 0
    const balRes1 = await page.request.get(`${API_BASE}/wallet/balance`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    expect(Number((await balRes1.json()).data)).toBe(0);

    // 1. Initiate Add Money via API / UI
    const addMoneyRes = await page.request.post(`${API_BASE}/wallet/add-money`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { amount: 500.00 }
    });
    const addMoneyJson = await addMoneyRes.json();
    expect(addMoneyJson.success).toBe(true);
    const rzpOrderId = addMoneyJson.data.razorpayOrderId;

    // 2. Verify Add Money Payment
    const verifyRes = await page.request.post(`${API_BASE}/wallet/verify-add-money?amount=500.00`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_topup_mock_' + Date.now(),
        razorpaySignature: 'mock_signature'
      }
    });
    const verifyJson = await verifyRes.json();
    expect(verifyJson.success).toBe(true);
    expect(Number(verifyJson.data.balanceAfter)).toBe(500.00);

    // 3. Inspect Browser UI to verify updated balance and ledger transaction
    await page.goto('/dashboard?tab=wallet');
    await expect(page.getByText(/₹\s*500/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/TOPUP/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('WALLET-03: Insufficient Balance Rejection on Spend Attempt', async ({ page }) => {
    const testUser = generateTestUser('wallet_spend');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Attempt to spend 9999 from wallet when balance is 0
    const spendRes = await page.request.post(`${API_BASE}/wallet/checkout-pay`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        type: 'order',
        orderId: null,
        amountFromWallet: 9999.00,
        amountFromGateway: 0.00
      }
    });

    // Should return 400 Bad Request or business error
    expect(spendRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('WALLET-04: Wallet Withdrawal Request Creation & Ledger Hold', async ({ page }) => {
    const testUser = generateTestUser('wallet_withdraw');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Credit 1000 first
    const addMoneyRes = await page.request.post(`${API_BASE}/wallet/add-money`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { amount: 1000.00 }
    });
    const rzpOrderId = (await addMoneyRes.json()).data.razorpayOrderId;

    await page.request.post(`${API_BASE}/wallet/verify-add-money?amount=1000.00`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_topup_for_wd_' + Date.now(),
        razorpaySignature: 'mock_signature'
      }
    });

    // Submit withdrawal request
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

    const wdJson = await wdRes.json();
    expect(wdJson.success).toBe(true);
    expect(wdJson.data.status).toBe('REQUESTED');

    // Verify balance in wallet reflects remaining available balance
    const walletRes = await page.request.get(`${API_BASE}/wallet`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const walletData = (await walletRes.json()).data;
    expect(Number(walletData.availableBalance)).toBe(500.00);
    expect(Number(walletData.pendingBalance)).toBe(500.00);
  });
});
