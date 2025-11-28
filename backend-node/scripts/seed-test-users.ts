import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 8);
}

const SENTIMENT_LABELS = ['joyful', 'nostalgic', 'loving', 'hopeful', 'reflective'];
const MEMORY_TITLES = [
  'Family Reunion',
  'First Day of School',
  'Wedding Anniversary',
  'Birthday Celebration',
  'Summer Vacation',
  'Graduation Day',
  'Holiday Gathering',
  'New Home',
  'Baby\'s First Steps',
  'Retirement Party'
];

async function seedTestUsers() {
  console.log('🌱 Seeding 300 test users for simulation...');

  const testUsers: any[] = [];
  const password = await hashPassword('Test123456!');
  const salt = crypto.randomBytes(16).toString('hex');

  for (let i = 1; i <= 300; i++) {
    const email = `testuser${i}@simulation.test`;
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: password,
          salt,
          createdAt,
          status: 'alive',
          checkInIntervalDays: 90,
          nextCheckIn: new Date(Date.now() + Math.random() * 60 * 60 * 1000)
        }
      });

      const vmkSalt = crypto.randomBytes(16).toString('hex');
      const encryptedVmk = crypto.randomBytes(32).toString('hex');
      
      const vault = await prisma.vault.create({
        data: {
          userId: user.id,
          encryptedVmk,
          vmkSalt,
          uploadLimitWeekly: 50,
          uploadCountThisWeek: 0
        }
      });

      const memoryCount = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < memoryCount; j++) {
        const sentimentLabel = SENTIMENT_LABELS[Math.floor(Math.random() * SENTIMENT_LABELS.length)];
        const title = MEMORY_TITLES[Math.floor(Math.random() * MEMORY_TITLES.length)];
        
        const encryptedData = crypto.randomBytes(32).toString('hex');
        const encryptedDek = crypto.randomBytes(32).toString('hex');
        
        await prisma.vaultItem.create({
          data: {
            vaultId: vault.id,
            title: `${title} ${j + 1}`,
            type: 'photo',
            encryptedData,
            encryptedDek,
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-${j}/200/150`,
            sentimentLabel,
            emotionCategory: sentimentLabel,
            importanceScore: Math.floor(Math.random() * 10) + 1,
            recipientIds: [],
            createdAt: new Date(createdAt.getTime() + j * 24 * 60 * 60 * 1000)
          }
        });
      }

      testUsers.push({
        email,
        password: 'Test123456!',
        userId: user.id,
        vaultId: vault.id
      });

      if (i % 50 === 0) {
        console.log(`✅ Created ${i}/300 users...`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${i}:`, error);
    }
  }

  fs.writeFileSync(
    '/tmp/test-users.json',
    JSON.stringify(testUsers, null, 2)
  );

  console.log('✅ Seeded 300 test users successfully!');
  console.log('📝 Credentials saved to /tmp/test-users.json');
  console.log(`📊 Total users: ${testUsers.length}`);
  console.log(`📊 Total memories: ${testUsers.length * 5} (avg)`);
}

seedTestUsers()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
