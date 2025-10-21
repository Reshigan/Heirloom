import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { VaultSchema, VaultAccessLogSchema, VaultInheritanceSchema, VaultMemorySchema, VaultTokenSchema } from '../models/vault';
import { aiService } from './aiService';
import { notificationService } from './notificationService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class VaultService {
  // Generate secure vault access token
  private generateSecureToken(length: number = 64): string {
    return randomBytes(length).toString('hex');
  }

  // Hash token for secure storage
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Verify token timing-safe comparison
  private verifyToken(providedToken: string, storedHash: string): boolean {
    const providedHash = this.hashToken(providedToken);
    return timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
  }

  // Create a new private vault
  async createVault(ownerId: string, vaultData: {
    name: string;
    description?: string;
    unlockDate?: Date;
    unlockConditions?: any;
    inheritanceSettings?: any;
    privacySettings?: any;
  }) {
    try {
      const accessToken = this.generateSecureToken();
      const backupTokens = [
        this.generateSecureToken(),
        this.generateSecureToken(),
        this.generateSecureToken()
      ];

      const vault = await prisma.vault.create({
        data: {
          id: randomBytes(16).toString('hex'),
          ownerId,
          name: vaultData.name,
          description: vaultData.description,
          accessToken: this.hashToken(accessToken),
          backupTokens: backupTokens.map(token => this.hashToken(token)),
          unlockDate: vaultData.unlockDate,
          unlockConditions: vaultData.unlockConditions || {},
          inheritanceSettings: vaultData.inheritanceSettings || {},
          privacySettings: vaultData.privacySettings || {},
          status: 'locked',
        }
      });

      // Create primary token record
      await prisma.vaultToken.create({
        data: {
          id: randomBytes(16).toString('hex'),
          vaultId: vault.id,
          token: this.hashToken(accessToken),
          tokenType: 'primary',
          createdBy: ownerId,
        }
      });

      // Create backup token records
      for (const backupToken of backupTokens) {
        await prisma.vaultToken.create({
          data: {
            id: randomBytes(16).toString('hex'),
            vaultId: vault.id,
            token: this.hashToken(backupToken),
            tokenType: 'backup',
            createdBy: ownerId,
          }
        });
      }

      logger.info(`Vault created: ${vault.id} for owner: ${ownerId}`);

      return {
        vault,
        accessToken, // Return unhashed token for user to save
        backupTokens // Return unhashed backup tokens
      };
    } catch (error) {
      logger.error('Failed to create vault:', error);
      throw new Error('Failed to create vault');
    }
  }

  // Unlock vault with token
  async unlockVault(token: string, accessorInfo: {
    ipAddress: string;
    userAgent?: string;
    location?: any;
    userId?: string;
  }) {
    try {
      // Find vault by token
      const vaultTokens = await prisma.vaultToken.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          vault: true
        }
      });

      let matchedVault = null;
      let matchedToken = null;

      // Check all active tokens for a match
      for (const vaultToken of vaultTokens) {
        if (this.verifyToken(token, vaultToken.token)) {
          matchedVault = vaultToken.vault;
          matchedToken = vaultToken;
          break;
        }
      }

      // Log access attempt
      const accessLog = await prisma.vaultAccessLog.create({
        data: {
          id: randomBytes(16).toString('hex'),
          vaultId: matchedVault?.id || 'unknown',
          accessorId: accessorInfo.userId,
          accessToken: this.hashToken(token),
          accessType: 'token_unlock',
          ipAddress: accessorInfo.ipAddress,
          userAgent: accessorInfo.userAgent,
          location: accessorInfo.location,
          success: !!matchedVault,
          failureReason: matchedVault ? undefined : 'Invalid token',
        }
      });

      if (!matchedVault || !matchedToken) {
        logger.warn(`Failed vault unlock attempt from IP: ${accessorInfo.ipAddress}`);
        throw new Error('Invalid access token');
      }

      // Check token restrictions
      if (matchedToken.restrictions) {
        const restrictions = matchedToken.restrictions as any;
        
        // IP whitelist check
        if (restrictions.ipWhitelist?.length > 0) {
          if (!restrictions.ipWhitelist.includes(accessorInfo.ipAddress)) {
            throw new Error('Access denied: IP not whitelisted');
          }
        }

        // Time restrictions check
        if (restrictions.timeRestrictions) {
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay();

          if (restrictions.timeRestrictions.allowedHours?.length > 0) {
            if (!restrictions.timeRestrictions.allowedHours.includes(hour)) {
              throw new Error('Access denied: Outside allowed hours');
            }
          }

          if (restrictions.timeRestrictions.allowedDays?.length > 0) {
            if (!restrictions.timeRestrictions.allowedDays.includes(day)) {
              throw new Error('Access denied: Outside allowed days');
            }
          }
        }
      }

      // Check usage limits
      if (matchedToken.maxUsages && matchedToken.usageCount >= matchedToken.maxUsages) {
        throw new Error('Token usage limit exceeded');
      }

      // Update token usage
      await prisma.vaultToken.update({
        where: { id: matchedToken.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedBy: accessorInfo.userId,
        }
      });

      // Unlock vault if locked
      if (matchedVault.status === 'locked') {
        await prisma.vault.update({
          where: { id: matchedVault.id },
          data: {
            status: 'unlocked',
            unlockedAt: new Date(),
          }
        });

        // Trigger inheritance process if configured
        if (matchedVault.inheritanceSettings?.automaticInheritance) {
          await this.triggerInheritance(matchedVault.id, 'token_used');
        }

        // Send notifications
        if (matchedVault.inheritanceSettings?.notificationEmails?.length > 0) {
          await this.sendUnlockNotifications(matchedVault);
        }
      }

      logger.info(`Vault unlocked: ${matchedVault.id} by token`);

      return {
        vault: matchedVault,
        accessGranted: true,
        message: 'Vault successfully unlocked'
      };
    } catch (error) {
      logger.error('Failed to unlock vault:', error);
      throw error;
    }
  }

  // Add memory to vault
  async addMemoryToVault(vaultId: string, memoryId: string, addedBy: string, emotionalContext?: any) {
    try {
      // Verify vault exists and is accessible
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId }
      });

      if (!vault) {
        throw new Error('Vault not found');
      }

      if (vault.status === 'locked') {
        throw new Error('Cannot add memories to locked vault');
      }

      // Get memory details for AI analysis
      const memory = await prisma.memory.findUnique({
        where: { id: memoryId }
      });

      if (!memory) {
        throw new Error('Memory not found');
      }

      // Perform AI analysis for emotional context and search metadata
      const aiAnalysis = await aiService.analyzeMemoryForVault(memory);

      const vaultMemory = await prisma.vaultMemory.create({
        data: {
          id: randomBytes(16).toString('hex'),
          vaultId,
          memoryId,
          addedBy,
          emotionalContext: emotionalContext || aiAnalysis.emotionalContext,
          searchMetadata: aiAnalysis.searchMetadata,
        }
      });

      // Update vault metadata
      await prisma.vault.update({
        where: { id: vaultId },
        data: {
          metadata: {
            ...vault.metadata as any,
            totalMemories: (vault.metadata as any)?.totalMemories + 1 || 1,
            lastActivity: new Date(),
          }
        }
      });

      logger.info(`Memory ${memoryId} added to vault ${vaultId}`);

      return vaultMemory;
    } catch (error) {
      logger.error('Failed to add memory to vault:', error);
      throw error;
    }
  }

  // Advanced sentiment-based search
  async searchVaultBySentiment(vaultId: string, query: {
    sentiment?: string;
    emotions?: string[];
    ageRange?: string;
    timeRange?: { start?: Date; end?: Date };
    people?: string[];
    naturalLanguageQuery?: string;
  }) {
    try {
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId }
      });

      if (!vault || vault.status === 'locked') {
        throw new Error('Vault not accessible');
      }

      if (!vault.privacySettings?.allowSearch) {
        throw new Error('Search not allowed for this vault');
      }

      // Parse natural language query if provided
      let parsedQuery = query;
      if (query.naturalLanguageQuery) {
        parsedQuery = await aiService.parseNaturalLanguageQuery(query.naturalLanguageQuery);
      }

      // Build search filters
      const searchFilters: any = {
        vaultId,
        isVisible: true,
      };

      // Sentiment filter
      if (parsedQuery.sentiment) {
        searchFilters.emotionalContext = {
          path: ['sentiment'],
          equals: parsedQuery.sentiment
        };
      }

      // Emotions filter
      if (parsedQuery.emotions?.length > 0) {
        searchFilters.emotionalContext = {
          path: ['emotions'],
          array_contains: parsedQuery.emotions
        };
      }

      // Age range filter
      if (parsedQuery.ageRange) {
        searchFilters.emotionalContext = {
          path: ['ageContext', 'ageRange'],
          equals: parsedQuery.ageRange
        };
      }

      // Get vault memories with filters
      const vaultMemories = await prisma.vaultMemory.findMany({
        where: searchFilters,
        include: {
          memory: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            }
          }
        },
        orderBy: [
          { emotionalContext: { path: ['intensity'], sort: 'desc' } },
          { addedAt: 'desc' }
        ]
      });

      // Apply additional AI-powered filtering and ranking
      const rankedResults = await aiService.rankSearchResults(
        vaultMemories,
        query.naturalLanguageQuery || ''
      );

      logger.info(`Sentiment search performed on vault ${vaultId}: ${rankedResults.length} results`);

      return {
        results: rankedResults,
        totalCount: rankedResults.length,
        query: parsedQuery,
        searchMetadata: {
          searchedAt: new Date(),
          vaultId,
          queryType: 'sentiment_search'
        }
      };
    } catch (error) {
      logger.error('Failed to search vault by sentiment:', error);
      throw error;
    }
  }

  // Trigger inheritance process
  async triggerInheritance(vaultId: string, triggerEvent: string) {
    try {
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId }
      });

      if (!vault) {
        throw new Error('Vault not found');
      }

      const inheritanceSettings = vault.inheritanceSettings as any;
      if (!inheritanceSettings?.automaticInheritance) {
        return; // Inheritance not enabled
      }

      // Create inheritance record
      const inheritance = await prisma.vaultInheritance.create({
        data: {
          id: randomBytes(16).toString('hex'),
          vaultId,
          originalOwnerId: vault.ownerId,
          inheritanceType: 'automatic',
          triggerEvent: triggerEvent as any,
          triggerDate: new Date(),
          status: 'pending',
        }
      });

      // Schedule inheritance activation after delay
      const delayHours = inheritanceSettings.inheritanceDelay || 24;
      const activationDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);

      // In a real implementation, you'd use a job queue like Bull or Agenda
      setTimeout(async () => {
        await this.activateInheritance(inheritance.id);
      }, delayHours * 60 * 60 * 1000);

      logger.info(`Inheritance triggered for vault ${vaultId}, activation in ${delayHours} hours`);

      return inheritance;
    } catch (error) {
      logger.error('Failed to trigger inheritance:', error);
      throw error;
    }
  }

  // Activate inheritance
  async activateInheritance(inheritanceId: string) {
    try {
      const inheritance = await prisma.vaultInheritance.findUnique({
        where: { id: inheritanceId },
        include: { vault: true }
      });

      if (!inheritance || inheritance.status !== 'pending') {
        return;
      }

      // Update vault status
      await prisma.vault.update({
        where: { id: inheritance.vaultId },
        data: {
          status: 'inherited',
          inheritedAt: new Date(),
        }
      });

      // Update inheritance status
      await prisma.vaultInheritance.update({
        where: { id: inheritanceId },
        data: {
          status: 'active',
          completedAt: new Date(),
        }
      });

      // Send inheritance notifications
      await this.sendInheritanceNotifications(inheritance);

      logger.info(`Inheritance activated for vault ${inheritance.vaultId}`);
    } catch (error) {
      logger.error('Failed to activate inheritance:', error);
      throw error;
    }
  }

  // Link family members to inherited vault
  async linkFamilyMembersToVault(vaultId: string, familyMembers: Array<{
    userId: string;
    role: string;
    accessLevel: any;
  }>) {
    try {
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId }
      });

      if (!vault || vault.status !== 'inherited') {
        throw new Error('Vault not available for family linking');
      }

      // Create family member access records
      for (const member of familyMembers) {
        await prisma.vaultFamilyAccess.create({
          data: {
            id: randomBytes(16).toString('hex'),
            vaultId,
            userId: member.userId,
            role: member.role,
            accessLevel: member.accessLevel,
            grantedAt: new Date(),
          }
        });
      }

      logger.info(`Family members linked to vault ${vaultId}: ${familyMembers.length} members`);

      return { success: true, linkedMembers: familyMembers.length };
    } catch (error) {
      logger.error('Failed to link family members to vault:', error);
      throw error;
    }
  }

  // Send unlock notifications
  private async sendUnlockNotifications(vault: any) {
    try {
      const inheritanceSettings = vault.inheritanceSettings as any;
      const emails = inheritanceSettings?.notificationEmails || [];

      for (const email of emails) {
        await notificationService.sendEmail({
          to: email,
          subject: `${vault.name} - Vault Unlocked`,
          template: 'vault_unlocked',
          data: {
            vaultName: vault.name,
            unlockedAt: new Date(),
            message: inheritanceSettings?.inheritanceMessage || 'A private vault has been unlocked and is now accessible.',
          }
        });
      }
    } catch (error) {
      logger.error('Failed to send unlock notifications:', error);
    }
  }

  // Send inheritance notifications
  private async sendInheritanceNotifications(inheritance: any) {
    try {
      const vault = inheritance.vault;
      const inheritanceSettings = vault.inheritanceSettings as any;
      const emails = inheritanceSettings?.notificationEmails || [];

      for (const email of emails) {
        await notificationService.sendEmail({
          to: email,
          subject: `${vault.name} - Inheritance Activated`,
          template: 'vault_inherited',
          data: {
            vaultName: vault.name,
            inheritedAt: inheritance.completedAt,
            message: inheritanceSettings?.inheritanceMessage || 'A private vault has been inherited and is now available to family members.',
          }
        });
      }
    } catch (error) {
      logger.error('Failed to send inheritance notifications:', error);
    }
  }

  // Get vault details (for authorized users)
  async getVaultDetails(vaultId: string, userId?: string) {
    try {
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId },
        include: {
          memories: {
            include: {
              memory: {
                include: {
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    }
                  }
                }
              }
            }
          },
          accessLogs: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      if (!vault) {
        throw new Error('Vault not found');
      }

      // Check access permissions
      if (vault.status === 'locked' && vault.ownerId !== userId) {
        throw new Error('Vault is locked and not accessible');
      }

      return vault;
    } catch (error) {
      logger.error('Failed to get vault details:', error);
      throw error;
    }
  }

  // Get user's vaults
  async getUserVaults(userId: string) {
    try {
      const ownedVaults = await prisma.vault.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { memories: true }
          }
        }
      });

      const inheritedVaults = await prisma.vaultFamilyAccess.findMany({
        where: { userId },
        include: {
          vault: {
            include: {
              _count: {
                select: { memories: true }
              }
            }
          }
        }
      });

      return {
        owned: ownedVaults,
        inherited: inheritedVaults.map(access => ({
          ...access.vault,
          accessRole: access.role,
          accessLevel: access.accessLevel,
        }))
      };
    } catch (error) {
      logger.error('Failed to get user vaults:', error);
      throw error;
    }
  }
}

export const vaultService = new VaultService();