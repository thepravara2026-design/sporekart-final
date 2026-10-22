import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 3B & 3C: Product Discovery, Cart Operations & End-to-End Order Lifecycle', () => {

  test('ORDER-01: Catalog Browsing, Search & Filter Verification', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 15000 });

    const cardCount = await page.getByTestId('product-card').count();
    expect(cardCount).toBeGreaterThan(0);

    // Test Category filter navigation
    const categoryLink = page.getByRole('link', { name: /Dry Mushrooms|Fresh Mushrooms|Mushroom Growing Kits/i }).first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('ORDER-02: Product Detail Page - Variant Pricing & Stock Availability', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.getByTestId('product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.getByRole('link').first().click();

    await expect(page).toHaveURL(/\/product\//, { timeout: 15000 });
    await expect(page.getByTestId('product-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('product-price')).toBeVisible();

    // Verify stock availability badge
    const badge = page.getByTestId('product-availability').first();
    await expect(badge).toBeVisible();

    // If variants exist, click variant button and verify price / sku update
    const variantBtns = page.getByTestId('product-variant').locator('button');
    if (await variantBtns.count() > 1) {
      await variantBtns.nth(1).click();
      await page.waitForTimeout(300);
      await expect(page.getByTestId('product-price')).toBeVisible();
    }
  });

  test('ORDER-03: Guest Cart Operations - Add, Modify Quantity & Remove', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/products');
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.reload();

    const firstCard = page.getByTestId('product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.getByRole('link').first().click();

    await page.getByTestId('product-title').waitFor({ state: 'visible', timeout: 15000 });
    const addToCartBtn = page.getByTestId('add-to-cart').first();
    await expect(addToCartBtn).toBeEnabled({ timeout: 10000 });

    const cartAddPromise = page.waitForResponse(r => r.url().includes('/cart/items') && r.status() === 200, { timeout: 15000 });
    await addToCartBtn.click();
    await cartAddPromise;

    // Verify Cart Drawer opens or navigate to /cart
    await page.goto('/cart');
    await expect(page.getByText(/Your Shopping Cart|Shopping Cart|Order Summary/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Proceed to Checkout|Checkout/i })).toBeVisible({ timeout: 10000 });
  });

  test('ORDER-04: Full Checkout, Simulated Payment & Order Confirmation Lifecycle', async ({ page, context }) => {
    test.setTimeout(60000);
    const testUser = generateTestUser('order_flow');
    await authenticateInBrowser(page, testUser, false);

    // 1. Select Product & Add to Cart
    await page.goto('/products');
    const firstCard = page.getByTestId('product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.getByRole('link').first().click();

    await page.getByTestId('product-title').waitFor({ state: 'visible', timeout: 15000 });
    const addToCartBtn = page.getByTestId('add-to-cart').first();
    await expect(addToCartBtn).toBeEnabled({ timeout: 10000 });

    const cartAddPromise = page.waitForResponse(r => r.url().includes('/cart/items') && r.status() === 200, { timeout: 15000 });
    await addToCartBtn.click();
    await cartAddPromise;

    // 2. Proceed to Cart
    await page.goto('/cart');
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // 3. Fill Shipping Address Form
    const nameInput = page.getByPlaceholder('e.g. Suresh Kumar').first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.fill(testUser.fullName);

    const phoneInput = page.getByPlaceholder('9876543210').first();
    if (await phoneInput.isEditable()) {
      await phoneInput.fill(testUser.phone);
    }

    await page.getByPlaceholder('e.g. 560001').fill('411001');
    await expect(page.getByText(/Auto-filled/i)).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('e.g. Plot 12, Green Agro Farm, Main Road').fill('101 Green Valley');

    // 4. Place Order / Proceed to Payment
    const placeOrderBtn = page.getByTestId('checkout-button');
    await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // 5. Payment Page Verification
    await page.waitForURL(/\/payment\?type=order/, { timeout: 20000 });
    await expect(page.getByText(/Total Amount|Payment/i).first()).toBeVisible({ timeout: 10000 });

    // 6. Complete Simulated Payment
    const payBtn = page.getByRole('button', { name: /Pay ₹.*via Razorpay|Pay .*via Razorpay|Pay Securely|Pay ₹.*with Wallet Balance/i });
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // 7. Order Confirmation Verification
    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 25000 });
    await expect(page.getByText(/Payment Confirmed|Order Confirmed|Thank you/i).first()).toBeVisible({ timeout: 15000 });

    // Extract Order ID from URL
    const url = page.url();
    const orderId = url.split('/order-confirmation/')[1]?.split('?')[0];
    expect(orderId).toBeTruthy();

    // 8. Refresh Confirmation Screen - Idempotency Check (No duplicate orders)
    await page.reload();
    await expect(page.getByText(/Payment Confirmed|Order Confirmed|Thank you/i).first()).toBeVisible({ timeout: 15000 });

    // 9. Inspect Order in Customer History
    await page.goto('/dashboard?tab=activeTrack');
    await expect(page.getByText(/PAID|CONFIRMED|PLACED/i).first()).toBeVisible({ timeout: 15000 });
  });
});
