import { PrismaClient, MemoryType, SubscriptionTier, FamilyRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Sample family data for realistic testing
const SAMPLE_FAMILIES = [
  {
    name: "The Hamilton Legacy",
    description: "Four generations of memories, stories, and love",
    members: [
      {
        firstName: "Eleanor",
        lastName: "Hamilton",
        email: "eleanor@hamilton.family",
        role: "OWNER" as FamilyRole,
        dateOfBirth: new Date("1945-03-15"),
        bio: "Grandmother, storyteller, and keeper of family traditions"
      },
      {
        firstName: "Robert",
        lastName: "Hamilton", 
        email: "robert@hamilton.family",
        role: "ADMIN" as FamilyRole,
        dateOfBirth: new Date("1970-08-22"),
        bio: "Father, photographer, and family historian"
      },
      {
        firstName: "Sarah",
        lastName: "Hamilton",
        email: "sarah@hamilton.family", 
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("1972-11-10"),
        bio: "Mother, writer, and memory keeper"
      },
      {
        firstName: "Emma",
        lastName: "Hamilton",
        email: "emma@hamilton.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("1998-05-18"),
        bio: "Daughter, artist, and digital native"
      },
      {
        firstName: "James",
        lastName: "Hamilton",
        email: "james@hamilton.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("2000-12-03"),
        bio: "Son, musician, and tech enthusiast"
      }
    ]
  },
  {
    name: "The Chen Chronicles", 
    description: "A modern family bridging cultures and generations",
    members: [
      {
        firstName: "Wei",
        lastName: "Chen",
        email: "wei@chen.family",
        role: "OWNER" as FamilyRole,
        dateOfBirth: new Date("1965-07-08"),
        bio: "Immigrant, entrepreneur, and proud father"
      },
      {
        firstName: "Lisa",
        lastName: "Chen",
        email: "lisa@chen.family",
        role: "ADMIN" as FamilyRole,
        dateOfBirth: new Date("1968-02-14"),
        bio: "Teacher, community leader, and cultural bridge"
      },
      {
        firstName: "David",
        lastName: "Chen",
        email: "david@chen.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("1995-09-25"),
        bio: "Software engineer and first-generation college graduate"
      },
      {
        firstName: "Amy",
        lastName: "Chen",
        email: "amy@chen.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("1997-04-12"),
        bio: "Medical student and volunteer"
      }
    ]
  },
  {
    name: "The Johnson Journey",
    description: "Stories of resilience, love, and triumph",
    members: [
      {
        firstName: "Marcus",
        lastName: "Johnson",
        email: "marcus@johnson.family",
        role: "OWNER" as FamilyRole,
        dateOfBirth: new Date("1975-01-20"),
        bio: "Single father, coach, and community mentor"
      },
      {
        firstName: "Zoe",
        lastName: "Johnson",
        email: "zoe@johnson.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("2005-06-30"),
        bio: "High school student, athlete, and aspiring journalist"
      },
      {
        firstName: "Tyler",
        lastName: "Johnson",
        email: "tyler@johnson.family",
        role: "MEMBER" as FamilyRole,
        dateOfBirth: new Date("2008-11-15"),
        bio: "Middle schooler, gamer, and future scientist"
      }
    ]
  }
];

// Sample memories with realistic content
const SAMPLE_MEMORIES = [
  // Hamilton Family Memories
  {
    title: "Eleanor's 80th Birthday Celebration",
    description: "A beautiful family gathering to celebrate Grandma Eleanor's milestone birthday",
    content: "The whole family came together at the old family home. Eleanor wore her favorite blue dress, the same one from her 50th anniversary. The grandchildren performed a song they wrote just for her, and there wasn't a dry eye in the room. She told stories about growing up during the war, and we all felt so connected to our history.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-03-15"),
    location: "Hamilton Family Home, Portland, Oregon",
    tags: ["birthday", "family gathering", "milestone", "grandmother", "celebration"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/eleanor-80th-1.jpg", "https://example.com/photos/eleanor-80th-2.jpg"],
    thumbnailUrl: "https://example.com/photos/eleanor-80th-thumb.jpg"
  },
  {
    title: "Emma's Art School Graduation",
    description: "Emma graduated from art school with honors, fulfilling her lifelong dream",
    content: "After four years of hard work, late nights, and countless sketches, Emma finally walked across that stage. Her final portfolio was a series of family portraits that captured each of us in our most authentic moments. Mom cried, Dad beamed with pride, and Grandma Eleanor said it was the most beautiful thing she'd ever seen.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-05-20"),
    location: "Portland Art Institute",
    tags: ["graduation", "achievement", "art", "education", "pride"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/emma-graduation.jpg"],
    thumbnailUrl: "https://example.com/photos/emma-graduation-thumb.jpg"
  },
  {
    title: "Family Camping Trip to Crater Lake",
    description: "Our annual summer camping adventure to one of Oregon's most beautiful places",
    content: "This year's camping trip was extra special because it was James's first time driving to the campsite. We set up our tents by the lake, roasted marshmallows, and told ghost stories. Emma sketched the sunset while James played his guitar. These are the moments that make us who we are as a family.",
    type: "PHOTO" as MemoryType,
    date: new Date("2023-07-15"),
    location: "Crater Lake National Park, Oregon",
    tags: ["camping", "nature", "family time", "adventure", "summer"],
    importance: 4,
    mediaUrls: ["https://example.com/photos/crater-lake-1.jpg", "https://example.com/photos/crater-lake-2.jpg"],
    thumbnailUrl: "https://example.com/photos/crater-lake-thumb.jpg"
  },
  {
    title: "Robert's Retirement Party",
    description: "Celebrating Dad's 30-year career and the beginning of his next chapter",
    content: "After three decades of dedicated service, Dad finally retired. His colleagues threw him a surprise party, and we were all there to celebrate. He gave a speech about how work was important, but family was everything. Now he's excited to spend more time with his grandchildren and maybe write that book he's always talked about.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-09-10"),
    location: "Hamilton & Associates Office",
    tags: ["retirement", "career", "celebration", "new chapter", "family"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/robert-retirement.jpg"],
    thumbnailUrl: "https://example.com/photos/robert-retirement-thumb.jpg"
  },
  {
    title: "Sarah's First Published Novel",
    description: "Mom's lifelong dream of becoming a published author finally came true",
    content: "The package arrived on a Tuesday morning - a box of Sarah's first published novels. She held the book with trembling hands, running her fingers over her name on the cover. 'The Stories We Keep' - a novel about family secrets and the power of truth. We're all so proud of her perseverance and talent.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-11-08"),
    location: "Hamilton Family Home",
    tags: ["achievement", "writing", "dreams", "publication", "success"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/sarah-book.jpg"],
    thumbnailUrl: "https://example.com/photos/sarah-book-thumb.jpg"
  },

  // Chen Family Memories
  {
    title: "Wei's Citizenship Ceremony",
    description: "After 25 years in America, Wei finally became a U.S. citizen",
    content: "It was an emotional day for our entire family. Wei had worked so hard for this moment, studying for the test while running his restaurant. When he raised his right hand and took the oath, we all felt the weight of his journey. From a young man with nothing but dreams to a proud American citizen - this is what the American dream looks like.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-04-12"),
    location: "Federal Building, San Francisco",
    tags: ["citizenship", "immigration", "achievement", "american dream", "pride"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/wei-citizenship.jpg"],
    thumbnailUrl: "https://example.com/photos/wei-citizenship-thumb.jpg"
  },
  {
    title: "David's First Job at Tech Startup",
    description: "David landed his dream job as a software engineer at a promising startup",
    content: "All those late nights coding and studying finally paid off. David got the call on a Friday afternoon - he got the job! The startup is working on AI technology that could change how we interact with computers. He's nervous but excited to be part of something innovative. We celebrated with his favorite dumplings from Dad's restaurant.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-06-01"),
    location: "Chen Family Restaurant",
    tags: ["career", "technology", "achievement", "first job", "celebration"],
    importance: 4,
    mediaUrls: ["https://example.com/photos/david-job-celebration.jpg"],
    thumbnailUrl: "https://example.com/photos/david-job-thumb.jpg"
  },
  {
    title: "Amy's Medical School Acceptance",
    description: "Amy received acceptance letters from three medical schools",
    content: "The letters came all in one week - three acceptances! Amy had worked so hard, volunteering at the hospital, studying for the MCAT, and maintaining perfect grades. When she opened the first acceptance letter, she just stared at it in disbelief. Mom cried, Dad beamed, and David gave her the biggest hug. She's going to be an amazing doctor.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-03-28"),
    location: "Chen Family Home",
    tags: ["education", "medical school", "achievement", "acceptance", "future doctor"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/amy-acceptance.jpg"],
    thumbnailUrl: "https://example.com/photos/amy-acceptance-thumb.jpg"
  },
  {
    title: "Chinese New Year Family Reunion",
    description: "Our biggest family gathering with relatives from across the country",
    content: "This year's Chinese New Year was extra special - relatives flew in from New York, Los Angeles, and even some from Taiwan. We prepared for days, making dumplings, decorating with red lanterns, and setting up the mahjong tables. The kids performed a dragon dance, and Grandpa Chen told stories about celebrating New Year in the old country. Food, laughter, and family - the perfect combination.",
    type: "PHOTO" as MemoryType,
    date: new Date("2023-01-22"),
    location: "Chen Family Restaurant",
    tags: ["chinese new year", "family reunion", "tradition", "culture", "celebration"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/chinese-new-year-1.jpg", "https://example.com/photos/chinese-new-year-2.jpg"],
    thumbnailUrl: "https://example.com/photos/chinese-new-year-thumb.jpg"
  },

  // Johnson Family Memories
  {
    title: "Zoe's State Championship Win",
    description: "Zoe led her basketball team to the state championship victory",
    content: "The game was tied with 30 seconds left. Zoe had the ball, and everyone in the gym was on their feet. She drove to the basket, made the shot, and won the state championship for her school. As a single dad, watching my daughter achieve her dreams while being such a leader and role model for her teammates - I couldn't be prouder.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-03-05"),
    location: "State Arena, Sacramento",
    tags: ["basketball", "championship", "sports", "achievement", "leadership"],
    importance: 5,
    mediaUrls: ["https://example.com/photos/zoe-championship.jpg"],
    thumbnailUrl: "https://example.com/photos/zoe-championship-thumb.jpg"
  },
  {
    title: "Tyler's Science Fair Victory",
    description: "Tyler won first place at the regional science fair with his robotics project",
    content: "Tyler spent months building his robot that could sort recycling automatically. He taught himself programming, 3D printing, and electronics. When they announced his name as the first-place winner, his face lit up like Christmas morning. The judges were impressed by his innovation and his passion for environmental protection. This kid is going to change the world.",
    type: "MILESTONE" as MemoryType,
    date: new Date("2023-04-20"),
    location: "Regional Science Fair, Oakland",
    tags: ["science fair", "robotics", "innovation", "environment", "achievement"],
    importance: 4,
    mediaUrls: ["https://example.com/photos/tyler-science-fair.jpg"],
    thumbnailUrl: "https://example.com/photos/tyler-science-fair-thumb.jpg"
  },
  {
    title: "Father's Day Surprise",
    description: "The kids surprised Marcus with a homemade video of family memories",
    content: "I thought it was just going to be a quiet Father's Day, but Zoe and Tyler had been secretly working on something for weeks. They created a video montage of our family memories - from their first steps to recent achievements. They interviewed neighbors, teachers, and coaches about what kind of father I am. I'm not ashamed to say I cried like a baby. Being their dad is my greatest achievement.",
    type: "STORY" as MemoryType,
    date: new Date("2023-06-18"),
    location: "Johnson Family Home",
    tags: ["fathers day", "surprise", "family love", "memories", "gratitude"],
    importance: 5,
    mediaUrls: ["https://example.com/videos/fathers-day-surprise.mp4"],
    thumbnailUrl: "https://example.com/photos/fathers-day-thumb.jpg"
  }
];

