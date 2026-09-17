import { test, expect } from '@playwright/test';

test.describe('E2E Flow 1: Guest Browsing', () => {
  test('Guest can view home page, catalog products, and educational guides', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Sporekart/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2. Navigate to Catalog Page
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.getByText(/Spore/i).first()).toBeVisible();

    // 3. Navigate to Cultivation & Spawn Guides (SEO/GEO content)
    await page.goto('/guides/mushroom-cultivation');
    await expect(page.getByRole('heading', { name: /Mushroom Cultivation/i })).toBeVisible();

    await page.goto('/guides/mushroom-spawn');
    await expect(page.getByRole('heading', { name: /Mushroom Spawn/i })).toBeVisible();
  });
});
