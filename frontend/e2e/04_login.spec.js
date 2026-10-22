import { test, expect } from '@playwright/test';

test.describe('AUTH-3 to AUTH-7: Customer Authentication & Session Management', () => {
  test('Customer Authentication Lifecycle: Modal Open, Google Auth Sign-In, and Token Persistence', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.reload();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const loginNavBtn = page.getByTestId('desktop-login-btn');
    await expect(loginNavBtn).toBeVisible({ timeout: 10000 });
    await loginNavBtn.click();

    // Verify Auth Modal appears
    await expect(page.getByText(/Login or Register to Sporekart/i)).toBeVisible({ timeout: 10000 });

    // Click Google Auth Dev Login button
    const googleLoginBtn = page.getByRole('button', { name: /Continue with Google|Quick Google Login Test/i }).first();
    await expect(googleLoginBtn).toBeVisible({ timeout: 10000 });
    await googleLoginBtn.click();

    // Verify modal closes and user is logged in
    await expect(page.getByTestId('desktop-login-btn')).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Log out of account/i })).toBeVisible({ timeout: 15000 });

    const token = await page.evaluate(() => localStorage.getItem('sporekart_token'));
    expect(token).toBeTruthy();
  });
});
