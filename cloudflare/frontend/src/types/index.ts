/**
 * Canonical domain types for Heirloom.
 *
 * Import from here — do not define these inline in page files.
 * All fields from real API responses are represented; page-local
 * shape differences are handled by making everything optional.
 */

export interface FamilyMember {
  id: string;
  name: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  role?: string | null;
  lastEntry?: string | null;
  dye?: string | null;
  deletedAt?: string | null;
  pendingDeletion?: boolean;
  status?: string | null;
}

export interface Memory {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  emotion?: string | null;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  duration?: number | null;
  metadata?: {
    to?: string;
    recipientName?: string;
    entryDate?: string;
    dye?: string;
    images?: Array<{ fileUrl?: string }>;
    [key: string]: unknown;
  } | null;
  /** camelCase from newer API responses */
  createdAt?: string | null;
  /** snake_case from older/raw DB responses */
  created_at?: string | null;
}

export interface Letter {
  id: string;
  title?: string | null;
  salutation?: string | null;
  /** Full body (reading view) */
  body?: string | null;
  /** Truncated preview (list view) */
  bodyPreview?: string | null;
  signature?: string | null;
  deliveryTrigger?: string | null;
  scheduledDate?: string | null;
  sealedAt?: string | null;
  milestoneLabel?: string | null;
  deliveredAt?: string | null;
  emotion?: string | null;
  recipients?: Array<{ id: string; name: string; relationship: string }>;
  legacyRecipients?: Array<{ id: string; name: string; email?: string }>;
  createdAt?: string | null;
  /** snake_case from older/raw DB responses */
  created_at?: string | null;
  metadata?: { dye?: string; [key: string]: unknown } | null;
}

export interface VoiceRecording {
  id: string;
  title?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  duration?: number | null;
  emotion?: string | null;
  transcript?: string | null;
  createdAt?: string | null;
  /** snake_case from older/raw DB responses */
  created_at?: string | null;
  metadata?: { dye?: string; [key: string]: unknown } | null;
}
