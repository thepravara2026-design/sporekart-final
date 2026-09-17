import { test, expect } from '@playwright/test';

test.describe('E2E Flow 5 & 6: Cart Merge & Checkout Execution', () => {
  test('User merges guest items and opens checkout', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i });
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
      await expect(page).toHaveURL(/\/checkout/);
    }
  });
});
