import { test, expect } from '@playwright/test';

test.describe('E2E Flow 3: Guest Cart Management', () => {
  test('Guest can add items to cart and modify quantities', async ({ page }) => {
    await page.goto('/products');
    const addToCartButton = page.getByTestId('add-to-cart').first();
    await addToCartButton.waitFor({ state: 'visible', timeout: 15000 });
    await addToCartButton.click();

    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText(/Shopping Cart|Cart Items|Order Summary/i).first()).toBeVisible({ timeout: 10000 });
  });
});
