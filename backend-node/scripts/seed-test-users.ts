import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

const prisma = new PrismaClient();

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
  const password = await bcrypt.hash('Test123456!', 10);

  for (let i = 1; i <= 300; i++) {
    const email = `testuser${i}@simulation.test`;
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password,
          createdAt,
          status: 'alive',
          checkInFrequency: 90, // 90 days normally, but will be compressed in test
          nextCheckIn: new Date(Date.now() + Math.random() * 60 * 60 * 1000), // Next 60 minutes
          notificationSettings: {
            weekly_digest: true,
            daily_reminders: true,
            new_comments: true,
            new_memories: true,
            birthdays: true,
            anniversaries: true,
            story_prompts: true,
            family_activity: true,
            email_notifications: true,
            push_notifications: true
          }
        }
      });

      const vault = await prisma.vault.create({
        data: {
          userId: user.id,
          name: `${user.email}'s Vault`,
          uploadLimit: 50,
          uploadCountThisWeek: 0
        }
      });

      const memoryCount = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < memoryCount; j++) {
        const sentimentLabel = SENTIMENT_LABELS[Math.floor(Math.random() * SENTIMENT_LABELS.length)];
        const title = MEMORY_TITLES[Math.floor(Math.random() * MEMORY_TITLES.length)];
        
        await prisma.vaultItem.create({
          data: {
            vaultId: vault.id,
            title: `${title} ${j + 1}`,
            description: `A cherished memory from the past`,
            type: 'photo',
            mediaUrl: `https://picsum.photos/seed/${user.id}-${j}/800/600`,
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-${j}/200/150`,
            sentimentLabel,
            emotionCategory: sentimentLabel,
            importanceScore: Math.floor(Math.random() * 10) + 1,
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
