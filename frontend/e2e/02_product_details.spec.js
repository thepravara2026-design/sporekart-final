import { test, expect } from '@playwright/test';

test.describe('E2E Flow 2: Product Details & Intelligent Stock Availability', () => {
  test('Guest can inspect product detail page, stock availability label, gallery, and check pincode', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 15000 });
    await firstProduct.getByRole('link').first().click();

    await expect(page).toHaveURL(/\/product\//, { timeout: 15000 });
    await page.getByTestId('product-title').waitFor({ state: 'visible', timeout: 20000 });
    await expect(page.getByTestId('product-title')).toBeVisible();
    await expect(page.getByTestId('product-price')).toBeVisible();

    const availabilityBadge = page.getByTestId('product-availability');
    await expect(availabilityBadge).toBeVisible({ timeout: 10000 });
    const availabilityText = await availabilityBadge.innerText();
    expect(availabilityText).toMatch(/Available|In Stock|Limited stock|Only a few left|Out of stock/i);
    expect(availabilityText).not.toMatch(/\b\d+\s+in stock\b/i);

    const gallery = page.getByTestId('product-gallery');
    await expect(gallery).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('product-primary-image')).toBeVisible({ timeout: 10000 });

    const pincodeInput = page.getByPlaceholder(/6-digit PIN code/i);
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('560001');
      await page.getByRole('button', { name: /Check Delivery|Check/i }).click();
      await expect(page.getByText(/Delivery Available|Serviceable|Days/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
