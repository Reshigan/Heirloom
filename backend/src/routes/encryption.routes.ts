import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { encryptionService } from '../services/encryption.service';
import { authService } from '../services/auth.service';

const router = Router();

/**
 * POST /api/encryption/setup
 * Initialize encryption for user account
 */
router.post('/setup', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  const valid = await authService.verifyPassword(password, req.user!.passwordHash);
  if (!valid) {
    throw ApiError.badRequest('Invalid password');
  }

  if (req.user!.encryptionSalt) {
    throw ApiError.conflict('Encryption already configured');
  }

  const keySet = await encryptionService.generateUserKeySet(req.user!.id, password);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      encryptionSalt: keySet.salt,
      encryptedMasterKey: JSON.stringify(keySet.encryptedMasterKey),
      keyDerivationParams: keySet.keyDerivationParams,
    },
  });

  const recoveryCode = encryptionService.generateRecoveryCode();

  res.json({
    message: 'Encryption configured successfully',
    keyDerivationParams: keySet.keyDerivationParams,
    salt: keySet.salt,
    recoveryCode,
  });
}));

/**
 * GET /api/encryption/params
 * Get encryption parameters for client-side key derivation
 */
router.get('/params', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  if (!user.encryptionSalt) {
    res.json({ configured: false });
    return;
  }

  res.json({
    configured: true,
    salt: user.encryptionSalt,
    keyDerivationParams: user.keyDerivationParams,
    encryptedMasterKey: user.encryptedMasterKey ? JSON.parse(user.encryptedMasterKey) : null,
  });
}));

/**
 * POST /api/encryption/escrow
 * Set up key escrow for beneficiaries
 */
router.post('/escrow', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { beneficiaryIds, encryptedKey } = req.body;

  if (!beneficiaryIds?.length) {
    throw ApiError.badRequest('At least one beneficiary required');
  }

  const validBeneficiaries = await prisma.familyMember.findMany({
    where: {
      id: { in: beneficiaryIds },
      userId: req.user!.id,
    },
  });

  if (validBeneficiaries.length !== beneficiaryIds.length) {
    throw ApiError.badRequest('Invalid beneficiary IDs');
  }

  await encryptionService.createKeyEscrow(req.user!.id, encryptedKey, beneficiaryIds);

  res.json({
    message: 'Key escrow configured',
    beneficiaryCount: beneficiaryIds.length,
  });
}));

/**
 * GET /api/encryption/escrow
 * Get escrow status
 */
router.get('/escrow', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const escrows = await prisma.keyEscrow.findMany({
    where: { userId: req.user!.id },
    include: {
      beneficiary: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  res.json(escrows.map(e => ({
    beneficiary: e.beneficiary,
    released: e.released,
    releasedAt: e.releasedAt,
    createdAt: e.createdAt,
  })));
}));

export default router;
