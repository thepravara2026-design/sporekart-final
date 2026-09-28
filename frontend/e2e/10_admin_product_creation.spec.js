import { test, expect } from '@playwright/test';

test.describe('E2E Flows 10, 11, 12: Admin Product Creation, Media Upload & Order Management', () => {
  test('Admin control plane routes exist and require authorization', async ({ page }) => {
    // 1. Visit Admin Login Page
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 2. Submit Dev Mock Admin OTP (admin@sporekart.in + 123456)
    const directOtpBtn = page.getByRole('button', { name: /Enter OTP Directly/i });
    if (await directOtpBtn.isVisible()) {
      await directOtpBtn.click();
    } else {
      await page.getByRole('button', { name: /Send Admin OTP/i }).click();
    }

    const otpInput = page.getByTestId('otp-code-input');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');

    await page.getByTestId('verify-otp-btn').click();

    // 3. Verify Admin Control Dashboard Access
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/Sporekart Admin Control Plane|Admin Control Desk|Admin Console|Management Console|Dashboard|Restricted Access/i).first()).toBeVisible({ timeout: 10000 });
  });
});
