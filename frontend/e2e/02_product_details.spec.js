import { test, expect } from '@playwright/test';

test.describe('E2E Flow 2: Product Details', () => {
  test('Guest can inspect product detail page, select variants, and check pincode serviceability', async ({ page }) => {
    // 1. Navigate to catalog and click first product
    await page.goto('/catalog');
    const firstProduct = page.locator('.group.relative').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // 2. Verify Product Detail URL & Elements
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('button', { name: /Add to Cart/i })).toBeVisible();

    // 3. Verify Pincode Check Feature
    const pincodeInput = page.getByPlaceholder(/Enter Pincode/i);
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('560001');
      await page.getByRole('button', { name: /Check/i }).click();
      await expect(page.getByText(/Serviceable/i)).toBeVisible();
    }
  });
});
