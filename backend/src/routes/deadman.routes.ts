import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { deadManSwitchService } from '../services/deadman.service';
import { authService } from '../services/auth.service';

const router = Router();

/**
 * GET /api/deadman/status
 * Get dead man's switch status
 */
router.get('/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const status = await deadManSwitchService.getStatus(req.user!.id);
  res.json(status || { enabled: false });
}));

/**
 * POST /api/deadman/configure
 * Configure dead man's switch
 */
router.post('/configure', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { intervalDays, gracePeriodDays } = req.body;

  if (![7, 14, 30, 60, 90].includes(intervalDays)) {
    throw ApiError.badRequest('Invalid check-in interval');
  }

  await deadManSwitchService.configure(
    req.user!.id,
    intervalDays,
    gracePeriodDays || 7
  );

  const status = await deadManSwitchService.getStatus(req.user!.id);
  res.json(status);
}));

/**
 * POST /api/deadman/checkin
 * Check in to reset timer
 */
router.post('/checkin', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const result = await deadManSwitchService.checkIn(req.user!.id);
  res.json(result);
}));

/**
 * POST /api/deadman/cancel
 * Cancel a triggered switch (requires password)
 */
router.post('/cancel', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    throw ApiError.badRequest('Password required');
  }

  const success = await deadManSwitchService.cancelTrigger(req.user!.id, password);

  if (!success) {
    throw ApiError.badRequest('Invalid password or switch not in triggered state');
  }

  res.json({ message: 'Switch cancelled, status reset to active' });
}));

/**
 * POST /api/deadman/disable
 * Disable dead man's switch
 */
router.post('/disable', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await prisma.deadManSwitch.update({
    where: { userId: req.user!.id },
    data: { enabled: false },
  });

  res.json({ message: 'Dead man\'s switch disabled' });
}));

/**
 * POST /api/deadman/verify/:token
 * Legacy contact verifies user's passing (public route)
 */
router.post('/verify/:token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const result = await deadManSwitchService.verifyPassing(token);

  if (!result.success) {
    throw ApiError.badRequest(result.message);
  }

  res.json(result);
}));

/**
 * GET /api/deadman/history
 * Get check-in history
 */
router.get('/history', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const history = await prisma.checkInHistory.findMany({
    where: { userId: req.user!.id },
    orderBy: { checkedInAt: 'desc' },
    take: 50,
  });

  res.json(history);
}));

export default router;
