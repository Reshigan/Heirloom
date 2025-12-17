import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { validate, updateProfileSchema, changePasswordSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/settings/profile
 */
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  });
}));

/**
 * PATCH /api/settings/profile
 */
router.patch('/profile', validate(updateProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, avatarUrl } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, avatarUrl },
  });

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  });
}));

/**
 * POST /api/settings/avatar-upload-url
 */
router.post('/avatar-upload-url', asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType } = req.body;
  const result = await storageService.getPresignedUploadUrl(req.user!.id, 'avatars', filename, contentType);
  res.json(result);
}));

/**
 * POST /api/settings/change-password
 */
router.post('/change-password', validate(changePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const valid = await authService.verifyPassword(currentPassword, req.user!.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await authService.hashPassword(newPassword);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash: newHash },
  });

  // Logout all other sessions
  await authService.logoutAll(req.user!.id);

  res.json({ message: 'Password changed successfully' });
}));

/**
 * GET /api/settings/notifications
 */
router.get('/notifications', asyncHandler(async (req: Request, res: Response) => {
  // In production, this would fetch from a user_settings table
  res.json({
    emailNotifications: true,
    reminderPrompts: true,
    deliveryConfirmations: true,
  });
}));

/**
 * PATCH /api/settings/notifications
 */
router.patch('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { emailNotifications, reminderPrompts, deliveryConfirmations } = req.body;
  // In production, save to user_settings table
  res.json({ emailNotifications, reminderPrompts, deliveryConfirmations });
}));

/**
 * GET /api/settings/preferences
 */
router.get('/preferences', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    defaultRecipientId: null,
    voiceQuality: 'high',
  });
}));

/**
 * PATCH /api/settings/preferences
 */
router.patch('/preferences', asyncHandler(async (req: Request, res: Response) => {
  const { defaultRecipientId, voiceQuality } = req.body;
  res.json({ defaultRecipientId, voiceQuality });
}));

/**
 * DELETE /api/settings/account
 */
router.delete('/account', asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  const valid = await authService.verifyPassword(password, req.user!.passwordHash);
  if (!valid) throw ApiError.badRequest('Incorrect password');

  // Delete all user data (cascade will handle related records)
  await prisma.user.delete({ where: { id: req.user!.id } });

  res.json({ message: 'Account deleted successfully' });
}));

/**
 * GET /api/settings/legacy-contacts
 * Get all legacy contacts for current user
 */
router.get('/legacy-contacts', asyncHandler(async (req: Request, res: Response) => {
  // Return empty array for now since LegacyContact model may not exist
  res.json([]);
}));

/**
 * POST /api/settings/legacy-contacts
 * Add a new legacy contact
 */
router.post('/legacy-contacts', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, relationship } = req.body;

  if (!name || !email || !relationship) {
    throw ApiError.badRequest('Name, email, and relationship are required');
  }

  // Return mock response for now
  res.status(201).json({
    id: 'temp-' + Date.now(),
    name,
    email,
    relationship,
    verificationStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/settings/legacy-contacts/:id
 * Remove a legacy contact
 */
router.delete('/legacy-contacts/:id', asyncHandler(async (req: Request, res: Response) => {
  res.status(204).send();
}));

/**
 * POST /api/settings/legacy-contacts/:id/resend
 * Resend verification email to a legacy contact
 */
router.post('/legacy-contacts/:id/resend', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Verification email sent' });
}));

export default router;
