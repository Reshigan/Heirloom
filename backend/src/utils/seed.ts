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

  // Create sample memories with realistic images
  await prisma.memory.createMany({
    data: [
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Summer at the lake house',
        description: 'The summer of 2023, when everyone came together. We spent two wonderful weeks at the cabin by the lake, swimming, fishing, and making memories that will last forever.',
        fileUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=60' },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Emma\'s graduation',
        description: 'So proud of how far she\'s come. Watching her walk across that stage was one of the proudest moments of my life. All those late nights studying paid off.',
        fileUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60' },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Christmas morning 2022',
        description: 'The whole family gathered around the tree. Michael surprised us all with his homemade gifts that year.',
        fileUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80',
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&q=60' },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Our 25th anniversary',
        description: 'Twenty-five years of love, laughter, and adventure. We renewed our vows at the same chapel where it all began.',
        fileUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60' },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Family reunion at grandma\'s farm',
        description: 'Four generations together for the first time. Grandma Rose was so happy to see everyone.',
        fileUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=60' },
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'The story of how we met',
        description: 'A recording for the grandchildren about how their grandparents fell in love at a small coffee shop in 1995.',
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'Grandpa James\'s war stories',
        description: 'Dad finally agreed to record his memories from his time in the service. These stories need to be preserved.',
      },
    ],
  });

  console.log('✅ Created sample memories with images');

  // Create sample letters with realistic content
  await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'To my children',
      salutation: 'My dearest Emma and Michael,',
      body: `If you're reading this, it means I'm no longer with you in person, but please know that my love for you both transcends any boundary, even this one.

I want you to know how incredibly proud I am of the people you've become. Emma, your determination and compassion have always inspired me. The way you care for others, the way you fight for what's right – you got that from your grandmother, and it fills my heart with joy to see her spirit live on in you.

Michael, your creativity and gentle soul have been a constant source of wonder. Remember when you were seven and you built that birdhouse for me? It still hangs in the backyard, and every spring when the robins return, I think of you.

There are a few things I want you to remember:

First, take care of each other. You are siblings, but more importantly, you are friends. Life will throw challenges at you, but together, you can weather any storm.

Second, don't let grief consume you. I've lived a full and beautiful life, and so much of that beauty came from being your mother. Celebrate the memories we made together rather than mourning what could have been.

Third, tell the people you love that you love them. Every day. Don't wait for the perfect moment – there is no perfect moment, only this moment.

I've left some recordings and photos in this app for you. They're my way of staying close, of being there for the moments I'll miss. Play them when you need to hear my voice, look at them when you need to remember my face.

You are my greatest achievement, my proudest legacy. Everything I've done, I've done for you.`,
      signature: 'With all my love, forever and always,\nMom',
      deliveryTrigger: 'POSTHUMOUS',
      recipients: {
        create: [
          { familyMemberId: familyMembers[0].id },
          { familyMemberId: familyMembers[1].id },
        ],
      },
    },
  });

  // Create a second letter for a specific occasion
  await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'For Emma\'s wedding day',
      salutation: 'My beautiful Emma,',
      body: `Today is your wedding day, and even though I may not be there to see you walk down the aisle, I am with you in spirit.

I remember the day you were born – how you looked up at me with those big curious eyes, and I knew in that moment that my life would never be the same. You made me a mother, and that has been the greatest gift of my life.

I've watched you grow from that tiny baby into the remarkable woman you are today. I've seen you fall and get back up. I've seen you love and lose and love again. And now, you're about to begin a new chapter with someone who sees in you what I've always seen – a heart full of gold and a spirit that cannot be contained.

Some advice for your marriage, from someone who spent 30 wonderful years with your father:

Never go to bed angry. Talk it out, even when it's hard. Especially when it's hard.

Keep dating each other. The romance doesn't end at the altar – it's just beginning.

Build a home filled with laughter. The dishes can wait, the laundry can pile up, but moments of joy are fleeting – catch them while you can.

Remember that you're partners, not competitors. You're on the same team, always.

I wish I could be there to fix your veil, to wipe away your happy tears, to dance with you one last time. But know that wherever I am, I am dancing. I am celebrating. I am so incredibly proud of you.

Be happy, my darling. You deserve all the love in the world.`,
      signature: 'Your loving mother,\nMom',
      deliveryTrigger: 'SCHEDULED',
      scheduledDate: new Date('2026-06-15'),
      recipients: {
        create: [
          { familyMemberId: familyMembers[0].id },
        ],
      },
    },
  });

  console.log('✅ Created sample letters');

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
