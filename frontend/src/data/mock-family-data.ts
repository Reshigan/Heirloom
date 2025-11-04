export interface FamilyMember {
  id: string
  name: string
  birthDate: string
  deathDate?: string
  birthPlace: string
  occupation: string
  bio: string
  avatar: string
  parentIds: string[]
  spouseIds: string[]
  childrenIds: string[]
  generation: number
  position: { x: number; y: number }
  memories: string[]
  achievements: string[]
  relationships: {
    id: string
    type: 'parent' | 'spouse' | 'child' | 'sibling'
    name: string
  }[]
  lifeStatus: 'alive' | 'deceased'
  vaultStatus: 'sealed' | 'unsealed'
  unlockedAt?: Date
  executors?: string[]
  guardians?: string[]
  vaults?: { id: string; name: string; tokenId: string; audienceType: 'immediate' | 'extended' | 'custom' }[]
  vaultHealth?: {
    lastUpdated: Date
    missingMetadataCount: number
    completionPercentage: number
    suggestions: string[]
  }
}

export interface Memory {
  id: string
  title: string
  description: string
  date: string
  location: string
  participants: string[]
  tags: string[]
  type: 'photo' | 'document' | 'story' | 'video' | 'audio' | 'legacy-video'
  thumbnail: string
  content: string
  aiEnhanced: boolean
  emotions: string[]
  significance: 'low' | 'medium' | 'high' | 'milestone'
  privacyLevel: 'public' | 'private' | 'restricted'
  restrictedTo?: string[]
  unlockDate?: string
  isTimeLocked: boolean
  reactions?: { userId: string; type: 'heart' | 'smile' | 'tear' | 'star'; timestamp: Date }[]
  comments?: { userId: string; userName: string; text: string; timestamp: Date }[]
  aiGeneratedEmotions?: { emotion: string; confidence: number }[]
  legacyRecipient?: string
  legacyOccasion?: string
}

export interface TimelineEvent {
  id: string
  title: string
  date: string
  description: string
  type: 'birth' | 'marriage' | 'death' | 'achievement' | 'milestone' | 'family' | 'career'
  participants: string[]
  location: string
  significance: 'low' | 'medium' | 'high'
  memories: string[]
  era: string
}

