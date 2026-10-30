import http from 'k6/http';
import { check, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom Metrics for Concurrency Analysis
export const conflictCounter = new Counter('race_conflict_409_count');
export const successCounter = new Counter('race_success_200_count');
export const errorRate = new Rate('race_unexpected_error_rate');

// Test Profile: Sudden concurrent burst of 20 virtual users in parallel
export const options = {
  scenarios: {
    batch_enrollment_race: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // We expect graceful business rejection (400 Bad Request or 409 Conflict), NOT 500 Internal Server Errors
    'race_unexpected_error_rate': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

export function setup() {
  // Discovery: Find an active course and available batch
  const res = http.get(`${BASE_URL}/training/courses`);
  let batchId = null;
  let courseId = null;

  try {
    const courses = JSON.parse(res.body);
    const list = Array.isArray(courses) ? courses : (courses.data || []);
    if (list.length > 0) {
      courseId = list[0].id;
      // Fetch course details with batches
      const detailRes = http.get(`${BASE_URL}/training/courses/${courseId}`);
      const courseDetail = JSON.parse(detailRes.body);
      const batches = courseDetail.batches || [];
      if (batches.length > 0) {
        batchId = batches[0].id;
      }
    }
  } catch (e) {
    console.warn('Could not discover dynamic batch fixture; will fallback to placeholder UUID: ' + e);
  }

  return {
    batchId: batchId || '00000000-0000-0000-0000-000000000001',
    courseId: courseId || '00000000-0000-0000-0000-000000000001',
  };
}

export default function (data) {
  const vuId = __VU;
  const dummyUserId = `00000000-0000-0000-0001-${String(vuId).padStart(12, '0')}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Sporekart-Concurrency-StressTest/2.0',
    'X-User-ID': dummyUserId,
  };

  group('Concurrent Enrollment Attempt', function () {
    const payload = JSON.stringify({
      batchId: data.batchId,
      notes: `Race condition test from VU ${vuId}`,
    });

    const res = http.post(`${BASE_URL}/training/enroll`, payload, { headers });

    if (res.status === 200 || res.status === 201) {
      successCounter.add(1);
    } else if (res.status === 409 || res.status === 400 || res.status === 422) {
      // 409 Conflict / 400 Bad Request indicates business lock or capacity exceeded cleanly
      conflictCounter.add(1);
    } else {
      // 500 or deadlock indicates failure of distributed locking
      errorRate.add(1);
    }

    check(res, {
      'clean status code (200, 201, 400, 409, 422)': (r) =>
        r.status === 200 || r.status === 201 || r.status === 409 || r.status === 400 || r.status === 422,
      'no database deadlock 500': (r) => r.status !== 500,
    });
  });
}
