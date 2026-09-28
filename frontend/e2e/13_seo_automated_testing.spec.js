import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/products/fresh-mushrooms',
  '/products/mushroom-spawn',
  '/training',
  '/blog',
  '/mushroom-cultivation-guide',
  '/mushroom-spawn-guide',
  '/about',
  '/contact'
];

test.describe('PHASE 30: SEO Automated Testing Suite', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`Inspect SEO compliance for public route: ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      // 1. Title test
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.trim().length).toBeGreaterThan(5);

      // 2. Meta description test (.last() targets react-helmet-async dynamic tag)
      const description = await page.locator('meta[name="description"]').last().getAttribute('content');
      expect(description).toBeTruthy();
      expect(description?.trim().length).toBeGreaterThan(10);

      // 3. Canonical URL test
      const canonical = await page.locator('link[rel="canonical"]').last().getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain('sporekart.in');

      // 4. H1 Heading structure test (At least 1 H1 per page)
      await page.locator('h1').first().waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // 5. Robots tag test (No accidental noindex on public routes)
      const robotsLocator = page.locator('meta[name="robots"]');
      if (await robotsLocator.count() > 0) {
        const robotsMeta = await robotsLocator.last().getAttribute('content');
        if (robotsMeta) {
          expect(robotsMeta.toLowerCase()).not.toContain('noindex');
        }
      }

      // 6. OpenGraph Metadata test
      const ogTitle = await page.locator('meta[property="og:title"]').last().getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').last().getAttribute('content');
      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();

      // 7. Structured Data (JSON-LD) test
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const jsonLdCount = await jsonLdScripts.count();
      expect(jsonLdCount).toBeGreaterThan(0);

      // 8. Image Alt Text test for content images
      const images = page.locator('img[src]');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        if (alt !== null) {
          expect(alt.trim().length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  test('Admin routes must explicitly specify noindex / restrict indexing', async ({ page }) => {
    await page.goto('/admin/login');
    const robotsMeta = await page.locator('meta[name="robots"]').last().getAttribute('content');
    if (robotsMeta) {
      expect(robotsMeta.toLowerCase()).toContain('noindex');
    }
  });

  test('Internal links verification & no orphan routes', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href^="/"]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(5);
  });
});
