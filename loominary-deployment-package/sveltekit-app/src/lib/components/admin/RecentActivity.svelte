<script>
  import { onMount } from 'svelte';
  
  export let limit = 10;
  
  let activities = [];
  let loading = true;

  onMount(async () => {
    await loadRecentActivity();
  });

  async function loadRecentActivity() {
    loading = true;
    try {
      const response = await fetch(`/api/admin/activity?limit=${limit}`);
      if (response.ok) {
        activities = await response.json();
      } else {
        // Mock data for demo
        activities = [
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered: John Doe',
            user: { firstName: 'John', lastName: 'Doe' },
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            severity: 'info'
          },
          {
            id: '2',
            type: 'memory_created',
            description: 'Memory created: "Childhood Adventures"',
            user: { firstName: 'Jane', lastName: 'Smith' },
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            severity: 'info'
          },
          {
            id: '3',
            type: 'inheritance_token',
            description: 'Inheritance token created',
            user: { firstName: 'Bob', lastName: 'Johnson' },
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            severity: 'success'
          },
          {
            id: '4',
            type: 'ai_story_generated',
            description: 'AI story generated from 3 memories',
            user: { firstName: 'Alice', lastName: 'Brown' },
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            severity: 'info'
          },
          {
            id: '5',
            type: 'vault_sealed',
            description: 'Vault sealed for inheritance',
            user: { firstName: 'Charlie', lastName: 'Wilson' },
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            severity: 'warning'
          }
        ];
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      activities = [];
    } finally {
      loading = false;
    }
  }

  function getActivityIcon(type) {
    switch (type) {
      case 'user_registration': return '👤';
      case 'memory_created': return '📝';
      case 'inheritance_token': return '🎫';
      case 'ai_story_generated': return '🤖';
      case 'vault_sealed': return '🔐';
      case 'time_capsule': return '⏰';
      case 'family_created': return '👨‍👩‍👧‍👦';
      default: return '📋';
    }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<style>
  .recent-activity {
    background: rgba(26, 26, 26, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .activity-title {
    color: #D4AF37;
    font-size: 1.25rem;
    font-weight: 500;
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

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.3);
    border: 1px solid rgba(212, 175, 55, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .activity-item:hover {
    border-color: rgba(212, 175, 55, 0.3);
    background: rgba(212, 175, 55, 0.05);
  }

  .activity-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .activity-content {
    flex: 1;
    min-width: 0;
  }

  .activity-description {
    color: #F4E5C2;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .activity-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .activity-user {
    font-weight: 500;
  }

  .activity-timestamp {
    margin-left: auto;
  }

  .severity-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.5rem;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(244, 229, 194, 0.3);
    border-radius: 50%;
    border-top-color: #F4E5C2;
    animation: spin 1s ease-in-out infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

<div class="recent-activity">
  <div class="activity-header">
    <h3 class="activity-title">Recent Activity</h3>
    <button class="refresh-button" on:click={loadRecentActivity}>
      Refresh
    </button>
  </div>

  {#if loading}
    <div class="loading">
      <span class="loading-spinner"></span>
      Loading recent activity...
    </div>
  {:else if activities.length === 0}
    <div class="empty-state">
      <div style="font-size: 2rem; margin-bottom: 1rem;">📋</div>
      <p>No recent activity to display</p>
    </div>
  {:else}
    <div class="activity-list">
      {#each activities as activity}
        <div class="activity-item">
          <div class="activity-icon">
            {getActivityIcon(activity.type)}
          </div>
          
          <div class="activity-content">
            <div class="activity-description">
              {activity.description}
            </div>
            
            <div class="activity-meta">
              {#if activity.user}
                <span class="activity-user">
                  {activity.user.firstName} {activity.user.lastName}
                </span>
              {/if}
              
              <span class="activity-timestamp">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          </div>
          
          <div 
            class="severity-indicator"
            style="background-color: {getSeverityColor(activity.severity)}"
          ></div>
        </div>
      {/each}
    </div>
  {/if}
</div>