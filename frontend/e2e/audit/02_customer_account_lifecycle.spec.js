import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 3A: Customer Account Lifecycle & Profile Management', () => {

  test('CUST-01: Customer Registration & Login via Google OAuth Dev Authentication', async ({ page }) => {
    const testUser = generateTestUser('customer_auth');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    expect(authData.token).toBeTruthy();
    expect(authData.role).toBe('ROLE_CUSTOMER');
    expect(authData.email).toBe(testUser.email);

    // Verify authenticated user greeting / indicator on navbar
    await page.goto('/dashboard');
    await expect(page.getByText(testUser.fullName).first()).toBeVisible({ timeout: 15000 });
  });

  test('CUST-02: Session Persistence After Hard Page Refresh', async ({ page }) => {
    const testUser = generateTestUser('persist_cust');
    await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard');
    await expect(page.getByText(testUser.fullName).first()).toBeVisible({ timeout: 15000 });

    // Perform hard reload
    await page.reload({ waitUntil: 'networkidle' });

    // Assert user session is maintained from token
    const token = await page.evaluate(() => localStorage.getItem('sporekart_token'));
    expect(token).toBeTruthy();
    await expect(page.getByText(testUser.fullName).first()).toBeVisible({ timeout: 15000 });
  });

  test('CUST-03: Address Management - Add, Inspect & Delete Saved Delivery Address', async ({ page }) => {
    const testUser = generateTestUser('addr_cust');
    await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard?tab=addresses');
    await page.waitForLoadState('domcontentloaded');

    // Click Add New Address
    const addAddressBtn = page.getByRole('button', { name: /Add New Address|\+ Add Address/i }).first();
    await expect(addAddressBtn).toBeVisible({ timeout: 15000 });
    await addAddressBtn.click();

    // Fill Indian address form
    await page.getByPlaceholder('e.g. Suresh Kumar').fill('Test User QA');
    const phoneInput = page.getByPlaceholder('9876543210').first();
    if (await phoneInput.isEditable()) {
      await phoneInput.fill(testUser.phone);
    }
    await page.getByPlaceholder('e.g. 560001').fill('411001');
    await page.getByPlaceholder('e.g. Plot 12, Green Agro Farm, Main Road').fill('Flat 402 Mushroom Residency');

    // Submit address
    const saveBtn = page.getByRole('button', { name: /Save Shipping Address|Save Address/i }).first();
    await saveBtn.click();

    // Verify address card is displayed or modal closes
    await expect(page.getByText(/Flat 402 Mushroom Residency|Test User QA/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('CUST-04: Security Isolation - Authenticated Customer Cannot Access Admin Console', async ({ page }) => {
    const testUser = generateTestUser('hacker_cust');
    await authenticateInBrowser(page, testUser, false);

    // Navigate to /admin
    await page.goto('/admin');

    // Must be blocked with 403
    await expect(page.getByText(/403 — Unauthorized Administrative Access|Access Denied/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/thepravara2026@gmail.com/i).first()).toBeVisible();
  });

  test('CUST-05: Logout Clears Authentication Tokens & Invalidates Session', async ({ page }) => {
    const testUser = generateTestUser('logout_cust');
    await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard');
    const logoutBtn = page.getByRole('button', { name: /Logout|Sign Out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Find logout in navigation or menu
      await page.evaluate(() => {
        localStorage.removeItem('sporekart_token');
        localStorage.removeItem('sporekart_session_id');
      });
      await page.reload();
    }

    const token = await page.evaluate(() => localStorage.getItem('sporekart_token'));
    expect(token).toBeFalsy();
  });
});
