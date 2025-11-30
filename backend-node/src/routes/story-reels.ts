import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../db';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const reels = await prisma.storyReel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reels);
  } catch (error: any) {
    console.error('Error fetching story reels:', error);
    res.status(500).json({ error: 'Failed to fetch story reels' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const reel = await prisma.storyReel.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reel) {
      return res.status(404).json({ error: 'Story reel not found' });
    }

    await prisma.storyReel.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(reel);
  } catch (error: any) {
    console.error('Error fetching story reel:', error);
    res.status(500).json({ error: 'Failed to fetch story reel' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, memoryIds, duration, musicTrack, style } = req.body;

    if (!title || !memoryIds || memoryIds.length === 0) {
      return res.status(400).json({ error: 'Title and at least one memory are required' });
    }

    const memories = await prisma.vaultItem.findMany({
      where: {
        id: { in: memoryIds },
        vault: { userId }
      }
    });

    if (memories.length !== memoryIds.length) {
      return res.status(403).json({ error: 'Some memories do not belong to you' });
    }

    const reel = await prisma.storyReel.create({
      data: {
        userId,
        title,
        description,
        memoryIds,
        duration: duration || 30,
        musicTrack,
        style: style || 'elegant',
        status: 'draft'
      }
    });

    res.status(201).json(reel);
  } catch (error: any) {
    console.error('Error creating story reel:', error);
    res.status(500).json({ error: 'Failed to create story reel' });
  }
});

router.post('/:id/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const reel = await prisma.storyReel.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reel) {
      return res.status(404).json({ error: 'Story reel not found' });
    }

    await prisma.storyReel.update({
      where: { id },
      data: { status: 'generating' }
    });


    setTimeout(async () => {
      try {
        await prisma.storyReel.update({
          where: { id },
          data: {
            status: 'ready',
            videoUrl: `https://storage.example.com/reels/${id}.mp4`,
            thumbnailUrl: `https://storage.example.com/reels/${id}-thumb.jpg`
          }
        });
      } catch (error) {
        console.error('Error updating reel after generation:', error);
      }
    }, 5000);

    res.json({ message: 'Video generation started', status: 'generating' });
  } catch (error: any) {
    console.error('Error generating story reel:', error);
    res.status(500).json({ error: 'Failed to generate story reel' });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { title, description, memoryIds, duration, musicTrack, style, isPublic } = req.body;

    const reel = await prisma.storyReel.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reel) {
      return res.status(404).json({ error: 'Story reel not found' });
    }

    const updatedReel = await prisma.storyReel.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(memoryIds && { memoryIds }),
        ...(duration && { duration }),
        ...(musicTrack !== undefined && { musicTrack }),
        ...(style && { style }),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    res.json(updatedReel);
  } catch (error: any) {
    console.error('Error updating story reel:', error);
    res.status(500).json({ error: 'Failed to update story reel' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const reel = await prisma.storyReel.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reel) {
      return res.status(404).json({ error: 'Story reel not found' });
    }

    await prisma.storyReel.delete({
      where: { id }
    });

    res.json({ message: 'Story reel deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting story reel:', error);
    res.status(500).json({ error: 'Failed to delete story reel' });
  }
});

export default router;
