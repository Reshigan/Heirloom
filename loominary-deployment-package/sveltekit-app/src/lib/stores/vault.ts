import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Private Vault System - Core Concept:
// Each family has a private vault that is completely isolated
// Content is only accessible via inheritance tokens
// Tokens can be shared selectively on death or by choice
// Recipients can choose what to accept from shared tokens

export interface PrivateVault {
  id: string;
  familyId: string;
  ownerId: string;
  vaultName: string;
  description: string;
  isSealed: boolean; // Sealed vaults can only be opened by inheritance tokens
  privacyLevel: 'PRIVATE' | 'FAMILY_ONLY' | 'SELECTIVE_SHARE';
  createdAt: Date;
  lastAccessed: Date;
  totalMemories: number;
  totalSize: number;
  encryptionKey?: string;
}

export interface InheritanceToken {
  id: string;
  vaultId: string;
  tokenCode: string; // Unique access code
  grantor: string; // Who granted access
  grantee?: string; // Who can use this token (optional - can be open)
  permissions: InheritancePermission[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  usedAt?: Date;
  conditions: TokenCondition[];
}

export interface InheritancePermission {
  contentType: 'memories' | 'photos' | 'audio' | 'documents' | 'stories' | 'time_capsules';
  categories: string[]; // Specific categories they can access
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  accessLevel: 'VIEW_ONLY' | 'COPY' | 'FULL_ACCESS';
  personalNotes?: string; // Private notes from grantor
}

export interface TokenCondition {
  type: 'DEATH_CERTIFICATE' | 'TIME_DELAY' | 'MANUAL_APPROVAL' | 'FAMILY_CONSENSUS';
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  details: any;
  fulfilledAt?: Date;
}

export interface VaultContent {
  id: string;
  vaultId: string;
  type: 'memory' | 'photo' | 'audio' | 'document' | 'story' | 'time_capsule';
  title: string;
  content: string;
  metadata: any;
  privacyLevel: 'PERSONAL' | 'FAMILY' | 'INHERITABLE' | 'PUBLIC_ON_DEATH';
  categories: string[];
  createdAt: Date;
  lastModified: Date;
  isEncrypted: boolean;
  inheritanceInstructions?: string;
}

export interface LegacyPlan {
  id: string;
  vaultId: string;
  planName: string;
  description: string;
  beneficiaries: LegacyBeneficiary[];
  contentDistribution: ContentDistribution[];
  conditions: LegacyCondition[];
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface LegacyBeneficiary {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  address?: string;
  priority: number; // 1 = highest priority
  isVerified: boolean;
}

export interface ContentDistribution {
  beneficiaryId: string;
  contentIds: string[];
  categories: string[];
  accessLevel: 'VIEW_ONLY' | 'COPY' | 'FULL_ACCESS';
  personalMessage?: string;
  delayDays?: number; // Days to wait before granting access
}

export interface LegacyCondition {
  type: 'DEATH_VERIFICATION' | 'TIME_BASED' | 'MANUAL_TRIGGER' | 'FAMILY_VOTE';
  description: string;
  isRequired: boolean;
  status: 'PENDING' | 'FULFILLED' | 'FAILED';
}

// Stores
export const vaultStore = writable<PrivateVault | null>(null);
export const inheritanceTokensStore = writable<InheritanceToken[]>([]);
export const vaultContentStore = writable<VaultContent[]>([]);
export const legacyPlanStore = writable<LegacyPlan | null>(null);
export const receivedTokensStore = writable<InheritanceToken[]>([]);

// Derived stores
export const vaultStats = derived(vaultStore, ($vault) => {
  if (!$vault) return null;
  
  return {
    totalMemories: $vault.totalMemories,
    totalSize: $vault.totalSize,
    isSealed: $vault.isSealed,
    privacyLevel: $vault.privacyLevel,
    daysSinceCreation: Math.floor((Date.now() - new Date($vault.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  };
});

export const activeTokens = derived(inheritanceTokensStore, ($tokens) => {
  return $tokens.filter(token => token.isActive && (!token.expiresAt || new Date(token.expiresAt) > new Date()));
});

export const pendingTokens = derived(receivedTokensStore, ($tokens) => {
  return $tokens.filter(token => 
    token.conditions.some(condition => condition.status === 'PENDING')
  );
});

// Vault actions
export const vaultActions = {
  // Initialize user's private vault
  async initializeVault(userId: string, familyId: string) {
    try {
      const response = await fetch('/api/vault/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, familyId })
      });

      if (response.ok) {
        const vault = await response.json();
        vaultStore.set(vault);
        return vault;
      }
    } catch (error) {
      console.error('Failed to initialize vault:', error);
    }
  },

  // Load vault data
  async loadVault(vaultId: string) {
    try {
      const response = await fetch(`/api/vault/${vaultId}`);
      if (response.ok) {
        const vault = await response.json();
        vaultStore.set(vault);
        
        // Load vault content
        const contentResponse = await fetch(`/api/vault/${vaultId}/content`);
        if (contentResponse.ok) {
          const content = await contentResponse.json();
          vaultContentStore.set(content);
        }
        
        return vault;
      }
    } catch (error) {
      console.error('Failed to load vault:', error);
    }
  },

  // Add content to vault
  async addContent(content: Omit<VaultContent, 'id' | 'createdAt' | 'lastModified'>) {
    try {
      const response = await fetch('/api/vault/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      if (response.ok) {
        const newContent = await response.json();
        vaultContentStore.update(contents => [...contents, newContent]);
        
        // Update vault stats
        vaultStore.update(vault => {
          if (!vault) return vault;
          return {
            ...vault,
            totalMemories: vault.totalMemories + 1,
            lastAccessed: new Date()
          };
        });
        
        return newContent;
      }
    } catch (error) {
      console.error('Failed to add content:', error);
    }
  },

  // Create inheritance token
  async createInheritanceToken(tokenData: Omit<InheritanceToken, 'id' | 'tokenCode' | 'createdAt'>) {
    try {
      const response = await fetch('/api/vault/inheritance-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData)
      });

      if (response.ok) {
        const token = await response.json();
        inheritanceTokensStore.update(tokens => [...tokens, token]);
        return token;
      }
    } catch (error) {
      console.error('Failed to create inheritance token:', error);
    }
  },

  // Use inheritance token to access vault
  async useInheritanceToken(tokenCode: string) {
    try {
      const response = await fetch('/api/vault/use-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenCode })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add accessible content to a separate store for inherited content
        if (result.accessibleContent) {
          // This would be handled differently - inherited content is separate from personal vault
          return result;
        }
      }
    } catch (error) {
      console.error('Failed to use inheritance token:', error);
    }
  },

  // Create legacy plan
  async createLegacyPlan(planData: Omit<LegacyPlan, 'id' | 'createdAt' | 'lastUpdated'>) {
    try {
      const response = await fetch('/api/vault/legacy-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const plan = await response.json();
        legacyPlanStore.set(plan);
        return plan;
      }
    } catch (error) {
      console.error('Failed to create legacy plan:', error);
    }
  },

  // Seal vault (makes it inheritance-only)
  async sealVault(vaultId: string, conditions: LegacyCondition[]) {
    try {
      const response = await fetch(`/api/vault/${vaultId}/seal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions })
      });

      if (response.ok) {
        vaultStore.update(vault => {
          if (!vault) return vault;
          return { ...vault, isSealed: true };
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to seal vault:', error);
    }
  },

  // Update content privacy level
  async updateContentPrivacy(contentId: string, privacyLevel: VaultContent['privacyLevel']) {
    try {
      const response = await fetch(`/api/vault/content/${contentId}/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyLevel })
      });

      if (response.ok) {
        vaultContentStore.update(contents => 
          contents.map(content => 
            content.id === contentId 
              ? { ...content, privacyLevel, lastModified: new Date() }
              : content
          )
        );
        return true;
      }
    } catch (error) {
      console.error('Failed to update content privacy:', error);
    }
  },

