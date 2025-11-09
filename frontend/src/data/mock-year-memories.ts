/**
 * Mock data simulating a full year of memory capturing
 * Demonstrates the Heirloom platform with realistic usage patterns
 */

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  people: string[];
  emotions: string[];
  category: string;
  privacyLevel: 'public' | 'private' | 'restricted';
  isTimeLocked: boolean;
  unlockDate?: string;
  mediaType: 'photo' | 'video' | 'audio' | 'document';
  thumbnail?: string;
}

/**
 * Full year of memories (52 memories - one per week)
 * Simulating a person capturing their life throughout 2024
 */
export const yearOfMemories: Memory[] = [
  {
    id: 'mem-001',
    title: 'New Year\'s Eve Celebration',
    description: 'Welcomed 2024 with family and friends. Champagne toast at midnight, fireworks lighting up the sky.',
    date: '2024-01-01',
    location: 'Home, San Francisco',
    people: ['Sarah', 'Michael', 'Emma', 'James'],
    emotions: ['Joy', 'Hope', 'Gratitude'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-002',
    title: 'First Snowfall',
    description: 'Took the kids to see their first real snowfall. Emma made her first snowman.',
    date: '2024-01-08',
    location: 'Lake Tahoe, California',
    people: ['Emma', 'James', 'Sarah'],
    emotions: ['Joy', 'Awe', 'Love'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-003',
    title: 'Grandmother\'s 90th Birthday',
    description: 'Four generations gathered to celebrate Grandma Rose. She shared stories from her childhood.',
    date: '2024-01-15',
    location: 'Family Home, Napa Valley',
    people: ['Grandma Rose', 'Mom', 'Dad', 'Sarah', 'Emma', 'James'],
    emotions: ['Love', 'Gratitude', 'Nostalgia'],
    category: 'Milestone',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-004',
    title: 'Career Milestone',
    description: 'Promoted to Senior Director. Years of hard work finally paying off.',
    date: '2024-01-22',
    location: 'Office, San Francisco',
    people: ['Team Members', 'Sarah'],
    emotions: ['Pride', 'Gratitude', 'Joy'],
    category: 'Career',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-005',
    title: 'Valentine\'s Day Surprise',
    description: 'Sarah planned a surprise dinner at the restaurant where we had our first date.',
    date: '2024-02-14',
    location: 'Chez Panisse, Berkeley',
    people: ['Sarah'],
    emotions: ['Love', 'Gratitude', 'Joy'],
    category: 'Romance',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-006',
    title: 'Emma\'s School Play',
    description: 'Emma played the lead role in her school\'s production of Annie. She was magnificent.',
    date: '2024-02-20',
    location: 'Lincoln Elementary School',
    people: ['Emma', 'Sarah', 'James', 'Grandparents'],
    emotions: ['Pride', 'Joy', 'Love'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-007',
    title: 'Weekend Hiking Adventure',
    description: 'Conquered the Mist Trail at Yosemite. The view from the top was breathtaking.',
    date: '2024-02-25',
    location: 'Yosemite National Park',
    people: ['Sarah', 'Michael', 'Lisa'],
    emotions: ['Awe', 'Peace', 'Gratitude'],
    category: 'Adventure',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-008',
    title: 'First Day of Spring',
    description: 'Planted a cherry blossom tree in the backyard. A living memory for generations.',
    date: '2024-03-20',
    location: 'Home Garden',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Hope', 'Peace', 'Love'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-009',
    title: 'James\'s First Steps',
    description: 'Our little one took his first independent steps today. Growing up so fast.',
    date: '2024-03-15',
    location: 'Living Room',
    people: ['James', 'Sarah', 'Emma'],
    emotions: ['Joy', 'Pride', 'Love'],
    category: 'Milestone',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-010',
    title: 'Spring Break Road Trip',
    description: 'Drove down Highway 1 to Big Sur. Stopped at every scenic overlook.',
    date: '2024-03-28',
    location: 'Big Sur, California',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Awe', 'Peace'],
    category: 'Travel',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-011',
    title: 'Easter Sunday',
    description: 'Family egg hunt in the garden. Emma found the golden egg!',
    date: '2024-04-07',
    location: 'Home Garden',
    people: ['Sarah', 'Emma', 'James', 'Extended Family'],
    emotions: ['Joy', 'Love', 'Gratitude'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-012',
    title: 'Emma\'s 8th Birthday Party',
    description: 'Unicorn-themed party with all her friends. The cake was a masterpiece.',
    date: '2024-04-15',
    location: 'Home',
    people: ['Emma', 'Friends', 'Sarah', 'James'],
    emotions: ['Joy', 'Love', 'Pride'],
    category: 'Milestone',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-013',
    title: 'Cherry Blossoms in Bloom',
    description: 'The tree we planted is blooming! Pink petals everywhere.',
    date: '2024-04-22',
    location: 'Home Garden',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Awe', 'Peace', 'Hope'],
    category: 'Nature',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-014',
    title: 'Mother\'s Day Breakfast',
    description: 'Kids made breakfast in bed for Sarah. Slightly burnt toast, but made with love.',
    date: '2024-05-12',
    location: 'Home',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Love', 'Gratitude', 'Joy'],
    category: 'Family',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-015',
    title: 'Memorial Day BBQ',
    description: 'Hosted the annual family barbecue. Three generations sharing stories and laughter.',
    date: '2024-05-27',
    location: 'Backyard',
    people: ['Extended Family', 'Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Gratitude', 'Nostalgia'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-016',
    title: 'Emma\'s Soccer Championship',
    description: 'Her team won the championship! She scored the winning goal.',
    date: '2024-05-20',
    location: 'Golden Gate Park',
    people: ['Emma', 'Team', 'Sarah', 'James'],
    emotions: ['Pride', 'Joy', 'Gratitude'],
    category: 'Achievement',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  
  {
    id: 'mem-017',
    title: 'Last Day of School',
    description: 'Emma completed 2nd grade with honors. Summer vacation begins!',
    date: '2024-06-14',
    location: 'Lincoln Elementary',
    people: ['Emma', 'Sarah', 'Teachers'],
    emotions: ['Pride', 'Joy', 'Hope'],
    category: 'Education',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-018',
    title: 'Father\'s Day Fishing Trip',
    description: 'Took Emma fishing for the first time. She caught a bass!',
    date: '2024-06-16',
    location: 'Lake Berryessa',
    people: ['Emma', 'Dad'],
    emotions: ['Joy', 'Pride', 'Peace'],
    category: 'Family',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-019',
    title: 'Summer Solstice Celebration',
    description: 'Watched the sunset from Twin Peaks. Longest day of the year.',
    date: '2024-06-21',
    location: 'Twin Peaks, San Francisco',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Peace', 'Awe', 'Gratitude'],
    category: 'Nature',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-020',
    title: '4th of July Fireworks',
    description: 'Watched fireworks over the bay. James\'s first fireworks show.',
    date: '2024-07-04',
    location: 'Marina District',
    people: ['Sarah', 'Emma', 'James', 'Friends'],
    emotions: ['Joy', 'Awe', 'Gratitude'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-021',
    title: 'Family Vacation to Hawaii',
    description: 'First family trip to Maui. Snorkeling, beaches, and unforgettable sunsets.',
    date: '2024-07-15',
    location: 'Maui, Hawaii',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Peace', 'Love'],
    category: 'Travel',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-022',
    title: 'Learning to Surf',
    description: 'Emma caught her first wave! Natural surfer in the making.',
    date: '2024-07-18',
    location: 'Wailea Beach, Maui',
    people: ['Emma', 'Surf Instructor'],
    emotions: ['Pride', 'Joy', 'Awe'],
    category: 'Adventure',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  
  {
    id: 'mem-023',
    title: 'Backyard Camping',
    description: 'Set up a tent in the backyard. Told ghost stories and roasted marshmallows.',
    date: '2024-08-03',
    location: 'Backyard',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Love', 'Peace'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-024',
    title: 'Perseid Meteor Shower',
    description: 'Drove to the mountains to watch shooting stars. Made wishes together.',
    date: '2024-08-12',
    location: 'Mount Tamalpais',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Awe', 'Peace', 'Hope'],
    category: 'Nature',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-025',
    title: 'Summer\'s End Beach Day',
    description: 'Last beach day before school starts. Built the biggest sandcastle ever.',
    date: '2024-08-25',
    location: 'Stinson Beach',
    people: ['Sarah', 'Emma', 'James', 'Friends'],
    emotions: ['Joy', 'Nostalgia', 'Peace'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-026',
    title: 'First Day of 3rd Grade',
    description: 'Emma started 3rd grade. New teacher, new adventures.',
    date: '2024-09-03',
    location: 'Lincoln Elementary',
    people: ['Emma', 'Sarah'],
    emotions: ['Hope', 'Pride', 'Joy'],
    category: 'Education',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-027',
    title: 'James\'s First Birthday',
    description: 'Our little one turned one! Smash cake was a huge success.',
    date: '2024-09-10',
    location: 'Home',
    people: ['James', 'Sarah', 'Emma', 'Family'],
    emotions: ['Love', 'Joy', 'Gratitude'],
    category: 'Milestone',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-028',
    title: 'Autumn Equinox Hike',
    description: 'Hiked to Alamere Falls. The changing leaves were spectacular.',
    date: '2024-09-22',
    location: 'Point Reyes National Seashore',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Peace', 'Awe', 'Gratitude'],
    category: 'Nature',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-029',
    title: 'Pumpkin Patch Adventure',
    description: 'Found the perfect pumpkins for carving. Hayride and apple cider.',
    date: '2024-10-12',
    location: 'Half Moon Bay',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Nostalgia', 'Peace'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-030',
    title: 'Halloween Costume Party',
    description: 'Emma dressed as a scientist, James as a little pumpkin. Trick-or-treating was magical.',
    date: '2024-10-31',
    location: 'Neighborhood',
    people: ['Sarah', 'Emma', 'James', 'Neighbors'],
    emotions: ['Joy', 'Love', 'Nostalgia'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-031',
    title: 'Career Achievement',
    description: 'Led the successful launch of our biggest project. Team celebration.',
    date: '2024-10-20',
    location: 'Office',
    people: ['Team', 'Sarah'],
    emotions: ['Pride', 'Gratitude', 'Joy'],
    category: 'Career',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-032',
    title: 'Veterans Day Tribute',
    description: 'Visited Grandpa\'s memorial. Taught the kids about his service.',
    date: '2024-11-11',
    location: 'National Cemetery',
    people: ['Sarah', 'Emma', 'James', 'Mom'],
    emotions: ['Gratitude', 'Nostalgia', 'Pride'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-033',
    title: 'Thanksgiving Feast',
    description: 'Hosted Thanksgiving for 20 family members. Emma helped cook her first turkey.',
    date: '2024-11-28',
    location: 'Home',
    people: ['Extended Family', 'Sarah', 'Emma', 'James'],
    emotions: ['Gratitude', 'Love', 'Joy'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-034',
    title: 'Black Friday Tradition',
    description: 'Skipped the sales. Instead, volunteered at the food bank as a family.',
    date: '2024-11-29',
    location: 'SF Food Bank',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Gratitude', 'Pride', 'Love'],
    category: 'Service',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-035',
    title: 'First Snow of Winter',
    description: 'Unexpected snowfall in the city! Kids made snow angels in the park.',
    date: '2024-12-05',
    location: 'Golden Gate Park',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Awe', 'Love'],
    category: 'Nature',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-036',
    title: 'Holiday Lights Tour',
    description: 'Drove through neighborhoods to see Christmas lights. Hot cocoa and carols.',
    date: '2024-12-15',
    location: 'Various Neighborhoods',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Peace', 'Nostalgia'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-037',
    title: 'Christmas Eve Magic',
    description: 'Read \'Twas the Night Before Christmas. Left cookies for Santa.',
    date: '2024-12-24',
    location: 'Home',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Love', 'Hope'],
    category: 'Celebration',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-038',
    title: 'Christmas Morning',
    description: 'Emma got her first bike, James got building blocks. Pure joy.',
    date: '2024-12-25',
    location: 'Home',
    people: ['Sarah', 'Emma', 'James', 'Grandparents'],
    emotions: ['Joy', 'Love', 'Gratitude'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-039',
    title: 'Year-End Reflection',
    description: 'Looked through all our photos from 2024. What an incredible year.',
    date: '2024-12-31',
    location: 'Home',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Gratitude', 'Nostalgia', 'Hope'],
    category: 'Reflection',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  
  {
    id: 'mem-040',
    title: 'Winter Morning Walk',
    description: 'Crisp January morning. Coffee and conversation with Sarah.',
    date: '2024-01-29',
    location: 'Neighborhood',
    people: ['Sarah'],
    emotions: ['Peace', 'Love', 'Gratitude'],
    category: 'Daily Life',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-041',
    title: 'Piano Recital',
    description: 'Emma performed Für Elise perfectly. Six months of practice paid off.',
    date: '2024-03-10',
    location: 'Music School',
    people: ['Emma', 'Sarah', 'James', 'Teacher'],
    emotions: ['Pride', 'Joy', 'Love'],
    category: 'Achievement',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'video'
  },
  {
    id: 'mem-042',
    title: 'Spring Garden Planting',
    description: 'Planted tomatoes, herbs, and flowers. Emma has her own garden plot now.',
    date: '2024-04-28',
    location: 'Home Garden',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Hope', 'Peace', 'Joy'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-043',
    title: 'Cinco de Mayo Fiesta',
    description: 'Neighborhood block party. Homemade tacos and dancing.',
    date: '2024-05-05',
    location: 'Neighborhood',
    people: ['Neighbors', 'Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Gratitude', 'Love'],
    category: 'Community',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-044',
    title: 'Graduation Ceremony',
    description: 'Completed my Executive MBA. Sarah and kids surprised me with flowers.',
    date: '2024-06-08',
    location: 'UC Berkeley',
    people: ['Sarah', 'Emma', 'James', 'Classmates'],
    emotions: ['Pride', 'Gratitude', 'Joy'],
    category: 'Achievement',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-045',
    title: 'Summer Concert in the Park',
    description: 'Jazz under the stars. James danced to every song.',
    date: '2024-07-27',
    location: 'Stern Grove',
    people: ['Sarah', 'Emma', 'James', 'Friends'],
    emotions: ['Joy', 'Peace', 'Love'],
    category: 'Entertainment',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-046',
    title: 'County Fair Adventure',
    description: 'Ferris wheel, cotton candy, and Emma won a giant teddy bear.',
    date: '2024-08-17',
    location: 'Marin County Fair',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Nostalgia', 'Love'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-047',
    title: 'Labor Day Sailing',
    description: 'First time sailing on the bay. Emma wants to learn to sail now.',
    date: '2024-09-02',
    location: 'San Francisco Bay',
    people: ['Sarah', 'Emma', 'James', 'Friends'],
    emotions: ['Joy', 'Awe', 'Peace'],
    category: 'Adventure',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-048',
    title: 'Grandparents\' Anniversary',
    description: '60 years of marriage. They renewed their vows surrounded by family.',
    date: '2024-09-28',
    location: 'Family Home',
    people: ['Grandparents', 'Extended Family', 'Sarah', 'Emma', 'James'],
    emotions: ['Love', 'Gratitude', 'Nostalgia'],
    category: 'Celebration',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-049',
    title: 'Fall Harvest Festival',
    description: 'Apple picking, cider pressing, and hayrides. Perfect autumn day.',
    date: '2024-10-06',
    location: 'Apple Hill',
    people: ['Sarah', 'Emma', 'James', 'Friends'],
    emotions: ['Joy', 'Peace', 'Gratitude'],
    category: 'Family',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-050',
    title: 'Diwali Celebration',
    description: 'Celebrated with our neighbors. Lit diyas and shared sweets.',
    date: '2024-11-01',
    location: 'Neighborhood',
    people: ['Neighbors', 'Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Gratitude', 'Peace'],
    category: 'Community',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-051',
    title: 'First Hanukkah Candle',
    description: 'Joined friends for the first night of Hanukkah. Latkes and dreidel games.',
    date: '2024-12-08',
    location: 'Friends\' Home',
    people: ['Friends', 'Sarah', 'Emma', 'James'],
    emotions: ['Joy', 'Gratitude', 'Love'],
    category: 'Community',
    privacyLevel: 'public',
    isTimeLocked: false,
    mediaType: 'photo'
  },
  {
    id: 'mem-052',
    title: 'Winter Solstice',
    description: 'Longest night of the year. Lit candles and reflected on the year\'s blessings.',
    date: '2024-12-21',
    location: 'Home',
    people: ['Sarah', 'Emma', 'James'],
    emotions: ['Peace', 'Gratitude', 'Hope'],
    category: 'Reflection',
    privacyLevel: 'private',
    isTimeLocked: false,
    mediaType: 'photo'
  }
];

/**
 * Get memories by month
 */
export function getMemoriesByMonth(month: number): Memory[] {
  return yearOfMemories.filter(memory => {
    const memoryMonth = new Date(memory.date).getMonth() + 1;
    return memoryMonth === month;
  });
}

/**
 * Get memories by emotion
 */
export function getMemoriesByEmotion(emotion: string): Memory[] {
  return yearOfMemories.filter(memory => 
    memory.emotions.includes(emotion)
  );
}

/**
 * Get memories by category
 */
export function getMemoriesByCategory(category: string): Memory[] {
  return yearOfMemories.filter(memory => 
    memory.category === category
  );
}

/**
 * Get recent memories (last N)
 */
export function getRecentMemories(count: number = 10): Memory[] {
  return yearOfMemories
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}
