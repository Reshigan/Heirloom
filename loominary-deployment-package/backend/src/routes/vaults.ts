import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { vaultService } from '../services/vaultService';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Request schemas
const CreateVaultSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  unlockDate: z.string().datetime().optional(),
  unlockConditions: z.object({
    requiresMultipleTokens: z.boolean().optional(),
    minimumTokensRequired: z.number().min(1).optional(),
    allowedUnlockers: z.array(z.string()).optional(),
    timeDelayHours: z.number().min(0).optional(),
  }).optional(),
  inheritanceSettings: z.object({
    automaticInheritance: z.boolean().optional(),
    inheritanceDelay: z.number().min(0).optional(),
    notificationEmails: z.array(z.string().email()).optional(),
    inheritanceMessage: z.string().optional(),
  }).optional(),
  privacySettings: z.object({
    allowSearch: z.boolean().optional(),
    allowAIAnalysis: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
    allowSharing: z.boolean().optional(),
  }).optional(),
});

const UnlockVaultSchema = z.object({
  token: z.string().min(32),
});

const AddMemoryToVaultSchema = z.object({
  memoryId: z.string().uuid(),
  emotionalContext: z.object({
    sentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']).optional(),
    emotions: z.array(z.string()).optional(),
    intensity: z.number().min(0).max(1).optional(),
    ageContext: z.object({
      subjectAge: z.number().optional(),
      ageRange: z.string().optional(),
      lifeStage: z.string().optional(),
    }).optional(),
  }).optional(),
});

const SearchVaultSchema = z.object({
  sentiment: z.string().optional(),
  emotions: z.array(z.string()).optional(),
  ageRange: z.string().optional(),
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  people: z.array(z.string()).optional(),
  naturalLanguageQuery: z.string().optional(),
});

const LinkFamilyMembersSchema = z.object({
  familyMembers: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['full_access', 'view_only', 'contributor']),
    accessLevel: z.object({
      canViewMemories: z.boolean().optional(),
      canAddMemories: z.boolean().optional(),
      canEditMemories: z.boolean().optional(),
      canDeleteMemories: z.boolean().optional(),
      canInviteOthers: z.boolean().optional(),
      canManageVault: z.boolean().optional(),
    }).optional(),
  })),
});

