<script lang="ts">
  import { onMount } from 'svelte';

  interface SubscriptionTier {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    maxMemories: number;
    maxFamilyMembers: number;
    aiStoriesPerMonth: number;
    timeCapsules: number;
    priority: number;
  }

  let tiers: SubscriptionTier[] = [];
  let loading = true;
  let selectedTier = 'premium';

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/subscriptions/tiers');
      const data = await response.json();
      tiers = data.tiers;
      loading = false;
    } catch (error) {
      console.error('Failed to load pricing tiers:', error);
      // Fallback data
      tiers = [
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
      loading = false;
    }
  });

  function selectTier(tierId: string) {
    selectedTier = tierId;
  }

  function getTierIcon(tierId: string) {
    switch (tierId) {
      case 'basic': return '🌱';
      case 'premium': return '⭐';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'enterprise': return '🏢';
      default: return '✨';
    }
  }

  function isPopular(tier: SubscriptionTier) {
    return tier.id === 'premium';
  }

  function isEnterprise(tier: SubscriptionTier) {
    return tier.id === 'enterprise';
  }
</script>

<svelte:head>
  <title>Pricing - Loominary Legacy Platform</title>
  <meta name="description" content="Choose the perfect plan to preserve your family's legacy for future generations. From basic memory storage to enterprise-grade legacy management." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <!-- Hero Section -->
  <div class="relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="text-center">
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
          Choose Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Legacy Plan</span>
        </h1>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Preserve your family's memories and stories for future generations. 
          Start free and upgrade as your legacy grows.
        </p>
        
        <!-- Referral Highlight -->
        <div class="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-6 py-3 mb-12">
          <span class="text-2xl">⚡</span>
          <span class="text-green-300 font-medium">Refer 5 friends and get a month FREE!</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Pricing Cards -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
    {#if loading}
      <div class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {#each tiers as tier (tier.id)}
          <div class="relative">
            <!-- Popular Badge -->
            {#if isPopular(tier)}
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <span>⭐</span>
                  Most Popular
                </div>
              </div>
            {/if}

            <!-- Card -->
            <div class="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 h-full transition-all duration-300 hover:scale-105 hover:bg-white/15 {selectedTier === tier.id ? 'ring-2 ring-purple-400' : ''}">
              <!-- Tier Header -->
              <div class="text-center mb-6">
                <div class="text-4xl mb-3">{getTierIcon(tier.id)}</div>
                <h3 class="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div class="flex items-baseline justify-center gap-1">
                  <span class="text-4xl font-bold text-white">
                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  </span>
                  {#if tier.price > 0}
                    <span class="text-gray-400">/{tier.interval}</span>
                  {/if}
                </div>
              </div>

              <!-- Features -->
              <div class="space-y-4 mb-8">
                {#each tier.features as feature}
                  <div class="flex items-start gap-3">
                    <span class="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span class="text-gray-300 text-sm">{feature}</span>
                  </div>
                {/each}
              </div>

              <!-- Limits Display -->
              <div class="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Memories</span>
                  <span class="text-white font-medium">
                    {tier.maxMemories === -1 ? 'Unlimited' : tier.maxMemories.toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Family Members</span>
                  <span class="text-white font-medium">
                    {tier.maxFamilyMembers === -1 ? 'Unlimited' : tier.maxFamilyMembers}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">AI Stories/Month</span>
                  <span class="text-white font-medium">
                    {tier.aiStoriesPerMonth === -1 ? 'Unlimited' : tier.aiStoriesPerMonth}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Time Capsules</span>
                  <span class="text-white font-medium">
                    {tier.timeCapsules === -1 ? 'Unlimited' : tier.timeCapsules}
                  </span>
                </div>
              </div>

              <!-- CTA Button -->
              <button 
                class="w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 {
                  tier.price === 0 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : isPopular(tier)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                      : isEnterprise(tier)
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                }"
                on:click={() => selectTier(tier.id)}
              >
                {tier.price === 0 ? 'Start Free' : isEnterprise(tier) ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Features Comparison -->
    <div class="mt-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-white mb-4">Why Choose Loominary?</h2>
        <p class="text-gray-300 max-w-2xl mx-auto">
          More than just storage - we're building the future of legacy preservation
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🛡️</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Secure & Private</h3>
          <p class="text-gray-300">End-to-end encryption ensures your memories are safe and private, accessible only to those you choose.</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">👥</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Family Collaboration</h3>
          <p class="text-gray-300">Invite family members to contribute memories and stories, creating a rich tapestry of your family's history.</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">⏰</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Future-Proof</h3>
          <p class="text-gray-300">Time capsules and digital inheritance ensure your legacy lives on for generations to come.</p>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="mt-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
      </div>

      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h3 class="text-lg font-bold text-white mb-2">How does the referral program work?</h3>
          <p class="text-gray-300">Refer 5 friends who sign up for any paid plan, and you'll get a full month free! There's no limit to how many free months you can earn.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h3 class="text-lg font-bold text-white mb-2">Can I upgrade or downgrade my plan?</h3>
          <p class="text-gray-300">Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h3 class="text-lg font-bold text-white mb-2">What happens to my data if I cancel?</h3>
          <p class="text-gray-300">Your data remains accessible for 30 days after cancellation. You can export all your memories and stories during this period.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h3 class="text-lg font-bold text-white mb-2">Is my data secure?</h3>
          <p class="text-gray-300">Absolutely. We use enterprise-grade encryption, regular security audits, and comply with international privacy standards to keep your memories safe.</p>
        </div>
      </div>
    </div>
  </div>
</div>