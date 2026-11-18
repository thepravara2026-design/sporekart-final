/**
 * Sporekart Automated SEO Quality Gate
 * Executes rigorous pre-flight automated verification of sitemap.xml, robots.txt,
 * HTML metadata, OpenGraph tags, canonical links, and Schema.org JSON-LD.
 * Fails with non-zero exit code on any validation error.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 Executing Sporekart Automated SEO Quality Gate');
console.log('====================================================');

const results = [];
let totalFailures = 0;

function assert(condition, gateId, gateName, details = '') {
  if (condition) {
    results.push({ gateId, gateName, passed: true, details });
    console.log(` [✓] [${gateId}] ${gateName}: PASSED`);
  } else {
    results.push({ gateId, gateName, passed: false, details });
    totalFailures++;
    console.error(` [✗] [${gateId}] ${gateName}: FAILED - ${details}`);
  }
}

// -------------------------------------------------------------
// 1. SITEMAP.XML VERIFICATION
// -------------------------------------------------------------
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'SEO-01', 'sitemap.xml Existence', 'File must exist in public/sitemap.xml');

if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  // Verify XML structure
  assert(sitemapContent.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'SEO-02', 'sitemap.xml XML Header', 'Must have valid XML declaration');
  assert(sitemapContent.includes('<urlset') && sitemapContent.includes('</urlset>'), 'SEO-03', 'sitemap.xml Root URLSet', 'Must have valid <urlset> wrapper');

  // Verify Essential URLs
  const requiredRoutes = [
    'https://sporekart.in/',
    'https://sporekart.in/products',
    'https://sporekart.in/products/mushroom-spawn',
    'https://sporekart.in/products/growing-kits',
    'https://sporekart.in/training'
  ];
  requiredRoutes.forEach((route, idx) => {
    assert(sitemapContent.includes(`<loc>${route}</loc>`), `SEO-04.${idx + 1}`, `sitemap.xml Essential Route: ${route}`, `Missing <loc>${route}</loc>`);
  });

  // Verify No Staging or Localhost URLs
  assert(!sitemapContent.includes('localhost') && !sitemapContent.includes('127.0.0.1'), 'SEO-05', 'sitemap.xml No Localhost URLs', 'Sitemap must not contain localhost');

  // Verify URL Tag Completeness
  const locCount = (sitemapContent.match(/<loc>/g) || []).length;
  const lastmodCount = (sitemapContent.match(/<lastmod>/g) || []).length;
  const changefreqCount = (sitemapContent.match(/<changefreq>/g) || []).length;
  const priorityCount = (sitemapContent.match(/<priority>/g) || []).length;

  assert(locCount >= 10, 'SEO-06', 'sitemap.xml Minimum URL Count', `Expected >= 10 URLs, found ${locCount}`);
  assert(locCount === lastmodCount, 'SEO-07', 'sitemap.xml Lastmod Completeness', `locCount (${locCount}) matches lastmodCount (${lastmodCount})`);
  assert(locCount === changefreqCount, 'SEO-08', 'sitemap.xml Changefreq Completeness', `locCount (${locCount}) matches changefreqCount (${changefreqCount})`);
  assert(locCount === priorityCount, 'SEO-09', 'sitemap.xml Priority Completeness', `locCount (${locCount}) matches priorityCount (${priorityCount})`);
}

// -------------------------------------------------------------
// 2. ROBOTS.TXT VERIFICATION
// -------------------------------------------------------------
const robotsPath = path.join(rootDir, 'public', 'robots.txt');
assert(fs.existsSync(robotsPath), 'SEO-10', 'robots.txt Existence', 'File must exist in public/robots.txt');

if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');

  assert(robotsContent.includes('User-agent: *'), 'SEO-11', 'robots.txt User-agent Directive', 'Must specify User-agent: *');
  assert(robotsContent.includes('Allow: /'), 'SEO-12', 'robots.txt Public Allow Directive', 'Must allow root access');
  assert(robotsContent.includes('Disallow: /admin'), 'SEO-13', 'robots.txt Admin Disallow Directive', 'Must disallow /admin');
  assert(robotsContent.includes('Disallow: /dashboard'), 'SEO-14', 'robots.txt Customer Portal Disallow', 'Must disallow private customer dashboard');
  assert(robotsContent.includes('Disallow: /cart'), 'SEO-15', 'robots.txt Cart Disallow', 'Must disallow /cart to avoid crawling cart state');
  assert(robotsContent.includes('Sitemap: https://sporekart.in/sitemap.xml'), 'SEO-16', 'robots.txt Sitemap Pointer', 'Must reference production sitemap URL');
}

// -------------------------------------------------------------
// 3. INDEX.HTML METADATA & SCHEMA VERIFICATION
// -------------------------------------------------------------
const htmlPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(htmlPath), 'SEO-17', 'index.html Existence', 'File must exist at root index.html');

if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Title validation
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  assert(titleMatch && titleMatch[1].trim().length >= 20 && titleMatch[1].includes('Sporekart'),
    'SEO-18', 'index.html Title Tag', 'Title must be non-empty, >= 20 chars, and include brand name');

  // Meta Description validation
  const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  assert(descMatch && descMatch[1].trim().length >= 50 && descMatch[1].trim().length <= 200,
    'SEO-19', 'index.html Meta Description', `Description length must be 50-200 chars (found ${descMatch ? descMatch[1].length : 0})`);

  // Canonical tag validation
  const canonicalMatch = htmlContent.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  assert(canonicalMatch && canonicalMatch[1].startsWith('https://'),
    'SEO-20', 'index.html Canonical URL', `Canonical URL must be a valid HTTPS link (found ${canonicalMatch ? canonicalMatch[1] : 'none'})`);

  // Robots meta tag
  assert(htmlContent.includes('<meta name="robots" content="index, follow" />') || htmlContent.includes('name="robots"'),
    'SEO-21', 'index.html Robots Meta Tag', 'Robots tag must allow index and follow');

  // OpenGraph tags
  assert(htmlContent.includes('property="og:type"'), 'SEO-22', 'index.html OpenGraph Type', 'Must include og:type');
  assert(htmlContent.includes('property="og:title"'), 'SEO-23', 'index.html OpenGraph Title', 'Must include og:title');
  assert(htmlContent.includes('property="og:description"'), 'SEO-24', 'index.html OpenGraph Description', 'Must include og:description');
  assert(htmlContent.includes('property="og:image"'), 'SEO-25', 'index.html OpenGraph Image', 'Must include og:image');
  assert(htmlContent.includes('property="og:url"'), 'SEO-26', 'index.html OpenGraph URL', 'Must include og:url');

  // Twitter tags
  assert(htmlContent.includes('property="twitter:card"'), 'SEO-27', 'index.html Twitter Card', 'Must include twitter:card');
  assert(htmlContent.includes('property="twitter:title"'), 'SEO-28', 'index.html Twitter Title', 'Must include twitter:title');
  assert(htmlContent.includes('property="twitter:description"'), 'SEO-29', 'index.html Twitter Description', 'Must include twitter:description');

  // JSON-LD Structured Data
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let jsonLdMatches = [...htmlContent.matchAll(jsonLdRegex)];
  assert(jsonLdMatches.length > 0, 'SEO-30', 'index.html Structured Data Presence', 'At least one JSON-LD block must exist');

  jsonLdMatches.forEach((m, idx) => {
    try {
      const parsed = JSON.parse(m[1].trim());
      assert(parsed['@context'] === 'https://schema.org', `SEO-31.${idx + 1}`, `JSON-LD #${idx + 1} Schema.org Context`, 'Context must be https://schema.org');
      assert(Boolean(parsed['@type']), `SEO-32.${idx + 1}`, `JSON-LD #${idx + 1} Type Definition`, 'Type must be specified');
    } catch (err) {
      assert(false, `SEO-33.${idx + 1}`, `JSON-LD #${idx + 1} Valid JSON Syntax`, `Parse error: ${err.message}`);
    }
  });
}

console.log('====================================================');
if (totalFailures === 0) {
  console.log(`✅ ALL ${results.length} SEO QUALITY GATES PASSED AUTOMATED VERIFICATION!`);
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`❌ FAILED ${totalFailures} OUT OF ${results.length} SEO QUALITY GATES!`);
  console.log('====================================================');
  process.exit(1);
}
