import { test, expect } from '@playwright/test';

test.describe('AUTH-3 to AUTH-7: Customer Authentication via OTP', () => {
  test('Full OTP Lifecycle: Request, Invalid OTP validation, and Fallback OTP Authentication', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const loginNavBtn = page.getByTestId('desktop-login-btn');
    await expect(loginNavBtn).toBeVisible({ timeout: 10000 });
    await loginNavBtn.click();

    const testEmail = `customer_${Date.now()}@sporekart.com`;
    const identifierInput = page.getByTestId('auth-identifier-input');
    await identifierInput.waitFor({ state: 'visible', timeout: 10000 });
    await identifierInput.fill(testEmail);

    const sendOtpBtn = page.getByTestId('send-otp-btn');
    await sendOtpBtn.click();

    const otpInput = page.getByTestId('otp-code-input');
    await otpInput.waitFor({ state: 'visible', timeout: 15000 });

    // Test Invalid OTP (AUTH-5 validation failure path)
    await otpInput.fill('999999');
    const submitOtpBtn = page.getByTestId('verify-otp-btn');
    await submitOtpBtn.click();

    await expect(page.getByText(/Invalid OTP code/i)).toBeVisible({ timeout: 10000 });

    // Test Valid Fallback OTP (AUTH-4 & AUTH-6 success path)
    await otpInput.fill('123456');
    await submitOtpBtn.click();

    await expect(loginNavBtn).not.toBeVisible({ timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('sporekart_token'));
    expect(token).toBeTruthy();
  });
});
