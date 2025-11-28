import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'https://loom.vantax.co.za';

const testUsers = new SharedArray('users', function () {
  const allUsers = JSON.parse(open('/tmp/test-users.json'));
  return allUsers.slice(50, 300); // Users 51-300
});

export const options = {
  stages: [
    { duration: '2m', target: 250 }, // Ramp up to 250 VUs
    { duration: '20m', target: 250 }, // Hold at 250 VUs
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Less than 5% of requests should fail
  },
};

export default function () {
  const user = testUsers[__VU % testUsers.length];

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'got token': (r) => r.json('token') !== undefined,
  });

  if (loginRes.status !== 200) {
    console.error(`Login failed for ${user.email}: ${loginRes.status}`);
    sleep(1);
    return;
  }

  const token = loginRes.json('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
    event: 'login_success',
    properties: { method: 'k6' }
  }), { headers });

  sleep(1);

  const vaultRes = http.get(`${BASE_URL}/api/vault/items?limit=10`, { headers });
  check(vaultRes, {
    'vault items fetched': (r) => r.status === 200,
  });

  sleep(2);

  const searchRes = http.get(`${BASE_URL}/api/search?q=family`, { headers });
  check(searchRes, {
    'search successful': (r) => r.status === 200,
  });

  http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
    event: 'search_open',
    properties: { query: 'family' }
  }), { headers });

  sleep(2);

  const notifRes = http.get(`${BASE_URL}/api/notifications`, { headers });
  check(notifRes, {
    'notifications fetched': (r) => r.status === 200,
  });

  http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
    event: 'notification_check',
    properties: {}
  }), { headers });

  sleep(3);

  if (notifRes.status === 200) {
    const notifications = notifRes.json();
    if (notifications && notifications.length > 0) {
      const notifId = notifications[0].id;
      http.put(`${BASE_URL}/api/notifications/${notifId}/read`, null, { headers });

      http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
        event: 'notification_opened',
        properties: { notificationId: notifId }
      }), { headers });
    }
  }

  sleep(2);

  const commentRes = http.post(`${BASE_URL}/api/comments`, JSON.stringify({
    vaultItemId: user.vaultId,
    content: 'This is a test comment from k6 simulation'
  }), { headers });

  if (commentRes.status === 200 || commentRes.status === 201) {
    http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
      event: 'comment_create',
      properties: {}
    }), { headers });
  }

  sleep(5);

  http.post(`${BASE_URL}/api/analytics/events`, JSON.stringify({
    event: 'time_in_app_heartbeat',
    properties: {}
  }), { headers });

  sleep(Math.random() * 5 + 3); // Random sleep 3-8 seconds
}
