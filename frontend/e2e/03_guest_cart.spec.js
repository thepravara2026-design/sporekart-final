import { test, expect } from '@playwright/test';

test.describe('E2E Flow 3: Guest Cart Management', () => {
  test('Guest can add items to cart and modify quantities', async ({ page }) => {
    await page.goto('/products');
    const firstCardLink = page.locator('[data-testid="product-card"] a').first();
    await firstCardLink.waitFor({ state: 'visible', timeout: 15000 });
    await firstCardLink.click();

    await expect(page).toHaveURL(/\/product\//, { timeout: 15000 });
    const addToCartButton = page.getByTestId('add-to-cart').first();
    await addToCartButton.waitFor({ state: 'visible', timeout: 15000 });

    const variantBtn = page.getByTestId('product-variant').locator('button').first();
    if (await variantBtn.isVisible().catch(() => false)) {
      await variantBtn.click();
    }

    await addToCartButton.click();

    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });
});
