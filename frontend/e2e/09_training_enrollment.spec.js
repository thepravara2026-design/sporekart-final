import { test, expect } from '@playwright/test';

test.describe('FE-16 & FE-17: Training Course Browse, Batch Enrollment & Confirmation', () => {
  test('User inspects course details, enrolls in upcoming batch, completes payment, and receives confirmation', async ({ page, context }) => {
    test.setTimeout(90000);
    // 0. Ensure fresh guest session directly on /training
    page.on('console', msg => console.log(`[BROWSER ${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]:', err));

    await context.clearCookies();
    await page.goto('/training');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 2. Select First Available Course & Click Enroll Now
    const enrollBtn = page.getByRole('button', { name: /Enroll Now|Select Slot/i }).first();
    await expect(enrollBtn).toBeVisible({ timeout: 20000 });
    await enrollBtn.click();

    // 3. Authenticate via Google Dev Auth in Auth Modal (if guest)
    const googleDevBtn = page.getByRole('button', { name: /Quick Google Login Test|Continue with Google \(Dev Mode\)/i }).first();
    await googleDevBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await googleDevBtn.isVisible()) {
      await googleDevBtn.click();
      await expect(googleDevBtn).not.toBeVisible({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // 4. Fill Trainee Profile Modal & Proceed to Payment
    await expect(page.getByText(/Loading profile details/i)).not.toBeVisible({ timeout: 15000 }).catch(() => {});

    const recipientInput = page.locator('#recipientName');
    const proceedPaymentBtn = page.getByRole('button', { name: /Save Profile & Proceed to Payment|Confirm Seat & Proceed to Payment|Proceed to Payment/i }).first();

    await expect(recipientInput).toBeVisible({ timeout: 15000 });

    const uniquePhone = '8' + Math.floor(100000000 + Math.random() * 900000000);
    await recipientInput.fill('Playwright Trainee');
    const phoneInput = page.locator('#phone');
    await phoneInput.fill(uniquePhone);
    await page.locator('#pincode').fill('560001');
    await page.waitForTimeout(500);

    // Ensure phone number was retained through PIN lookup
    if ((await phoneInput.inputValue()) !== uniquePhone) {
      await phoneInput.fill(uniquePhone);
    }

    await page.locator('#state').selectOption('Karnataka');
    await page.waitForTimeout(400);

    const citySelect = page.locator('select#city');
    if (await citySelect.isVisible().catch(() => false)) {
      await citySelect.selectOption({ index: 1 });
    } else {
      await page.locator('input#city').fill('Bengaluru');
    }
    await page.locator('#line1').fill('123 Agri Campus Road');

    await expect(proceedPaymentBtn).toBeVisible({ timeout: 10000 });
    await expect(proceedPaymentBtn).toBeEnabled({ timeout: 10000 });
    await proceedPaymentBtn.click();

    // 5. Verify Payment Gateway Loaded for Enrollment
    await page.waitForURL(/\/payment\?type=enrollment/, { timeout: 25000 });
    
    // 6. Authorize Payment
    const payBtn = page.getByRole('button', { name: /Pay ₹.*via Razorpay|Pay ₹.*Securely|Pay .*with Wallet Balance/i }).first();
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // 7. Verify Training Confirmation Screen Loaded
    await page.waitForURL(/\/training\/confirmation\//, { timeout: 25000 });
    await expect(page.getByText(/Seat Reserved|Enrollment Confirmed|Training Masterclass|Confirmed/i).first()).toBeVisible({ timeout: 15000 });
  });
});
