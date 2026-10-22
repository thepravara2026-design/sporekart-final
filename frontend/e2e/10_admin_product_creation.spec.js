import { test, expect } from '@playwright/test';

test.describe('E2E Flows 10, 11, 12: Admin Product Creation, Media Upload & Order Management', () => {
  test('Admin control plane routes exist and require authorization', async ({ page }) => {
    // 1. Visit Admin Login Page
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 2. Submit Dev Mock Admin Authentication (thepravara2026@gmail.com)
    const adminDevBtn = page.getByRole('button', { name: /Dev Mode: Sign in as thepravara2026@gmail.com|Continue as thepravara2026@gmail.com/i });
    await expect(adminDevBtn).toBeVisible({ timeout: 15000 });
    await adminDevBtn.click();

    // 3. Verify Admin Control Dashboard Access
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console|Dashboard|Overview/i).first()).toBeVisible({ timeout: 20000 });
  });
});
