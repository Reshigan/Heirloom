# 300-User Simulation with Stickiness Tracking

This simulation tests the Heirloom platform with 300 concurrent users to measure stickiness (user retention and engagement) with reminder notifications enabled.

## Overview

The simulation uses a hybrid approach:
- **50 users** via Playwright (real browser UI interaction)
- **250 users** via k6 (API-level load testing)

This provides realistic load while keeping resource usage manageable.

## Prerequisites

1. **Node.js** and **npm** installed
2. **k6** installed: `brew install k6` (Mac) or download from https://k6.io/
3. **Playwright** installed: `npx playwright install chromium`
4. **PostgreSQL** database running
5. **Backend** running at `BASE_URL` (default: https://loom.vantax.co.za)

## Setup

1. Install dependencies:
```bash
cd /home/ubuntu/repos/Heirloom
npm install
cd simulation
npm install playwright @playwright/test typescript ts-node
```

2. Set environment variables:
```bash
export NEXT_PUBLIC_ANALYTICS=on
export BASE_URL=https://loom.vantax.co.za
```

## Running the Simulation

### Full Automated Run

```bash
cd /home/ubuntu/repos/Heirloom/simulation
./run-simulation.sh
```

This will:
1. Seed 300 test users with memories
2. Start 50 Playwright sessions (real UI)
3. Start 250 k6 API users
4. Collect stickiness metrics
5. Generate a comprehensive report

### Manual Steps

#### 1. Seed Test Users

```bash
cd /home/ubuntu/repos/Heirloom/backend-node
npx ts-node scripts/seed-test-users.ts
```

This creates 300 users with:
- Email: `testuser1@simulation.test` through `testuser300@simulation.test`
- Password: `Test123456!`
- 3-7 memories each with varied sentiment labels
- All notification settings enabled
- Staggered join timestamps

#### 2. Run Playwright Simulation

```bash
cd /home/ubuntu/repos/Heirloom/simulation
npx ts-node playwright-simulation.ts
```

This simulates 50 real users:
- Login
- Browse memories
- Open search
- Check notifications
- Stay active for 8 minutes with heartbeats

#### 3. Run k6 Load Test

```bash
cd /home/ubuntu/repos/Heirloom/simulation
k6 run k6-load-test.js
```

This simulates 250 API users:
- Ramp up over 2 minutes
- Hold at 250 concurrent users for 20 minutes
- Ramp down over 2 minutes
- Each user: login → fetch memories → search → check notifications → create comments

#### 4. Collect Metrics

```bash
curl -X GET "https://loom.vantax.co.za/api/analytics/metrics?cohortTag=simulation.test" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.'
```

## Metrics Tracked

### Stickiness Metrics
- **Activation Rate**: % of users who performed at least one action
- **Retention Rate (D1)**: % of users who returned after first "day" (compressed to 1 minute)
- **Average Session Length**: Time users spend in the app
- **Sessions Per User**: How often users return

### Engagement Metrics
- **Actions Per Session**: Uploads, comments, searches per session
- **Time to First Value**: How quickly users upload their first memory
- **Engagement Depth**: % of users with ≥3 actions

### Notification Metrics
- **Notification Open Rate**: % of reminders that were opened
- **Time to Open**: How quickly users respond to notifications
- **Reminder → Action Conversion**: % of users who take action after a reminder

### Technical Metrics
- **SSE Connection Stability**: Uptime, reconnect counts
- **API Response Times**: p50, p95, p99
- **Error Rates**: 4xx/5xx per 1000 requests

## Output

The simulation generates:
1. **Console logs**: Real-time progress
2. **`/tmp/test-users.json`**: Test user credentials
3. **`/tmp/simulation-metrics.json`**: Raw metrics data
4. **`/tmp/simulation-report.md`**: Comprehensive markdown report

## Cleanup

To remove test users after simulation:

```bash
cd /home/ubuntu/repos/Heirloom/backend-node
npx prisma studio
# Delete users with email containing "simulation.test"
```

Or via SQL:
```sql
DELETE FROM "User" WHERE email LIKE '%simulation.test%';
```

## Troubleshooting

### k6 not found
Install k6: https://k6.io/docs/getting-started/installation/

### Playwright browser not installed
Run: `npx playwright install chromium`

### Database connection errors
Ensure PostgreSQL is running and DATABASE_URL is set correctly

### SSE connection errors
Check that the backend is running and SSE endpoint is accessible

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   300 Test Users                         │
│  (seeded with memories, notifications enabled)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─────────────────┬──────────────┐
                          │                 │              │
                    ┌─────▼─────┐    ┌─────▼─────┐  ┌────▼────┐
                    │ Playwright │    │    k6     │  │ Backend │
                    │  (50 UI)   │    │ (250 API) │  │  API    │
                    └─────┬──────┘    └─────┬─────┘  └────┬────┘
                          │                 │              │
                          └─────────────────┴──────────────┘
                                          │
                                    ┌─────▼─────┐
                                    │ Analytics │
                                    │  Events   │
                                    └─────┬─────┘
                                          │
                                    ┌─────▼─────┐
                                    │ Stickiness│
                                    │  Metrics  │
                                    └───────────┘
```

## Notes

- The simulation uses **compressed time**: 1 minute = 1 day for retention calculations
- All test users have email domain `@simulation.test` for easy identification
- Notification reminders are scheduled within the next 60 minutes for immediate testing
- SSE connections are kept open during Playwright sessions to test real-time notifications
- The simulation is safe to run on staging/production as test users are clearly marked

## Next Steps

After reviewing the simulation results:
1. Analyze stickiness metrics to identify improvement areas
2. Optimize notification delivery based on open rates
3. Enhance features that drive high engagement
4. Scale infrastructure if needed based on load test results
5. Run A/B tests on engagement features
