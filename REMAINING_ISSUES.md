# Remaining Issues Requiring Separate Implementation

This document outlines the remaining issues from the audit documents that require significant architectural changes or separate PRs.

## Critical Security Issues (Require Product/Architecture Decisions)

### 1. Password Stored in sessionStorage
**Location**: `frontend/src/contexts/AuthContext.tsx` (lines 50, 64)

**Issue**: User's plaintext password is stored in sessionStorage for vault encryption initialization. This is accessible via XSS attacks, browser extensions, or developer tools.

**Impact**: CRITICAL - An attacker with brief browser access can extract the master password and decrypt all vault contents.

**Solution Options**:
- Option A: Prompt user for password on every vault operation (poor UX)
- Option B: Use Web Crypto API to derive and store keys in memory only
- Option C: Implement session-based key derivation with automatic timeout
- Option D: Use browser's native credential storage APIs

**Recommendation**: Requires product decision on UX vs security tradeoff.

---

### 2. JWT Token Exposed in SSE URL
**Location**: `frontend/src/contexts/NotificationContext.tsx` (line 75)

**Issue**: JWT token is passed as query parameter in SSE connection: `/notifications/stream?token=${token}`

**Impact**: HIGH - Token visible in server logs, browser history, and Referer headers.

**Solution**: Move token to Authorization header or use cookie-based authentication for SSE. Requires backend changes to support header-based auth for EventSource.

**Backend Changes Needed**:
- Modify `/notifications/stream` endpoint to accept Authorization header
- Implement cookie-based session for SSE if headers not supported by EventSource polyfill

---

### 3. Shamir Secret Sharing Placeholder
**Location**: `frontend/src/components/trusted-contacts.tsx` (line 331)

**Issue**: `shamirShareEncrypted` is hardcoded as `'placeholder_encrypted_share'` instead of actual Shamir secret sharing implementation.

**Impact**: CRITICAL - Trusted contacts cannot actually unlock vaults. The 2-of-3 verification is UI theater with no cryptographic backing.

**Solution**: 
1. Install Shamir secret sharing library (e.g., `secrets.js-grempe`)
2. Split vault master key into N shares (e.g., 3 shares)
3. Encrypt each share with recipient's public key
4. Store encrypted shares in database
5. Implement reconstruction logic when M-of-N contacts verify death

**Estimated Effort**: 2-3 days including testing and security review.

---

## High Priority Features (Require Backend + Frontend Work)

### 4. Family Tree Real API Integration
**Location**: `frontend/src/components/family-tree.tsx`, `animated-family-tree.tsx`

**Issue**: Both family tree components use mock data. No connection to Person model in database.

**Impact**: HIGH - Core platform vision (unlocked vaults merging into family tree) is not implemented.

**Backend Work Needed**:
- Create API routes: `POST /api/people`, `GET /api/people`, `PUT /api/people/:id`, `DELETE /api/people/:id`
- Create relationship management: `POST /api/people/:id/relationships`
- Implement vault-to-family-tree merge logic in UnlockService

**Frontend Work Needed**:
- Replace mock data with API calls
- Add person tagging UI during memory upload
- Implement family tree filtering by person
- Build recipient portal for viewing inherited memories

**Estimated Effort**: 1-2 weeks

---

### 5. Frequency-Based Pricing Tier Limits
**Location**: Multiple components (upload, story reels, letters, etc.)

**Issue**: No enforcement of tier-based limits (e.g., 4 memories/week for free tier, 20/week for premium).

**Solution**:
1. Add tier limit checks in upload components
2. Display usage indicators in UI
3. Show upgrade prompts when limits reached
4. Implement backend rate limiting per tier

**Backend Changes Needed**:
- Add tier limit enforcement in upload endpoints
- Track weekly usage per user
- Return usage stats in API responses

**Estimated Effort**: 3-5 days

---

## Medium Priority Improvements

### 6. Lazy Loading for Heavy Components
**Components**: ThreeBackground, StoryReels, MemorialPages, AfterImGoneLetters

**Solution**: Use React.lazy() and Suspense for code splitting.

**Example**:
```typescript
const ThreeBackground = React.lazy(() => import('./three-background'))
const StoryReels = React.lazy(() => import('./story-reels'))

// Usage:
<Suspense fallback={<LoadingSpinner />}>
  <ThreeBackground />
</Suspense>
```

**Estimated Effort**: 1 day

---

### 7. Skeleton Loading States
**Components**: Memory gallery, timeline, notifications, search results

**Solution**: Add skeleton screens for better perceived performance.

**Estimated Effort**: 2-3 days

---

### 8. Accessibility Improvements
**Issues**:
- Missing ARIA labels on memory orbs, constellation, interactive elements
- No keyboard navigation for visual components
- Missing focus indicators
- No reduced motion support

**Solution**:
- Add `aria-label`, `aria-describedby` to interactive elements
- Implement keyboard navigation (Tab, Enter, Arrow keys)
- Add `@media (prefers-reduced-motion: reduce)` CSS
- Add focus-visible styles

**Estimated Effort**: 3-4 days

---

## Low Priority / Technical Debt

### 9. Story Recording MediaRecorder Implementation
**Location**: `frontend/src/components/story-recorder.tsx` (lines 114-123)

**Issue**: Uses hardcoded simulated transcript instead of actual audio capture.

**Solution**: Implement MediaRecorder API for real audio recording and speech-to-text integration.

---

### 10. Memory Gallery Mock Data
**Location**: `frontend/src/components/memory-gallery.tsx` (line 30)

**Issue**: Uses mock data instead of fetching from API.

**Solution**: Replace with `apiClient.getMemories()` calls.

---

### 11. Upload Handler Implementation
**Location**: `frontend/src/components/memory-gallery.tsx` (lines 100-107)

**Issue**: Upload button does nothing - only logs to console.

**Solution**: Implement actual file upload logic using `apiClient.uploadItem()`.

---

## Summary

**Completed in This PR**:
- ✅ Toast notification system added
- ✅ All alert() calls replaced with toast notifications
- ✅ Console.log statements removed (kept console.error)
- ✅ Error boundaries already implemented (Phase 1)
- ✅ Missing API methods added (Phase 1)
- ✅ Check-in button wired to API (Phase 2)
- ✅ Grace period cancellation UI added (Phase 2)

**Requires Separate PRs**:
- Password in sessionStorage (security - requires product decision)
- SSE token in URL (security - requires backend changes)
- Shamir secret sharing (security - requires crypto library integration)
- Family tree API integration (feature - requires backend + frontend work)
- Frequency-based pricing limits (feature - requires backend + frontend work)
- Lazy loading, skeletons, accessibility (UX improvements - can be done incrementally)

**Estimated Total Remaining Effort**: 4-6 weeks for all remaining issues.
