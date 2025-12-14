import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample image URLs (using placeholder images)
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800',
  'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
  'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
  'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=800',
];

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.letterRecipient.deleteMany({});
  await prisma.letter.deleteMany({});
  await prisma.voiceRecording.deleteMany({});
  await prisma.memory.deleteMany({});
  await prisma.familyMember.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Clear admin-related tables (if they exist)
  try {
    await prisma.couponRedemption.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.adminUser.deleteMany({});
  } catch (e) {
    // Tables may not exist yet
  }
  
  console.log('✅ Database cleared');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data first
  await clearDatabase();

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12);
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@heirloom.app',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      emailVerified: true,
      subscription: {
        create: {
          tier: 'ESSENTIAL',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create family members with more details
  const familyMembers = await Promise.all([
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Emma Johnson',
        relationship: 'Daughter',
        email: 'emma@example.com',
        birthDate: new Date('1995-06-15'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Michael Johnson',
        relationship: 'Son',
        email: 'michael@example.com',
        birthDate: new Date('1998-03-22'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'James Wilson',
        relationship: 'Father',
        birthDate: new Date('1945-11-08'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Rose Wilson',
        relationship: 'Mother',
        birthDate: new Date('1948-04-12'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'David Johnson',
        relationship: 'Husband',
        email: 'david@example.com',
        birthDate: new Date('1968-09-30'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Lily Johnson',
        relationship: 'Granddaughter',
        birthDate: new Date('2020-12-25'),
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Thomas Wilson',
        relationship: 'Brother',
        email: 'thomas@example.com',
        birthDate: new Date('1972-07-04'),
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

  // Create comprehensive memories with images
  const memories = await Promise.all([
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Summer at the lake house',
        description: 'The summer of 2023, when everyone came together for a week of swimming, fishing, and making memories. The kids caught their first fish!',
        fileUrl: SAMPLE_IMAGES[0],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Emma\'s graduation day',
        description: 'So proud of how far she\'s come. Graduated summa cum laude from Stanford University with a degree in Computer Science.',
        fileUrl: SAMPLE_IMAGES[1],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Christmas morning 2022',
        description: 'The whole family gathered around the tree. Lily was so excited to open her presents - her first Christmas she could really understand!',
        fileUrl: SAMPLE_IMAGES[2],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Our 25th wedding anniversary',
        description: 'David surprised me with a trip to Paris. We renewed our vows at a small chapel overlooking the Seine.',
        fileUrl: SAMPLE_IMAGES[3],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Michael\'s first day at his new job',
        description: 'He was so nervous but so excited. Now he\'s a senior engineer at Google. Time flies!',
        fileUrl: SAMPLE_IMAGES[4],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Mom and Dad\'s 50th anniversary',
        description: 'We threw them a surprise party. Dad cried when he saw everyone. It was beautiful.',
        fileUrl: SAMPLE_IMAGES[5],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Family reunion at the old farmhouse',
        description: 'First time in 10 years we got all the cousins together. The farmhouse looked exactly the same.',
        fileUrl: SAMPLE_IMAGES[6],
        encrypted: false,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: 'Lily\'s first birthday',
        description: 'She smashed that cake like a champion! Her little face covered in frosting was the cutest thing.',
        fileUrl: SAMPLE_IMAGES[7],
        encrypted: false,
      },
    }),
  ]);

  console.log(`✅ Created ${memories.length} memories with images`);

  // Create voice recordings with transcripts
  const voiceRecordings = await Promise.all([
    prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: 'How I met your grandfather',
        description: 'A story for the grandchildren about how it all began.',
        transcript: 'It was the summer of 1965. I was working at the local diner when this handsome young man walked in. He ordered a coffee and a slice of apple pie, and he came back every single day for three months before he finally asked me out. Your grandfather was shy, but persistent. Our first date was a picnic by the river, and he brought wildflowers he picked himself. I knew then that he was the one.',
        duration: 180,
        fileUrl: 'https://example.com/audio/story1.mp3',
        fileKey: 'audio/story1.mp3',
        fileSize: 2160000,
        encrypted: false,
      },
    }),
    prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: 'The day Emma was born',
        description: 'Remembering the most beautiful day of my life.',
        transcript: 'June 15th, 1995. It was the hottest day of the year, and I was in labor for 18 hours. But when they placed her in my arms, everything else disappeared. She had the tiniest fingers and the loudest cry. Your father cried too - he was so overwhelmed with joy. We named her Emma after my grandmother, who had passed just a year before.',
        duration: 150,
        fileUrl: 'https://example.com/audio/story2.mp3',
        fileKey: 'audio/story2.mp3',
        fileSize: 1800000,
        encrypted: false,
      },
    }),
    prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: 'Advice I wish I\'d known at 20',
        description: 'Wisdom to pass on to the next generation.',
        transcript: 'If I could go back and tell my younger self anything, it would be this: Don\'t rush. Life isn\'t a race. Take time to enjoy the small moments - the morning coffee, the sunset walks, the quiet conversations. Also, call your parents more. They won\'t be around forever, and you\'ll miss them more than you can imagine. And most importantly, be kind to yourself. You\'re doing better than you think.',
        duration: 120,
        fileUrl: 'https://example.com/audio/story3.mp3',
        fileKey: 'audio/story3.mp3',
        fileSize: 1440000,
        encrypted: false,
      },
    }),
    prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: 'Our family\'s secret recipe',
        description: 'The apple pie recipe that has been in our family for generations.',
        transcript: 'This apple pie recipe has been in our family for four generations. My great-grandmother brought it over from Ireland. The secret is in the spices - a pinch of cardamom along with the cinnamon. And you must use Granny Smith apples, nothing else. I\'m passing this recipe to you, Emma, as my mother passed it to me. Guard it well and share it with your children.',
        duration: 90,
        fileUrl: 'https://example.com/audio/story4.mp3',
        fileKey: 'audio/story4.mp3',
        fileSize: 1080000,
        encrypted: false,
      },
    }),
    prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: 'The Christmas miracle of 1987',
        description: 'A story about kindness and hope during hard times.',
        transcript: 'We had nothing that year. Your father had lost his job, and we could barely afford to keep the lights on. I didn\'t know how we\'d give the kids any presents. But on Christmas Eve, there was a knock at the door. A stranger handed us an envelope with $500 cash and a note that said "Merry Christmas from a friend." We never found out who it was, but that act of kindness changed everything. It\'s why I always try to help others when I can.',
        duration: 200,
        fileUrl: 'https://example.com/audio/story5.mp3',
        fileKey: 'audio/story5.mp3',
        fileSize: 2400000,
        encrypted: false,
      },
    }),
  ]);

  console.log(`✅ Created ${voiceRecordings.length} voice recordings with transcripts`);

  // Create comprehensive letters
  const letters = await Promise.all([
    prisma.letter.create({
      data: {
        userId: user.id,
        title: 'To my children on my passing',
        salutation: 'My dearest Emma and Michael,',
        body: `If you're reading this, I'm no longer with you in body, but please know that my love for you transcends all boundaries, even death itself.

I want you to know how proud I am of both of you. Emma, your determination and kindness remind me so much of your grandmother. Michael, your creativity and gentle heart have always been a source of joy.

Please take care of each other. Family is everything. When times get hard, remember the summers at the lake house, the Christmas mornings, the Sunday dinners. Those moments were my greatest treasures.

Don't mourn for too long. Live your lives fully. Love deeply. Laugh often. And when you miss me, just look at the stars - I'll be there, watching over you always.

Tell Lily about me. Show her the photos, play her my voice recordings. I want her to know her grandmother loved her more than words can say.`,
        signature: 'With all my love, forever and always, Mom',
        deliveryTrigger: 'POSTHUMOUS',
        sealedAt: new Date(),
        encrypted: false,
        recipients: {
          create: [
            { familyMemberId: familyMembers[0].id },
            { familyMemberId: familyMembers[1].id },
          ],
        },
      },
    }),
    prisma.letter.create({
      data: {
        userId: user.id,
        title: 'For Emma on her wedding day',
        salutation: 'My beautiful Emma,',
        body: `Today you become a wife, and my heart is overflowing with joy and just a little bit of bittersweet tears.

I remember the day you were born like it was yesterday. Now here you are, a grown woman, ready to start your own family. Where did the time go?

Marriage is a beautiful journey, but it's not always easy. There will be hard days. On those days, remember why you chose each other. Remember the love that brought you here today.

Be patient with each other. Communicate openly. Never go to bed angry. And always, always make time for each other, even when life gets busy.

Your father and I have been married for 30 years, and I love him more today than the day we wed. That's my wish for you - a love that grows deeper with time.

I'm so proud of the woman you've become. You're going to be an amazing wife.`,
        signature: 'All my love, Mom',
        deliveryTrigger: 'SCHEDULED',
        scheduledDate: new Date('2025-06-15'),
        sealedAt: new Date(),
        encrypted: false,
        recipients: {
          create: [
            { familyMemberId: familyMembers[0].id },
          ],
        },
      },
    }),
    prisma.letter.create({
      data: {
        userId: user.id,
        title: 'To Lily on her 18th birthday',
        salutation: 'My precious Lily,',
        body: `Happy 18th birthday, my darling granddaughter!

I'm writing this when you're just 4 years old, running around the house with your pigtails bouncing, asking a million questions about everything. I hope you never lose that curiosity.

By now, you're a young woman ready to take on the world. I may or may not be there to see it, but I want you to know how much you've been loved from the very first moment.

You were born on Christmas Day - the greatest gift our family ever received. Your laughter has been the soundtrack of our happiest moments.

As you step into adulthood, remember: Be brave. Be kind. Be yourself. The world needs exactly who you are.

I've left you my grandmother's ring - the one with the sapphire. It's been passed down through four generations of strong women in our family. Now it's yours.

Make us proud, Lily. But more importantly, make yourself proud.`,
        signature: 'With endless love, Grandma Sarah',
        deliveryTrigger: 'SCHEDULED',
        scheduledDate: new Date('2038-12-25'),
        sealedAt: new Date(),
        encrypted: false,
        recipients: {
          create: [
            { familyMemberId: familyMembers[5].id },
          ],
        },
      },
    }),
    prisma.letter.create({
      data: {
        userId: user.id,
        title: 'Thank you, David',
        salutation: 'My darling David,',
        body: `After 30 years of marriage, I still get butterflies when you walk into the room.

Thank you for being my partner, my best friend, my rock. Thank you for the coffee you bring me every morning, for holding my hand during the scary times, for making me laugh when I want to cry.

Thank you for being an amazing father to our children. They are who they are because of you.

I know I don't say it enough, but you are the best decision I ever made. Choosing you, building a life with you - it's been the greatest adventure.

Here's to 30 more years, my love. And then 30 more after that.`,
        signature: 'Forever yours, Sarah',
        deliveryTrigger: 'IMMEDIATE',
        encrypted: false,
        recipients: {
          create: [
            { familyMemberId: familyMembers[4].id },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${letters.length} letters`);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123456', 12);
  const adminUser = await prisma.adminUser.create({
    data: {
      email: 'admin@heirloom.app',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create sample coupons
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'WELCOME20',
        description: '20% off for new users',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxUses: 100,
        currentUses: 0,
        isActive: true,
        createdById: adminUser.id,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FAMILY50',
        description: '$5 off Family plan',
        discountType: 'FIXED_AMOUNT',
        discountValue: 500, // $5.00 in cents
        applicableTiers: ['FAMILY'],
        isActive: true,
        createdById: adminUser.id,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'LEGACY2024',
        description: '30% off Legacy plan',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        applicableTiers: ['LEGACY'],
        validUntil: new Date('2025-12-31'),
        isActive: true,
        createdById: adminUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${coupons.length} sample coupons`);

  console.log('🎉 Seeding complete!');
  console.log(`
Summary:
- 1 demo user (demo@heirloom.app / demo123456)
- 1 admin user (admin@heirloom.app / admin123456)
- ${familyMembers.length} family members
- ${memories.length} memories with images
- ${voiceRecordings.length} voice recordings with transcripts
- ${letters.length} letters (sealed and draft)
- ${coupons.length} sample coupons
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