// Sample AI-generated stories
const SAMPLE_STORIES = [
  {
    title: "The Hamilton Legacy: Four Generations of Love",
    content: `In the heart of Portland, Oregon, stands a house that has witnessed nearly a century of Hamilton family history. It's more than just brick and mortar; it's a repository of memories, dreams, and the enduring bonds that tie four generations together.

Eleanor Hamilton, now 80, sits in her favorite armchair by the window, the same spot where she's watched her family grow and flourish. Her eyes, still bright with wisdom and warmth, have seen the world change dramatically, but her love for her family has remained constant.

"Family isn't just about blood," Eleanor often says, "it's about the stories we share and the love we pass down."

Her son Robert, a man who inherited his mother's gentle strength and his father's determination, has spent his life documenting these stories through his camera lens. Every birthday, every milestone, every quiet Sunday afternoon has been captured, creating a visual narrative of their family's journey.

Sarah, Robert's wife, brings the gift of words to their family legacy. Her recently published novel, "The Stories We Keep," draws inspiration from the very conversations that happen around their dinner table. She understands that every family has secrets, but more importantly, every family has love that transcends those secrets.

The youngest generation, Emma and James, represent the future of the Hamilton legacy. Emma's artistic vision captures the soul of her family in ways that photographs cannot, while James's music provides the soundtrack to their shared experiences. Together, they're creating new traditions while honoring the old ones.

This is the Hamilton legacy - not just a family tree, but a living, breathing testament to the power of love, the importance of memory, and the beauty of belonging to something greater than yourself.`,
    style: "narrative",
    aiModel: "llama3.1:70b",
    generationTime: 3500,
    confidence: 0.92
  },
  {
    title: "The Chen Chronicles: Bridging Two Worlds",
    content: `The aroma of five-spice and ginger fills the Chen family restaurant every morning, but it carries more than just the promise of delicious food. It carries the dreams of a man who left everything behind to build something beautiful for his children.

Wei Chen arrived in San Francisco twenty-five years ago with nothing but determination and a recipe book his grandmother had given him. Today, as he holds his certificate of citizenship, he reflects on the journey that brought him here.

"In China, I was just Wei," he tells his children. "In America, I became Dad, husband, business owner, and now, citizen. Each role taught me something new about who I could become."

Lisa, his wife, bridged not just two cultures but two hearts. As a teacher, she understood the importance of education, but as a mother, she knew the value of tradition. She made sure David and Amy spoke Mandarin at home while excelling in English at school.

David's success in the tech world represents the American dream realized, but he never forgets the late nights he spent in the restaurant, learning the value of hard work from his father. Amy's acceptance to medical school is the culmination of years of sacrifice and support from her entire family.

The Chen family story is one of transformation - not just of individuals, but of what it means to be American. They've created a legacy that honors their past while embracing their future, proving that the strongest families are those that can adapt while staying true to their core values.`,
    style: "narrative", 
    aiModel: "llama3.1:70b",
    generationTime: 3200,
    confidence: 0.89
  }
];

