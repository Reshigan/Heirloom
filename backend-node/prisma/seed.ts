import { PrismaClient, Visibility } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'test@heirloom.app';
const TEST_USER_PASSWORD = 'Test123456!';

const memoriesByDecade = [
  {
    decade: '1920s',
    memories: [
      {
        title: 'Great Grandparents Wedding Day',
        description: 'A beautiful ceremony at the old church downtown. The whole family gathered to celebrate their union.',
        date: new Date('1923-06-15'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 0.9,
        emotionCategory: 'celebration',
        importanceScore: 10,
        keywords: ['wedding', 'family', 'celebration', 'church'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      },
      {
        title: 'First Family Home',
        description: 'The house where it all began. A modest home filled with love and laughter.',
        date: new Date('1925-03-20'),
        type: 'photo',
        sentimentLabel: 'nostalgic',
        sentimentScore: 0.7,
        emotionCategory: 'home',
        importanceScore: 9,
        keywords: ['home', 'family', 'beginning', 'heritage'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      },
      {
        title: 'Sunday Family Gatherings',
        description: 'Every Sunday, the family would gather for dinner. These moments shaped who we are.',
        date: new Date('1927-08-10'),
        type: 'photo',
        sentimentLabel: 'happy',
        sentimentScore: 0.85,
        emotionCategory: 'family',
        importanceScore: 8,
        keywords: ['family', 'tradition', 'dinner', 'togetherness'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      },
    ],
  },
  {
    decade: '1930s',
    memories: [
      {
        title: 'Grandpa\'s First Job',
        description: 'Started working at the factory to support the family during tough times.',
        date: new Date('1932-04-05'),
        type: 'document',
        sentimentLabel: 'determined',
        sentimentScore: 0.6,
        emotionCategory: 'work',
        importanceScore: 8,
        keywords: ['work', 'perseverance', 'family', 'responsibility'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
      },
      {
        title: 'Family Farm Memories',
        description: 'Summer days spent on the family farm. Learning the value of hard work and nature.',
        date: new Date('1935-07-22'),
        type: 'photo',
        sentimentLabel: 'nostalgic',
        sentimentScore: 0.75,
        emotionCategory: 'nature',
        importanceScore: 7,
        keywords: ['farm', 'summer', 'childhood', 'nature'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
      },
      {
        title: 'Grandma\'s Recipe Book',
        description: 'Handwritten recipes passed down through generations. Each dish tells a story.',
        date: new Date('1938-11-30'),
        type: 'document',
        sentimentLabel: 'loving',
        sentimentScore: 0.8,
        emotionCategory: 'tradition',
        importanceScore: 9,
        keywords: ['recipes', 'tradition', 'cooking', 'heritage'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400',
      },
    ],
  },
  {
    decade: '1940s',
    memories: [
      {
        title: 'Letters from the War',
        description: 'Precious letters sent home during difficult times. A testament to love and hope.',
        date: new Date('1943-09-12'),
        type: 'letter',
        sentimentLabel: 'hopeful',
        sentimentScore: 0.65,
        emotionCategory: 'correspondence',
        importanceScore: 10,
        keywords: ['war', 'letters', 'hope', 'family'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
      },
      {
        title: 'Victory Celebration',
        description: 'The day the war ended. Joy and relief filled every heart.',
        date: new Date('1945-05-08'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 0.95,
        emotionCategory: 'celebration',
        importanceScore: 10,
        keywords: ['victory', 'celebration', 'peace', 'joy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
      },
      {
        title: 'New Beginnings',
        description: 'Starting fresh after the war. Building a future for the next generation.',
        date: new Date('1947-03-15'),
        type: 'photo',
        sentimentLabel: 'hopeful',
        sentimentScore: 0.8,
        emotionCategory: 'new beginnings',
        importanceScore: 8,
        keywords: ['hope', 'future', 'family', 'rebuilding'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
      },
    ],
  },
  {
    decade: '1950s',
    memories: [
      {
        title: 'Mom\'s First Day of School',
        description: 'A proud moment as she started her education journey.',
        date: new Date('1952-09-01'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.85,
        emotionCategory: 'education',
        importanceScore: 8,
        keywords: ['school', 'education', 'childhood', 'pride'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      },
      {
        title: 'Family Road Trip',
        description: 'Our first big adventure across the country. Memories made along the way.',
        date: new Date('1955-07-20'),
        type: 'photo',
        sentimentLabel: 'adventurous',
        sentimentScore: 0.9,
        emotionCategory: 'travel',
        importanceScore: 7,
        keywords: ['travel', 'adventure', 'family', 'road trip'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      },
      {
        title: 'Grandparents\' Anniversary',
        description: '25 years of love and commitment. A celebration of enduring partnership.',
        date: new Date('1958-06-15'),
        type: 'photo',
        sentimentLabel: 'loving',
        sentimentScore: 0.9,
        emotionCategory: 'anniversary',
        importanceScore: 9,
        keywords: ['anniversary', 'love', 'marriage', 'celebration'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
      },
    ],
  },
  {
    decade: '1960s',
    memories: [
      {
        title: 'Dad\'s High School Graduation',
        description: 'A milestone achievement. The first in the family to graduate high school.',
        date: new Date('1962-06-10'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.9,
        emotionCategory: 'achievement',
        importanceScore: 9,
        keywords: ['graduation', 'achievement', 'education', 'pride'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
      },
      {
        title: 'Summer at the Lake',
        description: 'Endless summer days swimming and fishing. Simple joys that lasted a lifetime.',
        date: new Date('1965-08-15'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 0.85,
        emotionCategory: 'recreation',
        importanceScore: 7,
        keywords: ['summer', 'lake', 'swimming', 'childhood'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
      },
      {
        title: 'Family Business Opens',
        description: 'Opening day of our family store. A dream realized through hard work.',
        date: new Date('1968-04-20'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.9,
        emotionCategory: 'business',
        importanceScore: 10,
        keywords: ['business', 'entrepreneurship', 'family', 'achievement'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      },
    ],
  },
  {
    decade: '1970s',
    memories: [
      {
        title: 'Parents\' Wedding',
        description: 'The day my parents said "I do". The beginning of our immediate family.',
        date: new Date('1972-05-27'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 0.95,
        emotionCategory: 'wedding',
        importanceScore: 10,
        keywords: ['wedding', 'parents', 'love', 'family'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
      },
      {
        title: 'First Family Pet',
        description: 'Max, our golden retriever. He was more than a pet, he was family.',
        date: new Date('1975-03-10'),
        type: 'photo',
        sentimentLabel: 'loving',
        sentimentScore: 0.85,
        emotionCategory: 'pets',
        importanceScore: 7,
        keywords: ['pet', 'dog', 'family', 'love'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      },
      {
        title: 'Neighborhood Block Party',
        description: 'When communities were close-knit. Everyone knew everyone.',
        date: new Date('1978-07-04'),
        type: 'photo',
        sentimentLabel: 'happy',
        sentimentScore: 0.8,
        emotionCategory: 'community',
        importanceScore: 6,
        keywords: ['community', 'neighbors', 'celebration', 'friendship'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      },
    ],
  },
  {
    decade: '1980s',
    memories: [
      {
        title: 'My Birth',
        description: 'The day I entered this world. A new chapter for our family.',
        date: new Date('1982-11-15'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 1.0,
        emotionCategory: 'birth',
        importanceScore: 10,
        keywords: ['birth', 'baby', 'family', 'new life'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
      },
      {
        title: 'First Steps',
        description: 'Learning to walk. Mom captured this precious moment on camera.',
        date: new Date('1983-09-20'),
        type: 'video',
        sentimentLabel: 'proud',
        sentimentScore: 0.9,
        emotionCategory: 'milestone',
        importanceScore: 9,
        keywords: ['milestone', 'childhood', 'first steps', 'growth'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
      },
      {
        title: 'Family Vacation to Disney',
        description: 'The most magical trip of my childhood. Pure wonder and joy.',
        date: new Date('1987-06-25'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 0.95,
        emotionCategory: 'vacation',
        importanceScore: 8,
        keywords: ['vacation', 'disney', 'childhood', 'magic'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      },
    ],
  },
  {
    decade: '1990s',
    memories: [
      {
        title: 'First Day of Middle School',
        description: 'Nervous but excited. The beginning of teenage years.',
        date: new Date('1993-09-07'),
        type: 'photo',
        sentimentLabel: 'nervous',
        sentimentScore: 0.5,
        emotionCategory: 'education',
        importanceScore: 7,
        keywords: ['school', 'teenager', 'education', 'growth'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
      },
      {
        title: 'Learning to Drive',
        description: 'Dad teaching me to drive. A rite of passage and bonding moment.',
        date: new Date('1998-07-15'),
        type: 'photo',
        sentimentLabel: 'excited',
        sentimentScore: 0.85,
        emotionCategory: 'milestone',
        importanceScore: 8,
        keywords: ['driving', 'independence', 'father', 'milestone'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
      },
      {
        title: 'High School Graduation',
        description: 'Walking across that stage. Ready to take on the world.',
        date: new Date('1999-06-12'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.9,
        emotionCategory: 'graduation',
        importanceScore: 10,
        keywords: ['graduation', 'achievement', 'education', 'future'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1627556704302-624286467c65?w=400',
      },
    ],
  },
  {
    decade: '2000s',
    memories: [
      {
        title: 'College Years',
        description: 'Finding myself and lifelong friends. The best years of growth.',
        date: new Date('2002-09-15'),
        type: 'photo',
        sentimentLabel: 'nostalgic',
        sentimentScore: 0.8,
        emotionCategory: 'education',
        importanceScore: 9,
        keywords: ['college', 'friends', 'growth', 'education'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400',
      },
      {
        title: 'First Job',
        description: 'Starting my career. Nervous but determined to succeed.',
        date: new Date('2005-08-01'),
        type: 'photo',
        sentimentLabel: 'determined',
        sentimentScore: 0.75,
        emotionCategory: 'career',
        importanceScore: 8,
        keywords: ['career', 'work', 'achievement', 'independence'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400',
      },
      {
        title: 'Meeting My Partner',
        description: 'The day I met the love of my life. Everything changed.',
        date: new Date('2008-03-14'),
        type: 'photo',
        sentimentLabel: 'loving',
        sentimentScore: 1.0,
        emotionCategory: 'romance',
        importanceScore: 10,
        keywords: ['love', 'romance', 'partner', 'relationship'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
      },
    ],
  },
  {
    decade: '2010s',
    memories: [
      {
        title: 'Our Wedding Day',
        description: 'Surrounded by loved ones, we promised forever. The happiest day.',
        date: new Date('2012-06-23'),
        type: 'photo',
        sentimentLabel: 'joyful',
        sentimentScore: 1.0,
        emotionCategory: 'wedding',
        importanceScore: 10,
        keywords: ['wedding', 'marriage', 'love', 'celebration'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      },
      {
        title: 'First Child Born',
        description: 'Becoming a parent. The most profound love I\'ve ever known.',
        date: new Date('2015-04-10'),
        type: 'photo',
        sentimentLabel: 'loving',
        sentimentScore: 1.0,
        emotionCategory: 'birth',
        importanceScore: 10,
        keywords: ['baby', 'parent', 'birth', 'family'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400',
      },
      {
        title: 'Family Home Purchase',
        description: 'Bought our forever home. A place to build memories.',
        date: new Date('2018-09-30'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.9,
        emotionCategory: 'home',
        importanceScore: 9,
        keywords: ['home', 'house', 'family', 'achievement'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
      },
    ],
  },
  {
    decade: '2020s',
    memories: [
      {
        title: 'Pandemic Family Time',
        description: 'Difficult times brought us closer. Learning what truly matters.',
        date: new Date('2020-05-15'),
        type: 'photo',
        sentimentLabel: 'reflective',
        sentimentScore: 0.6,
        emotionCategory: 'family',
        importanceScore: 8,
        keywords: ['pandemic', 'family', 'togetherness', 'resilience'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
      },
      {
        title: 'Child\'s First Day of School',
        description: 'Watching them grow up. Pride mixed with bittersweet emotions.',
        date: new Date('2022-09-06'),
        type: 'photo',
        sentimentLabel: 'proud',
        sentimentScore: 0.85,
        emotionCategory: 'milestone',
        importanceScore: 9,
        keywords: ['school', 'child', 'milestone', 'growth'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      },
      {
        title: 'Creating This Legacy',
        description: 'Preserving our family memories for future generations. A gift of love.',
        date: new Date('2025-11-27'),
        type: 'document',
        sentimentLabel: 'hopeful',
        sentimentScore: 0.9,
        emotionCategory: 'legacy',
        importanceScore: 10,
        keywords: ['legacy', 'memories', 'future', 'preservation'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=400',
      },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, salt);

  const user = await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    update: {},
    create: {
      email: TEST_USER_EMAIL,
      passwordHash,
      salt,
      status: 'alive',
      checkInIntervalDays: 90,
      nextCheckIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ User created/found: ${user.email}`);

  const vault = await prisma.vault.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      encryptedVmk: 'dummy_encrypted_vmk_for_seed',
      vmkSalt: '57d77f58c874b3b522441fc321981cd9',
      tier: 'family',
      storageLimitBytes: BigInt(107374182400), // 100GB for testing
      uploadLimitWeekly: 100,
    },
  });

  console.log(`✅ Vault created/found: ${vault.id}`);

  let totalMemories = 0;
  for (const decadeData of memoriesByDecade) {
    console.log(`\n📅 Seeding ${decadeData.decade} memories...`);
    
    for (const memory of decadeData.memories) {
      const vaultItem = await prisma.vaultItem.create({
        data: {
          vaultId: vault.id,
          type: memory.type,
          title: memory.title,
          encryptedData: JSON.stringify({
            description: memory.description,
            date: memory.date.toISOString(),
          }),
          encryptedDek: 'dummy_encrypted_dek_for_seed',
          thumbnailUrl: memory.thumbnailUrl,
          fileSizeBytes: BigInt(Math.floor(Math.random() * 5000000) + 100000), // Random size 100KB-5MB
          recipientIds: [],
          emotionCategory: memory.emotionCategory,
          importanceScore: memory.importanceScore,
          sentimentScore: memory.sentimentScore,
          sentimentLabel: memory.sentimentLabel,
          keywords: memory.keywords,
          aiSummary: memory.description,
          visibility: Visibility.PRIVATE,
          createdAt: memory.date,
          updatedAt: memory.date,
        },
      });

      totalMemories++;
      console.log(`  ✓ ${memory.title}`);
    }
  }

  console.log(`\n✅ Seeded ${totalMemories} memories across ${memoriesByDecade.length} decades`);
  console.log(`\n🎉 Seed completed successfully!`);
  console.log(`\nTest user credentials:`);
  console.log(`  Email: ${TEST_USER_EMAIL}`);
  console.log(`  Password: ${TEST_USER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
