import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Comprehensive image URLs for 10 years of memories
const MEMORY_IMAGES = {
  family: [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
    'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800',
    'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
  ],
  celebrations: [
    'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
    'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=800',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800',
  ],
  travel: [
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  ],
  milestones: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  ],
  everyday: [
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  ],
};

// Helper to get random image from category
function getRandomImage(category: keyof typeof MEMORY_IMAGES): string {
  const images = MEMORY_IMAGES[category];
  return images[Math.floor(Math.random() * images.length)];
}

// Helper to create date in the past
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
  console.log('Seeding database with 10 years of comprehensive data...');

  // Clear existing data first
  await clearDatabase();

  // Create demo user - Sarah Johnson, a 55-year-old grandmother
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

  // Create comprehensive family members (3 generations)
  const familyMembers = await Promise.all([
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Emma Johnson-Mitchell',
        relationship: 'Daughter',
        email: 'emma@example.com',
        phone: '+1-555-0101',
        birthDate: new Date('1995-06-15'),
        notes: 'Eldest daughter, married to James Mitchell in 2022. Works as a software engineer at Google.',
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
        notes: 'Youngest child, completed MBA at Stanford. Passionate about entrepreneurship.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'James Wilson',
        relationship: 'Father',
        birthDate: new Date('1945-11-08'),
        notes: 'Retired Army veteran. Passed away peacefully in 2020. His wisdom lives on in our hearts.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Rose Wilson',
        relationship: 'Mother',
        phone: '+1-555-0103',
        birthDate: new Date('1948-04-12'),
        notes: 'Still going strong at 77! Lives in the family home in Vermont. Best apple pie maker in the county.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'David Johnson',
        relationship: 'Husband',
        email: 'david@example.com',
        phone: '+1-555-0104',
        birthDate: new Date('1968-09-30'),
        notes: 'My rock for 32 years. Retired architect, now spends his days woodworking and spoiling the grandkids.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Lily Mitchell',
        relationship: 'Granddaughter',
        birthDate: new Date('2020-12-25'),
        notes: 'Our Christmas miracle! Emma and James\'s first child. Has her mother\'s eyes and her grandfather\'s stubborn streak.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Thomas Wilson',
        relationship: 'Brother',
        email: 'thomas@example.com',
        phone: '+1-555-0105',
        birthDate: new Date('1972-07-04'),
        notes: 'Younger brother, lives in California. Successful restaurant owner.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Margaret Wilson-Chen',
        relationship: 'Sister',
        email: 'margaret@example.com',
        phone: '+1-555-0106',
        birthDate: new Date('1974-02-14'),
        notes: 'Baby sister, married to Robert Chen. Two kids: Sophie (12) and Daniel (9). Lives in Boston.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'James Mitchell',
        relationship: 'Son-in-law',
        email: 'james.mitchell@example.com',
        phone: '+1-555-0107',
        birthDate: new Date('1993-08-19'),
        notes: 'Emma\'s husband. Wonderful man who treats our daughter like a queen. Works in finance.',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Oliver Mitchell',
        relationship: 'Grandson',
        birthDate: new Date('2023-05-10'),
        notes: 'Our newest addition! Emma and James\'s second child. Already has his father wrapped around his little finger.',
      },
    }),
  ]);

  console.log(`Created ${familyMembers.length} family members`);

  // Create story prompts
  await prisma.storyPrompt.createMany({
    data: [
      { category: 'Love', text: 'How did you meet your partner?', emoji: '💑', order: 1 },
      { category: 'Love', text: 'What was your wedding day like?', emoji: '💒', order: 2 },
      { category: 'Love', text: 'What keeps your love strong after all these years?', emoji: '💕', order: 3 },
      { category: 'Childhood', text: 'Describe your childhood home', emoji: '🏠', order: 1 },
      { category: 'Childhood', text: 'What games did you play as a child?', emoji: '🎮', order: 2 },
      { category: 'Childhood', text: 'Who was your best friend growing up?', emoji: '👫', order: 3 },
      { category: 'Holidays', text: 'Favorite holiday memory', emoji: '🎄', order: 1 },
      { category: 'Holidays', text: 'Family traditions you cherish', emoji: '🕯️', order: 2 },
      { category: 'Holidays', text: 'The best gift you ever received', emoji: '🎁', order: 3 },
      { category: 'Wisdom', text: 'Best advice you ever received', emoji: '💡', order: 1 },
      { category: 'Wisdom', text: 'Lessons learned from mistakes', emoji: '📚', order: 2 },
      { category: 'Wisdom', text: 'What would you tell your younger self?', emoji: '✨', order: 3 },
      { category: 'Career', text: 'Your first job', emoji: '💼', order: 1 },
      { category: 'Career', text: 'Proudest professional moment', emoji: '🏆', order: 2 },
      { category: 'Career', text: 'Mentors who shaped your career', emoji: '🌟', order: 3 },
      { category: 'Family', text: 'The day your first child was born', emoji: '👶', order: 1 },
      { category: 'Family', text: 'Favorite family vacation', emoji: '✈️', order: 2 },
      { category: 'Family', text: 'What does family mean to you?', emoji: '❤️', order: 3 },
    ],
    skipDuplicates: true,
  });

  console.log('Created story prompts');

  // Create 10 years of memories (2015-2025) - 60+ memories
  const memoriesData = [
    // 2015
    { year: 2015, month: 1, title: 'New Year\'s Eve 2014', description: 'Watching the ball drop with the whole family. Michael was still in high school, Emma had just started college.', category: 'celebrations' },
    { year: 2015, month: 3, title: 'Emma\'s 20th birthday', description: 'Surprised her at Stanford with a cake and her favorite flowers. She cried happy tears.', category: 'celebrations' },
    { year: 2015, month: 6, title: 'Summer road trip to Yellowstone', description: 'Two weeks, 3,000 miles, and countless memories. The kids complained about no WiFi but ended up loving it.', category: 'travel' },
    { year: 2015, month: 8, title: 'Michael\'s first day of senior year', description: 'My baby boy, all grown up. He was so nervous but tried to act cool.', category: 'milestones' },
    { year: 2015, month: 11, title: 'Thanksgiving at Mom\'s house', description: 'The whole Wilson clan together. Dad told his war stories for the hundredth time, and we loved every minute.', category: 'family' },
    { year: 2015, month: 12, title: 'Christmas morning 2015', description: 'Last Christmas with both kids still living at home. We didn\'t know it then, but it made it even more precious.', category: 'celebrations' },
    // 2016
    { year: 2016, month: 2, title: 'Valentine\'s Day surprise', description: 'David surprised me with a weekend getaway to Napa Valley. 24 years of marriage and he still makes my heart flutter.', category: 'travel' },
    { year: 2016, month: 5, title: 'Michael\'s high school graduation', description: 'Valedictorian! I cried through his entire speech. So proud of the young man he\'s become.', category: 'milestones' },
    { year: 2016, month: 6, title: 'Family reunion at the lake house', description: 'First time in 5 years we got everyone together. Cousins meeting for the first time, old stories retold.', category: 'family' },
    { year: 2016, month: 7, title: 'Teaching Michael to drive', description: 'White-knuckle moments in the parking lot. He\'s a better driver than me now.', category: 'everyday' },
    { year: 2016, month: 9, title: 'Dropping Michael off at college', description: 'Empty nest officially began. Cried the whole drive home. David pretended he had allergies.', category: 'milestones' },
    { year: 2016, month: 10, title: 'Our 25th wedding anniversary', description: 'Renewed our vows in a small ceremony. Same love, deeper roots.', category: 'celebrations' },
    // 2017
    { year: 2017, month: 1, title: 'Learning to paint', description: 'Started watercolor classes at the community center. Terrible at first, but it brings me such peace.', category: 'everyday' },
    { year: 2017, month: 3, title: 'Emma\'s first real job', description: 'She got the offer from Google! All those late nights studying paid off. My brilliant girl.', category: 'milestones' },
    { year: 2017, month: 5, title: 'Mother\'s Day brunch', description: 'Both kids flew home to surprise me. Best gift I could ever ask for.', category: 'family' },
    { year: 2017, month: 7, title: 'Trip to Ireland', description: 'Finally visited the homeland. Found the village where great-grandma was born. Magical.', category: 'travel' },
    { year: 2017, month: 9, title: 'Dad\'s 72nd birthday', description: 'He said he didn\'t want a fuss, but his smile when we all showed up said otherwise.', category: 'celebrations' },
    { year: 2017, month: 11, title: 'First Thanksgiving as empty nesters', description: 'Quiet but peaceful. David and I cooked together, danced in the kitchen.', category: 'family' },
    // 2018
    { year: 2018, month: 2, title: 'Snow day memories', description: 'Biggest snowstorm in 20 years. Built a snowman with the neighbor kids. Felt like a kid again.', category: 'everyday' },
    { year: 2018, month: 4, title: 'Emma brings James home', description: 'First time meeting her boyfriend. He was so nervous. I knew right away he was the one.', category: 'family' },
    { year: 2018, month: 6, title: 'Michael\'s internship in NYC', description: 'Visited him in his tiny apartment. He was so proud to show us around his new city.', category: 'milestones' },
    { year: 2018, month: 8, title: 'Beach week with the Wilsons', description: 'Annual tradition continues. Sandcastles, sunburns, and sibling squabbles. Perfect.', category: 'travel' },
    { year: 2018, month: 10, title: 'Fall foliage in Vermont', description: 'Stayed at Mom\'s, helped with the apple harvest. The colors were breathtaking.', category: 'travel' },
    { year: 2018, month: 12, title: 'Christmas with James', description: 'His first holiday with our family. He fit right in, even beat David at chess.', category: 'celebrations' },
    // 2019
    { year: 2019, month: 1, title: 'New Year\'s resolutions', description: 'Started journaling daily. Best decision I ever made. These memories matter.', category: 'everyday' },
    { year: 2019, month: 3, title: 'Emma\'s promotion', description: 'Senior engineer at 24! She called us crying happy tears. Like mother, like daughter.', category: 'milestones' },
    { year: 2019, month: 5, title: 'Garden in full bloom', description: 'The roses David planted for our anniversary finally bloomed. Red, pink, and white.', category: 'everyday' },
    { year: 2019, month: 7, title: 'James asks for our blessing', description: 'He was shaking when he asked David. Of course we said yes. Welcome to the family, son.', category: 'milestones' },
    { year: 2019, month: 8, title: 'The proposal!', description: 'Emma called us screaming with joy. James proposed at sunset on the beach. Perfect.', category: 'celebrations' },
    { year: 2019, month: 11, title: 'Engagement party', description: 'Hosted 50 people in our backyard. Fairy lights, champagne, and so much love.', category: 'celebrations' },
    // 2020
    { year: 2020, month: 1, title: 'Dad\'s health scare', description: 'He collapsed at home. Rushed to the hospital. Those were the longest hours of my life.', category: 'family' },
    { year: 2020, month: 3, title: 'The world changed', description: 'Lockdown began. Grateful we had each other. Video calls became our lifeline.', category: 'everyday' },
    { year: 2020, month: 4, title: 'Saying goodbye to Dad', description: 'He passed peacefully, surrounded by love. The hardest day of my life. Miss you, Daddy.', category: 'family' },
    { year: 2020, month: 6, title: 'Virtual family dinners', description: 'Every Sunday on Zoom. Not the same, but it kept us connected.', category: 'family' },
    { year: 2020, month: 9, title: 'Emma\'s backyard wedding', description: 'Pandemic couldn\'t stop love. Small ceremony, big hearts. She was radiant.', category: 'celebrations' },
    { year: 2020, month: 12, title: 'Lily is born!', description: 'Christmas Day, 7 lbs 4 oz. Our first grandchild. I\'ve never felt such overwhelming love.', category: 'milestones' },
    // 2021
    { year: 2021, month: 1, title: 'First time holding Lily', description: 'Finally got to meet her in person. She grabbed my finger and I was gone. Completely smitten.', category: 'family' },
    { year: 2021, month: 3, title: 'Vaccinated!', description: 'Light at the end of the tunnel. Hugged my mom for the first time in a year.', category: 'milestones' },
    { year: 2021, month: 5, title: 'Lily\'s first steps', description: 'Video call with Emma when it happened. We all cheered so loud she fell down laughing.', category: 'milestones' },
    { year: 2021, month: 7, title: 'Road trip to see the grandkids', description: 'Two weeks of grandparent duty. Exhausting and wonderful. Lily calls me "Nana."', category: 'family' },
    { year: 2021, month: 9, title: 'Michael starts MBA', description: 'Stanford Business School. Following in his sister\'s footsteps. So proud.', category: 'milestones' },
    { year: 2021, month: 12, title: 'Lily\'s first Christmas', description: 'She was more interested in the wrapping paper than the gifts. Pure joy.', category: 'celebrations' },
    // 2022
    { year: 2022, month: 2, title: 'Teaching Lily to bake', description: 'More flour on her than in the bowl. Made the messiest, most delicious cookies ever.', category: 'everyday' },
    { year: 2022, month: 4, title: 'Spring garden with Lily', description: 'She "helped" plant tomatoes. Mostly she dug holes and got dirty. Perfect afternoon.', category: 'everyday' },
    { year: 2022, month: 6, title: 'Family cruise to Alaska', description: 'First big trip post-pandemic. Glaciers, whales, and three generations of Johnsons.', category: 'travel' },
    { year: 2022, month: 8, title: 'Lily\'s 2nd birthday', description: 'Unicorn theme. She smashed the cake like a champion. That smile!', category: 'celebrations' },
    { year: 2022, month: 10, title: 'Emma announces pregnancy #2', description: 'Lily is going to be a big sister! Due in May. Our family keeps growing.', category: 'milestones' },
    { year: 2022, month: 12, title: 'White Christmas', description: 'First snow in years. Built snowmen with Lily. She named hers "Frosty Nana."', category: 'celebrations' },
    // 2023
    { year: 2023, month: 1, title: 'New Year with the grandkids', description: 'Lily stayed up until midnight for the first time. She was so proud of herself.', category: 'celebrations' },
    { year: 2023, month: 3, title: 'Lily\'s first day of preschool', description: 'She marched in like she owned the place. No tears from her, plenty from me.', category: 'milestones' },
    { year: 2023, month: 5, title: 'Oliver is born!', description: 'May 10th, 8 lbs 2 oz. Lily kissed his head and said "my baby." Heart melted.', category: 'milestones' },
    { year: 2023, month: 7, title: 'Summer at the lake house', description: 'Three generations, one week, endless memories. Lily learned to swim!', category: 'travel' },
    { year: 2023, month: 9, title: 'Michael\'s graduation', description: 'MBA complete! He has a job offer in San Francisco. My babies are all grown up.', category: 'milestones' },
    { year: 2023, month: 11, title: 'Thanksgiving with everyone', description: 'First time in years we had the whole family. 15 people around the table. Chaos and love.', category: 'family' },
    // 2024
    { year: 2024, month: 1, title: 'Teaching Lily to read', description: 'She sounded out her first word: "LOVE." Couldn\'t have picked a better one.', category: 'everyday' },
    { year: 2024, month: 3, title: 'Mom\'s 76th birthday', description: 'Surprised her with all her grandkids and great-grandkids. She cried happy tears.', category: 'celebrations' },
    { year: 2024, month: 5, title: 'Oliver\'s first birthday', description: 'He\'s walking already! Chasing Lily around the yard. Brothers and sisters.', category: 'celebrations' },
    { year: 2024, month: 7, title: 'Family reunion 2024', description: 'Biggest one yet. Cousins from three countries. Dad would have loved it.', category: 'family' },
    { year: 2024, month: 9, title: 'Our 33rd anniversary', description: 'David surprised me with a trip to Paris. The city of love, with my love.', category: 'travel' },
    { year: 2024, month: 12, title: 'Christmas 2024', description: 'Lily performed in her school play. Oliver said "Nana" for the first time. Perfect.', category: 'celebrations' },
    // 2025
    { year: 2025, month: 1, title: 'New Year\'s Day 2025', description: 'Watching the sunrise with David. Grateful for another year, another chance to love.', category: 'everyday' },
    { year: 2025, month: 2, title: 'Valentine\'s Day tradition', description: '33 years of heart-shaped pancakes. Some traditions never get old.', category: 'everyday' },
    { year: 2025, month: 3, title: 'Spring cleaning discoveries', description: 'Found old love letters from David. Read them all, fell in love again.', category: 'everyday' },
    { year: 2025, month: 4, title: 'Easter egg hunt', description: 'Lily helped Oliver find eggs. She\'s such a good big sister.', category: 'family' },
    { year: 2025, month: 5, title: 'Mother\'s Day 2025', description: 'All my children and grandchildren together. This is what life is about.', category: 'family' },
    { year: 2025, month: 6, title: 'Summer begins', description: 'Pool opened, grandkids arrived. Let the chaos begin!', category: 'family' },
  ];

  const memories = [];
  for (const m of memoriesData) {
    const memory = await prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PHOTO',
        title: m.title,
        description: m.description,
        fileUrl: getRandomImage(m.category as keyof typeof MEMORY_IMAGES),
        encrypted: false,
        createdAt: new Date(m.year, m.month - 1, 15),
      },
    });
    memories.push(memory);
  }

  console.log(`Created ${memories.length} memories spanning 10 years`);

  // Create voice recordings with detailed transcripts
  const voiceRecordingsData = [
    {
      title: 'How I met your grandfather',
      description: 'A story for the grandchildren about how it all began.',
      transcript: `It was the summer of 1990. I was 25 years old, working as a nurse at Boston General. Your grandfather David was an architect, and he came in with a broken wrist from a construction site accident. He was so embarrassed - turns out he'd been showing off for his crew and fell off a ladder. I tried not to laugh while I was taking his vitals, but he caught me smiling. He came back the next week with flowers, claiming he needed a "follow-up appointment." The receptionist told him that's not how it works, but I happened to be walking by and agreed to coffee. Our first date was at a little cafe near the harbor. We talked for six hours. He missed his train home and had to sleep on his friend's couch. He says it was worth it. Three months later, he proposed on that same harbor, right as the sun was setting. I said yes before he even finished the question. We got married the following June, and here we are, 33 years later. Still making each other laugh, still choosing each other every day. That's the secret, kids. Choose each other. Every single day.`,
      duration: 420,
      prompt: 'How did you meet your partner?',
      createdAt: yearsAgo(2),
    },
    {
      title: 'The day Emma was born',
      description: 'Remembering the most beautiful day of my life.',
      transcript: `June 15th, 1995. The hottest day of the year. I was in labor for 18 hours. Your grandfather paced the hallway so much the nurses joked about him wearing a groove in the floor. When they finally placed Emma in my arms, everything else disappeared. The pain, the exhaustion, the fear - all of it just melted away. She was so tiny. Seven pounds, four ounces. She had the tiniest fingers and the loudest cry. The nurses said she had strong lungs. They weren't wrong - that girl has never been quiet about anything! David cried. He'll deny it, but I have witnesses. He held her like she was made of glass, whispering promises about all the things he'd teach her. We named her Emma after my grandmother, who had passed just a year before. I like to think Grandma Emma was watching over us that day. Those first few weeks were a blur of sleepless nights and overwhelming love. I remember thinking, "So this is what it's all about. This is why we're here." Emma, if you're listening to this someday, know that you made me a mother. You taught me what unconditional love really means. You were my first, and you'll always hold a special place in my heart.`,
      duration: 360,
      prompt: 'The day your first child was born',
      createdAt: yearsAgo(3),
    },
    {
      title: 'Advice I wish I\'d known at 20',
      description: 'Wisdom to pass on to the next generation.',
      transcript: `If I could go back and talk to my 20-year-old self, here's what I'd say: First, stop worrying so much about what other people think. Most people are too busy worrying about themselves to judge you. And the ones who do judge? Their opinions don't matter anyway. Second, call your parents more. I know you think you're busy, but they won't be around forever. I'd give anything for one more phone call with my dad. Third, take more pictures. Not selfies - real pictures. Of ordinary days. Of your messy apartment. Of your friends laughing. Those are the ones you'll treasure. Fourth, it's okay to fail. In fact, fail more. Fail faster. Every failure is just a lesson in disguise. I learned more from my mistakes than from my successes. Fifth, be kind to yourself. You're doing better than you think. That voice in your head that says you're not good enough? It's lying. Sixth, invest in experiences, not things. I don't remember what car I drove at 25, but I remember every trip, every adventure, every late night with friends. And finally, love deeply. Even when it's scary. Even when it might hurt. A life without love is no life at all. You're going to be okay, kid. Better than okay. You're going to be amazing.`,
      duration: 300,
      prompt: 'What would you tell your younger self?',
      createdAt: yearsAgo(1),
    },
    {
      title: 'Our family\'s secret recipe',
      description: 'The apple pie recipe that has been in our family for generations.',
      transcript: `This apple pie recipe has been in our family for four generations. My great-grandmother Margaret brought it over from Ireland in 1920. Now, I'm going to share the secret ingredient that makes it special. Are you ready? It's cardamom. Just a pinch, along with the cinnamon. Most people can't identify it, but they always say our pie tastes different. Better. Here's what you need: Six Granny Smith apples - and it has to be Granny Smith, nothing else. Three-quarters cup of sugar, two tablespoons of flour, one teaspoon of cinnamon, and that pinch of cardamom. For the crust, use cold butter. Ice cold. That's the secret to a flaky crust. And don't overwork the dough - treat it gently, like you're handling something precious. Roll it out on a floured surface, lay it in your pie dish, add the filling, then the top crust. Cut little slits for the steam to escape. Brush with egg wash and sprinkle with sugar. Bake at 375 for about 50 minutes, until the crust is golden and the filling is bubbling. I'm passing this recipe to you, Emma, as my mother passed it to me. Guard it well. Share it with your children. And every time you make it, think of all the women in our family who made it before you. That's the real secret ingredient - love, passed down through generations.`,
      duration: 280,
      prompt: 'Family traditions you cherish',
      createdAt: yearsAgo(4),
    },
    {
      title: 'The Christmas miracle of 1987',
      description: 'A story about kindness and hope during hard times.',
      transcript: `Christmas 1987. I was 22, newly married, and we had nothing. David had just lost his job when the architecture firm downsized. We were living in a tiny apartment, counting pennies, wondering how we'd pay rent. I didn't know how we'd have any kind of Christmas. We couldn't afford a tree, let alone gifts. I cried myself to sleep more nights than I'd like to admit. On Christmas Eve, there was a knock at our door. When David opened it, no one was there. But on our doorstep was a box. Inside was a small Christmas tree, already decorated. A ham. Potatoes. Vegetables. And an envelope with $500 cash and a note that said, "Merry Christmas from a friend." We never found out who it was. We asked everyone we knew. No one claimed it. That money got us through January. David found a new job in February. But more than the money, that gift gave us hope. It reminded us that there's goodness in the world, even when things seem darkest. Every year since, we've tried to pay it forward. Anonymous gifts to families who are struggling. It's become our tradition. Whoever you were, mysterious friend - thank you. You changed our lives. You taught us the true meaning of Christmas.`,
      duration: 320,
      prompt: 'Favorite holiday memory',
      createdAt: yearsAgo(5),
    },
    {
      title: 'What marriage really means',
      description: 'Reflections on 33 years of partnership.',
      transcript: `People ask me the secret to a long marriage. After 33 years with David, here's what I've learned: Marriage isn't about finding the perfect person. It's about loving an imperfect person perfectly. David leaves his socks on the floor. I'm terrible with directions. We've learned to laugh about it. It's about choosing each other, every single day. Even on the hard days. Especially on the hard days. There were times we wanted to give up. Times we hurt each other. But we kept choosing to stay, to work, to grow. It's about growing together, not apart. We've both changed so much since 1991. The key is changing in the same direction. Supporting each other's dreams, even when they're scary. It's about the little things. The coffee he brings me every morning. The way I scratch his back while we watch TV. The inside jokes no one else understands. It's about forgiveness. Real forgiveness, not keeping score. We've both made mistakes. Big ones. But we've learned to let go, to move forward, to trust again. And it's about friendship. David is my best friend. My favorite person to talk to, to laugh with, to sit in silence with. If you find someone who makes ordinary moments feel special, hold onto them. That's the real magic.`,
      duration: 350,
      prompt: 'What keeps your love strong after all these years?',
      createdAt: yearsAgo(0, 3, 1),
    },
    {
      title: 'Lessons from my father',
      description: 'Remembering Dad and the wisdom he shared.',
      transcript: `My father, James Wilson, was a quiet man. He didn't say much, but when he spoke, you listened. He served in Vietnam. Never talked about it much, but it shaped him. Made him appreciate the simple things. A warm meal. A safe home. Family gathered around the table. He taught me to work hard. "Nothing worth having comes easy, Sarah," he'd say. He worked two jobs to put us through school, never complained once. He taught me to be honest. Even when it's hard. Even when a lie would be easier. "Your word is all you have," he'd say. "Don't waste it on lies." He taught me to love deeply. The way he looked at my mother, even after 50 years... that's the kind of love I wanted. The kind I found with David. He taught me that strength isn't about never falling. It's about getting back up. Every time. Dad passed away in April 2020. The pandemic meant we couldn't all be there. But he knew he was loved. I made sure of that. I miss him every day. But I hear his voice in my head, guiding me. I see him in my children, in my grandchildren. Dad, if you can hear this somehow - thank you. For everything. I hope I've made you proud.`,
      duration: 380,
      prompt: 'Mentors who shaped your life',
      createdAt: yearsAgo(1, 6, 20),
    },
    {
      title: 'A letter to my grandchildren',
      description: 'Words of love for Lily and Oliver.',
      transcript: `My darling Lily and Oliver, by the time you're old enough to really understand this, I might not be here anymore. So I want to make sure you know some things. First, you are loved. More than you can possibly imagine. From the moment you were born, you captured my heart completely. Being your Nana is the greatest joy of my life. Lily, you came into this world on Christmas Day, the best gift we ever received. You're so much like your mother - smart, determined, kind. Don't ever let anyone dim your light. Oliver, you're still so little as I record this, but I already see so much of your grandfather in you. That mischievous smile, that curiosity about everything. Keep asking questions, little one. I want you to know about your family. About your great-grandfather James, who was a hero. About your great-grandmother Rose, who makes the best apple pie. About all the people who came before you, whose love made you possible. I want you to know that life won't always be easy. There will be hard days, sad days, days when you want to give up. But you come from strong people. You have that strength inside you too. Be kind. Be brave. Be yourselves. And know that wherever I am, I'm watching over you. I'm cheering you on. I'm so, so proud of you. All my love, forever and always, Nana.`,
      duration: 400,
      prompt: 'What does family mean to you?',
      createdAt: yearsAgo(0, 1, 15),
    },
  ];

  const voiceRecordings = [];
  for (const v of voiceRecordingsData) {
    const recording = await prisma.voiceRecording.create({
      data: {
        userId: user.id,
        title: v.title,
        description: v.description,
        transcript: v.transcript,
        duration: v.duration,
        prompt: v.prompt,
        fileUrl: `https://heirloom-audio.s3.amazonaws.com/${user.id}/${v.title.toLowerCase().replace(/\\s+/g, '-')}.mp3`,
        fileKey: `${user.id}/${v.title.toLowerCase().replace(/\\s+/g, '-')}.mp3`,
        fileSize: v.duration * 12000,
        encrypted: false,
        createdAt: v.createdAt,
      },
    });
    voiceRecordings.push(recording);
  }

  console.log(`Created ${voiceRecordings.length} voice recordings with transcripts`);

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

  console.log(`Created ${letters.length} letters`);

  // Create notifications
  const notificationsData = [
    { type: 'REMINDER', title: 'Time to add a new memory', message: 'Your family is waiting to hear from you. Share a moment that matters.', read: false },
    { type: 'MILESTONE', title: 'You\'ve reached 50 memories!', message: 'Half a century of moments preserved. Your legacy grows stronger every day.', read: true },
    { type: 'EMOTIONAL', title: 'Emma\'s birthday is coming up', message: 'Would you like to write her a letter or record a special message?', read: false },
    { type: 'SYSTEM', title: 'Your subscription renews soon', message: 'Your Family plan renews on January 15th. Thank you for preserving your legacy.', read: true },
    { type: 'REMINDER', title: 'It\'s been a week since your last recording', message: 'Your voice is a gift to future generations. Take a moment to share a story.', read: false },
    { type: 'EMOTIONAL', title: 'Anniversary reminder', message: 'Your 33rd wedding anniversary is next month. Consider recording a message for David.', read: false },
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

  // Create activities
  const activitiesData = [
    { type: 'MEMORY_CREATED', action: 'Added memory: Summer begins', resourceType: 'memory', resourceId: memories[memories.length - 1].id },
    { type: 'VOICE_RECORDED', action: 'Recorded: A letter to my grandchildren', resourceType: 'voice', resourceId: voiceRecordings[voiceRecordings.length - 1].id },
    { type: 'LETTER_SEALED', action: 'Sealed letter: To my children on my passing', resourceType: 'letter', resourceId: letters[0].id },
    { type: 'FAMILY_ADDED', action: 'Added family member: Oliver Mitchell', resourceType: 'family', resourceId: familyMembers[familyMembers.length - 1].id },
    { type: 'LOGIN', action: 'Logged in from Chrome on MacOS', resourceType: null, resourceId: null },
    { type: 'SETTINGS_UPDATED', action: 'Updated notification preferences', resourceType: 'settings', resourceId: null },
  ];

  for (const a of activitiesData) {
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: a.type,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
      },
    });
  }
  console.log(`Created ${activitiesData.length} activities`);

  // Create wrapped data for multiple years
  const wrappedYears = [2020, 2021, 2022, 2023, 2024];
  for (const year of wrappedYears) {
    await prisma.wrappedData.create({
      data: {
        userId: user.id,
        year,
        totalMemories: Math.floor(Math.random() * 30) + 20,
        totalVoiceStories: Math.floor(Math.random() * 10) + 5,
        totalLetters: Math.floor(Math.random() * 5) + 2,
        totalStorage: BigInt(Math.floor(Math.random() * 1000000000) + 500000000),
        topEmotions: ['love', 'joy', 'nostalgia', 'gratitude'],
        longestStreak: Math.floor(Math.random() * 20) + 10,
        currentStreak: Math.floor(Math.random() * 10) + 1,
        topTaggedPeople: ['Emma', 'David', 'Lily', 'Michael'],
        highlights: [{ title: 'Best memory of the year', type: 'memory' }],
        generatedAt: new Date(year, 11, 31),
      },
    });
  }
  console.log(`Created wrapped data for ${wrappedYears.length} years`);

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
  const legacyContactsData = [
    { name: 'Emma Johnson-Mitchell', email: 'emma@example.com', relationship: 'Daughter' },
    { name: 'Michael Johnson', email: 'michael@example.com', relationship: 'Son' },
    { name: 'David Johnson', email: 'david@example.com', relationship: 'Husband' },
  ];

  for (const lc of legacyContactsData) {
    await prisma.legacyContact.create({
      data: {
        userId: user.id,
        name: lc.name,
        email: lc.email,
        relationship: lc.relationship,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });
  }
  console.log(`Created ${legacyContactsData.length} legacy contacts`);

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

  console.log(`Created ${coupons.length} sample coupons`);

  console.log('\n========================================');
  console.log('SEEDING COMPLETE - 10 Years of Data');
  console.log('========================================\n');
  console.log(`
Summary:
- 1 demo user (demo@heirloom.app / demo123456)
- 1 admin user (admin@heirloom.app / admin123456)
- ${familyMembers.length} family members (3 generations)
- ${memories.length} memories spanning 2015-2025
- ${voiceRecordings.length} voice recordings with detailed transcripts
- ${letters.length} letters (immediate, scheduled, posthumous)
- ${notificationsData.length} notifications
- ${activitiesData.length} activities
- ${wrappedYears.length} years of wrapped data (2020-2024)
- 1 Dead Man's Switch configuration
- ${legacyContactsData.length} legacy contacts
- ${coupons.length} sample coupons

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