// Sample time capsules
const SAMPLE_TIME_CAPSULES = [
  {
    title: "To My Grandchildren in 2040",
    message: `My dear grandchildren,

As I write this in 2023, you are still young, full of dreams and possibilities. I want you to know that watching you grow has been the greatest joy of my life.

Emma, your art has already touched so many hearts. I hope by 2040, your creativity has changed the world in ways we can't even imagine today.

James, your music brings our family together every Sunday. I hope you're still playing, still bringing joy to others through your gift.

The world is changing so fast, but some things remain constant: the importance of family, the power of love, and the value of kindness. Remember that you come from a long line of strong, loving people who believed in making the world better.

I may not be with you when you read this, but my love for you is eternal. Take care of each other, honor your family's legacy, and create new stories for the generations that come after you.

All my love,
Grandma Eleanor`,
    deliveryDate: new Date("2040-03-15"),
    recipients: ["emma@hamilton.family", "james@hamilton.family"]
  },
  {
    title: "The American Dream - A Father's Reflection",
    message: `To my children and their children,

Today I became an American citizen. As I write this, my hands are still shaking from the emotion of taking the oath. I want you to understand what this moment means, not just to me, but to our family's future.

When I left China, I was scared but hopeful. I didn't speak English well, I had no money, but I had dreams. I dreamed of a restaurant where families would gather, where food would bring people together, where my children could grow up with opportunities I never had.

David and Amy, you have exceeded every dream I ever had. You've become successful, but more importantly, you've remained kind and connected to your family and culture.

To my future grandchildren: You are the bridge between worlds. You carry the wisdom of your ancestors and the possibilities of your new country. Never forget where you came from, but never limit where you can go.

The American dream isn't just about success - it's about the freedom to become who you're meant to be while lifting others up along the way.

With all my love and pride,
Your father and grandfather, Wei Chen`,
    deliveryDate: new Date("2035-04-12"),
    recipients: ["david@chen.family", "amy@chen.family"]
  }
];

