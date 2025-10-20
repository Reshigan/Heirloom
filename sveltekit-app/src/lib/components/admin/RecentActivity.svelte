<script>
  import { onMount } from 'svelte';
  
  let activities = [
    {
      id: 1,
      type: 'user_registration',
      user: 'Sarah Johnson',
      action: 'registered for Loominary',
      timestamp: '2 minutes ago',
      icon: '👤'
    },
    {
      id: 2,
      type: 'memory_created',
      user: 'Michael Chen',
      action: 'created a new memory "Family Vacation 2024"',
      timestamp: '15 minutes ago',
      icon: '💭'
    },
    {
      id: 3,
      type: 'vault_created',
      user: 'Emma Wilson',
      action: 'created a private vault',
      timestamp: '1 hour ago',
      icon: '🔐'
    },
    {
      id: 4,
      type: 'ai_query',
      user: 'David Rodriguez',
      action: 'searched "happy moments from childhood"',
      timestamp: '2 hours ago',
      icon: '🔍'
    },
    {
      id: 5,
      type: 'subscription',
      user: 'Lisa Thompson',
      action: 'upgraded to Premium subscription',
      timestamp: '3 hours ago',
      icon: '⭐'
    }
  ];
  
  onMount(() => {
    // In production, this would fetch real activity data
    console.log('RecentActivity component mounted');
  });
  
  function getActivityColor(type) {
    switch (type) {
      case 'user_registration': return 'badge-success';
      case 'memory_created': return 'badge-info';
      case 'vault_created': return 'badge-warning';
      case 'ai_query': return 'badge-accent';
      case 'subscription': return 'badge-primary';
      default: return 'badge-neutral';
    }
  }
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">📈 Recent Activity</h2>
    <div class="space-y-4">
      {#each activities as activity}
        <div class="flex items-start space-x-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
          <div class="text-2xl">{activity.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-semibold text-sm">{activity.user}</span>
              <div class="badge {getActivityColor(activity.type)} badge-sm">{activity.type.replace('_', ' ')}</div>
            </div>
            <p class="text-sm text-base-content/70 mt-1">{activity.action}</p>
            <p class="text-xs text-base-content/50 mt-1">{activity.timestamp}</p>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="card-actions justify-end mt-4">
      <button class="btn btn-sm btn-outline">View All Activity</button>
    </div>
  </div>
</div>