// Mock Family Data
export const mockFamilyMembers: FamilyMember[] = [
  // Great Grandparents (Generation 1)
  {
    id: 'gg1',
    name: 'William Hamilton',
    birthDate: '1895-03-15',
    deathDate: '1978-11-22',
    birthPlace: 'Edinburgh, Scotland',
    occupation: 'Master Clockmaker',
    bio: 'A skilled craftsman who immigrated to America in 1920. Known for his precision and dedication to his craft.',
    avatar: '/avatars/william.jpg',
    parentIds: [],
    spouseIds: ['gg2'],
    childrenIds: ['g1'],
    generation: 1,
    position: { x: 200, y: 50 },
    memories: ['mem1', 'mem2', 'mem15'],
    achievements: ['Master Craftsman Certification', 'Founded Hamilton Clockworks'],
    relationships: [
      { id: 'gg2', type: 'spouse', name: 'Margaret Hamilton' },
      { id: 'g1', type: 'child', name: 'Robert Hamilton' }
    ],
    lifeStatus: 'deceased',
    vaultStatus: 'unsealed',
    unlockedAt: new Date('1978-12-01')
  },
  {
    id: 'gg2',
    name: 'Margaret Hamilton',
    birthDate: '1898-07-08',
    deathDate: '1982-05-14',
    birthPlace: 'Dublin, Ireland',
    occupation: 'Seamstress & Homemaker',
    bio: 'A talented seamstress who created beautiful garments for the local community. Known for her warm heart and storytelling.',
    avatar: '/avatars/margaret.jpg',
    parentIds: [],
    spouseIds: ['gg1'],
    childrenIds: ['g1'],
    generation: 1,
    position: { x: 400, y: 50 },
    memories: ['mem1', 'mem3', 'mem16'],
    achievements: ['Community Service Award', 'Master Seamstress'],
    relationships: [
      { id: 'gg1', type: 'spouse', name: 'William Hamilton' },
      { id: 'g1', type: 'child', name: 'Robert Hamilton' }
    ],
    lifeStatus: 'deceased',
    vaultStatus: 'unsealed',
    unlockedAt: new Date('1982-06-01')
  },
  
  // Grandparents (Generation 2)
  {
    id: 'g1',
    name: 'Robert Hamilton',
    birthDate: '1925-12-03',
    deathDate: '2010-08-17',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'Mechanical Engineer',
    bio: 'A brilliant engineer who worked on early computer systems. Served in WWII and later helped design NASA equipment.',
    avatar: '/avatars/robert.jpg',
    parentIds: ['gg1', 'gg2'],
    spouseIds: ['g2'],
    childrenIds: ['p1', 'p2'],
    generation: 2,
    position: { x: 200, y: 200 },
    memories: ['mem4', 'mem5', 'mem17'],
    achievements: ['WWII Veteran', 'NASA Contributor', 'Engineering Excellence Award'],
    relationships: [
      { id: 'gg1', type: 'parent', name: 'William Hamilton' },
      { id: 'gg2', type: 'parent', name: 'Margaret Hamilton' },
      { id: 'g2', type: 'spouse', name: 'Eleanor Hamilton' },
      { id: 'p1', type: 'child', name: 'James Hamilton' },
      { id: 'p2', type: 'child', name: 'Sarah Mitchell' }
    ]
  },
  {
    id: 'g2',
    name: 'Eleanor Hamilton',
    birthDate: '1928-04-20',
    deathDate: '2015-01-09',
    birthPlace: 'Chicago, Illinois',
    occupation: 'School Principal',
    bio: 'A dedicated educator who shaped young minds for over 40 years. Known for her innovative teaching methods.',
    avatar: '/avatars/eleanor.jpg',
    parentIds: [],
    spouseIds: ['g1'],
    childrenIds: ['p1', 'p2'],
    generation: 2,
    position: { x: 400, y: 200 },
    memories: ['mem4', 'mem6', 'mem18'],
    achievements: ['Educator of the Year', 'School Innovation Award', '40 Years Service'],
    relationships: [
      { id: 'g1', type: 'spouse', name: 'Robert Hamilton' },
      { id: 'p1', type: 'child', name: 'James Hamilton' },
      { id: 'p2', type: 'child', name: 'Sarah Mitchell' }
    ]
  },
  
  // Parents (Generation 3)
  {
    id: 'p1',
    name: 'James Hamilton',
    birthDate: '1955-06-12',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'Software Architect',
    bio: 'A pioneering software developer who helped build early internet infrastructure. Passionate about technology and family history.',
    avatar: '/avatars/james.jpg',
    parentIds: ['g1', 'g2'],
    spouseIds: ['p3'],
    childrenIds: ['c1', 'c2'],
    generation: 3,
    position: { x: 100, y: 350 },
    memories: ['mem7', 'mem8', 'mem19'],
    achievements: ['Internet Pioneer Award', 'Tech Innovation Leader', 'Open Source Contributor'],
    relationships: [
      { id: 'g1', type: 'parent', name: 'Robert Hamilton' },
      { id: 'g2', type: 'parent', name: 'Eleanor Hamilton' },
      { id: 'p3', type: 'spouse', name: 'Linda Hamilton' },
      { id: 'c1', type: 'child', name: 'Michael Hamilton' },
      { id: 'c2', type: 'child', name: 'Emma Hamilton' },
      { id: 'p2', type: 'sibling', name: 'Sarah Mitchell' }
    ]
  },
  {
    id: 'p3',
    name: 'Linda Hamilton',
    birthDate: '1958-09-25',
    birthPlace: 'San Francisco, California',
    occupation: 'Pediatric Nurse',
    bio: 'A compassionate nurse who dedicated her career to caring for children. Known for her gentle nature and healing touch.',
    avatar: '/avatars/linda.jpg',
    parentIds: [],
    spouseIds: ['p1'],
    childrenIds: ['c1', 'c2'],
    generation: 3,
    position: { x: 300, y: 350 },
    memories: ['mem7', 'mem9', 'mem20'],
    achievements: ['Nursing Excellence Award', 'Child Advocacy Recognition', '30 Years Service'],
    relationships: [
      { id: 'p1', type: 'spouse', name: 'James Hamilton' },
      { id: 'c1', type: 'child', name: 'Michael Hamilton' },
      { id: 'c2', type: 'child', name: 'Emma Hamilton' }
    ]
  },
  {
    id: 'p2',
    name: 'Sarah Mitchell',
    birthDate: '1952-11-30',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'Art Therapist',
    bio: 'A creative soul who uses art to heal others. Specializes in helping children express their emotions through creativity.',
    avatar: '/avatars/sarah.jpg',
    parentIds: ['g1', 'g2'],
    spouseIds: ['p4'],
    childrenIds: ['c3', 'c4'],
    generation: 3,
    position: { x: 500, y: 350 },
    memories: ['mem10', 'mem11', 'mem21'],
    achievements: ['Art Therapy Certification', 'Community Arts Award', 'Published Author'],
    relationships: [
      { id: 'g1', type: 'parent', name: 'Robert Hamilton' },
      { id: 'g2', type: 'parent', name: 'Eleanor Hamilton' },
      { id: 'p4', type: 'spouse', name: 'David Mitchell' },
      { id: 'c3', type: 'child', name: 'Alex Mitchell' },
      { id: 'c4', type: 'child', name: 'Sophie Mitchell' },
      { id: 'p1', type: 'sibling', name: 'James Hamilton' }
    ]
  },
  {
    id: 'p4',
    name: 'David Mitchell',
    birthDate: '1950-02-14',
    birthPlace: 'Portland, Oregon',
    occupation: 'Environmental Scientist',
    bio: 'A dedicated environmentalist who spent his career protecting natural resources. Passionate about conservation and outdoor adventures.',
    avatar: '/avatars/david.jpg',
    parentIds: [],
    spouseIds: ['p2'],
    childrenIds: ['c3', 'c4'],
    generation: 3,
    position: { x: 700, y: 350 },
    memories: ['mem10', 'mem12', 'mem22'],
    achievements: ['Environmental Protection Award', 'Conservation Leadership', 'Research Publications'],
    relationships: [
      { id: 'p2', type: 'spouse', name: 'Sarah Mitchell' },
      { id: 'c3', type: 'child', name: 'Alex Mitchell' },
      { id: 'c4', type: 'child', name: 'Sophie Mitchell' }
    ]
  },
  
  // Current Generation (Generation 4)
  {
    id: 'c1',
    name: 'Michael Hamilton',
    birthDate: '1985-03-22',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'UX Designer',
    bio: 'A creative designer who focuses on making technology accessible and beautiful. Passionate about user experience and digital storytelling.',
    avatar: '/avatars/michael.jpg',
    parentIds: ['p1', 'p3'],
    spouseIds: ['c5'],
    childrenIds: ['gc1'],
    generation: 4,
    position: { x: 100, y: 500 },
    memories: ['mem13', 'mem14', 'mem23'],
    achievements: ['Design Excellence Award', 'UX Innovation Leader', 'Digital Accessibility Advocate'],
    relationships: [
      { id: 'p1', type: 'parent', name: 'James Hamilton' },
      { id: 'p3', type: 'parent', name: 'Linda Hamilton' },
      { id: 'c5', type: 'spouse', name: 'Jessica Hamilton' },
      { id: 'gc1', type: 'child', name: 'Oliver Hamilton' },
      { id: 'c2', type: 'sibling', name: 'Emma Hamilton' }
    ]
  },
  {
    id: 'c5',
    name: 'Jessica Hamilton',
    birthDate: '1987-08-15',
    birthPlace: 'Seattle, Washington',
    occupation: 'Data Scientist',
    bio: 'A brilliant data scientist who uses analytics to solve complex problems. Passionate about AI and machine learning applications.',
    avatar: '/avatars/jessica.jpg',
    parentIds: [],
    spouseIds: ['c1'],
    childrenIds: ['gc1'],
    generation: 4,
    position: { x: 300, y: 500 },
    memories: ['mem13', 'mem24'],
    achievements: ['AI Research Award', 'Data Science Excellence', 'Tech Leadership Recognition'],
    relationships: [
      { id: 'c1', type: 'spouse', name: 'Michael Hamilton' },
      { id: 'gc1', type: 'child', name: 'Oliver Hamilton' }
    ]
  },
  {
    id: 'c2',
    name: 'Emma Hamilton',
    birthDate: '1988-12-05',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'Marine Biologist',
    bio: 'A passionate marine biologist dedicated to ocean conservation. Spends her time researching coral reef ecosystems.',
    avatar: '/avatars/emma.jpg',
    parentIds: ['p1', 'p3'],
    spouseIds: [],
    childrenIds: [],
    generation: 4,
    position: { x: 500, y: 500 },
    memories: ['mem25', 'mem26'],
    achievements: ['Marine Research Grant', 'Ocean Conservation Award', 'Scientific Publications'],
    relationships: [
      { id: 'p1', type: 'parent', name: 'James Hamilton' },
      { id: 'p3', type: 'parent', name: 'Linda Hamilton' },
      { id: 'c1', type: 'sibling', name: 'Michael Hamilton' }
    ]
  },
  {
    id: 'c3',
    name: 'Alex Mitchell',
    birthDate: '1990-07-18',
    birthPlace: 'Portland, Oregon',
    occupation: 'Renewable Energy Engineer',
    bio: 'An innovative engineer working on sustainable energy solutions. Combines family environmental values with cutting-edge technology.',
    avatar: '/avatars/alex.jpg',
    parentIds: ['p2', 'p4'],
    spouseIds: [],
    childrenIds: [],
    generation: 4,
    position: { x: 700, y: 500 },
    memories: ['mem27', 'mem28'],
    achievements: ['Clean Energy Innovation', 'Sustainability Leadership', 'Green Tech Pioneer'],
    relationships: [
      { id: 'p2', type: 'parent', name: 'Sarah Mitchell' },
      { id: 'p4', type: 'parent', name: 'David Mitchell' },
      { id: 'c4', type: 'sibling', name: 'Sophie Mitchell' }
    ]
  },
  {
    id: 'c4',
    name: 'Sophie Mitchell',
    birthDate: '1993-01-10',
    birthPlace: 'Portland, Oregon',
    occupation: 'Digital Artist',
    bio: 'A talented digital artist who creates immersive experiences. Combines traditional art techniques with modern technology.',
    avatar: '/avatars/sophie.jpg',
    parentIds: ['p2', 'p4'],
    spouseIds: [],
    childrenIds: [],
    generation: 4,
    position: { x: 900, y: 500 },
    memories: ['mem29', 'mem30'],
    achievements: ['Digital Art Excellence', 'Creative Innovation Award', 'Gallery Exhibitions'],
    relationships: [
      { id: 'p2', type: 'parent', name: 'Sarah Mitchell' },
      { id: 'p4', type: 'parent', name: 'David Mitchell' },
      { id: 'c3', type: 'sibling', name: 'Alex Mitchell' }
    ]
  },
  
  // Next Generation (Generation 5)
  {
    id: 'gc1',
    name: 'Oliver Hamilton',
    birthDate: '2018-05-30',
    birthPlace: 'Boston, Massachusetts',
    occupation: 'Student',
    bio: 'A curious and energetic child who loves building with blocks and asking endless questions about how things work.',
    avatar: '/avatars/oliver.jpg',
    parentIds: ['c1', 'c5'],
    spouseIds: [],
    childrenIds: [],
    generation: 5,
    position: { x: 200, y: 650 },
    memories: ['mem31', 'mem32'],
    achievements: ['First Steps', 'First Words', 'Kindergarten Graduate'],
    relationships: [
      { id: 'c1', type: 'parent', name: 'Michael Hamilton' },
      { id: 'c5', type: 'parent', name: 'Jessica Hamilton' }
    ]
  }
]