async function createUsers(familyData: typeof SAMPLE_FAMILIES[0]) {
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (const memberData of familyData.members) {
    const user = await prisma.user.create({
      data: {
        email: memberData.email,
        username: memberData.email.split('@')[0],
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        passwordHash: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        dateOfBirth: memberData.dateOfBirth,
        bio: memberData.bio,
        subscriptionTier: memberData.role === 'OWNER' ? 'FAMILY' : 'FREE',
        subscriptionEndsAt: memberData.role === 'OWNER' ? new Date('2024-12-31') : undefined,
        onboardingCompleted: true,
        referralCode: `${memberData.firstName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`
      }
    });
    users.push({ ...user, role: memberData.role });
  }

  return users;
}

async function createFamily(familyData: typeof SAMPLE_FAMILIES[0], users: any[]) {
  const family = await prisma.family.create({
    data: {
      name: familyData.name,
      description: familyData.description,
      isPublic: false,
      allowAIStories: true,
      privacyLevel: 'family'
    }
  });

  // Add family members
  for (const user of users) {
    await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId: family.id,
        role: user.role
      }
    });
  }

  return family;
}

async function createMemories(familyId: string, users: any[], memoryData: typeof SAMPLE_MEMORIES) {
  const memories = [];

  for (const memoryInfo of memoryData) {
    // Randomly assign author from family members
    const author = users[Math.floor(Math.random() * users.length)];
    
    const memory = await prisma.memory.create({
      data: {
        title: memoryInfo.title,
        description: memoryInfo.description,
        content: memoryInfo.content,
        type: memoryInfo.type,
        date: memoryInfo.date,
        location: memoryInfo.location,
        tags: memoryInfo.tags,
        importance: memoryInfo.importance,
        mediaUrls: memoryInfo.mediaUrls,
        thumbnailUrl: memoryInfo.thumbnailUrl,
        authorId: author.id,
        familyId: familyId,
        // Add constellation positioning
        constellationX: (Math.random() - 0.5) * 400, // Random position in constellation
        constellationY: (Math.random() - 0.5) * 400,
        connections: [] // Will be populated later with related memories
      }
    });
    memories.push(memory);
  }

  // Create connections between related memories
  for (let i = 0; i < memories.length; i++) {
    const connections = [];
    const numConnections = Math.floor(Math.random() * 3) + 1; // 1-3 connections
    
    for (let j = 0; j < numConnections; j++) {
      const randomIndex = Math.floor(Math.random() * memories.length);
      if (randomIndex !== i && !connections.includes(memories[randomIndex].id)) {
        connections.push(memories[randomIndex].id);
      }
    }

    await prisma.memory.update({
      where: { id: memories[i].id },
      data: { connections }
    });
  }

  return memories;
}

