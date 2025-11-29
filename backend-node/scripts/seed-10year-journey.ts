import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 8);
}

// AI Classification categories
const SENTIMENT_LABELS = ['joyful', 'nostalgic', 'loving', 'hopeful', 'reflective', 'grateful', 'peaceful', 'excited'];
const EMOTION_CATEGORIES = ['happiness', 'love', 'pride', 'gratitude', 'nostalgia', 'peace', 'excitement', 'wonder'];

// Comprehensive memory titles for 10 years
const MEMORY_CATEGORIES = {
  family: [
    'Family Reunion', 'Sunday Dinner', 'Game Night', 'Movie Night', 'Beach Day',
    'Picnic in the Park', 'Family BBQ', 'Holiday Gathering', 'Birthday Party', 'Anniversary Celebration'
  ],
  milestones: [
    'First Day of School', 'Graduation Day', 'First Job', 'Promotion', 'New Home',
    'Wedding Day', 'Baby\'s First Steps', 'First Words', 'Retirement', 'Achievement Award'
  ],
  travel: [
    'Summer Vacation', 'Road Trip', 'Beach Holiday', 'Mountain Getaway', 'City Tour',
    'International Trip', 'Weekend Escape', 'Camping Adventure', 'Cruise', 'Safari'
  ],
  hobbies: [
    'Art Project', 'Music Performance', 'Sports Game', 'Cooking Together', 'Gardening',
    'Photography Session', 'Craft Day', 'Book Club', 'Dance Class', 'Yoga Retreat'
  ],
  celebrations: [
    'New Year\'s Eve', 'Christmas', 'Thanksgiving', 'Easter', 'Halloween',
    'Valentine\'s Day', 'Mother\'s Day', 'Father\'s Day', 'Independence Day', 'Birthday'
  ]
};

// Stock image seeds for consistent, beautiful images
const STOCK_IMAGE_CATEGORIES = {
  family: ['family-portrait', 'family-dinner', 'family-playing', 'family-laughing', 'family-hugging'],
  nature: ['sunset', 'beach', 'mountains', 'forest', 'flowers'],
  celebration: ['birthday-cake', 'party', 'celebration', 'fireworks', 'balloons'],
  travel: ['vacation', 'travel', 'adventure', 'landscape', 'cityscape'],
  food: ['dinner', 'cooking', 'meal', 'restaurant', 'picnic']
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getStockImageUrl(category: string, seed: string): string {
  const width = 800;
  const height = 600;
  return `https://picsum.photos/seed/${seed}-${category}/800/600`;
}

async function seed10YearJourney() {
  console.log('🌱 Creating 10-year user journey with twice-weekly reminders...');

  const email = 'journey10year@vault.com';
  const password = await hashPassword('Test123456!');
  const salt = crypto.randomBytes(16).toString('hex');

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: password,
      salt,
      createdAt: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000), // 10 years ago
      status: 'alive',
      checkInIntervalDays: 3.5, // Twice weekly (every 3.5 days)
      nextCheckIn: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000)
    }
  });

  const vmkSalt = crypto.randomBytes(16).toString('hex');
  const encryptedVmk = crypto.randomBytes(32).toString('hex');
  
  const vault = await prisma.vault.create({
    data: {
      userId: user.id,
      encryptedVmk,
      vmkSalt,
      uploadLimitWeekly: 100,
      uploadCountThisWeek: 0
    }
  });

  console.log('✅ Created user and vault');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: Test123456!`);

  // Generate memories over 10 years (twice weekly = ~1040 memories)
  const startDate = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const memoriesPerWeek = 2;
  const totalMemories = Math.floor((totalDays / 7) * memoriesPerWeek);

  console.log(`📊 Generating ${totalMemories} memories over ${totalDays} days (${Math.floor(totalDays / 365)} years)`);

  let memoryCount = 0;
  const allCategories = Object.keys(MEMORY_CATEGORIES);

  for (let day = 0; day < totalDays; day += 3.5) {
    // Create memory twice a week
    const memoryDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    
    // Pick random category and title
    const category = getRandomElement(allCategories);
    const titles = MEMORY_CATEGORIES[category as keyof typeof MEMORY_CATEGORIES];
    const title = getRandomElement(titles);
    
    // Pick random sentiment and emotion
    const sentimentLabel = getRandomElement(SENTIMENT_LABELS);
    const emotionCategory = getRandomElement(EMOTION_CATEGORIES);
    
    // Pick random stock image category
    const imageCategory = getRandomElement(Object.keys(STOCK_IMAGE_CATEGORIES));
    const imageSeed = `${user.id}-${memoryCount}-${imageCategory}`;
    const thumbnailUrl = getStockImageUrl(imageCategory, imageSeed);
    
    // Generate importance score (higher for milestones)
    const importanceScore = category === 'milestones' 
      ? Math.floor(Math.random() * 3) + 8  // 8-10 for milestones
      : Math.floor(Math.random() * 7) + 3; // 3-9 for others
    
    const encryptedData = crypto.randomBytes(32).toString('hex');
    const encryptedDek = crypto.randomBytes(32).toString('hex');
    
    await prisma.vaultItem.create({
      data: {
        vaultId: vault.id,
        title: `${title} - ${memoryDate.getFullYear()}`,
        type: 'photo',
        encryptedData,
        encryptedDek,
        thumbnailUrl,
        sentimentLabel,
        emotionCategory,
        importanceScore,
        recipientIds: [],
        createdAt: memoryDate
      }
    });

    memoryCount++;

    if (memoryCount % 100 === 0) {
      console.log(`✅ Created ${memoryCount}/${totalMemories} memories...`);
    }
  }

  console.log('✅ Seeded 10-year journey successfully!');
  console.log(`📊 Total memories: ${memoryCount}`);
  console.log(`📊 Average per week: ${(memoryCount / (totalDays / 7)).toFixed(1)}`);
  console.log(`📊 Average per month: ${(memoryCount / (totalDays / 30)).toFixed(1)}`);
  console.log(`📊 Average per year: ${(memoryCount / (totalDays / 365)).toFixed(1)}`);
  
  // Create check-in reminders history
  console.log('📅 Creating check-in reminder history...');
  let reminderCount = 0;
  for (let day = 0; day < totalDays; day += 3.5) {
    const reminderDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'check_in_reminder',
        properties: {
          date: reminderDate.toISOString(),
          status: 'sent'
        },
        createdAt: reminderDate
      }
    });
    
    reminderCount++;
  }
  
  console.log(`✅ Created ${reminderCount} check-in reminders (twice weekly)`);

  const summary = {
    email,
    password: 'Test123456!',
    userId: user.id,
    vaultId: vault.id,
    totalMemories: memoryCount,
    totalReminders: reminderCount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    yearsOfData: Math.floor(totalDays / 365)
  };

  fs.writeFileSync(
    '/tmp/10year-journey.json',
    JSON.stringify(summary, null, 2)
  );

  console.log('📝 Journey summary saved to /tmp/10year-journey.json');
}

seed10YearJourney()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
