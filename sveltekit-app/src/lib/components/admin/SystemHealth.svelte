<script>
  import { onMount } from 'svelte';
  
  let healthData = {
    backend: { status: 'checking', responseTime: 0 },
    database: { status: 'checking', responseTime: 0 },
    ai: { status: 'checking', responseTime: 0 },
    storage: { status: 'checking', responseTime: 0 }
  };

  let lastUpdated = new Date();

  onMount(() => {
    checkSystemHealth();
    // Update every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  });

  async function checkSystemHealth() {
    const checks = [
      { key: 'backend', url: '/api/health' },
      { key: 'database', url: '/api/health/db' },
      { key: 'ai', url: '/api/ai/health' },
      { key: 'storage', url: '/api/health/storage' }
    ];

    for (const check of checks) {
      const startTime = Date.now();
      try {
        const response = await fetch(check.url);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          healthData[check.key] = {
            status: 'healthy',
            responseTime
          };
        } else {
          healthData[check.key] = {
            status: 'unhealthy',
            responseTime
          };
        }
      } catch (error) {
        healthData[check.key] = {
          status: 'error',
          responseTime: Date.now() - startTime
        };
      }
    }
    
    healthData = { ...healthData };
    lastUpdated = new Date();
  }

  function getStatusColor(status) {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'unhealthy': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '⚠️';
      case 'error': return '❌';
      default: return '🔄';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'unhealthy': return 'Degraded';
      case 'error': return 'Down';
      default: return 'Checking...';
    }
  }
</script>

<style>
  .system-health {
    background: rgba(26, 26, 26, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .health-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .health-title {
    color: #D4AF37;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .last-updated {
    color: #F4E5C2;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .health-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .health-item {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.1);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.3s ease;
  }

  .health-item:hover {
    border-color: rgba(212, 175, 55, 0.3);
  }

  .service-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .service-title {
    color: #F4E5C2;
    font-weight: 500;
    text-transform: capitalize;
  }

  .service-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .status-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .response-time {
    color: #F4E5C2;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .refresh-button {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #D4AF37;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .refresh-button:hover {
    background: rgba(212, 175, 55, 0.2);
  }

  .overall-status {
    text-align: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
    background: rgba(10, 10, 10, 0.3);
  }

  .overall-status.healthy {
    border: 1px solid #10B981;
    background: rgba(16, 185, 129, 0.1);
  }

  .overall-status.degraded {
    border: 1px solid #F59E0B;
    background: rgba(245, 158, 11, 0.1);
  }

  .overall-status.down {
    border: 1px solid #EF4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .overall-text {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .overall-description {
    font-size: 0.875rem;
    opacity: 0.8;
  }
</style>

<div class="system-health">
  <div class="health-header">
    <h3 class="health-title">System Health</h3>
    <div>
      <span class="last-updated">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </span>
      <button class="refresh-button" on:click={checkSystemHealth}>
        Refresh
      </button>
    </div>
  </div>

  <!-- Overall Status -->
  {#if Object.values(healthData).every(service => service.status === 'healthy')}
    <div class="overall-status healthy">
      <div class="overall-text" style="color: #10B981;">
        🟢 All Systems Operational
      </div>
      <div class="overall-description" style="color: #10B981;">
        All services are running normally
      </div>
    </div>
  {:else if Object.values(healthData).some(service => service.status === 'error')}
    <div class="overall-status down">
      <div class="overall-text" style="color: #EF4444;">
        🔴 System Issues Detected
      </div>
      <div class="overall-description" style="color: #EF4444;">
        One or more services are experiencing problems
      </div>
    </div>
  {:else}
    <div class="overall-status degraded">
      <div class="overall-text" style="color: #F59E0B;">
        🟡 Degraded Performance
      </div>
      <div class="overall-description" style="color: #F59E0B;">
        Some services are running with reduced performance
      </div>
    </div>
  {/if}

  <!-- Individual Service Status -->
  <div class="health-grid">
    {#each Object.entries(healthData) as [service, data]}
      <div class="health-item">
        <div class="service-name">
          <span class="service-title">{service}</span>
        </div>
        
        <div class="service-status">
          <span>{getStatusIcon(data.status)}</span>
          <span 
            class="status-text" 
            style="color: {getStatusColor(data.status)}"
          >
            {getStatusText(data.status)}
          </span>
        </div>
        
        {#if data.responseTime > 0}
          <div class="response-time">
            Response: {data.responseTime}ms
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>