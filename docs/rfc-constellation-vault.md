# RFC: Constellation Vault Platform

**Status**: Draft  
**Author**: Devin  
**Date**: 2025-11-22  
**Version**: 1.0

## Executive Summary

Transform Heirloom into a Personal Digital Vault platform with an immersive 3D constellation UI. The platform combines:
- **Privacy Model**: 100% private while alive, unlocks only upon verified death
- **Visual Experience**: Interactive 3D constellation where memories are stars in space
- **Business Model**: $2.50/month or $25/year with upload limits and storage caps

## 1. Threat Model & Security Architecture

### 1.1 Trust Boundaries
- **User's Browser**: Trusted zone - all encryption/decryption happens here
- **Server**: Untrusted - stores only encrypted blobs, never sees plaintext
- **Recipients**: Trusted after death verification - receive decryption keys via magic links
- **Trusted Contacts**: Semi-trusted - hold Shamir shares for death verification

### 1.2 Encryption Hierarchy

```
User Password (entered)
    ↓ PBKDF2-HMAC-SHA256 (310k iterations, 128-bit salt)
Vault Master Key (VMK, 32 bytes)
    ↓ Wraps each item's DEK
Data Encryption Keys (DEK, per-item, AES-256-GCM)
    ↓ Encrypts
Vault Item Content (photos, videos, letters, etc.)
```

### 1.3 Posthumous Decryption Flow

1. User sets up 2-of-3 trusted contacts at vault creation
2. VMK is split using Shamir's Secret Sharing (2-of-3 threshold)
3. Each trusted contact receives encrypted share (encrypted to their email-derived key)
4. Upon death verification:
   - 2 trusted contacts submit their shares
   - Shares reconstructed client-side in unlock portal
   - VMK recovered, used to unwrap item DEKs
   - DEKs re-wrapped to recipient public keys
   - Recipients receive magic links with embedded one-time keys

### 1.4 Attack Scenarios & Mitigations

| Attack | Mitigation |
|--------|-----------|
| Server compromise | E2EE ensures server never sees plaintext |
| False death claim | 30-day grace period + multi-channel user alerts |
| Trusted contact collusion | Require 2-of-3 threshold + audit logging |
| Recipient impersonation | Magic links are single-use, time-limited, IP-logged |
| Brute force password | PBKDF2 with 310k iterations + rate limiting |

## 2. State Machine: Dead Man's Switch

### 2.1 User Lifecycle States

```
┌─────────┐
│  ALIVE  │ ◄──────────────────┐
└────┬────┘                     │
     │ Miss check-in            │
     ↓                          │
┌──────────────┐                │
│ MISSED_ONE   │                │ User responds
└──────┬───────┘                │ or signs in
       │ Miss 2nd check-in      │
       ↓                        │
┌──────────────┐                │
│ MISSED_TWO   │                │
└──────┬───────┘                │
       │ Miss 3rd check-in      │
       ↓                        │
┌──────────────┐                │
│ ESCALATION   │ ───────────────┘
└──────┬───────┘  (notify trusted contacts)
       │ 2-of-3 confirm death
       ↓
┌──────────────────┐
│ PENDING_UNLOCK   │
└──────┬───────────┘
       │ 30-day grace period expires
       ↓
┌──────────────┐
│  UNLOCKED    │
└──────────────┘
```

### 2.2 Check-in Schedule

- **Default Interval**: 90 days
- **Configurable**: 30/60/90/180 days
- **Channels**: Email (primary) + SMS (backup)
- **Response Actions**: Click link, reply to email, sign in to platform
- **Snooze**: User can snooze for 7/14/30 days

### 2.3 Grace Period Logic

```python
# Pseudocode for grace period
if user.status == ESCALATION:
    if trusted_contacts_confirmed >= 2:
        user.status = PENDING_UNLOCK
        user.grace_period_end = now() + 30 days
        send_final_warnings_to_user()
        
if user.status == PENDING_UNLOCK:
    if now() > user.grace_period_end:
        user.status = UNLOCKED
        initiate_recipient_notifications()
    if user.signs_in():
        user.status = ALIVE
        cancel_unlock_process()
```

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Users with check-in tracking
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'alive', -- alive, missed_one, missed_two, escalation, pending_unlock, unlocked
    last_check_in TIMESTAMP,
    next_check_in TIMESTAMP,
    check_in_interval_days INT DEFAULT 90,
    grace_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vaults (one per user)