  // Load received inheritance tokens
  async loadReceivedTokens() {
    try {
      const response = await fetch('/api/vault/received-tokens');
      if (response.ok) {
        const tokens = await response.json();
        receivedTokensStore.set(tokens);
        return tokens;
      }
    } catch (error) {
      console.error('Failed to load received tokens:', error);
    }
  },

  // Accept or reject inherited content
  async respondToInheritance(tokenId: string, contentIds: string[], action: 'ACCEPT' | 'REJECT') {
    try {
      const response = await fetch(`/api/vault/inheritance/${tokenId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds, action })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (action === 'ACCEPT') {
          // Add accepted content to user's inherited content collection
          // This is separate from their personal vault
        }
        
        return result;
      }
    } catch (error) {
      console.error('Failed to respond to inheritance:', error);
    }
  }
};

// Privacy levels and their meanings
export const PRIVACY_LEVELS = {
  PERSONAL: {
    label: 'Personal Only',
    description: 'Only you can see this content. Never shared.',
    icon: '🔒',
    color: '#DC2626'
  },
  FAMILY: {
    label: 'Family Vault',
    description: 'Accessible to family members you explicitly grant access to.',
    icon: '👨‍👩‍👧‍👦',
    color: '#D97706'
  },
  INHERITABLE: {
    label: 'Inheritable',
    description: 'Can be shared via inheritance tokens you create.',
    icon: '🎁',
    color: '#D4AF37'
  },
  PUBLIC_ON_DEATH: {
    label: 'Legacy Public',
    description: 'Becomes publicly accessible after death verification.',
    icon: '🌟',
    color: '#10B981'
  }
};

// Content categories for organization
export const CONTENT_CATEGORIES = [
  { id: 'childhood', label: 'Childhood Memories', icon: '👶' },
  { id: 'family_traditions', label: 'Family Traditions', icon: '🎭' },
  { id: 'wisdom', label: 'Life Wisdom', icon: '🧠' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'relationships', label: 'Relationships', icon: '❤️' },
  { id: 'travels', label: 'Travel Memories', icon: '✈️' },
  { id: 'recipes', label: 'Family Recipes', icon: '👨‍🍳' },
  { id: 'photos', label: 'Photo Albums', icon: '📸' },
  { id: 'documents', label: 'Important Documents', icon: '📄' },
  { id: 'letters', label: 'Letters & Messages', icon: '💌' },
  { id: 'audio', label: 'Voice Recordings', icon: '🎵' },
  { id: 'stories', label: 'Family Stories', icon: '📚' },
  { id: 'genealogy', label: 'Family Tree', icon: '🌳' },
  { id: 'values', label: 'Family Values', icon: '⚖️' },
  { id: 'dreams', label: 'Hopes & Dreams', icon: '🌟' }
];

// Engagement system redesigned for private vault building
export const VAULT_ACHIEVEMENTS = {
  FIRST_MEMORY: {
    id: 'first_memory',
    title: 'Memory Keeper',
    description: 'Added your first memory to your private vault',
    xp: 100,
    icon: '📝'
  },
  VAULT_ORGANIZER: {
    id: 'vault_organizer',
    title: 'Vault Organizer',
    description: 'Organized memories into 5 different categories',
    xp: 200,
    icon: '📁'
  },
  LEGACY_PLANNER: {
    id: 'legacy_planner',
    title: 'Legacy Planner',
    description: 'Created your first inheritance plan',
    xp: 500,
    icon: '📋'
  },
  VAULT_GUARDIAN: {
    id: 'vault_guardian',
    title: 'Vault Guardian',
    description: 'Added 50 memories to your vault',
    xp: 1000,
    icon: '🛡️'
  },
  TIME_CAPSULE_CREATOR: {
    id: 'time_capsule_creator',
    title: 'Time Capsule Creator',
    description: 'Created your first time capsule for the future',
    xp: 300,
    icon: '⏰'
  },
  WISDOM_KEEPER: {
    id: 'wisdom_keeper',
    title: 'Wisdom Keeper',
    description: 'Recorded 10 pieces of life wisdom',
    xp: 750,
    icon: '🧠'
  }
};

// Auto-save vault data
if (browser) {
  vaultStore.subscribe(value => {
    if (value) {
      localStorage.setItem('loominary_vault', JSON.stringify(value));
    }
  });
}