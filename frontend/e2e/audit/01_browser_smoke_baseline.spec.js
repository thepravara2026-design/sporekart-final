import { test, expect } from '@playwright/test';
import { setupConsoleAndNetworkWatchers, FRONTEND_URL } from './audit_helpers.js';

test.describe('PHASE 2: Browser Smoke Test Baseline', () => {

  test('SMOKE-01: Public Core Routes Load Without Fatal Errors', async ({ page }) => {
    const { consoleErrors, failedRequests } = setupConsoleAndNetworkWatchers(page);

    const routes = [
      '/',
      '/products',
      '/training',
      '/about',
      '/contact',
      '/blog',
      '/mushroom-cultivation-guide',
      '/mushroom-spawn-guide',
      '/cart'
    ];

    for (const route of routes) {
      console.log(`Checking route: ${route}`);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);

      // Verify page container renders
      await expect(page.locator('#main-content')).toBeVisible({ timeout: 15000 });

      // Verify Navbar and Footer render
      await expect(page.locator('header, nav').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('footer').first()).toBeVisible({ timeout: 15000 });
    }

    // Verify no fatal crashes or critical unhandled JavaScript errors
    const fatalErrors = consoleErrors.filter(e => !e.text.includes('favicon') && !e.text.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED'));
    expect(fatalErrors.length).toBe(0);
  });

  test('SMOKE-02: Security Baseline - Guest Cannot Access Admin Console Directly', async ({ page }) => {
    // Attempting direct URL access to /admin as unauthenticated guest
    await page.goto('/admin');

    // Should render 403 Access Denied block
    await expect(page.getByText(/403 — Unauthorized Administrative Access|Access Denied/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/thepravara2026@gmail.com/i).first()).toBeVisible();

    // Verify Admin Control Login button is displayed
    const adminLoginLink = page.getByRole('link', { name: /Admin Sign-In Portal|Admin Control Login/i });
    await expect(adminLoginLink).toBeVisible();
  });

  test('SMOKE-03: Security Baseline - Direct Access to /admin/orders or /admin/products blocked for Guest', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByText(/403 — Unauthorized Administrative Access|Access Denied/i).first()).toBeVisible({ timeout: 10000 });

    await page.goto('/admin/orders');
    await expect(page.getByText(/403 — Unauthorized Administrative Access|Access Denied/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('SMOKE-04: Browser History Navigation (Back / Forward) Operates Seamlessly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/);

    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);

    await page.goBack();
    await expect(page).toHaveURL(/\/products/);

    await page.goForward();
    await expect(page).toHaveURL(/\/training/);
  });

  test('SMOKE-05: Page Refresh Does Not Corrupt or Crash UI State', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 15000 });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 15000 });
  });
});
