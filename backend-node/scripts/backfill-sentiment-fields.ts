import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEYWORDS_BY_CATEGORY = {
  family: ['family', 'together', 'love', 'home', 'bonding', 'memories', 'laughter', 'joy'],
  milestones: ['achievement', 'proud', 'success', 'milestone', 'celebration', 'growth', 'journey', 'special'],
  travel: ['adventure', 'explore', 'discover', 'journey', 'beautiful', 'experience', 'memories', 'wanderlust'],
  hobbies: ['passion', 'creative', 'fun', 'relaxing', 'fulfilling', 'enjoyment', 'skill', 'hobby'],
  celebrations: ['celebration', 'joy', 'festive', 'special', 'happy', 'memorable', 'tradition', 'gathering']
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function inferCategoryFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('family') || lowerTitle.includes('reunion') || lowerTitle.includes('dinner') || lowerTitle.includes('game night') || lowerTitle.includes('movie night')) {
    return 'family';
  } else if (lowerTitle.includes('graduation') || lowerTitle.includes('job') || lowerTitle.includes('promotion') || lowerTitle.includes('wedding') || lowerTitle.includes('achievement')) {
    return 'milestones';
  } else if (lowerTitle.includes('vacation') || lowerTitle.includes('trip') || lowerTitle.includes('travel') || lowerTitle.includes('cruise') || lowerTitle.includes('safari')) {
    return 'travel';
  } else if (lowerTitle.includes('art') || lowerTitle.includes('music') || lowerTitle.includes('sports') || lowerTitle.includes('cooking') || lowerTitle.includes('gardening')) {
    return 'hobbies';
  } else if (lowerTitle.includes('christmas') || lowerTitle.includes('birthday') || lowerTitle.includes('thanksgiving') || lowerTitle.includes('halloween') || lowerTitle.includes('celebration')) {
    return 'celebrations';
  }
  
  return 'family';
}

async function backfillSentimentFields() {
  console.log('🔄 Backfilling sentiment fields for 10-year journey user...');
  
  const targetEmail = 'journey10year@vault.com';
  
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      vault: {
        include: {
          items: {
            where: {
              OR: [
                { sentimentScore: null },
                { keywords: { isEmpty: true } }
              ]
            }
          }
        }
      }
    }
  });

  if (!user || !user.vault) {
    console.log('❌ User or vault not found');
    return;
  }

  console.log(`📊 Found ${user.vault.items.length} memories to backfill`);

  let updateCount = 0;
  const positiveSentiments = ['joyful', 'hopeful', 'grateful', 'excited', 'loving'];

  for (const item of user.vault.items) {
    const sentimentLabel = item.sentimentLabel || 'joyful';
    
    const baseSentimentScore = positiveSentiments.includes(sentimentLabel) 
      ? 0.6 + Math.random() * 0.35
      : 0.3 + Math.random() * 0.5;
    const sentimentScore = Math.round(baseSentimentScore * 100) / 100;
    
    const category = inferCategoryFromTitle(item.title || '');
    const categoryKeywords = KEYWORDS_BY_CATEGORY[category as keyof typeof KEYWORDS_BY_CATEGORY];
    const numKeywords = 2 + Math.floor(Math.random() * 3);
    const keywords: string[] = [];
    const shuffledKeywords = [...categoryKeywords].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numKeywords && i < shuffledKeywords.length; i++) {
      keywords.push(shuffledKeywords[i]);
    }

    await prisma.vaultItem.update({
      where: { id: item.id },
      data: {
        sentimentScore,
        keywords
      }
    });

    updateCount++;
    if (updateCount % 100 === 0) {
      console.log(`✅ Updated ${updateCount}/${user.vault.items.length} memories...`);
    }
  }

  console.log(`✅ Backfill complete! Updated ${updateCount} memories`);
}

backfillSentimentFields()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
