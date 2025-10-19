<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { 
    Star, 
    Users, 
    Camera, 
    Heart, 
    Calendar, 
    MapPin, 
    Award, 
    MessageCircle,
    Plus,
    Search,
    Settings,
    User,
    Share2
  } from 'lucide-svelte';
  
  // Types
  interface MemoryNode {
    id: string;
    title: string;
    type: 'photo' | 'story' | 'milestone' | 'person' | 'place';
    x: number;
    y: number;
    connections: string[];
    timestamp: Date;
    importance: number; // 1-5 scale
    preview?: string;
  }
  
  interface ConstellationState {
    centerX: number;
    centerY: number;
    zoom: number;
    rotation: number;
    selectedNode: string | null;
    hoveredNode: string | null;
  }
  
  // Props
  export let memories: MemoryNode[] = [];
  export let onNodeSelect: (node: MemoryNode) => void = () => {};
  export let onAddMemory: () => void = () => {};
  
  // State
  let containerElement: HTMLDivElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrame: number;
  
  const state = writable<ConstellationState>({
    centerX: 0,
    centerY: 0,
    zoom: 1,
    rotation: 0,
    selectedNode: null,
    hoveredNode: null
  });
  
  const mousePosition = tweened({ x: 0, y: 0 }, {
    duration: 100,
    easing: cubicOut
  });
  
  // Sample data for demonstration
  const sampleMemories: MemoryNode[] = [
    {
      id: '1',
      title: 'Wedding Day',
      type: 'milestone',
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
      type: 'milestone',
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
      type: 'photo',
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
      type: 'person',
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
      type: 'place',
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
      type: 'photo',
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
      type: 'milestone',
      x: 100,
      y: 120,
      connections: ['5'],
      timestamp: new Date('2022-09-01'),
      importance: 4,
      preview: '🏆'
    }
  ];
  
  // Initialize with sample data if no memories provided
  if (memories.length === 0) {
    memories = sampleMemories;
  }
  
  // Canvas drawing functions
  function drawConnections() {
    if (!ctx) return;
    
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.lineWidth = 1;
    
    memories.forEach(memory => {
      memory.connections.forEach(connectionId => {
        const connectedMemory = memories.find(m => m.id === connectionId);
        if (connectedMemory) {
          const currentState = $state;
          
          const x1 = memory.x + currentState.centerX;
          const y1 = memory.y + currentState.centerY;
          const x2 = connectedMemory.x + currentState.centerX;
          const y2 = connectedMemory.y + currentState.centerY;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
    });
  }
  
  function drawNodes() {
    if (!ctx) return;
    
    memories.forEach(memory => {
      const currentState = $state;
      const x = memory.x + currentState.centerX;
      const y = memory.y + currentState.centerY;
      const radius = 20 + (memory.importance * 5);
      
      // Node glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, `rgba(14, 165, 233, ${memory.importance * 0.1})`);
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Main node
      ctx.fillStyle = currentState.selectedNode === memory.id 
        ? 'rgba(234, 179, 8, 0.9)' 
        : 'rgba(14, 165, 233, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Preview text/emoji
      ctx.fillStyle = 'white';
      ctx.font = `${radius}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(memory.preview || '●', x, y);
    });
  }
  
  function animate() {
    if (!ctx || !canvasElement) return;
    
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw constellation background
    drawConnections();
    drawNodes();
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!containerElement) return;
    
    const rect = containerElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    mousePosition.set({ x, y });
    
    // Check for node hover
    const currentState = $state;
    const hoveredMemory = memories.find(memory => {
      const nodeX = memory.x + currentState.centerX;
      const nodeY = memory.y + currentState.centerY;
      const radius = 20 + (memory.importance * 5);
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return distance <= radius;
    });
    
    state.update(s => ({
      ...s,
      hoveredNode: hoveredMemory?.id || null
    }));
  }
  
  function handleClick(event: MouseEvent) {
    if (!containerElement) return;
    
    const rect = containerElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const currentState = $state;
    const clickedMemory = memories.find(memory => {
      const nodeX = memory.x + currentState.centerX;
      const nodeY = memory.y + currentState.centerY;
      const radius = 20 + (memory.importance * 5);
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return distance <= radius;
    });
    
    if (clickedMemory) {
      state.update(s => ({
        ...s,
        selectedNode: clickedMemory.id
      }));
      onNodeSelect(clickedMemory);
    }
  }
  
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    
    state.update(s => ({
      ...s,
      zoom: Math.max(0.5, Math.min(3, s.zoom * zoomFactor))
    }));
  }
  
  onMount(() => {
    if (containerElement && canvasElement) {
      ctx = canvasElement.getContext('2d')!;
      
      // Set canvas size
      const resizeCanvas = () => {
        const rect = containerElement.getBoundingClientRect();
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;
        
        state.update(s => ({
          ...s,
          centerX: rect.width / 2,
          centerY: rect.height / 2
        }));
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Start animation
      animate();
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  });
  
  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

<div 
  class="relative w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden constellation-bg"
  bind:this={containerElement}
  on:mousemove={handleMouseMove}
  on:click={handleClick}
  on:wheel={handleWheel}
  role="application"
  aria-label="Interactive family memory constellation"
>
  <!-- Canvas for constellation rendering -->
  <canvas 
    bind:this={canvasElement}
    class="absolute inset-0 w-full h-full"
  ></canvas>
  
  <!-- UI Overlay -->
  <div class="absolute inset-0 pointer-events-none">
    <!-- Top Navigation -->
    <div class="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
      <div class="flex items-center space-x-4">
        <div class="glass px-4 py-2 rounded-full">
          <h1 class="text-xl font-bold text-gradient-constellation">Heirloom</h1>
        </div>
        <div class="glass px-3 py-2 rounded-full">
          <Search class="w-5 h-5 text-constellation-300" />
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button class="glass p-3 rounded-full hover:bg-white/20 transition-colors">
          <User class="w-5 h-5 text-constellation-300" />
        </button>
        <button class="glass p-3 rounded-full hover:bg-white/20 transition-colors">
          <Settings class="w-5 h-5 text-constellation-300" />
        </button>
      </div>
    </div>
    
    <!-- Central Hub -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
      <div class="glass-dark p-6 rounded-2xl text-center">
        <h2 class="text-2xl font-bold text-white mb-2">The Legacy Constellation</h2>
        <p class="text-constellation-200 text-sm mb-4">Your family's story across time</p>
        <div class="flex justify-center space-x-2">
          <button 
            class="btn btn-primary btn-sm"
            on:click={onAddMemory}
          >
            <Plus class="w-4 h-4 mr-1" />
            Add Memory
          </button>
          <button class="btn btn-outline btn-sm">
            <Share2 class="w-4 h-4 mr-1" />
            Share
          </button>
        </div>
      </div>
    </div>
    
    <!-- Floating Action Buttons -->
    <div class="absolute bottom-6 right-6 flex flex-col space-y-3 pointer-events-auto">
      <button class="btn btn-circle btn-primary legacy-glow float-animation">
        <Camera class="w-6 h-6" />
      </button>
      <button class="btn btn-circle btn-secondary legacy-glow float-animation" style="animation-delay: 0.5s;">
        <Users class="w-6 h-6" />
      </button>
      <button class="btn btn-circle btn-accent legacy-glow float-animation" style="animation-delay: 1s;">
        <Heart class="w-6 h-6" />
      </button>
    </div>
    
    <!-- Timeline Selector -->
    <div class="absolute bottom-6 left-6 pointer-events-auto">
      <div class="glass px-4 py-3 rounded-xl">
        <div class="flex items-center space-x-3">
          <Calendar class="w-5 h-5 text-constellation-300" />
          <select class="select select-sm bg-transparent text-white border-none">
            <option>All Time</option>
            <option>2023</option>
            <option>2022</option>
            <option>2021</option>
            <option>2020</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Memory Details Panel -->
    {#if $state.selectedNode}
      {@const selectedMemory = memories.find(m => m.id === $state.selectedNode)}
      {#if selectedMemory}
        <div class="absolute top-20 right-4 w-80 glass-dark p-6 rounded-xl pointer-events-auto">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-white">{selectedMemory.title}</h3>
            <button 
              class="btn btn-ghost btn-sm btn-circle"
              on:click={() => state.update(s => ({ ...s, selectedNode: null }))}
            >
              ×
            </button>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center space-x-2 text-constellation-200">
              <Calendar class="w-4 h-4" />
              <span class="text-sm">{selectedMemory.timestamp.toLocaleDateString()}</span>
            </div>
            
            <div class="flex items-center space-x-2 text-constellation-200">
              <Star class="w-4 h-4" />
              <div class="flex space-x-1">
                {#each Array(5) as _, i}
                  <Star 
                    class="w-3 h-3 {i < selectedMemory.importance ? 'text-legacy-400 fill-current' : 'text-gray-500'}" 
                  />
                {/each}
              </div>
            </div>
            
            <div class="flex items-center space-x-2 text-constellation-200">
              <MessageCircle class="w-4 h-4" />
              <span class="text-sm">{selectedMemory.connections.length} connections</span>
            </div>
            
            <div class="pt-3 border-t border-white/10">
              <button class="btn btn-primary btn-sm w-full">
                View Details
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Particle Effects -->
  <div class="absolute inset-0 pointer-events-none">
    {#each Array(20) as _, i}
      <div 
        class="absolute w-1 h-1 bg-constellation-400 rounded-full opacity-30 animate-pulse"
        style="
          left: {Math.random() * 100}%; 
          top: {Math.random() * 100}%;
          animation-delay: {Math.random() * 3}s;
          animation-duration: {2 + Math.random() * 2}s;
        "
      ></div>
    {/each}
  </div>
</div>

<style>
  canvas {
    image-rendering: pixelated;
  }
</style>