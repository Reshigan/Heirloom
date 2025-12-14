import express from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/wrapped/current
 * Get current year wrapped data
 */
router.get('/current', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const currentYear = new Date().getFullYear();

  let wrapped = await prisma.wrappedData.findUnique({
    where: {
      userId_year: { userId, year: currentYear }
    }
  });

  if (!wrapped) {
    // Generate wrapped data
    wrapped = await generateWrapped(userId, currentYear);
  }

  res.json(wrapped);
}));

/**
 * GET /api/wrapped/:year
 * Get wrapped data for specific year
 */
router.get('/:year', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const year = parseInt(req.params.year);

  if (isNaN(year) || year < 2020 || year > new Date().getFullYear()) {
    throw ApiError.badRequest('Invalid year');
  }

  let wrapped = await prisma.wrappedData.findUnique({
    where: {
      userId_year: { userId, year }
    }
  });

  if (!wrapped) {
    wrapped = await generateWrapped(userId, year);
  }

  res.json(wrapped);
}));

/**
 * POST /api/wrapped/:year/regenerate
 * Regenerate wrapped data for a year
 */
router.post('/:year/regenerate', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const year = parseInt(req.params.year);

  if (isNaN(year) || year < 2020 || year > new Date().getFullYear()) {
    throw ApiError.badRequest('Invalid year');
  }

  // Delete existing wrapped data
  await prisma.wrappedData.deleteMany({
    where: { userId, year }
  });

  // Generate new wrapped data
  const wrapped = await generateWrapped(userId, year);

  res.json(wrapped);
}));

/**
 * GET /api/wrapped
 * Get all available years
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const years = await prisma.wrappedData.findMany({
    where: { userId },
    select: { year: true },
    orderBy: { year: 'desc' }
  });

  res.json(years.map((y: { year: number }) => y.year));
}));

/**
 * Generate wrapped data for a user and year
 */
async function generateWrapped(userId: string, year: number) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  // Count memories
  const memoriesCount = await prisma.memory.count({
    where: {
      userId,
      createdAt: { gte: startOfYear, lte: endOfYear }
    }
  });

  // Count voice recordings
  const voiceCount = await prisma.voiceRecording.count({
    where: {
      userId,
      createdAt: { gte: startOfYear, lte: endOfYear }
    }
  });

  // Count letters
  const lettersCount = await prisma.letter.count({
    where: {
      userId,
      createdAt: { gte: startOfYear, lte: endOfYear }
    }
  });

  // Get family members count
  const familyCount = await prisma.familyMember.count({
    where: { userId }
  });

  // Create wrapped data
  const wrapped = await prisma.wrappedData.create({
    data: {
      userId,
      year,
      totalMemories: memoriesCount,
      totalVoiceStories: voiceCount,
      totalLetters: lettersCount,
      totalStorage: BigInt(0),
      longestStreak: 0,
      currentStreak: 0,
      topEmotions: [],
      topTaggedPeople: [],
      highlights: [],
      summary: `In ${year}, you preserved ${memoriesCount} memories, recorded ${voiceCount} voice stories, and wrote ${lettersCount} letters for your ${familyCount} family members.`
    }
  });

  return wrapped;
}

export default router;
