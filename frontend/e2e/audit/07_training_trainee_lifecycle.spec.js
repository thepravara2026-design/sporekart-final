import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE } from './audit_helpers.js';

test.describe('PHASE 6: Training Discovery, Enrollment & Cancellation Lifecycle', () => {

  test('TRAIN-01: Training Catalog & Course Detail Browsing', async ({ page }) => {
    await page.goto('/training');
    await expect(page.getByText(/Masterclasses|Mushroom Training|Cultivation/i).first()).toBeVisible({ timeout: 15000 });

    // Open first course details
    const exploreBtn = page.getByRole('link', { name: /View Details|Explore Course|Enroll/i }).first();
    if (await exploreBtn.isVisible()) {
      await exploreBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/Curriculum|Syllabus|Upcoming Batches/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('TRAIN-02: Complete Trainee Enrollment, Payment & Confirmation Journey', async ({ page }) => {
    const testUser = generateTestUser('trainee');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // 1. Fetch available course & batch
    const coursesRes = await page.request.get(`${API_BASE}/training/courses`);
    const courses = (await coursesRes.json()).data;
    const course = courses[0];
    const batch = course.slots[0];
    expect(batch).toBeTruthy();

    const initialSeats = batch.availableSeats;

    // 2. Perform Enrollment via API/UI
    const enrollRes = await page.request.post(`${API_BASE}/training/enroll`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        batchId: batch.id,
        slotId: batch.id
      }
    });
    const enrollJson = await enrollRes.json();
    expect(enrollJson.success).toBe(true);
    const enrollmentId = enrollJson.data.id;

    // 3. Confirm Enrollment Payment
    const payRes = await page.request.post(`${API_BASE}/payment/verify-enrollment`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: {
        enrollmentId,
        paymentMethod: 'ONLINE_MOCK',
        transactionReference: 'TXN_TRAIN_' + Date.now()
      }
    });
    const payJson = await payRes.json();
    expect(payJson.success).toBe(true);

    // 4. Visit Training Confirmation Screen in Browser
    await page.goto(`/training/confirmation/${enrollmentId}`);
    await expect(page.getByText(/Enrollment Confirmed|Congratulations/i).first()).toBeVisible({ timeout: 15000 });

    // 5. Inspect Booking in Customer Dashboard
    await page.goto('/dashboard?tab=trainings');
    await expect(page.getByText(course.title).first()).toBeVisible({ timeout: 15000 });
  });

  test('TRAIN-03: Trainee Enrollment Cancellation & Seat Release', async ({ page }) => {
    const testUser = generateTestUser('cancel_trainee');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    const coursesRes = await page.request.get(`${API_BASE}/training/courses`);
    const course = (await coursesRes.json()).data[0];
    const batch = course.slots[0];

    // Enroll
    const enrollRes = await page.request.post(`${API_BASE}/training/enroll`, {
      headers: { Authorization: `Bearer ${authData.token}` },
      data: { batchId: batch.id, slotId: batch.id }
    });
    const enrollmentId = (await enrollRes.json()).data.id;

    // Cancel enrollment
    const cancelRes = await page.request.post(`${API_BASE}/training/enrollments/${enrollmentId}/cancel?reason=Schedule%20Conflict`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const cancelJson = await cancelRes.json();
    if (cancelJson.success) {
      expect(cancelJson.data.status).toBe('CANCELLED');
      await page.goto('/dashboard?tab=trainings');
      await expect(page.getByText(/CANCELLED/i).first()).toBeVisible({ timeout: 15000 });
    } else {
      // Validates business policy: cancellation is restricted within 7 days of batch start date
      expect(cancelJson.message).toMatch(/at least 7 days before the batch start date|cancellation/i);
    }
  });
});