async function createStories(familyId: string, users: any[], memories: any[], storyData: typeof SAMPLE_STORIES) {
  for (const storyInfo of storyData) {
    const author = users[Math.floor(Math.random() * users.length)];
    const relatedMemories = memories.slice(0, Math.floor(Math.random() * 3) + 2); // 2-4 related memories

    await prisma.story.create({
      data: {
        title: storyInfo.title,
        content: storyInfo.content,
        style: storyInfo.style,
        aiModel: storyInfo.aiModel,
        generationTime: storyInfo.generationTime,
        confidence: storyInfo.confidence,
        authorId: author.id,
        familyId: familyId,
        memoryIds: relatedMemories.map(m => m.id),
        prompt: "Generate a beautiful family story from our memories"
      }
    });
  }
}

async function createTimeCapsules(familyId: string, users: any[], timeCapsuleData: typeof SAMPLE_TIME_CAPSULES) {
  for (const capsuleInfo of timeCapsuleData) {
    const creator = users[0]; // Usually the family owner

    await prisma.timeCapsule.create({
      data: {
        title: capsuleInfo.title,
        message: capsuleInfo.message,
        deliveryDate: capsuleInfo.deliveryDate,
        recipients: capsuleInfo.recipients,
        mediaUrls: [],
        creatorId: creator.id,
        familyId: familyId
      }
    });
  }
}

