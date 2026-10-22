import { test, expect } from '@playwright/test';

test.describe('FE-9 & FE-10: Full Checkout, Payment Authorization & Order Confirmation', () => {
  test('Complete flow: Guest browse -> Cart -> Checkout -> Shipping -> Payment -> Order Confirmation', async ({ page, context }) => {
    test.setTimeout(90000);
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

    // Wait for item to be added and navigate to /cart
    await page.waitForTimeout(500);
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    const cartCheckoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i });
    await expect(cartCheckoutBtn).toBeVisible({ timeout: 10000 });
    await cartCheckoutBtn.click();

    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // 3. Complete Inline Login on Checkout Page (if guest)
    const googleDevBtn = page.getByRole('button', { name: /Quick Google Login Test|Continue with Google \(Dev Mode\)/i }).first();
    const recipientInput = page.locator('#recipientName');

    const mode = await Promise.race([
      googleDevBtn.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'login').catch(() => null),
      recipientInput.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'address').catch(() => null)
    ]);

    if (mode === 'login') {
      await googleDevBtn.click();
      await expect(page.getByText(/Validating cart prices/i)).not.toBeVisible({ timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // 4. Wait for address state to settle (either loading spinner finishes or form/cards appear)
    await expect(page.getByText(/Loading address details/i)).not.toBeVisible({ timeout: 15000 }).catch(() => {});

    const addressCard = page.locator('.rounded-card').first();
    await expect(recipientInput.or(addressCard)).toBeVisible({ timeout: 15000 });

    if (await recipientInput.isVisible()) {
      const uniquePhone = '8' + Math.floor(100000000 + Math.random() * 900000000);
      await recipientInput.fill('Playwright Customer');
      await page.locator('#phone').fill(uniquePhone);
      await page.locator('#pincode').fill('560001');
      await page.locator('#state').selectOption('Karnataka');
      await page.waitForTimeout(400);

      const citySelect = page.locator('select#city');
      if (await citySelect.isVisible().catch(() => false)) {
        await citySelect.selectOption({ index: 1 });
      } else {
        await page.locator('input#city').fill('Bengaluru');
      }
      await page.locator('#line1').fill('123 Green Agro Road, Near Hub');

      const saveAddressBtn = page.getByRole('button', { name: /Save Address/i });
      if (await saveAddressBtn.isVisible().catch(() => false)) {
        await saveAddressBtn.click();
        await expect(saveAddressBtn).not.toBeVisible({ timeout: 10000 }).catch(() => {});
      }
    } else if (await addressCard.isVisible()) {
      await addressCard.click();
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
    const payBtn = page.getByRole('button', { name: /Pay ₹.*Securely|Pay .*via Razorpay|Pay .*with Wallet Balance/i }).first();
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // 8. Verify Order Confirmation Screen Loaded
    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 25000 });
    await expect(page.getByText(/Payment Confirmed|Order Confirmed|Thank you/i).first()).toBeVisible({ timeout: 15000 });
  });
});
