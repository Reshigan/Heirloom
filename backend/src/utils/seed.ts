import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@heirloom.app' },
    update: {},
    create: {
      email: 'demo@heirloom.app',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      emailVerified: true,
      subscription: {
        create: {
          tier: 'FAMILY',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create family members
  const familyMembers = await Promise.all([
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Emma Johnson',
        relationship: 'Daughter',
        email: 'emma@example.com',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Michael Johnson',
        relationship: 'Son',
        email: 'michael@example.com',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'James Wilson',
        relationship: 'Father',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Rose Wilson',
        relationship: 'Mother',
      },
    }),
  ]);

  console.log(`✅ Created ${familyMembers.length} family members`);

  // Create story prompts
  const prompts = await prisma.storyPrompt.createMany({
    data: [
      { category: 'Love', text: 'How did you meet your partner?', emoji: '💑', order: 1 },
      { category: 'Love', text: 'What was your wedding day like?', emoji: '💒', order: 2 },
      { category: 'Childhood', text: 'Describe your childhood home', emoji: '🏠', order: 1 },
      { category: 'Childhood', text: 'What games did you play as a child?', emoji: '🎮', order: 2 },
      { category: 'Holidays', text: 'Favorite holiday memory', emoji: '🎄', order: 1 },
      { category: 'Holidays', text: 'Family traditions you cherish', emoji: '🕯️', order: 2 },
      { category: 'Wisdom', text: 'Best advice you ever received', emoji: '💡', order: 1 },
      { category: 'Wisdom', text: 'Lessons learned from mistakes', emoji: '📚', order: 2 },
      { category: 'Career', text: 'Your first job', emoji: '💼', order: 1 },
      { category: 'Career', text: 'Proudest professional moment', emoji: '🏆', order: 2 },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${prompts.count} story prompts`);

  // Create sample memories
  await prisma.memory.createMany({
    data: [
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Summer at the lake house',
        description: 'The summer of 2023, when everyone came together.',
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Emma\'s graduation',
        description: 'So proud of how far she\'s come.',
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'The story of how we met',
        description: 'A recording for the grandchildren.',
      },
    ],
  });

  console.log('✅ Created sample memories');

  // Create sample letter
  await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'To my children',
      salutation: 'My dearest Emma and Michael,',
      body: 'There are so many things I want to tell you both...',
      signature: 'With all my love, Mom',
      deliveryTrigger: 'POSTHUMOUS',
      recipients: {
        create: [
          { familyMemberId: familyMembers[0].id },
          { familyMemberId: familyMembers[1].id },
        ],
      },
    },
  });

  console.log('✅ Created sample letter');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