async function createNotifications(users: any[]) {
  const notificationTypes = [
    'MEMORY_REMINDER',
    'FAMILY_INVITE', 
    'STORY_GENERATED',
    'REFERRAL_REWARD',
    'LEGACY_REMINDER'
  ];

  for (const user of users) {
    // Create a few sample notifications for each user
    for (let i = 0; i < 3; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Sample ${type.replace('_', ' ')} Notification`,
          message: `This is a sample notification of type ${type} for testing purposes.`,
          type: type as any,
          priority: Math.random() > 0.7 ? 'HIGH' : 'NORMAL',
          deliveryMethod: ['app', 'email'],
          isRead: Math.random() > 0.5,
          readAt: Math.random() > 0.5 ? new Date() : null
        }
      });
    }
  }
}

async function createAnalytics(users: any[]) {
  const today = new Date();
  
  for (const user of users) {
    // Create analytics for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await prisma.userAnalytics.create({
        data: {
          userId: user.id,
          date: date,
          memoriesCreated: Math.floor(Math.random() * 3),
          storiesGenerated: Math.floor(Math.random() * 2),
          timeSpent: Math.floor(Math.random() * 120) + 10, // 10-130 minutes
          featuresUsed: ['constellation', 'memories', 'stories'].slice(0, Math.floor(Math.random() * 3) + 1),
          nodesClicked: Math.floor(Math.random() * 20),
          connectionsExplored: Math.floor(Math.random() * 10)
        }
      });
    }
  }
}

async function createSystemConfig() {
  const configs = [
    { key: 'ai_model_default', value: 'llama3.1:70b', description: 'Default AI model for story generation' },
    { key: 'max_memories_per_user', value: '1000', description: 'Maximum memories per user' },
    { key: 'referral_reward_threshold', value: '5', description: 'Number of referrals needed for free month' },
    { key: 'time_capsule_max_future_years', value: '50', description: 'Maximum years in future for time capsules' },
    { key: 'constellation_max_connections', value: '10', description: 'Maximum connections per memory node' }
  ];

  for (const config of configs) {
    await prisma.systemConfig.create({
      data: config
    });
  }
}

async function main() {
  try {
    logger.info('🌱 Starting database seeding...');

    // Clear existing data
    logger.info('Clearing existing data...');
    await prisma.userAnalytics.deleteMany();
    await prisma.aIInteraction.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.timeCapsule.deleteMany();
    await prisma.legacyPlan.deleteMany();
    await prisma.story.deleteMany();
    await prisma.memory.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemConfig.deleteMany();

    // Create system configuration
    logger.info('Creating system configuration...');
    await createSystemConfig();

    // Create families with users and content
    const allUsers: any[] = [];
    const allMemories: any[] = [];

    for (let i = 0; i < SAMPLE_FAMILIES.length; i++) {
      const familyData = SAMPLE_FAMILIES[i];
      logger.info(`Creating family: ${familyData.name}`);

      // Create users for this family
      const users = await createUsers(familyData);
      allUsers.push(...users);

      // Create the family
      const family = await createFamily(familyData, users);

      // Create memories for this family
      const familyMemories = SAMPLE_MEMORIES.slice(i * 5, (i + 1) * 5); // 5 memories per family
      const memories = await createMemories(family.id, users, familyMemories);
      allMemories.push(...memories);

      // Create AI-generated stories
      const familyStories = SAMPLE_STORIES.slice(i, i + 1); // 1 story per family
      await createStories(family.id, users, memories, familyStories);

      // Create time capsules
      const familyCapsules = SAMPLE_TIME_CAPSULES.slice(i, i + 1); // 1 time capsule per family
      await createTimeCapsules(family.id, users, familyCapsules);
    }

    // Create cross-family data
    logger.info('Creating notifications...');
    await createNotifications(allUsers);

    logger.info('Creating analytics data...');
    await createAnalytics(allUsers);

    // Set up some referral relationships
    logger.info('Setting up referral relationships...');
    const referrer = allUsers[0];
    const referred = allUsers.slice(1, 4); // First user referred 3 others

    for (const user of referred) {
      await prisma.user.update({
        where: { id: user.id },
        data: { referredBy: referrer.id }
      });
    }

    await prisma.user.update({
      where: { id: referrer.id },
      data: { 
        referralCount: 3,
        freeMonthsEarned: 0 // Will be calculated by referral service
      }
    });

    // Create some AI interactions
    logger.info('Creating AI interaction history...');
    for (const user of allUsers.slice(0, 5)) { // First 5 users have AI interactions
      for (let i = 0; i < 3; i++) {
        await prisma.aIInteraction.create({
          data: {
            userId: user.id,
            type: ['story_generation', 'memory_analysis', 'recommendation'][i],
            prompt: `Sample prompt for ${user.firstName}`,
            response: `Sample AI response for ${user.firstName}`,
            model: 'llama3.1:70b',
            responseTime: Math.floor(Math.random() * 5000) + 1000,
            confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
            userRating: Math.floor(Math.random() * 2) + 4 // 4-5 stars
          }
        });
      }
    }

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`Created ${allUsers.length} users across ${SAMPLE_FAMILIES.length} families`);
    logger.info(`Created ${allMemories.length} memories with AI-generated stories and time capsules`);
    logger.info('🚀 Your Loominary platform is ready for testing!');

    // Log sample login credentials
    logger.info('\n📧 Sample Login Credentials:');
    for (const family of SAMPLE_FAMILIES) {
      logger.info(`\n${family.name}:`);
      for (const member of family.members) {
        logger.info(`  ${member.firstName} ${member.lastName}: ${member.email} / password123`);
      }
    }

  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });