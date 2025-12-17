import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { AdminRole } from '@prisma/client';

const router = Router();

// Admin JWT secret (separate from user JWT)
const ADMIN_JWT_SECRET = env.JWT_SECRET + '_admin';

// Admin authentication middleware
export const authenticateAdmin = asyncHandler(async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Admin authentication required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; role: AdminRole };
    const admin = await prisma.adminUser.findUnique({ where: { id: decoded.adminId } });
    
    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized('Invalid admin session');
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid admin token');
  }
});

// Require specific admin role
export const requireRole = (...roles: AdminRole[]) => {
  return (req: Request, res: Response, next: any) => {
    const admin = (req as any).admin;
    if (!admin || !roles.includes(admin.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
};

// ============================================================================
// ADMIN AUTH
// ============================================================================

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password required');
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const token = jwt.sign(
    { adminId: admin.id, role: admin.role },
    ADMIN_JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
    },
  });
}));

/**
 * GET /api/admin/me
 * Get current admin user
 */
router.get('/me', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  res.json({
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
  });
}));

/**
 * POST /api/admin/create
 * Create new admin user (super admin only)
 */
router.post('/create', authenticateAdmin, requireRole('SUPER_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw ApiError.badRequest('All fields required');
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Admin with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'ADMIN',
    },
  });

  res.status(201).json({
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
  });
}));

// ============================================================================
// COUPONS
// ============================================================================

/**
 * GET /api/admin/coupons
 * List all coupons
 */
router.get('/coupons', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(coupons);
}));

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
router.post('/coupons', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxUses,
    minPurchase,
    applicableTiers,
    validFrom,
    validUntil,
  } = req.body;

  if (!code || !discountValue) {
    throw ApiError.badRequest('Code and discount value required');
  }

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    throw ApiError.conflict('Coupon code already exists');
  }

  const admin = (req as any).admin;
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description,
      discountType: discountType || 'PERCENTAGE',
      discountValue,
      maxUses: maxUses || null,
      minPurchase: minPurchase || null,
      applicableTiers: applicableTiers || [],
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      createdById: admin.id,
    },
  });

  res.status(201).json(coupon);
}));

/**
 * PATCH /api/admin/coupons/:id
 * Update a coupon
 */
router.patch('/coupons/:id', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      description: updates.description,
      discountType: updates.discountType,
      discountValue: updates.discountValue,
      maxUses: updates.maxUses,
      minPurchase: updates.minPurchase,
      applicableTiers: updates.applicableTiers,
      validUntil: updates.validUntil ? new Date(updates.validUntil) : undefined,
      isActive: updates.isActive,
    },
  });

  res.json(updated);
}));

/**
 * DELETE /api/admin/coupons/:id
 * Delete a coupon
 */
router.delete('/coupons/:id', authenticateAdmin, requireRole('SUPER_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.coupon.delete({ where: { id } });
  res.json({ success: true });
}));

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /api/admin/analytics/overview
 * Get system overview analytics
 */
router.get('/analytics/overview', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    activeSubscriptions,
    trialingUsers,
    totalMemories,
    totalLetters,
    totalVoiceRecordings,
    recentSignups,
    subscriptionsByTier,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'TRIALING' } }),
    prisma.memory.count(),
    prisma.letter.count(),
    prisma.voiceRecording.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.subscription.groupBy({
      by: ['tier'],
      _count: { tier: true },
    }),
  ]);

  const tierCounts = subscriptionsByTier.reduce((acc, item) => {
    acc[item.tier] = item._count.tier;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    users: {
      total: totalUsers,
      recentSignups,
      active: activeSubscriptions,
      trialing: trialingUsers,
    },
    subscriptions: {
      free: tierCounts.FREE || 0,
      essential: tierCounts.ESSENTIAL || 0,
      family: tierCounts.FAMILY || 0,
      legacy: tierCounts.LEGACY || 0,
    },
    content: {
      memories: totalMemories,
      letters: totalLetters,
      voiceRecordings: totalVoiceRecordings,
    },
  });
}));

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 */
router.get('/analytics/revenue', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const redemptions = await prisma.couponRedemption.findMany({
    where: { redeemedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });

  const totalDiscounts = redemptions.reduce((sum, r) => sum + r.discountApplied, 0);

  // Get subscription counts for MRR estimation
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', tier: { not: 'FREE' } },
  });

  // Estimate MRR (Monthly Recurring Revenue) based on tier pricing
  const tierPricing: Record<string, number> = {
    ESSENTIAL: 999, // $9.99
    FAMILY: 1999, // $19.99
    LEGACY: 4999 / 12, // $49.99/year = ~$4.17/month
  };

  const mrr = subscriptions.reduce((sum, sub) => {
    return sum + (tierPricing[sub.tier] || 0);
  }, 0);

  res.json({
    mrr: mrr / 100, // Convert cents to dollars
    totalDiscountsLast30Days: totalDiscounts / 100,
    activeSubscriptions: subscriptions.length,
    couponRedemptionsLast30Days: redemptions.length,
  });
}));

/**
 * GET /api/admin/analytics/users
 * Get user analytics
 */
router.get('/analytics/users', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    signupsLast30Days,
    signupsLast7Days,
    activeUsersLast7Days,
    usersWithContent,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({
      where: {
        OR: [
          { memories: { some: {} } },
          { letters: { some: {} } },
          { voiceRecordings: { some: {} } },
        ],
      },
    }),
  ]);

  res.json({
    signupsLast30Days,
    signupsLast7Days,
    activeUsersLast7Days,
    usersWithContent,
  });
}));

/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get('/users', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' as const } },
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        subscription: true,
        _count: { select: { memories: true, letters: true, voiceRecordings: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      subscription: u.subscription ? {
        tier: u.subscription.tier,
        status: u.subscription.status,
      } : null,
      contentCount: u._count,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

export default router;
