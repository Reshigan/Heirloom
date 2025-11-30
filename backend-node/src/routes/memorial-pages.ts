import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../db';

const router = Router();

router.get('/mine', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const memorialPage = await prisma.memorialPage.findFirst({
      where: { userId },
      include: {
        contributions: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' }
        },
        tributes: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(memorialPage);
  } catch (error: any) {
    console.error('Error fetching memorial page:', error);
    res.status(500).json({ error: 'Failed to fetch memorial page' });
  }
});

router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const memorialPage = await prisma.memorialPage.findFirst({
      where: {
        slug,
        isPublic: true
      },
      include: {
        contributions: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' }
        },
        tributes: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!memorialPage) {
      return res.status(404).json({ error: 'Memorial page not found' });
    }

    await prisma.memorialPage.update({
      where: { id: memorialPage.id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(memorialPage);
  } catch (error: any) {
    console.error('Error fetching public memorial page:', error);
    res.status(500).json({ error: 'Failed to fetch memorial page' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      slug,
      displayName,
      birthDate,
      deathDate,
      biography,
      profileImageUrl,
      coverImageUrl,
      featuredMemoryIds,
      isPublic,
      allowContributions,
      requireApproval
    } = req.body;

    if (!slug || !displayName) {
      return res.status(400).json({ error: 'Slug and display name are required' });
    }

    const existing = await prisma.memorialPage.findFirst({
      where: { userId }
    });

    let memorialPage;

    if (existing) {
      memorialPage = await prisma.memorialPage.update({
        where: { id: existing.id },
        data: {
          slug,
          displayName,
          ...(birthDate && { birthDate: new Date(birthDate) }),
          ...(deathDate && { deathDate: new Date(deathDate) }),
          ...(biography !== undefined && { biography }),
          ...(profileImageUrl !== undefined && { profileImageUrl }),
          ...(coverImageUrl !== undefined && { coverImageUrl }),
          ...(featuredMemoryIds && { featuredMemoryIds }),
          ...(isPublic !== undefined && { isPublic }),
          ...(allowContributions !== undefined && { allowContributions }),
          ...(requireApproval !== undefined && { requireApproval })
        }
      });
    } else {
      memorialPage = await prisma.memorialPage.create({
        data: {
          userId,
          slug,
          displayName,
          ...(birthDate && { birthDate: new Date(birthDate) }),
          ...(deathDate && { deathDate: new Date(deathDate) }),
          biography,
          profileImageUrl,
          coverImageUrl,
          featuredMemoryIds: featuredMemoryIds || [],
          isPublic: isPublic || false,
          allowContributions: allowContributions !== undefined ? allowContributions : true,
          requireApproval: requireApproval !== undefined ? requireApproval : true
        }
      });
    }

    res.status(existing ? 200 : 201).json(memorialPage);
  } catch (error: any) {
    console.error('Error creating/updating memorial page:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug already taken' });
    }
    res.status(500).json({ error: 'Failed to create/update memorial page' });
  }
});

router.post('/:slug/contribute', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const {
      contributorEmail,
      contributorName,
      encryptedData,
      encryptedDek,
      thumbnailUrl,
      type
    } = req.body;

    if (!contributorEmail || !encryptedData || !encryptedDek) {
      return res.status(400).json({
        error: 'Contributor email, encrypted data, and encryption key are required'
      });
    }

    const memorialPage = await prisma.memorialPage.findFirst({
      where: {
        slug,
        isPublic: true,
        allowContributions: true
      }
    });

    if (!memorialPage) {
      return res.status(404).json({ error: 'Memorial page not found or contributions not allowed' });
    }

    const contribution = await prisma.memorialContribution.create({
      data: {
        memorialPageId: memorialPage.id,
        contributorEmail,
        contributorName,
        encryptedData,
        encryptedDek,
        thumbnailUrl,
        type: type || 'photo',
        status: memorialPage.requireApproval ? 'pending' : 'approved'
      }
    });

    await prisma.memorialPage.update({
      where: { id: memorialPage.id },
      data: { contributionCount: { increment: 1 } }
    });

    res.status(201).json(contribution);
  } catch (error: any) {
    console.error('Error submitting contribution:', error);
    res.status(500).json({ error: 'Failed to submit contribution' });
  }
});

router.post('/:slug/tribute', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { authorName, authorEmail, message, isPublic } = req.body;

    if (!authorName || !message) {
      return res.status(400).json({ error: 'Author name and message are required' });
    }

    const memorialPage = await prisma.memorialPage.findFirst({
      where: {
        slug,
        isPublic: true
      }
    });

    if (!memorialPage) {
      return res.status(404).json({ error: 'Memorial page not found' });
    }

    const tribute = await prisma.memorialTribute.create({
      data: {
        memorialPageId: memorialPage.id,
        authorName,
        authorEmail,
        message,
        isPublic: isPublic !== undefined ? isPublic : true
      }
    });

    res.status(201).json(tribute);
  } catch (error: any) {
    console.error('Error submitting tribute:', error);
    res.status(500).json({ error: 'Failed to submit tribute' });
  }
});

router.get('/contributions/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const memorialPage = await prisma.memorialPage.findFirst({
      where: { userId }
    });

    if (!memorialPage) {
      return res.json([]);
    }

    const contributions = await prisma.memorialContribution.findMany({
      where: {
        memorialPageId: memorialPage.id,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(contributions);
  } catch (error: any) {
    console.error('Error fetching pending contributions:', error);
    res.status(500).json({ error: 'Failed to fetch pending contributions' });
  }
});

router.put('/contributions/:id/review', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const contribution = await prisma.memorialContribution.findUnique({
      where: { id },
      include: { memorialPage: true }
    });

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    if (contribution.memorialPage.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to review this contribution' });
    }

    const updatedContribution = await prisma.memorialContribution.update({
      where: { id },
      data: {
        status,
        ...(status === 'approved' && { approvedAt: new Date() })
      }
    });

    res.json(updatedContribution);
  } catch (error: any) {
    console.error('Error reviewing contribution:', error);
    res.status(500).json({ error: 'Failed to review contribution' });
  }
});

export default router;
