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

  // Create sample memories with pictures and voice notes
  await prisma.memory.createMany({
    data: [
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Summer at the lake house',
        description: 'The summer of 2023, when everyone came together. We spent two wonderful weeks at the cabin by the lake, swimming, fishing, and making memories that will last forever.',
        fileUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 245000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=60', width: 800, height: 600 },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Emma\'s graduation',
        description: 'So proud of how far she\'s come. Watching her walk across that stage was one of the proudest moments of my life.',
        fileUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 312000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60', width: 800, height: 533 },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Christmas morning 2022',
        description: 'The whole family gathered around the tree. Michael surprised us all with his homemade gifts that year.',
        fileUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 287000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&q=60', width: 800, height: 534 },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Our 25th anniversary',
        description: 'Twenty-five years of love, laughter, and adventure. We renewed our vows at the same chapel where it all began.',
        fileUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 198000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60', width: 800, height: 533 },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Family reunion at grandma\'s farm',
        description: 'Four generations together for the first time. Grandma Rose was so happy to see everyone.',
        fileUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 276000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=60', width: 800, height: 533 },
      },
      {
        userId: user.id,
        type: 'PHOTO',
        title: 'Beach vacation in Hawaii',
        description: 'Our dream trip finally came true. The kids loved learning to surf.',
        fileUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        mimeType: 'image/jpeg',
        fileSize: 234000,
        metadata: { thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60', width: 800, height: 533 },
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'The story of how we met',
        description: 'A recording for the grandchildren about how their grandparents fell in love at a small coffee shop in 1995.',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
        fileSize: 4500000,
        metadata: { 
          duration: 185,
          transcript: 'It was a rainy Tuesday afternoon in October 1995. I had just started my new job downtown and decided to duck into this little coffee shop to escape the rain. There she was, sitting by the window with a book in her hands - Pride and Prejudice, I later learned. Our eyes met, and I knew right then that my life was about to change forever. I gathered all my courage and asked if I could share her table. She smiled and said yes. We talked for three hours that day, and I knew I had found my soulmate.',
          waveform: [0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.2]
        },
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'Advice for my grandchildren',
        description: 'Life lessons I want to pass down to the next generation.',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        mimeType: 'audio/mpeg',
        fileSize: 3800000,
        metadata: { 
          duration: 142,
          transcript: 'My dear grandchildren, there are a few things I want you to always remember. First, be kind to everyone you meet - you never know what battles they are fighting. Second, never stop learning. The world is full of wonders waiting to be discovered. Third, cherish your family. They will be there for you when no one else will. Fourth, follow your dreams, but remember that the journey is just as important as the destination. And finally, always be true to yourself. The world needs your unique light.',
          waveform: [0.3, 0.5, 0.7, 0.6, 0.4, 0.8, 0.5, 0.3, 0.6, 0.4]
        },
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'My favorite childhood memory',
        description: 'Remembering summers at my grandmother\'s house.',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        mimeType: 'audio/mpeg',
        fileSize: 5200000,
        metadata: { 
          duration: 210,
          transcript: 'Every summer, my parents would send me to stay with my grandmother in the countryside. Those were the happiest days of my childhood. Grandma had this big old farmhouse with a wrap-around porch where we would sit and watch the fireflies at night. She taught me how to bake her famous apple pie, how to tend the garden, and how to find joy in the simple things. I can still smell the lavender that grew by her kitchen window. Those summers shaped who I am today, and I hope I have passed on some of that magic to all of you.',
          waveform: [0.4, 0.6, 0.5, 0.7, 0.8, 0.6, 0.4, 0.5, 0.7, 0.3]
        },
      },
      {
        userId: user.id,
        type: 'VOICE',
        title: 'A message for Emma on her wedding day',
        description: 'Words of love and wisdom for my daughter\'s special day.',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        mimeType: 'audio/mpeg',
        fileSize: 4100000,
        metadata: { 
          duration: 168,
          transcript: 'My beautiful Emma, today you begin a new chapter in your life. I remember the day you were born, how you looked up at me with those big curious eyes. Now you are a woman, about to start your own family. Marriage is a beautiful journey, but it takes work. Always communicate, even when it is hard. Never go to bed angry. Keep dating each other, even after fifty years. Support each other\'s dreams. And most importantly, never forget to laugh together. I am so proud of the woman you have become. I love you more than words can say.',
          waveform: [0.5, 0.7, 0.6, 0.8, 0.5, 0.4, 0.6, 0.7, 0.5, 0.3]
        },
      },
    ],
  });

  console.log('✅ Created sample memories with pictures and voice notes');

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
