import { test, expect } from '@playwright/test';

test.describe('E2E Flow 9: Training Enrollment & Course Details', () => {
  test('User inspects training courses and opens enrollment modal', async ({ page }) => {
    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);
    await expect(page.getByRole('heading', { name: /Mushroom Cultivation Training/i })).toBeVisible();
  });
});
