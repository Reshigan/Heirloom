import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const letters = await prisma.afterImGoneLetter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(letters);
  } catch (error: any) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const letter = await prisma.afterImGoneLetter.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    res.json(letter);
  } catch (error: any) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      recipientId,
      recipientEmail,
      recipientName,
      subject,
      encryptedContent,
      encryptedDek,
      attachedMemoryIds
    } = req.body;

    if (!recipientEmail || !subject || !encryptedContent || !encryptedDek) {
      return res.status(400).json({
        error: 'Recipient email, subject, encrypted content, and encryption key are required'
      });
    }

    if (recipientId) {
      const recipient = await prisma.recipient.findFirst({
        where: {
          id: recipientId,
          vault: { userId }
        }
      });

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
    }

    const letter = await prisma.afterImGoneLetter.create({
      data: {
        userId,
        recipientId,
        recipientEmail,
        recipientName,
        subject,
        encryptedContent,
        encryptedDek,
        attachedMemoryIds: attachedMemoryIds || [],
        deliveryStatus: 'pending'
      }
    });

    res.status(201).json(letter);
  } catch (error: any) {
    console.error('Error creating letter:', error);
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const {
      recipientId,
      recipientEmail,
      recipientName,
      subject,
      encryptedContent,
      encryptedDek,
      attachedMemoryIds
    } = req.body;

    const letter = await prisma.afterImGoneLetter.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    if (letter.deliveryStatus === 'delivered') {
      return res.status(403).json({ error: 'Cannot update a delivered letter' });
    }

    const updatedLetter = await prisma.afterImGoneLetter.update({
      where: { id },
      data: {
        ...(recipientId !== undefined && { recipientId }),
        ...(recipientEmail && { recipientEmail }),
        ...(recipientName !== undefined && { recipientName }),
        ...(subject && { subject }),
        ...(encryptedContent && { encryptedContent }),
        ...(encryptedDek && { encryptedDek }),
        ...(attachedMemoryIds && { attachedMemoryIds })
      }
    });

    res.json(updatedLetter);
  } catch (error: any) {
    console.error('Error updating letter:', error);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const letter = await prisma.afterImGoneLetter.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    if (letter.deliveryStatus === 'delivered') {
      return res.status(403).json({ error: 'Cannot delete a delivered letter' });
    }

    await prisma.afterImGoneLetter.delete({
      where: { id }
    });

    res.json({ message: 'Letter deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting letter:', error);
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

router.get('/:id/readiness', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const letter = await prisma.afterImGoneLetter.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    const recipient = letter.recipientId
      ? await prisma.recipient.findFirst({
          where: {
            id: letter.recipientId,
            vault: { userId }
          }
        })
      : null;

    const trustedContacts = await prisma.trustedContact.findMany({
      where: { userId }
    });

    const readiness = {
      hasRecipient: !!recipient,
      hasTrustedContacts: trustedContacts.length >= 2,
      hasContent: !!letter.encryptedContent,
      readinessPercentage: 0
    };

    let percentage = 0;
    if (readiness.hasRecipient) percentage += 40;
    if (readiness.hasTrustedContacts) percentage += 30;
    if (readiness.hasContent) percentage += 30;

    readiness.readinessPercentage = percentage;

    res.json(readiness);
  } catch (error: any) {
    console.error('Error checking letter readiness:', error);
    res.status(500).json({ error: 'Failed to check letter readiness' });
  }
});

export default router;
