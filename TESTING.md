# Constellation Vault Platform - Testing Guide

## Overview

This guide provides comprehensive testing instructions for all features of the Constellation Vault Platform.

---

## Prerequisites

- Backend running on http://localhost:3001 (or https://loom.vantax.co.za/api)
- Frontend running on http://localhost:3000 (or https://loom.vantax.co.za)
- curl or Postman for API testing
- Modern web browser (Chrome, Firefox, Safari)

---

## Part 1: Backend API Testing

### 1.1 Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T08:00:00.000Z"
}
```

---

### 1.2 Authentication Endpoints

#### Register New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "status": "alive",
    "nextCheckIn": "2026-02-20T00:00:00.000Z"
  },
  "vault": {
    "id": "uuid",
    "tier": "STARTER",
    "storageUsed": "0",
    "storageLimit": "10737418240",
    "uploadsThisWeek": 0,
    "uploadLimit": 3
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vmkSalt": "hex-encoded-salt"
}
```

#### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "status": "alive"
  },
  "vault": {
    "id": "uuid",
    "tier": "STARTER",
    "storageUsed": "0",
    "storageLimit": "10737418240"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User

```bash
TOKEN="your-jwt-token-from-login"

curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "status": "alive",
    "nextCheckIn": "2026-02-20T00:00:00.000Z"
  },
  "vault": {
    "id": "uuid",
    "tier": "STARTER",
    "storageUsed": "0",
    "storageLimit": "10737418240",
    "uploadsThisWeek": 0,
    "uploadLimit": 3
  }
}
```

---

### 1.3 Vault Endpoints

#### Upload Item

```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "photo",
    "title": "Family Reunion 2024",
    "encryptedData": "encrypted-data-hex",
    "encryptedDek": "encrypted-dek-hex",
    "fileSizeBytes": 2048000,
    "emotionCategory": "joy",
    "importanceScore": 8
  }'
```

**Expected Response:**
```json
{
  "item": {
    "id": "uuid",
    "type": "photo",
    "title": "Family Reunion 2024",
    "emotionCategory": "joy",
    "importanceScore": 8,
    "createdAt": "2025-11-22T08:00:00.000Z"
  },
  "vault": {
    "storageUsed": "2048000",
    "storageLimit": "10737418240",
    "uploadsRemaining": 2
  }
}
```

#### Get Vault Items

```bash
TOKEN="your-jwt-token"

curl -X GET "http://localhost:3001/api/vault/items?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "photo",
      "title": "Family Reunion 2024",
      "thumbnailUrl": null,
      "emotionCategory": "joy",
      "importanceScore": 8,
      "recipientIds": [],
      "createdAt": "2025-11-22T08:00:00.000Z"
    }
  ],
  "total": 1,
  "vault": {
    "id": "uuid",
    "tier": "STARTER",
    "storageUsed": "2048000",
    "storageLimit": "10737418240"
  }
}
```

#### Get Vault Statistics

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/vault/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "storage": {
    "used": "2048000",
    "limit": "10737418240",
    "percentUsed": 0.02
  },
  "uploads": {
    "thisWeek": 1,
    "limit": 3,
    "remaining": 2,
    "nextReset": "2025-11-24T00:00:00.000Z"
  },
  "items": {
    "total": 1,
    "byType": {
      "photo": 1
    },
    "byEmotion": {
      "joy": 1
    }
  },
  "recipients": {
    "total": 0
  },
  "tier": "STARTER"
}
```

---

### 1.4 Recipient Endpoints

#### Add Recipient

```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/recipients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "name": "John Doe",
    "relationship": "son",
    "accessLevel": "full"
  }'
```

**Expected Response:**
```json
{
  "recipient": {
    "id": "uuid",
    "email": "recipient@example.com",
    "name": "John Doe",
    "relationship": "son",
    "accessLevel": "full",
    "createdAt": "2025-11-22T08:00:00.000Z"
  }
}
```

#### Get Recipients

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/recipients \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "recipients": [
    {
      "id": "uuid",
      "email": "recipient@example.com",
      "name": "John Doe",
      "relationship": "son",
      "accessLevel": "full",
      "createdAt": "2025-11-22T08:00:00.000Z"
    }
  ]
}
```

---

### 1.5 Trusted Contact Endpoints

#### Add Trusted Contact

```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/trusted-contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trusted@example.com",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "shamirShareEncrypted": "encrypted-shamir-share-hex"
  }'
```

**Expected Response:**
```json
{
  "contact": {
    "id": "uuid",
    "email": "trusted@example.com",
    "name": "Jane Smith",
    "verificationStatus": "pending",
    "createdAt": "2025-11-22T08:00:00.000Z"
  },
  "verificationSent": true
}
```

#### Get Trusted Contacts

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/trusted-contacts \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "email": "trusted@example.com",
      "name": "Jane Smith",
      "verificationStatus": "pending",
      "createdAt": "2025-11-22T08:00:00.000Z"
    }
  ]
}
```

---

### 1.6 Check-In Endpoints

#### Get Check-In Status

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/check-in/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "status": "alive",
  "nextCheckIn": "2026-02-20T00:00:00.000Z",
  "intervalDays": 90,
  "missedCount": 0,
  "recentCheckIns": []
}
```

---

### 1.7 Subscription Endpoints

#### Get Current Subscription

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/subscriptions/current \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "tier": "STARTER",
  "subscription": null
}
```

---

### 1.8 Unlock Endpoints

#### Get Unlock Requests

```bash
TOKEN="your-jwt-token"

curl -X GET http://localhost:3001/api/unlock/requests \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "requests": []
}
```

---

## Part 2: Upload Limit Testing

### Test 1: Upload 3 Items (Within Limit)

```bash
TOKEN="your-jwt-token"

