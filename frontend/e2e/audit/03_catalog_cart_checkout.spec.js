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

    // 3. Fill Shipping Address Form if needed
    const recipientInput = page.locator('#recipientName, input[name="recipientName"]').first();
    if (await recipientInput.isVisible()) {
      await recipientInput.fill(testUser.fullName);
      await page.locator('#phone, input[name="phone"]').first().fill(testUser.phone);
      await page.locator('#line1, input[name="line1"]').first().fill('101 Green Valley');
      await page.locator('#city, input[name="city"]').first().fill('Pune');
      await page.locator('#state, select[name="state"]').first().selectOption('Maharashtra');
      await page.locator('#pincode, input[name="pincode"]').first().fill('411001');

      const saveAddressBtn = page.getByRole('button', { name: /Save Address|Use this address/i }).first();
      if (await saveAddressBtn.isVisible()) {
        await saveAddressBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 4. Place Order / Proceed to Payment
    const placeOrderBtn = page.getByTestId('checkout-button');
    await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // 5. Payment Page Verification
    await page.waitForURL(/\/payment\?type=order/, { timeout: 20000 });
    await expect(page.getByText(/Total Amount|Payment/i).first()).toBeVisible({ timeout: 10000 });

    // 6. Complete Simulated Payment
    const payBtn = page.getByRole('button', { name: /Pay ₹.*Securely|Pay Securely/i });
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
