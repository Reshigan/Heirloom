import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(cors, {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Subscription tiers endpoint
fastify.get('/api/subscriptions/tiers', async (request, reply) => {
  const tiers = [
    {
      id: 'basic',
      name: 'Basic Legacy',
      price: 0,
      interval: 'month',
      features: [
        '100 memories',
        '5 family members',
        '2 AI stories per month',
        '3 time capsules',
        'Basic constellation view'
      ],
      maxMemories: 100,
      maxFamilyMembers: 5,
      aiStoriesPerMonth: 2,
      timeCapsules: 3,
      priority: 1
    },
    {
      id: 'premium',
      name: 'Premium Legacy',
      price: 19.99,
      interval: 'month',
      features: [
        'Unlimited memories',
        '25 family members',
        '20 AI stories per month',
        'Unlimited time capsules',
        'Advanced constellation features',
        'Priority support',
        'HD video storage',
        'Advanced privacy controls'
      ],
      maxMemories: -1,
      maxFamilyMembers: 25,
      aiStoriesPerMonth: 20,
      timeCapsules: -1,
      priority: 2
    },
    {
      id: 'family',
      name: 'Family Legacy',
      price: 39.99,
      interval: 'month',
      features: [
        'Everything in Premium',
        'Unlimited family members',
        'Unlimited AI stories',
        'Collaborative storytelling',
        'Family tree visualization',
        'Advanced analytics',
        'Custom branding',
        'Dedicated family coordinator'
      ],
      maxMemories: -1,
      maxFamilyMembers: -1,
      aiStoriesPerMonth: -1,
      timeCapsules: -1,
      priority: 3
    },
    {
      id: 'enterprise',
      name: 'Enterprise Legacy',
      price: 99.99,
      interval: 'month',
      features: [
        'Everything in Family',
        'Multi-organization support',
        'Advanced security features',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantees',
        'White-label options',
        'API access',
        'Advanced compliance features'
      ],
      maxMemories: -1,
      maxFamilyMembers: -1,
      aiStoriesPerMonth: -1,
      timeCapsules: -1,
      priority: 4
    }
  ];

  return { tiers };
});

// Demo constellation data
fastify.get('/api/constellation', async (request, reply) => {
  const memories = [
    {
      id: '1',
      title: 'Wedding Day',
      date: '2020-06-15',
      type: 'photo',
      x: Math.random() * 800,
      y: Math.random() * 600,
      connections: ['2', '3']
    },
    {
      id: '2',
      title: 'First Home',
      date: '2021-03-10',
      type: 'milestone',
      x: Math.random() * 800,
      y: Math.random() * 600,
      connections: ['1', '4']
    },
    {
      id: '3',
      title: 'Baby Born',
      date: '2022-01-20',
      type: 'milestone',
      x: Math.random() * 800,
      y: Math.random() * 600,
      connections: ['1', '4', '5']
    },
    {
      id: '4',
      title: 'Family Vacation',
      date: '2022-07-04',
      type: 'photo',
      x: Math.random() * 800,
      y: Math.random() * 600,
      connections: ['2', '3', '5']
    },
    {
      id: '5',
      title: 'First Steps',
      date: '2023-02-14',
      type: 'video',
      x: Math.random() * 800,
      y: Math.random() * 600,
      connections: ['3', '4']
    }
  ];

  return { memories };
});

// Demo AI story generation
fastify.post('/api/ai/story', async (request, reply) => {
  const { memoryIds, style = 'narrative' } = request.body || {};
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const stories = [
    "In the golden light of that June morning, two hearts became one. The wedding bells echoed through the chapel as family and friends gathered to witness a love story that would span generations...",
    "The keys turned in the lock of their first home, a modest but perfect sanctuary where dreams would take root and flourish. Every room held the promise of memories yet to be made...",
    "A tiny cry pierced the hospital room silence, announcing the arrival of their greatest blessing. In that moment, their world expanded infinitely, filled with wonder and unconditional love...",
    "The ocean waves lapped at their feet as three generations built sandcastles together. Laughter carried on the salt breeze, weaving bonds that would last a lifetime...",
    "One wobbly step, then another. Those first tentative movements across the living room floor marked not just a milestone, but the beginning of a journey toward independence and discovery..."
  ];
  
  const randomStory = stories[Math.floor(Math.random() * stories.length)];
  
  return {
    story: randomStory,
    style,
    generatedAt: new Date().toISOString(),
    memoryCount: memoryIds?.length || 1
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Heirloom Payment Server running on http://localhost:3001');
    console.log('📊 Health check: http://localhost:3001/health');
    console.log('💰 Pricing tiers: http://localhost:3001/api/subscriptions/tiers');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();