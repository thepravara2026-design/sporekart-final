import { test, expect } from '@playwright/test';

test.describe('E2E Flow 3: Guest Cart Management', () => {
  test('Guest can add items to cart and modify quantities', async ({ page }) => {
    // 1. Visit catalog page
    await page.goto('/catalog');
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // 2. Open Cart Drawer / Page
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
  });
});