export async function vaultRoutes(fastify: FastifyInstance) {
  // Create a new private vault
  fastify.post('/vaults', {
    preHandler: [authMiddleware],
    schema: {
      body: CreateVaultSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            vault: { type: 'object' },
            accessToken: { type: 'string' },
            backupTokens: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const vaultData = CreateVaultSchema.parse(request.body);

      const result = await vaultService.createVault(userId, {
        ...vaultData,
        unlockDate: vaultData.unlockDate ? new Date(vaultData.unlockDate) : undefined,
      });

      logger.info(`Vault created: ${result.vault.id} by user: ${userId}`);

      reply.status(201).send({
        success: true,
        vault: result.vault,
        accessToken: result.accessToken,
        backupTokens: result.backupTokens,
        message: 'Private vault created successfully. Please save your access tokens securely.'
      });
    } catch (error: any) {
      logger.error('Vault creation failed:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create vault'
      });
    }
  });

  // Unlock vault with token
  fastify.post('/vaults/unlock', {
    schema: {
      body: UnlockVaultSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            vault: { type: 'object' },
            accessGranted: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = UnlockVaultSchema.parse(request.body);
      const userId = (request as any).user?.id;

      const result = await vaultService.unlockVault(token, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        userId,
        location: {
          // In production, you'd use a geolocation service
          country: request.headers['cf-ipcountry'] as string,
          city: request.headers['cf-ipcity'] as string,
        }
      });

      logger.info(`Vault unlocked: ${result.vault.id}`);

      reply.send({
        success: true,
        vault: result.vault,
        accessGranted: result.accessGranted,
        message: result.message
      });
    } catch (error: any) {
      logger.error('Vault unlock failed:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to unlock vault'
      });
    }
  });

  // Get user's vaults
  fastify.get('/vaults', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;

      const vaults = await vaultService.getUserVaults(userId);

      reply.send({
        success: true,
        vaults
      });
    } catch (error: any) {
      logger.error('Failed to get user vaults:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to retrieve vaults'
      });
    }
  });

  // Get vault details
  fastify.get('/vaults/:vaultId', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const userId = (request as any).user.id;

      const vault = await vaultService.getVaultDetails(vaultId, userId);

      reply.send({
        success: true,
        vault
      });
    } catch (error: any) {
      logger.error('Failed to get vault details:', error);
      reply.status(404).send({
        success: false,
        error: error.message || 'Vault not found'
      });
    }
  });

  // Add memory to vault
  fastify.post('/vaults/:vaultId/memories', {
    preHandler: [authMiddleware],
    schema: {
      body: AddMemoryToVaultSchema
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const userId = (request as any).user.id;
      const { memoryId, emotionalContext } = AddMemoryToVaultSchema.parse(request.body);

      const vaultMemory = await vaultService.addMemoryToVault(
        vaultId,
        memoryId,
        userId,
        emotionalContext
      );

      logger.info(`Memory ${memoryId} added to vault ${vaultId}`);

      reply.send({
        success: true,
        vaultMemory,
        message: 'Memory added to vault successfully'
      });
    } catch (error: any) {
      logger.error('Failed to add memory to vault:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to add memory to vault'
      });
    }
  });

  // Advanced sentiment-based search
  fastify.post('/vaults/:vaultId/search', {
    preHandler: [authMiddleware],
    schema: {
      body: SearchVaultSchema
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const searchQuery = SearchVaultSchema.parse(request.body);

      // Convert string dates to Date objects
      const processedQuery = {
        ...searchQuery,
        timeRange: searchQuery.timeRange ? {
          start: searchQuery.timeRange.start ? new Date(searchQuery.timeRange.start) : undefined,
          end: searchQuery.timeRange.end ? new Date(searchQuery.timeRange.end) : undefined,
        } : undefined,
      };

      const results = await vaultService.searchVaultBySentiment(vaultId, processedQuery);

      logger.info(`Sentiment search performed on vault ${vaultId}: ${results.results.length} results`);

      reply.send({
        success: true,
        ...results
      });
    } catch (error: any) {
      logger.error('Vault search failed:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Search failed'
      });
    }
  });

  // Link family members to inherited vault
  fastify.post('/vaults/:vaultId/link-family', {
    preHandler: [authMiddleware],
    schema: {
      body: LinkFamilyMembersSchema
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const { familyMembers } = LinkFamilyMembersSchema.parse(request.body);

      const result = await vaultService.linkFamilyMembersToVault(vaultId, familyMembers);

      logger.info(`Family members linked to vault ${vaultId}: ${result.linkedMembers} members`);

      reply.send({
        success: true,
        ...result,
        message: 'Family members linked to vault successfully'
      });
    } catch (error: any) {
      logger.error('Failed to link family members to vault:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to link family members'
      });
    }
  });

  // Trigger inheritance manually (admin/emergency use)
  fastify.post('/vaults/:vaultId/trigger-inheritance', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const userId = (request as any).user.id;

      // Check if user has permission to trigger inheritance
      // In production, this would check admin permissions or vault ownership
      
      const inheritance = await vaultService.triggerInheritance(vaultId, 'manual_trigger');

      logger.info(`Inheritance manually triggered for vault ${vaultId} by user ${userId}`);

      reply.send({
        success: true,
        inheritance,
        message: 'Inheritance process triggered successfully'
      });
    } catch (error: any) {
      logger.error('Failed to trigger inheritance:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to trigger inheritance'
      });
    }
  });

  // Get vault access logs (for vault owners/admins)
  fastify.get('/vaults/:vaultId/access-logs', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { vaultId } = request.params as { vaultId: string };
      const userId = (request as any).user.id;

      // Verify user has access to view logs
      const vault = await vaultService.getVaultDetails(vaultId, userId);
      
      if (!vault) {
        return reply.status(404).send({
          success: false,
          error: 'Vault not found'
        });
      }

      // In production, you'd fetch access logs from the database
      const accessLogs = vault.accessLogs || [];

      reply.send({
        success: true,
        accessLogs,
        totalCount: accessLogs.length
      });
    } catch (error: any) {
      logger.error('Failed to get vault access logs:', error);
      reply.status(400).send({
        success: false,
        error: error.message || 'Failed to retrieve access logs'
      });
    }
  });

  // Health check for vault service
  fastify.get('/vaults/health', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      success: true,
      service: 'vault-service',
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  });
}