# Upload 1
curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"photo","title":"Upload 1","encryptedData":"data1","encryptedDek":"dek1","fileSizeBytes":1024}'

# Upload 2
curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"photo","title":"Upload 2","encryptedData":"data2","encryptedDek":"dek2","fileSizeBytes":1024}'

# Upload 3
curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"photo","title":"Upload 3","encryptedData":"data3","encryptedDek":"dek3","fileSizeBytes":1024}'
```

**Expected**: All 3 uploads succeed with 201 status

### Test 2: Upload 4th Item (Over Limit)

```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"photo","title":"Upload 4","encryptedData":"data4","encryptedDek":"dek4","fileSizeBytes":1024}'
```

**Expected Response:**
```json
{
  "error": "Weekly upload limit reached. Resets on Monday."
}
```

**Expected Status**: 429 Too Many Requests

---

## Part 3: Frontend Testing

### 3.1 Authentication Flow

1. Open https://loom.vantax.co.za
2. Click "Sign In" button
3. Click "Register" tab
4. Enter email and password
5. Click "Register"
6. Verify you're redirected to the main interface
7. Verify your email is displayed in the navigation

### 3.2 Memory Upload Flow

1. Login to the platform
2. Click the "+" button (bottom right)
3. Select a file to upload
4. Enter title and description
5. Select emotion category
6. Click "Upload"
7. Verify the memory appears in the constellation

### 3.3 Recipient Management

1. Navigate to "Recipients" section
2. Click "Add Recipient"
3. Enter recipient email, name, and relationship
4. Select access level
5. Click "Add"
6. Verify recipient appears in the list

### 3.4 Check-In Status

1. Navigate to "Check-In" section
2. Verify next check-in date is displayed
3. Verify status is "alive"
4. Click "Check In Now" button
5. Verify check-in is recorded

---

## Part 4: Encryption Testing

### 4.1 Client-Side Encryption

```javascript
// In browser console
import { VaultEncryption, EncryptionUtils } from '@/lib/encryption';

// Initialize encryption
const vault = new VaultEncryption();
const password = 'testpass123';
const salt = EncryptionUtils.generateSalt();
await vault.initialize(password, salt);

// Encrypt data
const data = 'This is a secret message';
const encrypted = await vault.encryptItem(data);
console.log('Encrypted:', encrypted);

// Decrypt data
const decrypted = await vault.decryptItem(encrypted.encryptedData, encrypted.encryptedDek);
console.log('Decrypted:', decrypted);
// Should output: "This is a secret message"
```

---

## Part 5: Performance Testing

### 5.1 Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test authenticated endpoint (requires token)
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/vault/stats
```

**Expected**: 
- Health endpoint: >500 requests/second
- Authenticated endpoints: >100 requests/second

---

## Part 6: Security Testing

### 6.1 Test Authentication Required

```bash
# Try to access protected endpoint without token
curl -X GET http://localhost:3001/api/vault/items

# Expected: 401 Unauthorized
```

### 6.2 Test Invalid Token

```bash
curl -X GET http://localhost:3001/api/vault/items \
  -H "Authorization: Bearer invalid-token"

# Expected: 401 Unauthorized
```

### 6.3 Test SQL Injection Protection

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com OR 1=1--",
    "password": "anything"
  }'

# Expected: 401 Invalid credentials (not SQL error)
```

---

## Part 7: Error Handling Testing

### 7.1 Test Invalid Email Format

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "testpass123"
  }'

# Expected: 400 Bad Request with validation error
```

### 7.2 Test Missing Required Fields

```bash
curl -X POST http://localhost:3001/api/vault/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "photo"
  }'

# Expected: 400 Bad Request with missing field error
```

---

## Part 8: Integration Testing

### 8.1 Complete User Journey

1. **Register**: Create new account
2. **Login**: Authenticate with credentials
3. **Upload**: Add 3 memories (photos, videos, letters)
4. **Recipients**: Add 2 recipients with different access levels
5. **Trusted Contacts**: Add 3 trusted contacts
6. **Check-In**: Verify check-in status
7. **Statistics**: View vault statistics
8. **Logout**: Sign out
9. **Login Again**: Verify data persists

### 8.2 Dead Man's Switch Flow (Manual Simulation)

1. Register a new user
2. Add trusted contacts
3. Manually update user status in database:
   ```sql
   UPDATE users SET status = 'escalation', grace_period_end = NOW() + INTERVAL '30 days' WHERE email = 'test@example.com';
   ```
4. Verify unlock request is created
5. Simulate trusted contact confirmations
6. Verify vault unlocks after grace period

---

## Part 9: Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Part 10: Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible
- [ ] Alt text on images

---

## Known Issues

1. **Job Scheduler Not Running**: pg-boss has ES Module import issues. Cron jobs won't run automatically but API endpoints work.
2. **Email Notifications**: Require Resend API key configuration.

---

## Test Results Template

```markdown
## Test Results - [Date]

### Backend API Tests
- [ ] Health check: PASS/FAIL
- [ ] Authentication: PASS/FAIL
- [ ] Vault operations: PASS/FAIL
- [ ] Recipients: PASS/FAIL
- [ ] Trusted contacts: PASS/FAIL
- [ ] Check-in: PASS/FAIL
- [ ] Upload limits: PASS/FAIL

### Frontend Tests
- [ ] Authentication flow: PASS/FAIL
- [ ] Memory upload: PASS/FAIL
- [ ] Recipient management: PASS/FAIL
- [ ] Check-in status: PASS/FAIL

### Performance
- Health endpoint: X req/s
- Authenticated endpoints: X req/s

### Issues Found
1. [Description]
2. [Description]

### Notes
[Any additional observations]
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Reshigan/Heirloom/issues
- Email: reshigan@gonxt.tech
