import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  category: z.enum([
    'general',
    'billing',
    'technical',
    'feature_request',
    'bug_report',
    'account',
    'privacy',
    'other'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  metadata: z.record(z.any()).optional()
});

const AddMessageSchema = z.object({
  message: z.string().min(1).max(5000)
});

const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'escalated']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional()
});

// ============================================================================
// TICKET ROUTES
// ============================================================================

// Create a new support ticket
router.post('/tickets', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = CreateTicketSchema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        category: data.category,
        priority: data.priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        status: 'OPEN',
        metadata: data.metadata || {},
        messages: {
          create: {
            role: 'USER',
            content: data.message,
            userId
          }
        }
      },
      include: {
        messages: true
      }
    });

    // Send notification to support team
    await notifySupportTeam(ticket);

    // Auto-reply with acknowledgment
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        role: 'SYSTEM',
        content: `Thank you for contacting Heirloom Support. Your ticket #${ticket.id.slice(0, 8)} has been received.

**What to expect:**
• We typically respond within 2-4 hours during business hours
• Urgent issues are prioritized
• You'll receive email updates on this ticket

While you wait, you might find answers in our Help Center at help.heirloom.blue`
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get user's tickets
router.get('/tickets', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, limit = '20', offset = '0' } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/tickets/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Add message to ticket
router.post('/tickets/:id/messages', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = AddMessageSchema.parse(req.body);

    // Verify ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Add message
    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        role: 'USER',
        content: data.message,
        userId
      }
    });

    // Update ticket status and timestamp
    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'OPEN',
        updatedAt: new Date()
      }
    });

    // Notify support team
    await notifySupportTeam(ticket, message);

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Close ticket
router.post('/tickets/:id/close', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    // Add system message
    await prisma.supportMessage.create({
      data: {
        ticketId: id,
        role: 'SYSTEM',
        content: 'This ticket has been closed by the user. Thank you for contacting Heirloom Support!'
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// ============================================================================
// ADMIN ROUTES (for support team)
// ============================================================================

// Get all tickets (admin)
router.get('/admin/tickets', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, priority, assignedTo, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Update ticket (admin)
router.patch('/admin/tickets/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const data = UpdateTicketSchema.parse(req.body);

    const updateData: any = { updatedAt: new Date() };
    if (data.status) updateData.status = data.status.toUpperCase();
    if (data.priority) updateData.priority = data.priority.toUpperCase();
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData
    });

    res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Reply to ticket (admin)
router.post('/admin/tickets/:id/reply', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { message, internal = false } = req.body;

    if (!message || message.length < 1) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        role: internal ? 'INTERNAL' : 'ASSISTANT',
        content: message,
        userId: user.id
      }
    });

    // Update ticket
    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'PENDING',
        updatedAt: new Date(),
        assignedTo: user.id
      }
    });

    // Notify user (unless internal note)
    if (!internal) {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: { user: true }
      });
      if (ticket) {
        await notifyUser(ticket.user, ticket, reply);
      }
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

// ============================================================================
// BOT CONVERSATION LOGGING
// ============================================================================

// Log bot conversation
router.post('/bot/log', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { query, response, intent, helpful, articleIds } = req.body;

    await prisma.botConversation.create({
      data: {
        userId,
        query,
        response,
        intent,
        helpful,
        articleIds: articleIds || []
      }
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error logging bot conversation:', error);
    res.status(500).json({ error: 'Failed to log conversation' });
  }
});

// Get bot analytics (admin)
router.get('/admin/bot/analytics', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { days = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    // Total conversations
    const totalConversations = await prisma.botConversation.count({
      where: { createdAt: { gte: since } }
    });

    // Helpful rate
    const helpfulCount = await prisma.botConversation.count({
      where: { createdAt: { gte: since }, helpful: true }
    });
    const notHelpfulCount = await prisma.botConversation.count({
      where: { createdAt: { gte: since }, helpful: false }
    });

    // Top intents
    const intents = await prisma.botConversation.groupBy({
      by: ['intent'],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { intent: 'desc' } },
      take: 10
    });

    // Escalation rate
    const escalated = await prisma.botConversation.count({
      where: { createdAt: { gte: since }, intent: 'escalate' }
    });

    res.json({
      totalConversations,
      helpfulRate: totalConversations > 0 ? helpfulCount / (helpfulCount + notHelpfulCount) : 0,
      escalationRate: totalConversations > 0 ? escalated / totalConversations : 0,
      topIntents: intents,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching bot analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function notifySupportTeam(ticket: any, message?: any) {
  // In production, integrate with:
  // - Slack webhook
  // - Email to support@heirloom.blue
  // - Support dashboard notifications
  console.log(`[Support] New ticket/message: ${ticket.id}`);
  
  // Example Slack notification
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `New support ticket: ${ticket.subject}`,
  //     attachments: [{ text: message?.content || ticket.messages?.[0]?.content }]
  //   })
  // });
}

async function notifyUser(user: any, ticket: any, message: any) {
  // Send email notification to user
  console.log(`[Support] Notifying user ${user.email} of reply on ticket ${ticket.id}`);
  
  // Example email
  // await sendEmail({
  //   to: user.email,
  //   subject: `Re: ${ticket.subject} - Heirloom Support`,
  //   template: 'support-reply',
  //   data: { ticket, message }
  // });
}

// ============================================================================
// CANNED RESPONSES (for support team)
// ============================================================================

export const CANNED_RESPONSES = {
  greeting: `Hi there! 👋

Thank you for reaching out to Heirloom Support. I'm here to help!`,

  moreInfo: `To help you better, could you please provide:
- What device/browser are you using?
- When did this issue start?
- Any error messages you're seeing?`,

  resolved: `I'm glad we could help resolve this! 

If you have any other questions, don't hesitate to reach out. We're always here for you.

Thank you for being part of the Heirloom family! 💜`,

  escalate: `I understand this is important. I'm escalating your case to our senior support team who will follow up within 24 hours.

In the meantime, is there anything else I can help clarify?`,

  billing: `I can help with billing questions!

For account security, please note:
- We never ask for full credit card numbers via support
- All billing changes require email verification
- You can manage your subscription at Settings → Billing`,

  refund: `I understand you'd like a refund. Our policy:

- Full refund within 14 days of purchase
- Prorated refund for annual plans
- Refunds process within 5-10 business days

I'll process this for you now. You'll receive a confirmation email shortly.`,

  bug: `Thank you for reporting this! I've logged the bug with our engineering team.

Bug ID: #[AUTO_GENERATED]
Priority: [Based on impact]

We'll update you when this is fixed. Thank you for helping us improve Heirloom!`
};

export default router;
