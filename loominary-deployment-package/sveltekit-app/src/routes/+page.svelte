<script lang="ts">
  import { onMount } from 'svelte';
  import ConstellationInterface from '$components/constellation/ConstellationInterface.svelte';
  import { writable } from 'svelte/store';
  
  // Sample memory data for the constellation
  const memories = [
    {
      id: '1',
      title: 'Wedding Day',
      type: 'milestone' as const,
      x: 0,
      y: -150,
      connections: ['2', '3'],
      timestamp: new Date('2020-06-15'),
      importance: 5,
      preview: '💒'
    },
    {
      id: '2',
      title: 'First Child Born',
      type: 'milestone' as const,
      x: -120,
      y: -80,
      connections: ['1', '4'],
      timestamp: new Date('2021-03-22'),
      importance: 5,
      preview: '👶'
    },
    {
      id: '3',
      title: 'Family Vacation',
      type: 'photo' as const,
      x: 120,
      y: -80,
      connections: ['1', '5'],
      timestamp: new Date('2020-08-10'),
      importance: 4,
      preview: '🏖️'
    },
    {
      id: '4',
      title: 'Grandparents Visit',
      type: 'person' as const,
      x: -180,
      y: 20,
      connections: ['2', '6'],
      timestamp: new Date('2021-12-25'),
      importance: 4,
      preview: '👴👵'
    },
    {
      id: '5',
      title: 'New Home',
      type: 'place' as const,
      x: 180,
      y: 20,
      connections: ['3', '7'],
      timestamp: new Date('2022-01-15'),
      importance: 5,
      preview: '🏠'
    },
    {
      id: '6',
      title: 'Birthday Party',
      type: 'photo' as const,
      x: -100,
      y: 120,
      connections: ['4'],
      timestamp: new Date('2022-03-22'),
      importance: 3,
      preview: '🎂'
    },
    {
      id: '7',
      title: 'Career Achievement',
      type: 'milestone' as const,
      x: 100,
      y: 120,
      connections: ['5'],
      timestamp: new Date('2022-09-01'),
      importance: 4,
      preview: '🏆'
    }
  ];

  let showWelcome = true;
  let isLoading = true;

  onMount(() => {
    // Simulate loading time for dramatic effect
    setTimeout(() => {
      isLoading = false;
    }, 2000);
  });

  function handleNodeSelect(node: any) {
    console.log('Selected node:', node);
    // Here you would typically navigate to a detailed view or open a modal
  }

  function handleAddMemory() {
    console.log('Add memory clicked');
    // Here you would open the memory creation interface
  }

  function dismissWelcome() {
    showWelcome = false;
  }
</script>

<svelte:head>
  <title>Loominary - The Future of Legacy Preservation</title>
  <meta name="description" content="Experience the world's first constellation-based legacy platform. Preserve your family's memories for future generations with revolutionary AI-powered storytelling." />
</svelte:head>

{#if isLoading}
  <!-- Loading Screen -->
  <div class="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
    <div class="text-center">
      <div class="relative">
        <!-- Animated constellation logo -->
        <div class="w-32 h-32 mx-auto mb-8 relative">
          <div class="absolute inset-0 animate-spin">
            <div class="w-4 h-4 bg-constellation-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <div class="w-3 h-3 bg-legacy-400 rounded-full absolute top-1/4 right-0 transform -translate-y-1/2"></div>
            <div class="w-2 h-2 bg-constellation-300 rounded-full absolute bottom-1/4 right-1/4"></div>
            <div class="w-3 h-3 bg-legacy-300 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
            <div class="w-2 h-2 bg-constellation-400 rounded-full absolute top-1/3 left-0 transform -translate-y-1/2"></div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-gradient-to-br from-constellation-400 to-legacy-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h1 class="text-4xl font-bold text-white mb-4 animate-pulse">Loominary</h1>
        <p class="text-constellation-200 text-lg mb-8">Initializing your legacy constellation...</p>
        
        <!-- Loading progress -->
        <div class="w-64 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
          <div class="h-full bg-gradient-to-r from-constellation-400 to-legacy-400 rounded-full animate-pulse" style="width: 100%; animation-duration: 2s;"></div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Welcome Modal -->
  {#if showWelcome}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div class="glass-dark p-8 rounded-2xl max-w-2xl w-full text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-constellation-400 to-legacy-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span class="text-2xl">🌟</span>
          </div>
          <h2 class="text-3xl font-bold text-white mb-2">Welcome to the Future</h2>
          <p class="text-constellation-200">You're experiencing the world's first constellation-based legacy platform</p>
        </div>
        
        <div class="space-y-4 text-left mb-8">
          <div class="flex items-start space-x-3">
            <div class="w-6 h-6 bg-constellation-400 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
              <span class="text-xs text-white">1</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">Interactive Memory Constellation</h3>
              <p class="text-constellation-200 text-sm">Your memories float as connected nodes in a beautiful 3D space</p>
            </div>
          </div>
          
          <div class="flex items-start space-x-3">
            <div class="w-6 h-6 bg-legacy-400 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
              <span class="text-xs text-white">2</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">AI-Powered Storytelling</h3>
              <p class="text-constellation-200 text-sm">Llama 4 AI transforms your memories into beautiful family stories</p>
            </div>
          </div>
          
          <div class="flex items-start space-x-3">
            <div class="w-6 h-6 bg-constellation-500 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
              <span class="text-xs text-white">3</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">Legacy for Future Generations</h3>
              <p class="text-constellation-200 text-sm">Time capsules and digital inheritance planning for your family's future</p>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-4">
          <button 
            class="btn btn-primary flex-1"
            on:click={dismissWelcome}
          >
            Explore Your Constellation
          </button>
          <button 
            class="btn btn-outline flex-1"
            on:click={dismissWelcome}
          >
            Take the Tour
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Constellation Interface -->
  <ConstellationInterface 
    {memories}
    onNodeSelect={handleNodeSelect}
    onAddMemory={handleAddMemory}
  />

  <!-- Floating Feature Highlights -->
  <div class="fixed bottom-4 left-4 space-y-2 pointer-events-none z-30">
    <div class="glass px-4 py-2 rounded-full text-sm text-constellation-200 animate-pulse">
      🚀 World's First Constellation UI
    </div>
    <div class="glass px-4 py-2 rounded-full text-sm text-constellation-200 animate-pulse" style="animation-delay: 0.5s;">
      🤖 Powered by Llama 4 AI
    </div>
    <div class="glass px-4 py-2 rounded-full text-sm text-constellation-200 animate-pulse" style="animation-delay: 1s;">
      🌟 Built for Future Generations
    </div>
  </div>

  <!-- Performance Indicator -->
  <div class="fixed top-4 right-4 glass px-3 py-1 rounded-full text-xs text-constellation-300 pointer-events-none z-30">
    SvelteKit • 60fps • <span class="text-legacy-400">Superior Performance</span>
  </div>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>