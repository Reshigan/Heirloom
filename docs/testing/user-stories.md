# Heirloom Vault Platform - User Stories & Journeys

## Overview
This document defines comprehensive user stories for the Heirloom personal vault platform, covering realistic user journeys that simulate live platform usage. These stories drive our E2E test suite and ensure the platform functions holistically across all personas and workflows.

## Personas

### 1. Vault Owner (Primary User)
**Profile:** Sarah, 45, wants to preserve family memories and ensure they're accessible to loved ones if something happens to her.

**Goals:**
- Securely store encrypted memories (photos, videos, documents, voice notes)
- Share specific memories with family members
- Configure automatic check-ins to verify she's alive
- Designate trusted contacts who can unlock her vault if needed
- Monitor vault usage and storage

**Technical Context:**
- Has JWT token stored in localStorage as `vault_token`
- Owns a Vault with storage limits and upload quotas
- Can create VaultItems with client-side encryption
- Can assign recipientIds to share items
- Can configure check-in intervals and trusted contacts

### 2. Family Recipient
**Profile:** Michael, 28, Sarah's son, receives shared memories from his mother's vault.

**Goals:**
- Receive real-time notifications when memories are shared
- View and search shared memories
- Filter by type, emotion, date range
- Cannot access unshared memories (security boundary)

**Technical Context:**
- Has own JWT token and user account
- Receives SSE notifications via `/api/notifications/stream?token=JWT`
- Can only access VaultItems where their userId is in recipientIds array
- Can search with filters via `/api/search`

### 3. Trusted Contact
**Profile:** Emma, 50, Sarah's sister, designated to help unlock the vault in emergencies.

**Goals:**
- Receive check-in escalation notifications if Sarah misses check-ins
- Initiate unlock request when Sarah is unreachable
- Verify identity to access vault in true emergency
- Allow Sarah to cancel unlock if she returns

**Technical Context:**
- Has own JWT token and user account
- Listed in Sarah's TrustedContact table with shamirShareEncrypted
- Receives notifications when owner misses check-ins beyond grace period
- Can POST to `/api/unlock/verify-death/:token` to initiate unlock

### 4. Unauthenticated Visitor
**Profile:** Anonymous user exploring the platform.

**Goals:**
- View marketing/landing page
- Understand platform features
- Sign up or log in

**Technical Context:**
- No JWT token
- Redirected to login for any `/app/*` routes
- Can access `/` (marketing) and `/auth/*` routes

## User Journeys

### Journey 1: Owner Onboarding & First Upload
**Persona:** Vault Owner (Sarah)

**Story:** As a new vault owner, I want to register, log in, and upload my first encrypted memory so that I can start preserving my family history.

**Acceptance Criteria:**
1. Can register with email/password via POST `/api/auth/register`
2. Receives JWT token on successful registration
3. Can log in with credentials via POST `/api/auth/login`
4. Empty vault state shows helpful onboarding message
5. Can upload a memory (image) with encryption via POST `/api/vault/items`
6. Uploaded memory appears in timeline/constellation view
7. Vault stats reflect 1 item and updated storage usage

**Test Coverage:** `owner-onboarding.spec.ts`

### Journey 2: Owner Shares Memory with Recipient
**Persona:** Vault Owner (Sarah) → Family Recipient (Michael)

**Story:** As a vault owner, I want to share a specific memory with my son so that he can view it and receive a notification.

**Acceptance Criteria:**
1. Owner uploads memory with `recipientIds: [michaelUserId]`
2. Memory appears in owner's timeline
3. Recipient receives SSE notification of type "memory_shared"
4. Recipient can view notification in notification center
5. Recipient can click notification to view the shared memory
6. Recipient can decrypt and view the memory content
7. Owner's stats show 1 recipient with access
8. Recipient cannot access other unshared memories (security test)

**Test Coverage:** `owner-upload-and-share.spec.ts`, `recipient-notification-and-view.spec.ts`

### Journey 3: Recipient Searches Shared Memories
**Persona:** Family Recipient (Michael)

**Story:** As a recipient, I want to search through memories shared with me using keywords and filters so that I can find specific moments.

**Acceptance Criteria:**
1. Recipient has multiple shared memories seeded
2. Can open search modal via search button
3. Can enter search query (e.g., "birthday photo")
4. Search returns relevant results with AI-generated summaries
5. Can apply filters (type=image, emotion=joyful, date range)
6. Filter button opens filter panel
7. Type filter dropdown works correctly
8. Results update based on filters
9. Can click result to view full memory
10. Search only returns memories shared with recipient (security boundary)

**Test Coverage:** `search-and-discovery.spec.ts`

### Journey 4: Owner Configures Check-In & Trusted Contact
**Persona:** Vault Owner (Sarah) → Trusted Contact (Emma)

**Story:** As a vault owner, I want to configure automatic check-ins and designate my sister as a trusted contact so that my vault can be unlocked if I become unreachable.

**Acceptance Criteria:**
1. Owner can add trusted contact via POST `/api/trusted-contacts`
2. Trusted contact receives verification notification
3. Owner can configure check-in interval via POST `/api/check-in`
4. Check-in status shows next check-in date
5. When owner misses check-in (simulated), status changes to grace period
6. After grace period, trusted contact receives escalation notification
7. Trusted contact can initiate unlock request
8. Owner can cancel unlock if they return
9. Check-in resets status to "alive" and updates next check-in date

