import { test, expect } from '@playwright/test';

test.describe('FE-9 & FE-10: Full Checkout, Payment Authorization & Order Confirmation', () => {
  test('Complete flow: Guest browse -> Cart -> Checkout -> Shipping -> Payment -> Order Confirmation', async ({ page, context }) => {
    // 0. Ensure fresh guest session
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 1. Browse Catalog & Add Product to Cart
    await page.goto('/products');
    const firstCard = page.getByTestId('product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.getByRole('link').first().click();

    await expect(page).toHaveURL(/\/product\//, { timeout: 15000 });
    await page.getByTestId('product-title').waitFor({ state: 'visible', timeout: 15000 });

    const addToCartBtn = page.getByTestId('add-to-cart').first();
    await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });

    const variantBtn = page.getByTestId('product-variant').locator('button').first();
    if (await variantBtn.isVisible().catch(() => false)) {
      await variantBtn.click();
    }

    await expect(addToCartBtn).toBeEnabled({ timeout: 5000 });
    await addToCartBtn.click();

    // Wait for cart drawer or item to be added
    const drawer = page.getByRole('dialog', { name: /Shopping Cart Drawer/i });
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // 2. Proceed to Checkout from Cart Drawer or Page
    const drawerCheckoutBtn = drawer.getByRole('button', { name: /Proceed to Checkout|Checkout/i });
    if (await drawerCheckoutBtn.isVisible().catch(() => false)) {
      await drawerCheckoutBtn.click();
    } else {
      await page.goto('/cart');
      const cartCheckoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i });
      await expect(cartCheckoutBtn).toBeVisible({ timeout: 10000 });
      await cartCheckoutBtn.click();
    }

    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // 3. Complete Inline Login on Checkout Page (if guest)
    const testEmail = `checkout_${Date.now()}@sporekart.com`;
    const mobileInput = page.getByTestId('auth-identifier-input');
    const recipientInput = page.locator('#recipientName');

    await Promise.race([
      mobileInput.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
      recipientInput.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
    ]);

    if (await mobileInput.isVisible().catch(() => false)) {
      await mobileInput.fill(testEmail);
      await page.getByTestId('send-otp-btn').click();

      const otpInput = page.getByTestId('otp-code-input');
      await otpInput.waitFor({ state: 'visible', timeout: 15000 });
      await otpInput.fill('123456');
      await page.getByTestId('verify-otp-btn').click();

      // Wait until AuthForm unmounts or login state propagates
      await expect(mobileInput).toBeHidden({ timeout: 15000 });
    }

    // 4. Fill Shipping Address Form for new user
    await recipientInput.waitFor({ state: 'visible', timeout: 15000 });
    await recipientInput.fill('Playwright Guest Checkout');
    await page.locator('#phone').fill('9876543210');
    await page.locator('#line1').fill('123 Green Way');
    await page.locator('#city').fill('Bangalore');
    await page.locator('#state').fill('Karnataka');
    await page.locator('#pincode').fill('560001');

    const saveAddressBtn = page.getByRole('button', { name: /Save Address/i });
    if (await saveAddressBtn.isVisible().catch(() => false)) {
      await saveAddressBtn.click();
      await expect(recipientInput).toBeHidden({ timeout: 15000 });
    }

    page.on('dialog', dialog => dialog.accept().catch(() => {}));

    // 5. Submit Order / Proceed to Payment
    const placeOrderBtn = page.getByTestId('checkout-button');
    await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // 6. Verify Payment Gateway Page Loaded
    await page.waitForURL(/\/payment\?type=order/, { timeout: 20000 });
    await expect(page.getByText(/Total Amount/i).first()).toBeVisible({ timeout: 10000 });

    // 7. Select Payment & Click Pay Securely
    const payBtn = page.getByRole('button', { name: /Pay ₹.*Securely/i });
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // 8. Verify Order Confirmation Screen Loaded
    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 20000 });
    await expect(page.getByText(/Payment Confirmed|Thank you for your purchase/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Tax Invoice|Continue Shopping/i).first()).toBeVisible({ timeout: 10000 });
  });
});