CREATE TABLE vaults (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_vmk TEXT NOT NULL, -- VMK encrypted with password-derived key
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10GB
    upload_count_this_week INT DEFAULT 0,
    upload_limit_weekly INT DEFAULT 3,
    tier VARCHAR(50) DEFAULT 'starter', -- starter, family, unlimited, lifetime
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vault items (memories)
CREATE TABLE vault_items (
    id UUID PRIMARY KEY,
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- photo, video, letter, voice, document, wisdom
    title VARCHAR(255),
    encrypted_data TEXT NOT NULL, -- Encrypted content
    encrypted_dek TEXT NOT NULL, -- DEK wrapped by VMK
    thumbnail_url TEXT, -- Server-generated thumbnail (pragmatic E2EE)
    file_size_bytes BIGINT,
    recipient_ids UUID[], -- Array of recipient IDs
    scheduled_delivery TIMESTAMP, -- NULL for immediate, future date for scheduled
    emotion_category VARCHAR(50), -- joy, nostalgia, wisdom, etc.
    importance_score INT DEFAULT 5, -- 1-10 for constellation size
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recipients (people who will receive vault contents)
CREATE TABLE recipients (
    id UUID PRIMARY KEY,
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    relationship VARCHAR(100), -- son, daughter, spouse, friend, etc.
    access_level VARCHAR(50) DEFAULT 'specific', -- full, partial, specific
    public_key TEXT, -- Generated when recipient claims access
    notification_sent BOOLEAN DEFAULT FALSE,
    access_token TEXT, -- Magic link token
    access_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trusted contacts for death verification
CREATE TABLE trusted_contacts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    name VARCHAR(255),
    shamir_share_encrypted TEXT, -- Encrypted Shamir share
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified
    verification_token TEXT,
    confirmed_death BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Check-in history
CREATE TABLE check_ins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sent_at TIMESTAMP NOT NULL,
    sent_via VARCHAR(50), -- email, sms
    responded_at TIMESTAMP,
    response_method VARCHAR(50), -- link_click, email_reply, sign_in
    missed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Unlock requests and audit trail
CREATE TABLE unlock_requests (
    id UUID PRIMARY KEY,
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    initiated_by VARCHAR(255), -- Email of trusted contact who initiated
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, cancelled
    confirmations_count INT DEFAULT 0,
    grace_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Audit log for all sensitive operations
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- check_in_sent, check_in_missed, unlock_initiated, etc.
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription management
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Upload bonuses
CREATE TABLE upload_bonuses (
    id UUID PRIMARY KEY,
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    bonus_type VARCHAR(50), -- birthday, referral, annual_payment
    bonus_amount INT, -- Additional uploads per week
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Indexes

```sql
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_next_check_in ON users(next_check_in);
CREATE INDEX idx_vault_items_vault_id ON vault_items(vault_id);
CREATE INDEX idx_vault_items_scheduled_delivery ON vault_items(scheduled_delivery);
CREATE INDEX idx_recipients_vault_id ON recipients(vault_id);
CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

## 4. API Contract

### 4.1 Authentication Endpoints

```
POST /api/auth/register
Body: { email, password, name }
Response: { user, vault, token }

POST /api/auth/login
Body: { email, password }
Response: { user, vault, token }

POST /api/auth/check-in-response
Body: { token }
Response: { success, next_check_in }
```

### 4.2 Vault Endpoints

```
POST /api/vault/upload
Headers: Authorization: Bearer <token>
Body: FormData { file, encrypted_data, encrypted_dek, type, title, recipient_ids, scheduled_delivery }
Response: { item_id, storage_used, uploads_remaining }

GET /api/vault/items
Headers: Authorization: Bearer <token>
Query: ?type=photo&limit=50&offset=0
Response: { items[], total, storage_used, uploads_remaining }

PUT /api/vault/items/:id
Headers: Authorization: Bearer <token>
Body: { title, recipient_ids, scheduled_delivery }
Response: { item }

DELETE /api/vault/items/:id
Headers: Authorization: Bearer <token>
Response: { success, storage_freed }

GET /api/vault/stats
Headers: Authorization: Bearer <token>
Response: { storage_used, storage_limit, uploads_this_week, upload_limit, next_reset }
```

### 4.3 Recipient Endpoints

```
POST /api/recipients
Headers: Authorization: Bearer <token>
Body: { email, name, relationship, access_level }
Response: { recipient }

GET /api/recipients
Headers: Authorization: Bearer <token>
Response: { recipients[] }

PUT /api/recipients/:id
Headers: Authorization: Bearer <token>
Body: { name, relationship, access_level }
Response: { recipient }

DELETE /api/recipients/:id
Headers: Authorization: Bearer <token>
Response: { success }

GET /api/recipient-access/:token
Response: { items[], vault_owner_name, access_expires_at }
```

### 4.4 Trusted Contacts Endpoints

```
POST /api/trusted-contacts
Headers: Authorization: Bearer <token>
Body: { email, phone, name, shamir_share_encrypted }
Response: { contact, verification_sent }

POST /api/trusted-contacts/verify
Body: { token }
Response: { success }

POST /api/trusted-contacts/confirm-death
Body: { token, shamir_share }
Response: { success, confirmations_count, threshold_met }

GET /api/trusted-contacts
Headers: Authorization: Bearer <token>
Response: { contacts[] }
```

### 4.5 Check-in Endpoints

```
POST /api/check-in/configure
Headers: Authorization: Bearer <token>
Body: { interval_days }
Response: { next_check_in }

POST /api/check-in/snooze
Headers: Authorization: Bearer <token>
Body: { days }
Response: { next_check_in }

GET /api/check-in/status
Headers: Authorization: Bearer <token>
Response: { status, next_check_in, missed_count }
```

### 4.6 Subscription Endpoints

```
POST /api/subscriptions/create-checkout
Headers: Authorization: Bearer <token>
Body: { tier, interval } // interval: month or year
Response: { checkout_url }

POST /api/subscriptions/webhook
Body: Stripe webhook payload
Response: { received: true }

GET /api/subscriptions/current
Headers: Authorization: Bearer <token>
Response: { tier, status, current_period_end, cancel_at_period_end }

POST /api/subscriptions/cancel
Headers: Authorization: Bearer <token>
Response: { success, cancel_at_period_end }
```

## 5. Frontend Architecture

### 5.1 Technology Stack

- **Framework**: Next.js 15 with App Router
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand for global state
- **Animation**: Framer Motion + GSAP
- **Styling**: Tailwind CSS with custom cosmic theme
- **Encryption**: Web Crypto API (SubtleCrypto)
- **Secret Sharing**: libsodium.js for Shamir's Secret Sharing

### 5.2 Component Hierarchy

```
App
├── CosmicBackground (WebGL particle system)
├── CustomCursor (golden glow cursor)
├── Navigation
│   ├── TranslucentHeader
│   ├── MiniConstellationMap
│   ├── QuantumSearchBar
│   └── FamilyTreeNavigator
├── ConstellationCanvas (main 3D view)
│   ├── MemoryOrbs (3D nodes)
│   ├── ConnectionLines (glowing paths)
│   ├── TimelineSpiral (vertical helix)
│   └── OrbitControls
├── MemoryCard (glassmorphism detail view)
│   ├── HolographicPreview
│   ├── MetadataStrip
│   ├── EmotionAura
│   └── ActionButtons
├── StoryWeaver (split-screen editor)
│   ├── TimelinePanel
│   ├── CompositionCanvas
│   └── AISuggestions
├── WisdomWell (crystal container)
│   ├── ParticleText
│   └── OrbitalRings
├── UploadCeremony (fullscreen modal)
│   ├── VortexAnimation
│   ├── EncryptionProgress
│   └── LimitIndicator
├── RecipientManager
│   ├── RecipientList
│   └── AssignmentInterface
└── TrustedContactSetup
    ├── ContactForm
    └── ShamirShareDistribution
```

### 5.3 State Management

```typescript
// Zustand store structure
interface VaultStore {
  // User & Vault
  user: User | null;
  vault: Vault | null;
  
  // Items
  items: VaultItem[];
  selectedItem: VaultItem | null;
  
  // UI State
  view: 'constellation' | 'timeline' | 'story-weaver' | 'wisdom-well';
  loading: boolean;
  uploadProgress: number;
  
  // Filters
  timeRange: [Date, Date];
  emotionFilter: string[];
  typeFilter: string[];
  
  // Actions
  fetchItems: () => Promise<void>;
  uploadItem: (file: File, metadata: ItemMetadata) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setView: (view: string) => void;
}
```

## 6. Cron Jobs & Background Tasks

### 6.1 Job Scheduler

Use **pg-boss** (Postgres-backed job queue) for durable, persistent scheduling.

### 6.2 Scheduled Jobs

```typescript
// Monday 00:00 UTC: Reset weekly upload limits
schedule('reset-upload-limits', '0 0 * * 1', async () => {
  await db.vaults.updateMany({
    data: { upload_count_this_week: 0 }
  });
});

// Daily 09:00 UTC: Send check-in reminders
schedule('send-check-ins', '0 9 * * *', async () => {
  const users = await db.users.findMany({
    where: {
      next_check_in: { lte: new Date() },
      status: 'alive'
    }
  });
  
  for (const user of users) {
    await sendCheckInEmail(user);
    await sendCheckInSMS(user);
    await db.check_ins.create({
      data: {
        user_id: user.id,
        sent_at: new Date(),
        sent_via: 'email,sms'
      }
    });
  }
});

// Daily 10:00 UTC: Process missed check-ins
schedule('process-missed-check-ins', '0 10 * * *', async () => {
  const missedCheckIns = await db.check_ins.findMany({
    where: {
      sent_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      responded_at: null,
      missed: false
    }
  });
  
  for (const checkIn of missedCheckIns) {
    await updateUserStatus(checkIn.user_id);
  }
});

// Daily 11:00 UTC: Process scheduled deliveries
schedule('process-scheduled-deliveries', '0 11 * * *', async () => {
  const items = await db.vault_items.findMany({
    where: {
      scheduled_delivery: { lte: new Date() }
    },
    include: { vault: { include: { user: true } } }
  });
  
  for (const item of items) {
    if (item.vault.user.status === 'unlocked') {
      await notifyRecipients(item);
    }
  }
});

// Daily 12:00 UTC: Check grace period expirations
schedule('check-grace-periods', '0 12 * * *', async () => {
  const users = await db.users.findMany({
    where: {
      status: 'pending_unlock',
      grace_period_end: { lte: new Date() }
    }
  });
  
  for (const user of users) {
    await unlockVault(user.id);
  }
});

// Sunday 18:00 UTC: Send weekly engagement emails
schedule('weekly-engagement', '0 18 * * 0', async () => {
  const users = await db.users.findMany({
    where: { status: 'alive' },
    include: { vault: true }
  });
  
  for (const user of users) {
    if (user.vault.upload_count_this_week < user.vault.upload_limit_weekly) {
      await sendWeeklyReminder(user);
    }
  }
});
```

## 7. Migration Plan

### 7.1 Phase 1: Backend Setup (Week 1)

- [ ] Set up Node.js + Express + Prisma project structure
- [ ] Implement database schema with Prisma migrations
- [ ] Build authentication system with JWT
- [ ] Implement encryption utilities (Web Crypto API wrappers)
- [ ] Set up pg-boss for job scheduling
- [ ] Create audit logging middleware

### 7.2 Phase 2: Core Vault Features (Week 2)

- [ ] Upload endpoint with encryption and storage tracking
- [ ] Weekly limit enforcement with Monday reset job
- [ ] Vault items CRUD endpoints
- [ ] Recipient management endpoints
- [ ] Trusted contacts setup with Shamir's Secret Sharing
- [ ] Check-in system with email/SMS integration

### 7.3 Phase 3: Dead Man's Switch (Week 3)

- [ ] Check-in reminder cron job
- [ ] Missed check-in processing logic
- [ ] User status state machine
- [ ] Trusted contact death confirmation flow
- [ ] Grace period tracking and expiration
- [ ] Vault unlock mechanism

### 7.4 Phase 4: Payments & Limits (Week 4)

- [ ] Stripe integration for subscriptions
- [ ] Webhook handling for subscription events
- [ ] Tier-based feature enforcement
- [ ] Upload bonus system
- [ ] Storage limit enforcement
- [ ] Upgrade/downgrade flows

### 7.5 Phase 5: Constellation UI (Week 5-6)

- [ ] Set up React Three Fiber canvas
- [ ] Build 3D memory orbs with varying properties
- [ ] Implement connection lines between related memories
- [ ] Create Timeline Cathedral spiral structure
- [ ] Build glass morphism design system
- [ ] Implement cosmic particle background
- [ ] Add smooth zoom and navigation controls

### 7.6 Phase 6: Advanced Features (Week 7-8)

- [ ] Story Weaver interface
- [ ] Wisdom Well component
- [ ] Upload ceremony with animations
- [ ] Recipient access portal with magic links
- [ ] Mobile responsive 2D fallback
- [ ] Performance optimizations (lazy loading, virtual scrolling)

### 7.7 Phase 7: Testing & Deployment (Week 9)

- [ ] End-to-end testing of all flows
- [ ] Security audit of encryption implementation
- [ ] Performance testing with large datasets
- [ ] Deploy to staging server
- [ ] User acceptance testing
- [ ] Production deployment

## 8. Success Metrics

### 8.1 Technical Metrics

- **Encryption**: 100% of vault items encrypted client-side
- **Performance**: Constellation renders at 60fps with 1000+ memories
- **Uptime**: 99.9% availability for check-in system
- **Security**: Zero data breaches, zero unauthorized vault access

### 8.2 Business Metrics

- **Conversion**: 20% of signups convert to paid tier
- **Retention**: 80% of users upload at least 1 item in first week
- **Engagement**: 50% of users set up trusted contacts
- **Revenue**: $2.50 ARPU with 30% annual upgrade rate

## 9. Open Questions

1. **Resend API Key**: Need credentials for email sending
2. **Twilio Account**: Need credentials for SMS sending
3. **Stripe Products**: Need to create products/prices in Stripe dashboard
4. **AWS S3 Bucket**: Need bucket name and credentials for file storage
5. **Domain for Node.js API**: Should it be api.loom.vantax.co.za or same domain?

## 10. Next Steps

1. Get provider credentials (Resend, Twilio, Stripe, AWS)
2. Set up Node.js backend project structure
3. Implement Prisma schema and migrations
4. Build core vault upload/encryption flow
5. Create constellation UI prototype
6. Deploy to staging for testing

---

**End of RFC**