**Test Coverage:** `check-in-and-unlock.spec.ts`

### Journey 5: Real-Time Notifications
**Persona:** Family Recipient (Michael)

**Story:** As a recipient, I want to receive real-time notifications when memories are shared so that I'm immediately aware of new content.

**Acceptance Criteria:**
1. Recipient connects to SSE stream at `/api/notifications/stream?token=JWT`
2. Connection establishes successfully (EventSource readyState = 1)
3. When owner shares memory, notification arrives via SSE within 5 seconds
4. Notification appears in notification center with unread badge
5. Can click notification to mark as read
6. Unread count decreases
7. Can mark all notifications as seen
8. Notification center shows recent notifications in chronological order

**Test Coverage:** `recipient-notification-and-view.spec.ts`, existing `notifications.spec.ts`

### Journey 6: Unauthenticated Access Control
**Persona:** Unauthenticated Visitor

**Story:** As an unauthenticated user, I should be redirected to login when accessing protected routes to ensure security.

**Acceptance Criteria:**
1. Can access `/` (marketing page) without authentication
2. Accessing `/app` redirects to `/auth/login`
3. Accessing `/app/vault` redirects to `/auth/login`
4. After login, redirected back to originally requested page
5. Invalid JWT token forces re-authentication
6. Expired token shows appropriate error message

**Test Coverage:** `auth-and-security.spec.ts`

## Live Simulation Scenario

### "A Day in the Life of the Heirloom Platform"
**Duration:** ~5 minutes
**Personas:** All (Owner, Recipient, Trusted Contact)

**Narrative:**
Sarah (owner) wakes up and uploads a family photo from last night's dinner. She shares it with her son Michael (recipient). Michael receives a real-time notification on his phone, opens the app, and views the memory. He searches for other recent family photos using the AI search. Meanwhile, Sarah checks her vault stats and sees Michael has viewed the memory. Later, Sarah goes on a hiking trip and misses her weekly check-in. After the grace period, her sister Emma (trusted contact) receives an escalation notification. Emma prepares to initiate an unlock request, but Sarah returns from her trip and performs a check-in, canceling the unlock process.

**Test Flow:**
1. **Setup:** Create 3 users (owner, recipient, trusted contact) with storage states
2. **Owner uploads and shares:**
   - POST `/api/vault/items` with recipientIds
   - Assert item appears in owner timeline
3. **Recipient receives notification:**
   - Recipient connects to SSE stream
   - Assert notification arrives
   - Assert notification center shows new notification
4. **Recipient views memory:**
   - Click notification
   - Assert memory detail view opens
   - Assert content is decrypted and visible
5. **Recipient searches:**
   - Open search modal
   - Enter query "family"
   - Assert results include the shared memory
   - Apply filter type=image
   - Assert filtered results
6. **Owner checks stats:**
   - Navigate to stats dashboard
   - Assert 1 item uploaded
   - Assert storage usage updated
7. **Check-in flow:**
   - Owner configures short check-in interval (if possible, or use test trigger)
   - Simulate missed check-in
   - Assert trusted contact receives escalation notification
   - Trusted contact initiates unlock request
   - Owner returns and cancels unlock
   - Assert status returns to "alive"

**Test Coverage:** `live-simulation.spec.ts`

## Security & Edge Cases

### Security Boundaries
1. **Recipient Isolation:** Recipients can only access memories explicitly shared with them
2. **Encryption:** All vault items are encrypted client-side before upload
3. **Authentication:** All API endpoints require valid JWT token
4. **Authorization:** Users can only access their own vault and shared items

### Edge Cases to Test
1. **Empty States:**
   - New user with no memories
   - Recipient with no shared memories
   - No notifications
2. **Limits:**
   - Storage quota exceeded
   - Weekly upload limit reached
   - Maximum recipients reached (tier-based)
3. **Errors:**
   - Network failures during upload
   - Invalid encryption data
   - Expired JWT token
   - SSE connection drops and reconnects
4. **Timing:**
   - Notifications arrive out of order
   - Check-in grace period edge cases
   - Scheduled delivery in the past/future

## Test Data Requirements

### Minimal Seed Data (for fast tests)
- 3 users: owner, recipient, trusted contact
- 5-10 vault items with variety:
  - 3 images (small base64 thumbnails)
  - 2 text notes
  - 1 video (metadata only)
  - 1 audio (metadata only)
  - 1 document
- 2 recipients configured
- 1 trusted contact configured
- 5 notifications (mix of read/unread)

### Realistic Seed Data (for live simulation)
- Same as minimal, but with:
  - 20-30 vault items spanning multiple dates
  - Variety of emotions (joyful, happy, neutral, sad)
  - Variety of importance scores (1-10)
  - AI-generated keywords and summaries
  - Some items shared, some private

## Success Metrics

### Test Suite Goals
- **Coverage:** 100% of critical user journeys
- **Pass Rate:** 100% on clean environment
- **Runtime:** < 10 minutes for full suite
- **Stability:** < 1% flake rate over 100 runs
- **Maintainability:** Clear test names, minimal duplication, good abstractions

### Platform Quality Goals
- **Security:** No unauthorized access in any scenario
- **Performance:** Notifications arrive within 5 seconds
- **Reliability:** SSE reconnects automatically on disconnect
- **Usability:** All user flows complete without errors
- **Data Integrity:** Encryption/decryption works correctly for all item types
