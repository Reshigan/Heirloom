# Test Traceability Matrix

## Overview
This document maps user stories to test implementations, ensuring complete coverage of all acceptance criteria.

## Traceability Map

| User Story | Test File | Test Cases | Status | Priority |
|------------|-----------|------------|--------|----------|
| **Journey 1: Owner Onboarding** | `owner-onboarding.spec.ts` | 7 tests | Pending | P0 |
| - Register new account | | ✓ Can register with email/password | Pending | P0 |
| - Login with credentials | | ✓ Can login and receive JWT token | Pending | P0 |
| - View empty vault state | | ✓ Empty state shows onboarding message | Pending | P0 |
| - Upload first memory | | ✓ Can upload encrypted memory | Pending | P0 |
| - Memory appears in timeline | | ✓ Uploaded memory visible in timeline | Pending | P0 |
| - Vault stats update | | ✓ Stats reflect 1 item and storage usage | Pending | P0 |
| - Navigation works | | ✓ Can navigate between vault sections | Pending | P1 |
| **Journey 2: Share with Recipient** | `owner-upload-and-share.spec.ts` | 8 tests | Pending | P0 |
| - Upload with recipients | | ✓ Can upload memory with recipientIds | Pending | P0 |
| - Memory visible to owner | | ✓ Shared memory appears in owner timeline | Pending | P0 |
| - Recipient receives notification | | ✓ Recipient gets SSE notification | Pending | P0 |
| - Notification in center | | ✓ Notification appears in notification center | Pending | P0 |
| - Recipient can view memory | | ✓ Recipient can open shared memory | Pending | P0 |
| - Decryption works | | ✓ Memory content decrypts correctly | Pending | P0 |
| - Stats update | | ✓ Owner stats show recipient access | Pending | P1 |
| - Security boundary | | ✓ Recipient cannot access unshared memories | Pending | P0 |
| **Journey 3: Recipient Notifications** | `recipient-notification-and-view.spec.ts` | 10 tests | Pending | P0 |
| - SSE connection | | ✓ Can connect to notification stream | Pending | P0 |
| - Connection established | | ✓ EventSource readyState = 1 | Pending | P0 |
| - Notification arrives | | ✓ Notification received within 5s | Pending | P0 |
| - Appears in center | | ✓ Notification visible in center | Pending | P0 |
| - Unread badge | | ✓ Unread count badge shows correctly | Pending | P0 |
| - Mark as read | | ✓ Can mark notification as read | Pending | P0 |
| - Count decreases | | ✓ Unread count decreases | Pending | P0 |
| - Mark all seen | | ✓ Can mark all as seen | Pending | P0 |
| - Chronological order | | ✓ Notifications ordered by time | Pending | P1 |
| - Click to view | | ✓ Clicking notification opens memory | Pending | P0 |
| **Journey 4: Search & Discovery** | `search-and-discovery.spec.ts` | 10 tests | Pending | P0 |
| - Open search modal | | ✓ Search button opens modal | Existing | P0 |
| - Enter query | | ✓ Can type search query | Existing | P0 |
| - Results display | | ✓ Search returns results | Existing | P0 |
| - AI summaries | | ✓ Results show AI summaries/keywords | Existing | P0 |
| - Open filters | | ✓ Filter button opens filter panel | Existing | P0 |
| - Type filter | | ✓ Type dropdown filters results | Existing | P0 |
| - Emotion filter | | ✓ Emotion filter works | Pending | P1 |
| - Date range filter | | ✓ Date range filter works | Pending | P1 |
| - Click result | | ✓ Can click result to view memory | Pending | P0 |
| - Security boundary | | ✓ Only shows shared memories | Pending | P0 |
| **Journey 5: Check-In & Unlock** | `check-in-and-unlock.spec.ts` | 9 tests | Pending | P0 |
| - Add trusted contact | | ✓ Can add trusted contact | Pending | P0 |
| - Verification sent | | ✓ Contact receives verification | Pending | P1 |
| - Configure check-in | | ✓ Can set check-in interval | Pending | P0 |
| - Status shows next date | | ✓ Check-in status displays correctly | Pending | P0 |
| - Miss check-in | | ✓ Missed check-in triggers grace period | Pending | P0 |
| - Escalation notification | | ✓ Trusted contact notified after grace | Pending | P0 |
| - Initiate unlock | | ✓ Contact can initiate unlock request | Pending | P0 |
| - Owner cancels | | ✓ Owner can cancel unlock | Pending | P0 |
| - Status resets | | ✓ Check-in resets to "alive" | Pending | P0 |
| **Journey 6: Auth & Security** | `auth-and-security.spec.ts` | 6 tests | Pending | P0 |
| - Marketing page access | | ✓ Can access / without auth | Pending | P1 |
| - Protected route redirect | | ✓ /app redirects to login | Pending | P0 |
| - Vault route redirect | | ✓ /app/vault redirects to login | Pending | P0 |
| - Post-login redirect | | ✓ Redirects to original page after login | Pending | P1 |
| - Invalid token | | ✓ Invalid JWT forces re-auth | Pending | P0 |
| - Expired token | | ✓ Expired token shows error | Pending | P0 |
| **Live Simulation** | `live-simulation.spec.ts` | 1 comprehensive test | Pending | P0 |
| - Full user journey | | ✓ Complete day-in-the-life scenario | Pending | P0 |

