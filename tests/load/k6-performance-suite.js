import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom Metrics & SLA Trends
export const errorRate = new Rate('error_rate');
export const catalogLatency = new Trend('catalog_duration', true);
export const trainingLatency = new Trend('training_duration', true);
export const searchLatency = new Trend('search_duration', true);
export const cartLatency = new Trend('cart_duration', true);
export const cacheHitCounter = new Counter('cache_etag_304_count');

// Declarative Load Profile & Quality Gate Thresholds
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm-up & ramp-up to 10 VUs
    { duration: '1m',  target: 25 },  // Sustained load at 25 VUs
    { duration: '30s', target: 50 },  // Concurrency spike to 50 VUs
    { duration: '30s', target: 0 },   // Graceful ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], // 95% of all calls under 500ms
    'error_rate': ['rate<0.01'],                       // Total error rate below 1%
    'catalog_duration': ['p(95)<400'],                 // Catalog queries accelerated by Caffeine
    'training_duration': ['p(95)<400'],                // Training masterclasses accelerated by Caffeine
    'search_duration': ['p(95)<450'],                  // Trigram GIN indexed search
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

export default function () {
  const sessionId = `k6_session_${__VU}_${__ITER}`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Sporekart-k6-LoadTest/2.0',
    'X-Session-ID': sessionId,
  };

  let sampleProductId = null;
  let sampleVariantId = null;
  let lastEtag = null;

  // 1. PUBLIC BROWSING & CATALOG FLOW
  group('1. Public Browsing Flow', function () {
    // 1.1 Active Products List (Caffeine Cached)
    const resCatalog = http.get(`${BASE_URL}/products?page=0&size=12`, { headers });
    catalogLatency.add(resCatalog.timings.duration);
    
    const catalogPassed = check(resCatalog, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog has valid body': (r) => r.body && r.body.length > 0,
    });
    errorRate.add(!catalogPassed);

    if (resCatalog.headers['ETag']) {
      lastEtag = resCatalog.headers['ETag'];
    }

    try {
      const parsed = JSON.parse(resCatalog.body);
      const items = Array.isArray(parsed) ? parsed : (parsed.data || parsed.content || []);
      if (items.length > 0) {
        sampleProductId = items[0].id;
        if (items[0].variants && items[0].variants.length > 0) {
          sampleVariantId = items[0].variants[0].id;
        }
      }
    } catch (_) {}

    // 1.2 Categories Listing (Caffeine Cached)
    const resCategories = http.get(`${BASE_URL}/categories`, { headers });
    check(resCategories, {
      'categories status is 200': (r) => r.status === 200,
    });

    // 1.3 Masterclasses / Courses Listing (Caffeine Cached)
    const resCourses = http.get(`${BASE_URL}/training/courses`, { headers });
    trainingLatency.add(resCourses.timings.duration);
    const coursesPassed = check(resCourses, {
      'courses status is 200': (r) => r.status === 200,
    });
    errorRate.add(!coursesPassed);

    sleep(1);
  });

  // 2. SEARCH & TRIGRAM INDEX ACCELERATION FLOW
  group('2. Trigram Search Flow', function () {
    const searchTerms = ['oyster', 'mushroom', 'spawn', 'button'];
    const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const resSearch = http.get(`${BASE_URL}/products/search?q=${query}&page=0&size=10`, { headers });
    searchLatency.add(resSearch.timings.duration);
    const searchPassed = check(resSearch, {
      'search status is 200': (r) => r.status === 200,
    });
    errorRate.add(!searchPassed);

    sleep(1);
  });

  // 3. CART OPERATIONS FLOW (Anonymous & Concurrency Isolation)
  group('3. Cart Operations Flow', function () {
    if (sampleVariantId) {
      // 3.1 Add Item to Cart
      const addPayload = JSON.stringify({
        variantId: sampleVariantId,
        quantity: 1,
      });

      const resAddToCart = http.post(`${BASE_URL}/cart/items`, addPayload, { headers });
      cartLatency.add(resAddToCart.timings.duration);
      check(resAddToCart, {
        'add to cart status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      });

      // 3.2 Fetch Cart Details
      const resGetCart = http.get(`${BASE_URL}/cart`, { headers });
      check(resGetCart, {
        'get cart status is 200': (r) => r.status === 200,
      });

      // 3.3 Fetch Cart Item Count
      const resCartCount = http.get(`${BASE_URL}/cart/count`, { headers });
      check(resCartCount, {
        'cart count status is 200': (r) => r.status === 200,
      });
    }

    sleep(1);
  });

  // 4. ETAG CONDITIONAL CACHE REVALIDATION
  if (lastEtag) {
    group('4. HTTP ETag Revalidation Flow', function () {
      const etagHeaders = Object.assign({}, headers, {
        'If-None-Match': lastEtag,
      });
      const resEtag = http.get(`${BASE_URL}/products?page=0&size=12`, { headers: etagHeaders });
      const is304 = resEtag.status === 304;
      if (is304) {
        cacheHitCounter.add(1);
      }
      check(resEtag, {
        'etag returns 304 Not Modified or 200': (r) => r.status === 304 || r.status === 200,
      });
    });
  }
}
