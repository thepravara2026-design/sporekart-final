import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE, ADMIN_EMAIL, ADMIN_SUB } from './audit_helpers.js';

test.describe('PHASE 7: Customer Support Ticket & Helpdesk Lifecycle', () => {

  test('TICKET-01: Customer Creates Support Ticket with Valid Data', async ({ page }) => {
    const testUser = generateTestUser('support_cust');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    await page.goto('/dashboard?tab=support');
    await page.waitForLoadState('domcontentloaded');

    // Click Raise Ticket
    const raiseBtn = page.getByRole('button', { name: /Raise Complaint \/ Query|Raise a Support Ticket/i }).first();
    await expect(raiseBtn).toBeVisible({ timeout: 15000 });
    await raiseBtn.click();

    // Fill Ticket Modal Form
    await page.getByPlaceholder(/Describe your issue|placeholder/i).first().fill('My fruiting block is day 5 and humidity is low. Please advise watering schedule.');
    const subjectInput = page.locator('input[placeholder*="Subject"], input[type="text"]').first();
    if (await subjectInput.isVisible()) {
      await subjectInput.fill('Need cultivation assistance for oyster kit');
    }

    const submitBtn = page.getByRole('button', { name: /Submit Support Ticket|Submit/i }).first();
    await submitBtn.click();

    // Verify ticket appears in list
    await expect(page.getByText(/Need cultivation assistance for oyster kit/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/OPEN/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('TICKET-02: Bi-Directional Conversation: Customer Message & Admin Reply', async ({ page }) => {
    const testUser = generateTestUser('chat_ticket');
    const { authData: custAuth } = await authenticateInBrowser(page, testUser, false);

    // 1. Create ticket via API
    const ticketRes = await page.request.post(`${API_BASE}/support/tickets`, {
      headers: { Authorization: `Bearer ${custAuth.token}` },
      data: {
        subject: 'Spawn germination query',
        category: 'TRAINING_INQUIRY',
        priority: 'MEDIUM',
        message: 'Hello, what temperature is optimal?'
      }
    });
    const ticket = (await ticketRes.json()).data;
    expect(ticket.id).toBeTruthy();

    // 2. Admin logs in and replies
    const adminRes = await page.request.post(`${API_BASE}/auth/oauth/google`, {
      data: {
        googleSub: ADMIN_SUB,
        email: ADMIN_EMAIL,
        firstName: 'Admin',
        lastName: 'QA',
        fullName: 'Admin QA'
      }
    });
    const adminToken = (await adminRes.json()).data.token;

    const replyRes = await page.request.post(`${API_BASE}/admin/support/tickets/${ticket.id}/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        message: 'Optimal temperature is 24-28 degrees Celsius with 80% humidity.'
      }
    });
    expect(replyRes.status()).toBe(200);

    // 3. Admin updates status to IN_PROGRESS
    const statusRes = await page.request.put(`${API_BASE}/admin/support/tickets/${ticket.id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      }
    });
    expect(statusRes.status()).toBe(200);

    // 4. Verify in Customer Browser UI
    await page.goto('/dashboard?tab=support');
    await expect(page.getByText(/Spawn germination query/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('TICKET-03: Security Isolation - User Cannot Access Another User Ticket', async ({ page }) => {
    const userA = generateTestUser('user_a');
    const userB = generateTestUser('user_b');

    // Create User A and ticket
    const authARes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: userA });
    const tokenA = (await authARes.json()).data.token;

    const ticketRes = await page.request.post(`${API_BASE}/support/tickets`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        subject: 'Private User A Ticket',
        category: 'ACCOUNT_ISSUE',
        message: 'Private message'
      }
    });
    const ticketId = (await ticketRes.json()).data.id;

    // Create User B
    const authBRes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: userB });
    const tokenB = (await authBRes.json()).data.token;

    // User B attempts to access User A's ticket
    const accessRes = await page.request.get(`${API_BASE}/support/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    // Should return 403 Forbidden
    expect(accessRes.status()).toBe(403);
  });
});
