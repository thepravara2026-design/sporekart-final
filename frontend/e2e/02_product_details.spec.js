import { test, expect } from '@playwright/test';

test.describe('E2E Flow 2: Product Details & Intelligent Stock Availability', () => {
  test('Guest can inspect product detail page, stock availability label, gallery, and check pincode', async ({ page }) => {
    // 1. Navigate to catalog and click first product
    await page.goto('/catalog');
    const firstProduct = page.locator('.group.relative').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // 2. Verify Product Detail URL & Core Elements
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByTestId('product-title')).toBeVisible();
    await expect(page.getByTestId('product-price')).toBeVisible();

    // 3. Verify Stock Availability Messaging (No raw integer quantity displayed)
    const availabilityBadge = page.getByTestId('product-availability');
    await expect(availabilityBadge).toBeVisible();
    const availabilityText = await availabilityBadge.innerText();
    expect(availabilityText).toMatch(/Available|Limited stock|Only a few left|Out of stock/i);
    expect(availabilityText).not.toMatch(/\b\d+\s+in stock\b/i);

    // 4. Verify Multi-Image Product Gallery
    const gallery = page.getByTestId('product-gallery');
    await expect(gallery).toBeVisible();
    await expect(page.getByTestId('product-primary-image')).toBeVisible();

    // 5. Verify Pincode Check Feature
    const pincodeInput = page.getByPlaceholder(/Enter 6-digit PIN code/i);
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('560001');
      await page.getByRole('button', { name: /Check Delivery/i }).click();
      await expect(page.getByText(/Serviceable/i)).toBeVisible();
    }
  });
});
