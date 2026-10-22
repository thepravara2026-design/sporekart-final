import { expect } from '@playwright/test';

export const ADMIN_EMAIL = 'thepravara2026@gmail.com';
export const ADMIN_SUB = 'google_admin_thepravara2026';
export const API_BASE = 'http://localhost:8080/api/v1';
export const FRONTEND_URL = 'http://localhost:3000';

/**
 * Generate unique isolated test user fixtures
 */
export function generateTestUser(prefix = 'cust') {
  const ts = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const uniquePhone = `9${String(ts).slice(-5)}${String(rand).slice(-4)}`;
  return {
    email: `${prefix}_${ts}_${rand}@sporekart-qa.test`,
    googleSub: `sub_${prefix}_${ts}_${rand}`,
    firstName: `TestUser`,
    lastName: `QA`,
    fullName: `TestUser QA`,
    phone: uniquePhone
  };
}

/**
 * Perform login via UI dev button (for Admin) or API token injection with wait for /auth/me (for Customer)
 */
export async function authenticateInBrowser(page, userPayload, isAdmin = false) {
  if (isAdmin) {
    await page.goto('/admin/login');
    const adminDevBtn = page.getByRole('button', { name: /Dev Mode: Sign in as thepravara2026@gmail.com|Continue as thepravara2026@gmail.com/i });
    await expect(adminDevBtn).toBeVisible({ timeout: 15000 });
    await adminDevBtn.click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    // Wait for auth verification spinner to complete and admin control plane to render
    await expect(page.getByText(/Sporekart Control Plane|Sporekart Control Console/i).first()).toBeVisible({ timeout: 20000 });
    const token = await page.evaluate(() => localStorage.getItem('sporekart_token'));
    return { authData: { token, email: ADMIN_EMAIL, role: 'ROLE_ADMIN' }, payload: { email: ADMIN_EMAIL } };
  }

  const payload = userPayload || generateTestUser();

  // Call API to obtain valid JWT token
  const response = await page.request.post(`${API_BASE}/auth/oauth/google`, {
    data: payload
  });
  const json = await response.json();
  if (!json.success || !json.data?.token) {
    throw new Error(`Authentication fixture failed: ${JSON.stringify(json)}`);
  }

  const authData = json.data;

  // Navigate to app and inject token into localStorage
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('sporekart_token', data.token);
    localStorage.setItem('sporekart_session_id', 'audit_sess_' + Date.now());
  }, authData);

  // Reload page and wait for /auth/me to settle React user state
  const mePromise = page.waitForResponse(
    (res) => res.url().includes('/auth/me') && res.status() === 200,
    { timeout: 15000 }
  ).catch(() => {});

  await page.reload();
  await mePromise;
  await page.waitForTimeout(300);

  return { authData, payload };
}

/**
 * Attach listeners to catch uncaught page errors and failed network responses
 */
export function setupConsoleAndNetworkWatchers(page) {
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push({
      text: err.message,
      stack: err.stack
    });
  });

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes('/api/v1/auth/otp') && !url.includes('/favicon.ico')) {
      failedRequests.push({
        url,
        status,
        statusText: res.statusText()
      });
    }
  });

  return { consoleErrors, failedRequests };
}
