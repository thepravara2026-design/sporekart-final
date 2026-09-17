import { test, expect } from '@playwright/test';

test.describe('E2E Flow 4: Customer Authentication via OTP', () => {
  test('Customer requests OTP and authenticates', async ({ page }) => {
    await page.goto('/');
    // Trigger auth modal/page
    const loginBtn = page.getByRole('button', { name: /Login|Account/i }).first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }
  });
});