## Existing Test Coverage

| Test File | Test Count | Status | Notes |
|-----------|------------|--------|-------|
| `notifications.spec.ts` | 5 | ✅ Passing | Bell icon, center, badge, SSE, mark read |
| `ai-search.spec.ts` | 8 | ✅ Passing | Search button, modal, input, filters, results |
| **Total Existing** | **13** | **✅ 100%** | **Baseline coverage** |

## New Test Coverage (To Implement)

| Test File | Test Count | Estimated Runtime | Priority |
|-----------|------------|-------------------|----------|
| `owner-onboarding.spec.ts` | 7 | ~2 min | P0 |
| `owner-upload-and-share.spec.ts` | 8 | ~3 min | P0 |
| `recipient-notification-and-view.spec.ts` | 10 | ~3 min | P0 |
| `search-and-discovery.spec.ts` | 10 | ~2 min | P0 |
| `check-in-and-unlock.spec.ts` | 9 | ~4 min | P0 |
| `auth-and-security.spec.ts` | 6 | ~2 min | P0 |
| `live-simulation.spec.ts` | 1 | ~5 min | P0 |
| **Total New** | **51** | **~21 min** | **P0** |
| **Grand Total** | **64** | **~25 min** | **Complete** |

## Coverage by Feature

| Feature | User Stories | Test Cases | Coverage |
|---------|--------------|------------|----------|
| Authentication | 2 | 8 | Pending |
| Vault Upload | 2 | 10 | Pending |
| Sharing & Recipients | 2 | 8 | Pending |
| Notifications (SSE) | 2 | 15 | 5/15 ✅ |
| Search & AI | 1 | 10 | 8/10 ✅ |
| Check-In System | 1 | 9 | Pending |
| Trusted Contacts | 1 | 5 | Pending |
| Unlock Requests | 1 | 4 | Pending |
| Stats Dashboard | 1 | 3 | Pending |
| Security Boundaries | 3 | 6 | Pending |

## Test Tags

Tests are tagged for flexible CI execution:

- `@journey` - User journey tests (all new tests)
- `@live-sim` - Live simulation test
- `@smoke` - Critical path tests (subset of journeys)
- `@security` - Security boundary tests
- `@sse` - Real-time notification tests
- `@mobile` - Mobile-specific tests (future)
- `@desktop` - Desktop-specific tests (default)

## CI/CD Integration

### Test Suites

1. **Smoke Suite** (~5 min)
   - Run on every PR
   - Tags: `@smoke`
   - Coverage: Critical paths only

2. **Journey Suite** (~20 min)
   - Run on merge to main
   - Tags: `@journey`
   - Coverage: All user journeys

3. **Full Suite** (~25 min)
   - Run nightly
   - Tags: All
   - Coverage: Everything including live simulation

4. **Security Suite** (~5 min)
   - Run on security-related changes
   - Tags: `@security`
   - Coverage: Auth, authorization, encryption

## Success Criteria

### Definition of Done
- ✅ All acceptance criteria have corresponding test cases
- ✅ All P0 tests implemented and passing
- ✅ Test runtime under 30 minutes
- ✅ No flaky tests (< 1% failure rate)
- ✅ Clear test names and documentation
- ✅ Reusable fixtures and utilities

### Quality Gates
- **PR Merge:** Smoke suite must pass (100%)
- **Main Branch:** Journey suite must pass (100%)
- **Release:** Full suite must pass (100%)
- **Security:** Security suite must pass (100%)

## Maintenance

### Adding New Tests
1. Add user story to `user-stories.md`
2. Add traceability entry to this document
3. Implement test in appropriate `*.spec.ts` file
4. Tag test appropriately
5. Update coverage metrics

### Updating Tests
1. Update acceptance criteria in `user-stories.md`
2. Update test implementation
3. Update traceability status
4. Verify no regressions in related tests

## Notes

- Existing tests (`notifications.spec.ts`, `ai-search.spec.ts`) provide baseline coverage
- New tests will use multi-user fixtures and API seeding for speed
- Live simulation test chains all journeys for holistic validation
- Security tests ensure proper isolation between users
- SSE tests use both event stream and polling for reliability
