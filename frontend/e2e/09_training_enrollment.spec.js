import { test, expect } from '@playwright/test';

test.describe('FE-16 & FE-17: Training Course Browse, Batch Enrollment & Confirmation', () => {
  test('User inspects course details, enrolls in upcoming batch, completes payment, and receives confirmation', async ({ page, context }) => {
    // 0. Ensure fresh guest session
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.reload();

    // 1. Visit Training Masterclasses Page
    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 2. Select First Available Course & Click Enroll Now
    const enrollBtn = page.getByRole('button', { name: /Enroll Now|Select Slot/i }).first();
    await expect(enrollBtn).toBeVisible({ timeout: 20000 });
    await enrollBtn.click();

    // 3. Authenticate via OTP in Auth Modal (if guest)
    const testEmail = `trainee_${Date.now()}@sporekart.com`;
    const mobileInput = page.getByTestId('auth-identifier-input');
    const confirmPaymentBtn = page.getByRole('button', { name: /Confirm Seat & Proceed to Payment|Proceed to Payment/i });

    await Promise.race([
      mobileInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      confirmPaymentBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    ]);

    if (await mobileInput.isVisible().catch(() => false)) {
      await mobileInput.fill(testEmail);
      await page.getByTestId('send-otp-btn').click();

      const otpInput = page.getByTestId('otp-code-input');
      await otpInput.waitFor({ state: 'visible', timeout: 15000 });
      await otpInput.fill('123456');
      await page.getByTestId('verify-otp-btn').click();
    }

    // 4. Click Confirm Seat & Proceed to Payment in Batch Preview Modal
    await confirmPaymentBtn.waitFor({ state: 'visible', timeout: 20000 });
    await confirmPaymentBtn.click();

    // 5. Verify Payment Gateway Loaded for Enrollment
    await expect(page).toHaveURL(/\/payment\?type=enrollment/, { timeout: 20000 });
    
    // 6. Authorize Payment
    const payBtn = page.getByRole('button', { name: /Pay ₹.*Securely/i });
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // 7. Verify Training Confirmation Screen Loaded
    await expect(page).toHaveURL(/\/training\/confirmation\//, { timeout: 20000 });
    await expect(page.getByText(/Seat Reserved|Enrollment Confirmed|Training Masterclass/i).first()).toBeVisible({ timeout: 10000 });
  });
});
