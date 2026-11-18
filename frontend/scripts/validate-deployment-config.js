/**
 * Sporekart Production Deployment Configuration Validator
 * Validates vercel.json syntax, rewrites, CSP directives, and routing integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vercelJsonPath = path.resolve(__dirname, '..', 'vercel.json');

console.log('====================================================');
console.log('🚀 Validating Vercel Deployment Configuration');
console.log('====================================================');

if (!fs.existsSync(vercelJsonPath)) {
  console.error('❌ vercel.json file missing!');
  process.exit(1);
}

const raw = fs.readFileSync(vercelJsonPath, 'utf8');
let config;

try {
  config = JSON.parse(raw);
  console.log(' [✓] vercel.json syntax: VALID JSON');
} catch (err) {
  console.error('❌ vercel.json syntax ERROR:', err.message);
  process.exit(1);
}

// 1. Assert no bash parameter expansions like ${VAR:...}
if (raw.includes('${')) {
  console.error('❌ vercel.json contains unsupported bash parameter expansion "${..."!');
  process.exit(1);
}
console.log(' [✓] No illegal bash parameter expansions found');

// 2. Validate rewrites
if (!Array.isArray(config.rewrites) || config.rewrites.length === 0) {
  console.error('❌ vercel.json missing rewrites configuration!');
  process.exit(1);
}

const apiRewrite = config.rewrites.find(r => r.source && r.source.includes('/api/v1/'));
if (!apiRewrite || !apiRewrite.destination || !apiRewrite.destination.startsWith('https://')) {
  console.error('❌ vercel.json missing valid HTTPS API rewrite!');
  process.exit(1);
}
console.log(' [✓] API rewrite destination valid:', apiRewrite.destination);

const spaFallback = config.rewrites.find(r => r.source === '/(.*)' && r.destination === '/index.html');
if (!spaFallback) {
  console.error('❌ vercel.json missing SPA fallback rewrite to /index.html!');
  process.exit(1);
}
console.log(' [✓] SPA fallback rewrite valid');

// 3. Validate CSP
const rootHeader = config.headers?.find(h => h.source === '/(.*)');
const cspHeader = rootHeader?.headers?.find(h => h.key === 'Content-Security-Policy');
if (!cspHeader || !cspHeader.value.includes('https://api.sporekart.in')) {
  console.error('❌ Content-Security-Policy missing https://api.sporekart.in in connect-src!');
  process.exit(1);
}
console.log(' [✓] CSP headers include production API domain');

console.log('====================================================');
console.log('✅ VERCEL CONFIGURATION VALIDATION PASSED CLEANLY');
console.log('====================================================');
process.exit(0);

