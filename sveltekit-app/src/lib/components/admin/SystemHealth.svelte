<script>
  import { onMount } from 'svelte';
  
  let systemStats = {
    uptime: '2 days, 14 hours',
    memory: { used: 2.1, total: 8.0 },
    cpu: 15.3,
    disk: { used: 45.2, total: 100 },
    activeUsers: 127,
    totalMemories: 1543,
    apiRequests: 8924
  };
  
  let healthStatus = 'healthy';
  
  onMount(() => {
    // In production, this would fetch real system stats
    console.log('SystemHealth component mounted');
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div class="stat bg-base-100 shadow rounded-lg">
    <div class="stat-figure text-primary">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <div class="stat-title">System Status</div>
    <div class="stat-value text-primary">{healthStatus}</div>
    <div class="stat-desc">Uptime: {systemStats.uptime}</div>
  </div>
  
  <div class="stat bg-base-100 shadow rounded-lg">
    <div class="stat-figure text-secondary">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
      </svg>
    </div>
    <div class="stat-title">Memory Usage</div>
    <div class="stat-value">{systemStats.memory.used}GB</div>
    <div class="stat-desc">of {systemStats.memory.total}GB total</div>
  </div>
  
  <div class="stat bg-base-100 shadow rounded-lg">
    <div class="stat-figure text-accent">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
      </svg>
    </div>
    <div class="stat-title">CPU Usage</div>
    <div class="stat-value">{systemStats.cpu}%</div>
    <div class="stat-desc">Average load</div>
  </div>
  
  <div class="stat bg-base-100 shadow rounded-lg">
    <div class="stat-figure text-info">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </div>
    <div class="stat-title">Active Users</div>
    <div class="stat-value">{systemStats.activeUsers}</div>
    <div class="stat-desc">Currently online</div>
  </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">🌟 Loominary Platform Health</h2>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span>Database Connection</span>
          <div class="badge badge-success">Connected</div>
        </div>
        <div class="flex justify-between items-center">
          <span>Redis Cache</span>
          <div class="badge badge-success">Active</div>
        </div>
        <div class="flex justify-between items-center">
          <span>AI Service (Ollama)</span>
          <div class="badge badge-success">Running</div>
        </div>
        <div class="flex justify-between items-center">
          <span>File Storage</span>
          <div class="badge badge-success">Available</div>
        </div>
        <div class="flex justify-between items-center">
          <span>Email Service</span>
          <div class="badge badge-warning">Limited</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">📊 Platform Statistics</h2>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span>Total Memories</span>
          <span class="font-bold">{systemStats.totalMemories.toLocaleString()}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>API Requests (24h)</span>
          <span class="font-bold">{systemStats.apiRequests.toLocaleString()}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Storage Used</span>
          <span class="font-bold">{systemStats.disk.used}GB / {systemStats.disk.total}GB</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Private Vaults</span>
          <span class="font-bold">23</span>
        </div>
        <div class="flex justify-between items-center">
          <span>AI Queries (24h)</span>
          <span class="font-bold">156</span>
        </div>
      </div>
    </div>
  </div>
</div>
