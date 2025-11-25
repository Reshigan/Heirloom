/**
 * Migration script for private vault pivot
 * 
 * This script:
 * 1. Removes shared memory data (recipientIds arrays)
 * 2. Creates Person(self) for each user
 * 3. Sets all vault items to PRIVATE visibility
 * 4. Creates default LegacyPolicy for each user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting private vault migration...\n');

  console.log('Step 1: Clearing recipientIds from vault items...');
  const updateResult = await prisma.vaultItem.updateMany({
    data: {
      recipientIds: [],
    },
  });
  console.log(`✓ Cleared recipientIds from ${updateResult.count} vault items\n`);

  console.log('Step 2: Creating Person(self) for each user...');
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  let selfPersonsCreated = 0;
  for (const user of users) {
    const existingSelf = await prisma.person.findFirst({
      where: {
        ownerId: user.id,
        relation: 'self',
      },
    });

    if (!existingSelf) {
      await prisma.person.create({
        data: {
          ownerId: user.id,
          name: user.email.split('@')[0], // Use email prefix as default name
          relation: 'self',
        },
      });
      selfPersonsCreated++;
    }
  }
  console.log(`✓ Created ${selfPersonsCreated} Person(self) records\n`);

  console.log('Step 3: Creating default LegacyPolicy for each user...');
  let policiesCreated = 0;
  for (const user of users) {
    const existingPolicy = await prisma.legacyPolicy.findUnique({
      where: { ownerId: user.id },
    });

    if (!existingPolicy) {
      await prisma.legacyPolicy.create({
        data: {
          ownerId: user.id,
          rules: {
            defaultUnlockGroup: 'immediate_family',
            includePeopleIds: [],
            excludePeopleIds: [],
            memoryFilters: {
              visibility: 'POSTHUMOUS',
            },
          },
          gracePeriodDays: 14,
        },
      });
      policiesCreated++;
    }
  }
  console.log(`✓ Created ${policiesCreated} LegacyPolicy records\n`);

  const recipientCount = await prisma.recipient.count();
  console.log(`Note: ${recipientCount} recipient records exist (will not be used in private vault mode)\n`);

  console.log('Migration complete! ✓');
  console.log('\nSummary:');
  console.log(`- Cleared recipientIds from ${updateResult.count} vault items`);
  console.log(`- Created ${selfPersonsCreated} Person(self) records`);
  console.log(`- Created ${policiesCreated} LegacyPolicy records`);
  console.log(`- ${recipientCount} recipient records remain (unused)`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
