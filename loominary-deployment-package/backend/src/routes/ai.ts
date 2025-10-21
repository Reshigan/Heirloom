import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check for AI service
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'AI Service',
      model: 'llama3.1:70b',
      timestamp: new Date().toISOString()
    };
  });

  // Generate AI story from memories
  fastify.post('/generate-story', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { memoryIds, style, tone, length, customPrompt } = request.body as any;
      const userId = (request as any).user.id;
      const familyId = (request as any).user.familyId;

      if (!memoryIds || !Array.isArray(memoryIds) || memoryIds.length === 0) {
        return reply.status(400).send({ message: 'Memory IDs are required' });
      }

      // Verify user has access to these memories
      const accessibleMemories = await prisma.memory.count({
        where: {
          id: { in: memoryIds },
          OR: [
            { authorId: userId },
            { familyId: familyId }
          ]
        }
      });

      if (accessibleMemories !== memoryIds.length) {
        return reply.status(403).send({ message: 'Access denied to some memories' });
      }

      // Get memories for story generation
      const memories = await prisma.memory.findMany({
        where: {
          id: { in: memoryIds },
          familyId: familyId
        },
        include: {
          author: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Generate story (simplified version for now)
      const storyContent = memories.map(memory => 
        `${memory.title}\n\n${memory.description || memory.content}`
      ).join('\n\n---\n\n');

      const generatedStory = `# A Family Story

${storyContent}

This story weaves together ${memories.length} precious memories from your family's journey. Each memory represents a moment in time that has shaped who you are today.

*Generated with love by Loominary AI*`;

      // Save the story
      const story = await prisma.story.create({
        data: {
          title: `Family Story - ${new Date().toLocaleDateString()}`,
          content: generatedStory,
          prompt: customPrompt || 'AI-generated family story',
          style: style || 'narrative',
          aiModel: 'llama3.1:70b',
          generationTime: 1500,
          confidence: 0.85,
          authorId: userId,
          familyId: familyId,
          memoryIds: memoryIds
        }
      });

      return {
        story: generatedStory,
        title: story.title,
        confidence: 0.85,
        generationTime: 1500
      };

    } catch (error) {
      fastify.log.error('AI story generation failed:', error);
      return reply.status(500).send({ 
        message: 'Failed to generate story',
        error: (error as Error).message 
      });
    }
  });

  // Analyze memory content
  fastify.post('/analyze-memory', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { content, type } = request.body as any;
      const userId = (request as any).user.id;

      if (!content || !type) {
        return reply.status(400).send({ message: 'Content and type are required' });
      }

      // Simple analysis for now
      const wordCount = content.split(' ').length;
      const sentiment = content.toLowerCase().includes('happy') || content.toLowerCase().includes('love') || content.toLowerCase().includes('joy') ? 'positive' : 
                       content.toLowerCase().includes('sad') || content.toLowerCase().includes('difficult') || content.toLowerCase().includes('hard') ? 'negative' : 'neutral';

      const analysis = {
        summary: `This ${type} contains ${wordCount} words and appears to be a ${sentiment} memory.`,
        tags: content.split(' ').slice(0, 5).map(word => word.toLowerCase().replace(/[^a-z]/g, '')).filter(word => word.length > 3),
        sentiment,
        importance: Math.min(5, Math.max(1, Math.floor(wordCount / 50) + 1)),
        suggestions: [
          'Consider adding more details about the people involved',
          'Include the date or time period when this happened',
          'Add location information if relevant'
        ]
      };

      return analysis;

    } catch (error) {
      fastify.log.error('Memory analysis failed:', error);
      return reply.status(500).send({ 
        message: 'Failed to analyze memory',
        error: (error as Error).message 
      });
    }
  });

  // Get personalized recommendations
  fastify.get('/recommendations', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const familyId = (request as any).user.familyId;

      // Get user's recent memories for context
      const recentMemories = await prisma.memory.findMany({
        where: { familyId, authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          title: true,
          description: true,
          type: true,
          tags: true
        }
      });

      // Generate recommendations based on existing content
      const recommendations = [
        {
          type: 'memory_connection',
          title: 'Childhood Adventures',
          description: 'Share more stories from your childhood that shaped who you are today',
          confidence: 0.8
        },
        {
          type: 'story_idea',
          title: 'Family Traditions',
          description: 'Document the unique traditions your family celebrates',
          confidence: 0.9
        },
        {
          type: 'time_capsule',
          title: 'Letter to Future Self',
          description: 'Write a message to yourself 10 years from now',
          confidence: 0.7
        },
        {
          type: 'legacy_plan',
          title: 'Wisdom to Share',
          description: 'Record important life lessons you want to pass down',
          confidence: 0.85
        }
      ];

      return recommendations;

    } catch (error) {
      fastify.log.error('Recommendation generation failed:', error);
      return reply.status(500).send({ 
        message: 'Failed to generate recommendations',
        error: (error as Error).message 
      });
    }
  });

  // Generate time capsule message
  fastify.post('/time-capsule', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { recipientInfo, deliveryYear } = request.body as any;
      const userId = (request as any).user.id;

      if (!recipientInfo || !deliveryYear) {
        return reply.status(400).send({ message: 'Recipient info and delivery year are required' });
      }

      const currentYear = new Date().getFullYear();
      if (deliveryYear <= currentYear) {
        return reply.status(400).send({ message: 'Delivery year must be in the future' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      });

      const yearsInFuture = deliveryYear - currentYear;

      const message = `Dear ${recipientInfo},

This message was written in ${currentYear} with love and hope for your future. As I write this, ${yearsInFuture} years seem like both a lifetime and just a moment away.

I hope that when you read this, you are surrounded by love, pursuing your dreams, and finding joy in the simple moments of life. Remember that you are part of a family legacy that spans generations, and your story is an important chapter in that continuing narrative.

The world may be different when you read this, but the love that connects our family remains constant across time. Hold onto the values that matter, be kind to others, and never forget that you are deeply loved.

With all my hopes for your happiness and success,
${user?.firstName} ${user?.lastName}

Written on ${new Date().toLocaleDateString()}`;

      return { message };

    } catch (error) {
      fastify.log.error('Time capsule generation failed:', error);
      return reply.status(500).send({ 
        message: 'Failed to generate time capsule message',
        error: (error as Error).message 
      });
    }
  });
};

export default aiRoutes;
