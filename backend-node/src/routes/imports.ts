import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * POST /api/imports/start
 * Start a new import job
 */
router.post('/start', async (req: AuthRequest, res, next) => {
  try {
    const { source, settings } = req.body;

    if (!source) {
      throw new AppError(400, 'Import source is required');
    }

    const importJob = await prisma.importJob.create({
      data: {
        userId: req.user!.userId,
        source,
        settings: settings || {},
        status: 'pending'
      }
    });

    res.status(201).json({
      import_id: importJob.id,
      status: importJob.status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/imports/:importId/status
 * Get the status of an import job
 */
router.get('/:importId/status', async (req: AuthRequest, res, next) => {
  try {
    const { importId } = req.params;

    const importJob = await prisma.importJob.findUnique({
      where: { id: importId }
    });

    if (!importJob) {
      throw new AppError(404, 'Import job not found');
    }

    if (importJob.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to view this import job');
    }

    res.json({
      import_id: importJob.id,
      total: importJob.total,
      processed: importJob.processed,
      duplicates: importJob.duplicates,
      imported: importJob.imported,
      status: importJob.status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/imports/:importId/files
 * Upload files for an import job
 */
router.post('/:importId/files', async (req: AuthRequest, res, next) => {
  try {
    const { importId } = req.params;

    const importJob = await prisma.importJob.findUnique({
      where: { id: importId }
    });

    if (!importJob) {
      throw new AppError(404, 'Import job not found');
    }

    if (importJob.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to upload files for this import job');
    }

    await prisma.importJob.update({
      where: { id: importId },
      data: { status: 'processing' }
    });

    res.json({ message: 'Files uploaded successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
