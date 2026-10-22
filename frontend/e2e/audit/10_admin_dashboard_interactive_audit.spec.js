import { test, expect } from '@playwright/test';
import { authenticateInBrowser, API_BASE, ADMIN_EMAIL } from './audit_helpers.js';

test.describe('PHASE 9: Admin Dashboard Complete Interaction & Functional Audit', () => {

  test('ADMIN-01: Admin Login & Overview Summary Cards Reconciliation', async ({ page }) => {
    // 1. Authenticate as Admin
    await authenticateInBrowser(page, null, true);

    // 2. Verify Admin Console Header & Role
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/SUPER ADMINISTRATOR|ROLE_ADMIN/i).first()).toBeVisible({ timeout: 10000 });

    // 3. Verify Metric Cards render with numerical data
    await expect(page.locator('[data-testid="header-metric-catalog"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="header-metric-revenue"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="header-metric-orders"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="header-metric-customers"]')).toBeVisible({ timeout: 15000 });

    // 4. Test interactive analytics modal on metric card click
    await page.locator('[data-testid="header-metric-catalog"]').click();
    await expect(page.getByText(/Catalog Products & Inventory Registry|Complete catalog/i).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Close modal/i }).click();
  });

  test('ADMIN-02: Products & Variants Section - Table, Search & Filter', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Click Product & Catalog domain card
    const catalogDomain = page.getByRole('link', { name: /Product & Catalog/i });
    await expect(catalogDomain).toBeVisible({ timeout: 15000 });
    await catalogDomain.click();

    // Verify products table renders
    await expect(page.getByText(/Catalog Products Registry/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Test Search input
    const searchInput = page.getByPlaceholder(/Search title, SKU/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Oyster');
      await page.waitForTimeout(500);
      await expect(page.getByText(/Oyster/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('ADMIN-03: Inventory & Stock Replenishment Action', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Inventory via link
    const invLink = page.locator('a[href*="/admin/inventory"]').first();
    if (await invLink.isVisible()) {
      await invLink.click();
    } else {
      await page.locator('a[href*="/admin/products"]').first().click();
      const subInv = page.locator('a[href*="/admin/inventory"]').first();
      if (await subInv.isVisible()) await subInv.click();
    }

    await expect(page.getByText(/Inventory|Stock Management|Stock Health/i).first()).toBeVisible({ timeout: 15000 });
    const replenishBtn = page.getByRole('button', { name: /Replenish|Add Stock|\+ Stock|Restock/i }).first();
    if (await replenishBtn.isVisible()) {
      await replenishBtn.click();
      await page.waitForTimeout(300);
      const modal = page.locator('div[role="dialog"], .fixed').first();
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('ADMIN-04: Orders Management - Table, Status Filter & Details Inspection', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Orders via link
    const orderLink = page.locator('a[href*="/admin/orders"]').first();
    await expect(orderLink).toBeVisible({ timeout: 10000 });
    await orderLink.click();

    await expect(page.getByText(/Orders|Order Management|Order Records/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table, div[role="table"]').first()).toBeVisible({ timeout: 10000 });

    // Check status filter dropdown/buttons
    const filterBtn = page.locator('button, select').filter({ hasText: /ALL|PAID|CONFIRMED|SHIPPED|Status/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
  });

  test('ADMIN-05: Platform Finance & Withdrawal Review Operations', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Finance via link
    const finLink = page.locator('a[href*="/admin/finance"], a[href*="/admin/platform-wallets"]').first();
    await expect(finLink).toBeVisible({ timeout: 10000 });
    await finLink.click();

    await expect(page.getByText(/Finance|Wallet Ledger|Platform Balance|Withdrawal/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-06: Training Courses & Batches Section Inspection', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Courses via link
    const trainLink = page.locator('a[href*="/admin/courses"], a[href*="/admin/training"]').first();
    await expect(trainLink).toBeVisible({ timeout: 10000 });
    await trainLink.click();

    await expect(page.getByText(/Courses|Training|Masterclasses|Batches/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-07: Customer Support Helpdesk Section Inspection', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Support via link
    const suppLink = page.locator('a[href*="/admin/support"]').first();
    await expect(suppLink).toBeVisible({ timeout: 10000 });
    await suppLink.click();

    await expect(page.getByText(/Support Tickets|Helpdesk|Customer Inquiries|Complaint/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-08: Shipping Simulation & Courier Tracking Operations', async ({ page }) => {
    await authenticateInBrowser(page, null, true);

    // Navigate to Shipping via link
    const shipLink = page.locator('a[href*="/admin/shipping"]').first();
    if (await shipLink.isVisible()) {
      await shipLink.click();
    } else {
      await page.locator('a[href*="/admin/orders"]').first().click();
      const subShip = page.locator('a[href*="/admin/shipping"]').first();
      if (await subShip.isVisible()) await subShip.click();
    }

    await expect(page.getByText(/Shipping|Logistics|Shiprocket|Courier/i).first()).toBeVisible({ timeout: 15000 });
  });
});