// Mock Memories Data
export const mockMemories: Memory[] = [
  {
    id: 'mem1',
    title: 'Wedding Day - William & Margaret',
    description: 'The beautiful wedding ceremony of William and Margaret Hamilton in 1920.',
    date: '1920-06-15',
    location: 'St. Patrick\'s Cathedral, Boston',
    participants: ['gg1', 'gg2'],
    tags: ['wedding', 'love', 'celebration', 'family'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop',
    content: 'A beautiful black and white photograph of William and Margaret on their wedding day...',
    aiEnhanced: true,
    emotions: ['joy', 'love', 'hope'],
    significance: 'milestone'
  },
  {
    id: 'mem2',
    title: 'Hamilton Clockworks Opening',
    description: 'William opens his first clock shop in downtown Boston.',
    date: '1922-03-10',
    location: 'Downtown Boston, Massachusetts',
    participants: ['gg1', 'gg2'],
    tags: ['business', 'achievement', 'clockmaking'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
    content: 'William standing proudly in front of his new clock shop...',
    aiEnhanced: true,
    emotions: ['pride', 'determination', 'hope'],
    significance: 'high'
  },
  {
    id: 'mem3',
    title: 'Margaret\'s Sewing Circle',
    description: 'Margaret with her weekly sewing circle, creating beautiful garments for the community.',
    date: '1925-08-20',
    location: 'Hamilton Family Home',
    participants: ['gg2'],
    tags: ['community', 'craftsmanship', 'friendship'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    content: 'Margaret surrounded by her friends, all working on their latest creations...',
    aiEnhanced: false,
    emotions: ['contentment', 'friendship', 'creativity'],
    significance: 'medium'
  },
  {
    id: 'mem4',
    title: 'Robert\'s Birth',
    description: 'The joyful arrival of Robert Hamilton, first child of William and Margaret.',
    date: '1925-12-03',
    location: 'Boston General Hospital',
    participants: ['gg1', 'gg2', 'g1'],
    tags: ['birth', 'family', 'joy'],
    type: 'document',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    content: 'Birth certificate and hospital records of Robert Hamilton...',
    aiEnhanced: false,
    emotions: ['joy', 'love', 'wonder'],
    significance: 'milestone'
  },
  {
    id: 'mem5',
    title: 'Robert\'s War Service',
    description: 'Robert serving in WWII as a communications specialist.',
    date: '1943-09-15',
    location: 'European Theater',
    participants: ['g1'],
    tags: ['military', 'service', 'courage', 'wwii'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=400&h=300&fit=crop',
    content: 'Robert in his military uniform, ready to serve his country...',
    aiEnhanced: true,
    emotions: ['courage', 'duty', 'sacrifice'],
    significance: 'high'
  },
  {
    id: 'mem6',
    title: 'Eleanor\'s Teaching Award',
    description: 'Eleanor receives the Teacher of the Year award for her innovative methods.',
    date: '1965-05-20',
    location: 'Chicago Board of Education',
    participants: ['g2'],
    tags: ['education', 'achievement', 'recognition'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop',
    content: 'Eleanor proudly holding her Teacher of the Year award...',
    aiEnhanced: false,
    emotions: ['pride', 'accomplishment', 'dedication'],
    significance: 'high'
  },
  {
    id: 'mem7',
    title: 'James & Linda\'s Wedding',
    description: 'The beautiful wedding of James and Linda Hamilton in 1980.',
    date: '1980-07-12',
    location: 'Boston Common Gardens',
    participants: ['p1', 'p3', 'g1', 'g2'],
    tags: ['wedding', 'love', 'family', 'celebration'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    content: 'James and Linda exchanging vows in the beautiful garden setting...',
    aiEnhanced: true,
    emotions: ['love', 'joy', 'commitment'],
    significance: 'milestone'
  },
  {
    id: 'mem8',
    title: 'First Computer Program',
    description: 'James demonstrates his first computer program to the family.',
    date: '1978-11-05',
    location: 'Hamilton Family Home',
    participants: ['p1', 'g1', 'g2'],
    tags: ['technology', 'innovation', 'family'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    content: 'James showing his family the magic of computer programming...',
    aiEnhanced: false,
    emotions: ['excitement', 'innovation', 'pride'],
    significance: 'medium'
  },
  {
    id: 'mem9',
    title: 'Linda\'s Nursing Graduation',
    description: 'Linda graduates from nursing school with honors.',
    date: '1979-05-15',
    location: 'University of California San Francisco',
    participants: ['p3'],
    tags: ['education', 'achievement', 'healthcare'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    content: 'Linda in her nursing cap and gown, ready to heal the world...',
    aiEnhanced: false,
    emotions: ['accomplishment', 'dedication', 'compassion'],
    significance: 'high'
  },
  {
    id: 'mem10',
    title: 'Sarah & David\'s Art Gallery',
    description: 'Sarah and David open their first community art therapy center.',
    date: '1985-09-20',
    location: 'Portland, Oregon',
    participants: ['p2', 'p4'],
    tags: ['art', 'therapy', 'community', 'healing'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    content: 'Sarah and David cutting the ribbon at their new art therapy center...',
    aiEnhanced: false,
    emotions: ['fulfillment', 'hope', 'creativity'],
    significance: 'high'
  },
  {
    id: 'mem11',
    title: 'Family Reunion 1990',
    description: 'The entire Hamilton family gathers for a memorable reunion.',
    date: '1990-07-04',
    location: 'Lake Tahoe, California',
    participants: ['gg1', 'gg2', 'g1', 'g2', 'p1', 'p2', 'p3', 'p4', 'c1', 'c2'],
    tags: ['family', 'reunion', 'celebration', 'togetherness'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
    content: 'Four generations of the Hamilton family enjoying a beautiful summer day...',
    aiEnhanced: true,
    emotions: ['love', 'togetherness', 'joy'],
    significance: 'milestone'
  },
  {
    id: 'mem12',
    title: 'David\'s Environmental Award',
    description: 'David receives recognition for his groundbreaking environmental research.',
    date: '1992-04-22',
    location: 'Environmental Protection Agency, Washington DC',
    participants: ['p4'],
    tags: ['environment', 'achievement', 'conservation'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    content: 'David accepting his environmental protection award...',
    aiEnhanced: false,
    emotions: ['pride', 'dedication', 'hope'],
    significance: 'high'
  },
  {
    id: 'mem13',
    title: 'Michael & Jessica\'s Wedding',
    description: 'A modern wedding celebration combining technology and tradition.',
    date: '2010-09-18',
    location: 'Napa Valley, California',
    participants: ['c1', 'c5', 'p1', 'p3', 'g1', 'g2'],
    tags: ['wedding', 'love', 'modern', 'family'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop',
    content: 'Michael and Jessica\'s beautiful outdoor wedding ceremony...',
    aiEnhanced: true,
    emotions: ['love', 'joy', 'celebration'],
    significance: 'milestone'
  },
  {
    id: 'mem14',
    title: 'First App Launch',
    description: 'Michael launches his first successful mobile app.',
    date: '2012-03-15',
    location: 'San Francisco, California',
    participants: ['c1'],
    tags: ['technology', 'achievement', 'innovation'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
    content: 'Michael celebrating the launch of his groundbreaking app...',
    aiEnhanced: false,
    emotions: ['excitement', 'accomplishment', 'innovation'],
    significance: 'high'
  },
  {
    id: 'mem15',
    title: 'Oliver\'s Birth',
    description: 'The newest addition to the Hamilton family arrives.',
    date: '2018-05-30',
    location: 'Boston Children\'s Hospital',
    participants: ['gc1', 'c1', 'c5'],
    tags: ['birth', 'family', 'new generation'],
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    content: 'Little Oliver Hamilton, the newest member of our family...',
    aiEnhanced: false,
    emotions: ['joy', 'love', 'wonder'],
    significance: 'milestone'
  }
]

// Mock Timeline Events
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'event1',
    title: 'William & Margaret Immigration',
    date: '1920-01-15',
    description: 'William and Margaret Hamilton arrive in America from Scotland and Ireland, beginning the American Hamilton legacy.',
    type: 'milestone',
    participants: ['gg1', 'gg2'],
    location: 'Ellis Island, New York',
    significance: 'high',
    memories: ['mem1'],
    era: '1920s'
  },
  {
    id: 'event2',
    title: 'Hamilton Clockworks Founded',
    date: '1922-03-10',
    description: 'William establishes his clockmaking business, laying the foundation for the family\'s prosperity.',
    type: 'career',
    participants: ['gg1'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: ['mem2'],
    era: '1920s'
  },
  {
    id: 'event3',
    title: 'Robert Hamilton Born',
    date: '1925-12-03',
    description: 'The first American-born Hamilton arrives, continuing the family line.',
    type: 'birth',
    participants: ['g1', 'gg1', 'gg2'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: ['mem4'],
    era: '1920s'
  },
  {
    id: 'event4',
    title: 'Robert Serves in WWII',
    date: '1943-09-15',
    description: 'Robert Hamilton serves his country as a communications specialist in the European Theater.',
    type: 'achievement',
    participants: ['g1'],
    location: 'European Theater',
    significance: 'high',
    memories: ['mem5'],
    era: '1940s'
  },
  {
    id: 'event5',
    title: 'Robert & Eleanor Wedding',
    date: '1948-06-20',
    description: 'Robert marries Eleanor, a dedicated educator, expanding the Hamilton family.',
    type: 'marriage',
    participants: ['g1', 'g2'],
    location: 'Chicago, Illinois',
    significance: 'high',
    memories: [],
    era: '1940s'
  },
  {
    id: 'event6',
    title: 'James Hamilton Born',
    date: '1955-06-12',
    description: 'James Hamilton is born, destined to become a technology pioneer.',
    type: 'birth',
    participants: ['p1', 'g1', 'g2'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: [],
    era: '1950s'
  },
  {
    id: 'event7',
    title: 'Sarah Hamilton Born',
    date: '1952-11-30',
    description: 'Sarah Hamilton is born, future art therapist and healer.',
    type: 'birth',
    participants: ['p2', 'g1', 'g2'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: [],
    era: '1950s'
  },
  {
    id: 'event8',
    title: 'Eleanor Wins Teaching Award',
    date: '1965-05-20',
    description: 'Eleanor Hamilton receives Teacher of the Year for her innovative educational methods.',
    type: 'achievement',
    participants: ['g2'],
    location: 'Chicago, Illinois',
    significance: 'medium',
    memories: ['mem6'],
    era: '1960s'
  },
  {
    id: 'event9',
    title: 'James & Linda Wedding',
    date: '1980-07-12',
    description: 'James Hamilton marries Linda, a compassionate pediatric nurse.',
    type: 'marriage',
    participants: ['p1', 'p3'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: ['mem7'],
    era: '1980s'
  },
  {
    id: 'event10',
    title: 'Sarah & David Wedding',
    date: '1975-04-18',
    description: 'Sarah Hamilton marries David Mitchell, an environmental scientist.',
    type: 'marriage',
    participants: ['p2', 'p4'],
    location: 'Portland, Oregon',
    significance: 'high',
    memories: [],
    era: '1970s'
  },
  {
    id: 'event11',
    title: 'Michael Hamilton Born',
    date: '1985-03-22',
    description: 'Michael Hamilton is born, future UX designer and digital storyteller.',
    type: 'birth',
    participants: ['c1', 'p1', 'p3'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: [],
    era: '1980s'
  },
  {
    id: 'event12',
    title: 'Emma Hamilton Born',
    date: '1988-12-05',
    description: 'Emma Hamilton is born, future marine biologist and ocean conservationist.',
    type: 'birth',
    participants: ['c2', 'p1', 'p3'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: [],
    era: '1980s'
  },
  {
    id: 'event13',
    title: 'Family Reunion at Lake Tahoe',
    date: '1990-07-04',
    description: 'Four generations of Hamiltons gather for an unforgettable family reunion.',
    type: 'family',
    participants: ['gg1', 'gg2', 'g1', 'g2', 'p1', 'p2', 'p3', 'p4', 'c1', 'c2'],
    location: 'Lake Tahoe, California',
    significance: 'high',
    memories: ['mem11'],
    era: '1990s'
  },
  {
    id: 'event14',
    title: 'Michael & Jessica Wedding',
    date: '2010-09-18',
    description: 'Michael Hamilton marries Jessica, a brilliant data scientist.',
    type: 'marriage',
    participants: ['c1', 'c5'],
    location: 'Napa Valley, California',
    significance: 'high',
    memories: ['mem13'],
    era: '2010s'
  },
  {
    id: 'event15',
    title: 'Oliver Hamilton Born',
    date: '2018-05-30',
    description: 'Oliver Hamilton is born, representing the fifth generation of American Hamiltons.',
    type: 'birth',
    participants: ['gc1', 'c1', 'c5'],
    location: 'Boston, Massachusetts',
    significance: 'high',
    memories: ['mem15'],
    era: '2010s'
  }
]
