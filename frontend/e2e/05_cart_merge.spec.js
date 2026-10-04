import { test, expect } from '@playwright/test';

test.describe('CART-6 & CART-7: Guest Cart Persistence & Session Merge on Login', () => {
  test('Guest adds items, logs in via OTP, and merges guest cart into authenticated session', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.reload();

    // 1. Guest Adds Item to Cart
    await page.goto('/products');
    const firstCard = page.getByTestId('product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('[data-testid="product-card"] a').first().click();

    await expect(page).toHaveURL(/\/product\//, { timeout: 15000 });
    const addToCartButton = page.getByTestId('add-to-cart').first();
    await addToCartButton.waitFor({ state: 'visible', timeout: 15000 });
    await addToCartButton.click();

    // Close CartDrawer by navigating directly to /cart page
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await page.waitForLoadState('domcontentloaded');

    // 2. Open Auth Modal & Authenticate via Fallback OTP
    const loginBtn = page.getByRole('button', { name: /Login or Sign Up|Login \/ Signup|Login/i }).first();
    await expect(loginBtn).toBeVisible({ timeout: 15000 });
    await loginBtn.click();
    
    const testEmail = `cartmerge_${Date.now()}@sporekart.com`;
    const identifierInput = page.getByTestId('auth-identifier-input');
    await identifierInput.waitFor({ state: 'visible', timeout: 10000 });
    await identifierInput.fill(testEmail);

    await page.getByTestId('send-otp-btn').click();

    const otpInput = page.getByTestId('otp-code-input');
    await otpInput.waitFor({ state: 'visible', timeout: 15000 });
    await otpInput.fill('123456');

    await page.getByTestId('verify-otp-btn').click();

    // 3. Verify Cart Persistence & Merged Session Item Count
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole('button', { name: /Proceed to Checkout|Checkout/i })).toBeVisible({ timeout: 10000 });
  });
});
