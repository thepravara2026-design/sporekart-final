import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateInBrowser, API_BASE, ADMIN_EMAIL, ADMIN_SUB } from './audit_helpers.js';

test.describe('PHASE 8: In-App Notification Delivery, Persistence & Read State Lifecycle', () => {

  test('NOTIF-01: Customer Notifications Center Renders, Fetches Unread Count & Items', async ({ page }) => {
    const testUser = generateTestUser('notif_cust');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Verify unread count API returns 200
    const countRes = await page.request.get(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    expect(countRes.status()).toBe(200);

    // Verify notifications list API returns 200
    const listRes = await page.request.get(`${API_BASE}/notifications?unreadOnly=false`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    expect(listRes.status()).toBe(200);

    // Check Notification Bell in Navbar
    await page.goto('/');
    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell, svg') }).first();
    await expect(bellBtn).toBeVisible({ timeout: 15000 });
  });

  test('NOTIF-02: Mark As Read & Mark All As Read Endpoints Operate Reliably', async ({ page }) => {
    const testUser = generateTestUser('read_notif');
    const { authData } = await authenticateInBrowser(page, testUser, false);

    // Call mark-all-as-read
    const readAllRes = await page.request.patch(`${API_BASE}/notifications/read-all`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    expect(readAllRes.status()).toBe(200);
    const readAllJson = await readAllRes.json();
    expect(readAllJson.success).toBe(true);

    // Unread count must now be 0
    const countRes = await page.request.get(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const countJson = await countRes.json();
    expect(countJson.data.unreadCount).toBe(0);
  });

  test('NOTIF-03: Admin In-App Notifications & Unread Count Management', async ({ page }) => {
    const adminRes = await page.request.post(`${API_BASE}/auth/oauth/google`, {
      data: {
        googleSub: ADMIN_SUB,
        email: ADMIN_EMAIL,
        firstName: 'Sporekart',
        lastName: 'Admin',
        fullName: 'Sporekart Administrator'
      }
    });
    const adminToken = (await adminRes.json()).data.token;

    // Admin unread count
    const unreadRes = await page.request.get(`${API_BASE}/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(unreadRes.status()).toBe(200);

    // Admin in-app list
    const inAppRes = await page.request.get(`${API_BASE}/admin/notifications/in-app`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(inAppRes.status()).toBe(200);
  });

  test('NOTIF-04: Security Isolation - Customer Cannot Access Admin In-App Notifications', async ({ page }) => {
    const testUser = generateTestUser('unauth_notif');
    const authRes = await page.request.post(`${API_BASE}/auth/oauth/google`, { data: testUser });
    const custToken = (await authRes.json()).data.token;

    // Customer attempts to call admin notifications
    const blockedRes = await page.request.get(`${API_BASE}/admin/notifications/in-app`, {
      headers: { Authorization: `Bearer ${custToken}` }
    });

    // Must be 403 Forbidden
    expect(blockedRes.status()).toBe(403);
  });
});
