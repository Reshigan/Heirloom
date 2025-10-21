import { z } from 'zod';

// Vault Schema - Private memory vaults accessible only via tokens
export const VaultSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isLocked: z.boolean().default(true),
  accessToken: z.string().min(32), // Secure token for vault access
  backupTokens: z.array(z.string()).default([]), // Emergency backup tokens
  unlockDate: z.date().optional(), // Scheduled unlock date
  unlockConditions: z.object({
    requiresMultipleTokens: z.boolean().default(false),
    minimumTokensRequired: z.number().min(1).default(1),
    allowedUnlockers: z.array(z.string()).default([]), // User IDs who can unlock
    timeDelayHours: z.number().min(0).default(0), // Delay after token use
  }).optional(),
  inheritanceSettings: z.object({
    automaticInheritance: z.boolean().default(true),
    inheritanceDelay: z.number().min(0).default(24), // Hours before inheritance activates
    notificationEmails: z.array(z.string().email()).default([]),
    inheritanceMessage: z.string().optional(),
  }).optional(),
  privacySettings: z.object({
    allowSearch: z.boolean().default(true),
    allowAIAnalysis: z.boolean().default(true),
    allowDownload: z.boolean().default(false),
    allowSharing: z.boolean().default(false),
  }).default({}),
  metadata: z.object({
    totalMemories: z.number().default(0),
    totalSize: z.number().default(0), // in bytes
    lastActivity: z.date().optional(),
    createdBy: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }).default({}),
  status: z.enum(['active', 'locked', 'unlocked', 'inherited', 'archived']).default('locked'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  unlockedAt: z.date().optional(),
  inheritedAt: z.date().optional(),
});

// Vault Access Log Schema
export const VaultAccessLogSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  accessorId: z.string().uuid().optional(), // User who accessed (if authenticated)
  accessToken: z.string(),
  accessType: z.enum(['token_unlock', 'inheritance', 'admin_override', 'emergency_access']),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  success: z.boolean(),
  failureReason: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

// Vault Inheritance Schema
export const VaultInheritanceSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  originalOwnerId: z.string().uuid(),
  inheritedBy: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['full_access', 'view_only', 'contributor']),
    inheritedAt: z.date(),
    accessLevel: z.object({
      canViewMemories: z.boolean().default(true),
      canAddMemories: z.boolean().default(false),
      canEditMemories: z.boolean().default(false),
      canDeleteMemories: z.boolean().default(false),
      canInviteOthers: z.boolean().default(false),
      canManageVault: z.boolean().default(false),
    }).default({}),
  })).default([]),
  inheritanceType: z.enum(['automatic', 'manual', 'emergency']),
  triggerEvent: z.enum(['token_used', 'scheduled_date', 'manual_trigger', 'death_certificate']).optional(),
  triggerDate: z.date(),
  notificationsSent: z.boolean().default(false),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
});

// Vault Memory Association Schema
export const VaultMemorySchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  memoryId: z.string().uuid(),
  addedBy: z.string().uuid(),
  addedAt: z.date().default(() => new Date()),
  isVisible: z.boolean().default(true),
  accessLevel: z.enum(['public', 'family', 'private']).default('private'),
  emotionalContext: z.object({
    sentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']).optional(),
    emotions: z.array(z.string()).default([]), // joy, sadness, love, pride, etc.
    intensity: z.number().min(0).max(1).optional(), // 0-1 scale
    ageContext: z.object({
      subjectAge: z.number().optional(),
      ageRange: z.string().optional(), // "20s", "30s", "childhood", etc.
      lifeStage: z.string().optional(), // "young_adult", "parent", "grandparent", etc.
    }).optional(),
  }).optional(),
  searchMetadata: z.object({
    keywords: z.array(z.string()).default([]),
    people: z.array(z.string()).default([]),
    places: z.array(z.string()).default([]),
    events: z.array(z.string()).default([]),
    timeReferences: z.array(z.string()).default([]),
  }).default({}),
});

// Vault Token Schema
export const VaultTokenSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  token: z.string().min(32),
  tokenType: z.enum(['primary', 'backup', 'emergency', 'temporary']),
  isActive: z.boolean().default(true),
  usageCount: z.number().default(0),
  maxUsages: z.number().optional(), // null = unlimited
  expiresAt: z.date().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date().default(() => new Date()),
  lastUsedAt: z.date().optional(),
  lastUsedBy: z.string().uuid().optional(),
  restrictions: z.object({
    ipWhitelist: z.array(z.string()).default([]),
    timeRestrictions: z.object({
      allowedHours: z.array(z.number()).optional(), // 0-23
      allowedDays: z.array(z.number()).optional(), // 0-6 (Sunday-Saturday)
      timezone: z.string().default('UTC'),
    }).optional(),
    locationRestrictions: z.object({
      allowedCountries: z.array(z.string()).default([]),
      allowedCities: z.array(z.string()).default([]),
    }).optional(),
  }).default({}),
});

export type Vault = z.infer<typeof VaultSchema>;
export type VaultAccessLog = z.infer<typeof VaultAccessLogSchema>;
export type VaultInheritance = z.infer<typeof VaultInheritanceSchema>;
export type VaultMemory = z.infer<typeof VaultMemorySchema>;
export type VaultToken = z.infer<typeof VaultTokenSchema>;