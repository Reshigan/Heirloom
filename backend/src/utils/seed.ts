import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Image URLs for memories (using Unsplash)
const MEMORY_IMAGES = {
  family: [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
    'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800',
  ],
  celebrations: [
    'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
  ],
  travel: [
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  ],
  milestones: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  ],
};

function yearsAgo(years: number, month = 6, day = 15): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setMonth(month - 1);
  date.setDate(day);
  return date;
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.couponRedemption.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.wrappedData.deleteMany({});
  await prisma.botConversation.deleteMany({});
  await prisma.supportMessage.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.checkInHistory.deleteMany({});
  await prisma.keyEscrow.deleteMany({});
  await prisma.switchVerification.deleteMany({});
  await prisma.deadManSwitch.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.letterDelivery.deleteMany({});
  await prisma.letterRecipient.deleteMany({});
  await prisma.letter.deleteMany({});
  await prisma.voiceRecipient.deleteMany({});
  await prisma.voiceRecording.deleteMany({});
  await prisma.memoryRecipient.deleteMany({});
  await prisma.memory.deleteMany({});
  await prisma.legacyContact.deleteMany({});
  await prisma.familyMember.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.storyPrompt.deleteMany({});
  
  console.log('Database cleared');
}

async function main() {
  console.log('Seeding database with comprehensive test data...');

  // Clear existing data first
  await clearDatabase();

  // Create demo user - Sarah Johnson
  const passwordHash = await bcrypt.hash('demo123456', 12);
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@heirloom.app',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      emailVerified: true,
      lastLoginAt: new Date(),
      subscription: {
        create: {
          tier: 'FAMILY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create family members (10 members across 3 generations)
  const familyMembers = await Promise.all([
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Emma Johnson',
        relationship: 'Daughter',
        email: 'emma@example.com',
        phone: '+1-555-0101',
        birthDate: new Date('1995-06-15'),
        notes: 'Eldest daughter, works as a software engineer.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Michael Johnson',
        relationship: 'Son',
        email: 'michael@example.com',
        phone: '+1-555-0102',
        birthDate: new Date('1998-03-22'),
        notes: 'Youngest child, studying medicine.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'David Johnson',
        relationship: 'Husband',
        email: 'david@example.com',
        phone: '+1-555-0103',
        birthDate: new Date('1968-11-08'),
        notes: 'High school sweetheart, married 32 years.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'James Wilson',
        relationship: 'Father',
        birthDate: new Date('1945-02-14'),
        notes: 'Retired teacher, loves gardening.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Rose Wilson',
        relationship: 'Mother',
        birthDate: new Date('1948-07-20'),
        notes: 'Former nurse, amazing cook.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Lily Johnson',
        relationship: 'Granddaughter',
        birthDate: new Date('2020-12-25'),
        notes: 'Emma\'s daughter, born on Christmas Day.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Robert Wilson',
        relationship: 'Brother',
        email: 'robert@example.com',
        birthDate: new Date('1972-09-03'),
        notes: 'Lives in California, visits twice a year.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Margaret Chen',
        relationship: 'Sister-in-law',
        email: 'margaret@example.com',
        birthDate: new Date('1974-04-18'),
        notes: 'Robert\'s wife, wonderful artist.',
      },
    }),
  ]);

  console.log(`Created ${familyMembers.length} family members`);

  // Create memories spanning 10 years with images
  const memoriesData = [
    { title: 'Summer at the Lake House', description: 'Annual family reunion at Lake Tahoe. The kids loved the kayaking.', type: 'PHOTO', date: yearsAgo(10, 7, 20), fileUrl: MEMORY_IMAGES.family[0] },
    { title: 'Emma\'s College Graduation', description: 'So proud of our girl! Computer Science degree with honors.', type: 'PHOTO', date: yearsAgo(9, 5, 15), fileUrl: MEMORY_IMAGES.milestones[0] },
    { title: 'Trip to Paris', description: 'Our 25th anniversary trip. The Eiffel Tower at sunset was magical.', type: 'PHOTO', date: yearsAgo(9, 9, 10), fileUrl: MEMORY_IMAGES.travel[0] },
    { title: 'Michael\'s High School Graduation', description: 'Valedictorian speech brought tears to everyone\'s eyes.', type: 'PHOTO', date: yearsAgo(8, 6, 1), fileUrl: MEMORY_IMAGES.milestones[1] },
    { title: 'Thanksgiving Gathering', description: 'First time hosting at our new house. 22 people around the table!', type: 'PHOTO', date: yearsAgo(8, 11, 23), fileUrl: MEMORY_IMAGES.family[1] },
    { title: 'Road Trip to Yellowstone', description: 'Two weeks exploring national parks with the whole family.', type: 'PHOTO', date: yearsAgo(7, 8, 5), fileUrl: MEMORY_IMAGES.travel[1] },
    { title: 'Dad\'s 50th Birthday Surprise', description: 'We flew in Robert from California. David had no idea!', type: 'PHOTO', date: yearsAgo(7, 11, 8), fileUrl: MEMORY_IMAGES.celebrations[1] },
    { title: 'Emma\'s Engagement', description: 'James proposed at the same restaurant where we had our first date.', type: 'PHOTO', date: yearsAgo(6, 2, 14), fileUrl: MEMORY_IMAGES.celebrations[2] },
    { title: 'Family Reunion in Ireland', description: 'Tracing our roots. Found the village where great-grandpa was born.', type: 'PHOTO', date: yearsAgo(6, 6, 20), fileUrl: MEMORY_IMAGES.travel[2] },
    { title: 'Christmas Baby Lily', description: 'Our first grandchild arrived on Christmas Day. Best gift ever.', type: 'PHOTO', date: yearsAgo(5, 12, 25), fileUrl: MEMORY_IMAGES.family[3] },
    { title: 'First Steps', description: 'Lily took her first steps right into grandpa\'s arms.', type: 'PHOTO', date: yearsAgo(4, 10, 15), fileUrl: MEMORY_IMAGES.family[0] },
    { title: 'Garden Harvest', description: 'Dad\'s vegetable garden produced enough tomatoes for the whole neighborhood.', type: 'PHOTO', date: yearsAgo(4, 8, 20), fileUrl: MEMORY_IMAGES.family[1] },
    { title: 'Emma\'s Wedding', description: 'The most beautiful day. She looked just like her grandmother.', type: 'PHOTO', date: yearsAgo(3, 6, 18), fileUrl: MEMORY_IMAGES.celebrations[0] },
    { title: 'Michael Starts Medical School', description: 'Dropping him off at Johns Hopkins. So proud and so sad.', type: 'PHOTO', date: yearsAgo(3, 8, 25), fileUrl: MEMORY_IMAGES.milestones[0] },
    { title: 'Lily\'s 3rd Birthday', description: 'Unicorn theme party. She insisted on wearing her costume for a week after.', type: 'PHOTO', date: yearsAgo(2, 12, 25), fileUrl: MEMORY_IMAGES.celebrations[1] },
    { title: 'Anniversary Trip to Hawaii', description: '30 years together. Renewed our vows on the beach at sunset.', type: 'PHOTO', date: yearsAgo(2, 9, 15), fileUrl: MEMORY_IMAGES.travel[0] },
    { title: 'Four Generations Photo', description: 'Mom, me, Emma, and Lily. Four generations of strong women.', type: 'PHOTO', date: yearsAgo(1, 5, 10), fileUrl: MEMORY_IMAGES.family[2] },
    { title: 'Michael\'s White Coat Ceremony', description: 'Officially a doctor in training. Grandma Grace would be so proud.', type: 'PHOTO', date: yearsAgo(1, 8, 15), fileUrl: MEMORY_IMAGES.milestones[1] },
    { title: 'New Year\'s Eve Together', description: 'Welcoming 2025 with all three generations under one roof.', type: 'PHOTO', date: new Date('2025-01-01'), fileUrl: MEMORY_IMAGES.celebrations[2] },
    { title: 'Lily\'s First Day of Preschool', description: 'She was so brave. I was the one who cried.', type: 'PHOTO', date: new Date('2025-09-05'), fileUrl: MEMORY_IMAGES.milestones[0] },
  ];

  for (const m of memoriesData) {
    await prisma.memory.create({
      data: {
        userId: user.id,
        type: m.type as any,
        title: m.title,
        description: m.description,
        fileUrl: m.fileUrl,
        createdAt: m.date,
        updatedAt: m.date,
      },
    });
  }

  console.log(`Created ${memoriesData.length} memories spanning 10 years`);

  // Create voice recordings (with required fileUrl, fileKey, fileSize fields)
  const voiceRecordingsData = [
    { title: 'The Story of How We Met', description: 'For the grandchildren - how grandma and grandpa fell in love.', duration: 480, transcript: 'It was September 1990, my first day at the university library. I was looking for a book on medieval history when I bumped into your grandfather. He was reaching for the same book. We both laughed, and he offered to let me have it first. I said we could share it over coffee. That coffee turned into dinner, and dinner turned into 35 years of marriage.' },
    { title: 'Grandma Grace\'s Apple Pie Recipe', description: 'Her secret recipe, narrated step by step.', duration: 720, transcript: 'The secret is in the crust. You need cold butter, very cold. Cut it into small cubes and keep it in the freezer until you\'re ready. Mix two cups of flour with a pinch of salt, then work in the butter with your fingers until it looks like coarse crumbs. Add ice water, just a tablespoon at a time, until the dough comes together. Never overwork it.' },
    { title: 'Advice for Emma on Her Wedding Day', description: 'Words of wisdom for my daughter.', duration: 300, transcript: 'My darling Emma, today you begin a new chapter. Marriage is not about finding a perfect person, but about loving an imperfect person perfectly. Be patient with each other. Laugh often. Never go to bed angry. And always remember that the little moments are the big moments.' },
    { title: 'Family History - The Wilson Side', description: 'Stories from my father about our ancestors.', duration: 1200, transcript: 'Your great-great-grandfather came to America in 1892. He was just seventeen years old, with nothing but a small bag and big dreams. He worked in the coal mines of Pennsylvania for ten years before saving enough to buy a small farm. That farm is where your grandfather was born, and where I spent my summers as a child.' },
    { title: 'Lullaby for Lily', description: 'The same song I sang to Emma and Michael.', duration: 180, transcript: '(singing) Hush little baby, don\'t say a word, Grandma\'s gonna buy you a mockingbird. And if that mockingbird won\'t sing, Grandma\'s gonna buy you a diamond ring. And if that diamond ring turns brass, Grandma\'s gonna buy you a looking glass...' },
    { title: 'Life Lessons I\'ve Learned', description: 'Reflections on 55 years of life.', duration: 900, transcript: 'If I could tell my younger self anything, it would be this: Don\'t rush. The years go by faster than you think. Spend more time with the people you love. Take more pictures. Write things down. Tell people how much they mean to you while you still can. And never, ever take a single day for granted.' },
  ];

  for (let i = 0; i < voiceRecordingsData.length; i++) {
    const v = voiceRecordingsData[i];
    await prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: v.title,
        description: v.description,
        duration: v.duration,
        transcript: v.transcript,
        fileUrl: `https://heirloom-demo.s3.amazonaws.com/voice/recording-${i + 1}.mp3`,
        fileKey: `voice/recording-${i + 1}.mp3`,
        fileSize: v.duration * 16000,
        createdAt: yearsAgo(i, 3, 15),
      },
    });
  }

  console.log(`Created ${voiceRecordingsData.length} voice recordings`);

  // Create letters
  const letter1 = await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'To My Children',
      salutation: 'My dearest Emma and Michael,',
      body: 'There are so many things I want to tell you both. First, know that you have been the greatest joy of my life. From the moment each of you was born, my world became infinitely richer. I want you to know that no matter what happens, my love for you is eternal and unconditional.\n\nEmma, your strength and determination have always inspired me. The way you pursued your dreams while staying true to your values shows the woman you\'ve become.\n\nMichael, your compassion and dedication to helping others through medicine makes me prouder than words can express. You have your grandmother\'s healing spirit.\n\nTake care of each other. Family is everything.',
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

  const letter2 = await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'For Lily on Her 18th Birthday',
      salutation: 'My precious Lily,',
      body: 'By the time you read this, you\'ll be a young woman ready to take on the world. I want you to know the story of the day you were born - Christmas Day, 2020.\n\nThe world was going through a difficult time, but your arrival brought so much hope and joy. You were our Christmas miracle.\n\nI hope I\'m there to give you this letter in person, but if not, know that your grandmother loved you from the very first moment she held you.',
      signature: 'Love always,\nGrandma Sarah',
      deliveryTrigger: 'SCHEDULED',
      scheduledDate: new Date('2038-12-25'),
      recipients: {
        create: [
          { familyMemberId: familyMembers[5].id },
        ],
      },
    },
  });

  const letter3 = await prisma.letter.create({
    data: {
      userId: user.id,
      title: 'To My Husband David',
      salutation: 'My love,',
      body: 'Thirty-two years of marriage, and I still get butterflies when you walk into the room. Thank you for being my partner, my best friend, and my rock through everything life has thrown at us.\n\nRemember our first date at that little Italian restaurant? You were so nervous you knocked over the wine. I knew right then that I wanted to spend my life with you.\n\nHere\'s to many more years of adventures together.',
      signature: 'Forever yours,\nSarah',
      deliveryTrigger: 'IMMEDIATE',
      recipients: {
        create: [
          { familyMemberId: familyMembers[2].id },
        ],
      },
    },
  });

  console.log('Created 3 letters');

  // Create notifications
  const notificationsData = [
    { type: 'REMINDER', title: 'Weekly Check-in', message: 'Time for your weekly memory capture. What moments made you smile this week?', read: false },
    { type: 'MILESTONE', title: 'Memory Milestone', message: 'You\'ve captured 20 precious memories! Keep preserving your legacy.', read: true },
    { type: 'SYSTEM', title: 'Subscription Renewed', message: 'Your Family plan has been renewed for another month.', read: true },
    { type: 'EMOTIONAL', title: 'Anniversary Reminder', message: 'Your wedding anniversary is coming up in 3 days. Consider capturing a special memory.', read: false },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
      },
    });
  }

  console.log(`Created ${notificationsData.length} notifications`);

  // Create story prompts
  await prisma.storyPrompt.createMany({
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

  console.log('Created story prompts');

  // Create Dead Man's Switch configuration
  await prisma.deadManSwitch.create({
    data: {
      userId: user.id,
      enabled: true,
      checkInIntervalDays: 30,
      gracePeriodDays: 7,
      requiredVerifications: 2,
      lastCheckIn: new Date(),
      nextCheckInDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Created Dead Man\'s Switch configuration');

  // Create legacy contacts
  for (const fm of [familyMembers[0], familyMembers[1], familyMembers[2]]) {
    if (fm.email) {
      await prisma.legacyContact.create({
        data: {
          userId: user.id,
          name: fm.name,
          email: fm.email,
          relationship: fm.relationship,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
    }
  }

  console.log('Created legacy contacts');

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

  console.log(`Created admin user: ${adminUser.email}`);

  // Create sample coupons
  await Promise.all([
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
        discountValue: 500,
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

  console.log('Created sample coupons');

  // Create activities
  const activitiesData = [
    { type: 'MEMORY_CREATED', action: 'Created memory: Four Generations Photo' },
    { type: 'LETTER_CREATED', action: 'Created letter: To My Children' },
    { type: 'VOICE_RECORDED', action: 'Recorded: The Story of How We Met' },
    { type: 'LOGIN', action: 'Logged in from Chrome on macOS' },
    { type: 'SETTINGS_UPDATED', action: 'Updated notification preferences' },
  ];

  for (const a of activitiesData) {
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: a.type,
        action: a.action,
      },
    });
  }

  console.log(`Created ${activitiesData.length} activities`);

  console.log('\n========================================');
  console.log('SEEDING COMPLETE');
  console.log('========================================\n');
  console.log(`
Summary:
- 1 demo user (demo@heirloom.app / demo123456)
- 1 admin user (admin@heirloom.app / admin123456)
- ${familyMembers.length} family members
- ${memoriesData.length} memories spanning 10 years with images
- ${voiceRecordingsData.length} voice recordings
- 3 letters
- ${notificationsData.length} notifications
- Dead Man's Switch configured
- 3 legacy contacts
- 3 sample coupons

Demo credentials: demo@heirloom.app / demo123456
Admin credentials: admin@heirloom.app / admin123456
  `);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
