<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    engagementStore, 
    dailyPromptsStore, 
    notificationsStore,
    engagementActions,
    userLevel,
    levelProgress,
    CONTENT_PROMPTS
  } from '$lib/stores/engagement';

  let showCreateMemoryModal = false;
  let showAIStoryModal = false;
  let showInviteModal = false;
  let selectedPrompt = null;
  let recentMemories = [];
  let familyActivity = [];
  let weeklyChallenge = null;
  let leaderboardPosition = null;

  // Memory creation form
  let memoryForm = {
    title: '',
    description: '',
    type: 'text',
    date: '',
    location: '',
    tags: [],
    photos: []
  };

  // AI Story generation
  let aiStoryForm = {
    memoryIds: [],
    style: 'narrative',
    tone: 'warm',
    length: 'medium',
    customPrompt: ''
  };

  let generatingStory = false;
  let generatedStory = null;

  onMount(async () => {
    // Initialize engagement system
    if ($authStore.user) {
      await engagementActions.initialize($authStore.user.id);
      await engagementActions.updateStreak();
      await engagementActions.loadDailyPrompts();
      await loadDashboardData();
    }

    // Track daily login
    engagementActions.trackAction('daily_login');
  });

  async function loadDashboardData() {
    try {
      // Load recent memories
      const memoriesResponse = await fetch('/api/memories?limit=5');
      if (memoriesResponse.ok) {
        recentMemories = await memoriesResponse.json();
      }

      // Load family activity
      const activityResponse = await fetch('/api/families/activity?limit=10');
      if (activityResponse.ok) {
        familyActivity = await activityResponse.json();
      }

      // Load weekly challenge
      const challengeResponse = await fetch('/api/engagement/challenges/current');
      if (challengeResponse.ok) {
        weeklyChallenge = await challengeResponse.json();
      }

      // Load leaderboard position
      const leaderboardResponse = await fetch('/api/engagement/leaderboard/position');
      if (leaderboardResponse.ok) {
        leaderboardPosition = await leaderboardResponse.json();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  async function createMemory() {
    if (!memoryForm.title || !memoryForm.description) return;

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryForm)
      });

      if (response.ok) {
        const newMemory = await response.json();
        recentMemories = [newMemory, ...recentMemories.slice(0, 4)];
        
        // Track memory creation
        await engagementActions.trackAction('CREATE_MEMORY', {
          memoryId: newMemory.id,
          type: memoryForm.type
        });

        // Reset form and close modal
        memoryForm = {
          title: '',
          description: '',
          type: 'text',
          date: '',
          location: '',
          tags: [],
          photos: []
        };
        showCreateMemoryModal = false;

        // Show success notification
        notificationsStore.update(notifications => [
          ...notifications,
          {
            id: `memory_created_${Date.now()}`,
            type: 'success',
            title: 'Memory Created!',
            message: `"${newMemory.title}" has been added to your family legacy`,
            icon: '📝',
            timestamp: new Date(),
            autoHide: true
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  }

  async function generateAIStory() {
    if (aiStoryForm.memoryIds.length === 0) return;

    generatingStory = true;
    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiStoryForm)
      });

      if (response.ok) {
        generatedStory = await response.json();
        
        // Track AI story generation
        await engagementActions.trackAction('AI_STORY_GENERATED', {
          memoryCount: aiStoryForm.memoryIds.length,
          style: aiStoryForm.style
        });
      }
    } catch (error) {
      console.error('Failed to generate AI story:', error);
    } finally {
      generatingStory = false;
    }
  }

  function usePrompt(prompt) {
    selectedPrompt = prompt;
    memoryForm.title = prompt.title;
    showCreateMemoryModal = true;
    
    // Track prompt usage
    engagementActions.trackAction('prompt_used', {
      promptId: prompt.id,
      category: prompt.category
    });
  }

  async function completeDailyGoal(goalId) {
    await engagementActions.completeDailyGoal(goalId);
  }

  function dismissNotification(notificationId) {
    engagementActions.dismissNotification(notificationId);
  }

  // Auto-hide notifications
  $: if ($notificationsStore) {
    $notificationsStore.forEach(notification => {
      if (notification.autoHide) {
        setTimeout(() => {
          dismissNotification(notification.id);
        }, 5000);
      }
    });
  }
</script>

<svelte:head>
  <title>Dashboard - Loominary</title>
</svelte:head>

<style>
  .dashboard-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
    padding: 2rem;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .welcome-section {
    color: #F4E5C2;
  }

  .welcome-title {
    font-family: 'Bodoni Moda', serif;
    font-size: 2rem;
    color: #D4AF37;
    margin-bottom: 0.5rem;
  }

  .welcome-subtitle {
    opacity: 0.8;
    font-size: 1rem;
  }

  .user-stats {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #D4AF37;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #F4E5C2;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .level-progress {
    width: 200px;
    height: 8px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .level-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #B8941F, #D4AF37);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .card {
    background: rgba(26, 26, 26, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #D4AF37;
  }

  .card-action {
    background: none;
    border: none;
    color: #D4AF37;
    cursor: pointer;
    font-size: 0.875rem;
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .card-action:hover {
    opacity: 1;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-button {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 1rem;
    color: #F4E5C2;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
  }

  .action-button:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: #D4AF37;
    transform: translateY(-2px);
  }

  .action-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .action-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .action-description {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .daily-goals {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .goal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.1);
  }

  .goal-info {
    flex: 1;
  }

  .goal-title {
    color: #F4E5C2;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .goal-description {
    color: #F4E5C2;
    opacity: 0.7;
    font-size: 0.875rem;
  }

  .goal-progress {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .goal-progress-bar {
    width: 60px;
    height: 4px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }

  .goal-progress-fill {
    height: 100%;
    background: #D4AF37;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .goal-complete-btn {
    background: linear-gradient(135deg, #B8941F, #D4AF37);
    border: none;
    border-radius: 6px;
    color: #0A0A0A;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .goal-complete-btn:hover {
    transform: scale(1.05);
  }

  .goal-complete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .content-prompts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .prompt-item {
    padding: 1rem;
    background: rgba(10, 10, 10, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .prompt-item:hover {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }

  .prompt-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .prompt-title {
    color: #D4AF37;
    font-weight: 500;
  }

  .prompt-xp {
    color: #F4E5C2;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .prompt-description {
    color: #F4E5C2;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .recent-memories {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .memory-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.1);
  }

  .memory-thumbnail {
    width: 60px;
    height: 60px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .memory-info {
    flex: 1;
  }

  .memory-title {
    color: #F4E5C2;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .memory-meta {
    color: #F4E5C2;
    opacity: 0.7;
    font-size: 0.875rem;
  }

  .notifications {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 350px;
  }

  .notification {
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid #D4AF37;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .notification-title {
    color: #D4AF37;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .notification-close {
    background: none;
    border: none;
    color: #F4E5C2;
    cursor: pointer;
    opacity: 0.7;
  }

  .notification-message {
    color: #F4E5C2;
    font-size: 0.875rem;
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal-content {
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal-title {
    color: #D4AF37;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .modal-close {
    background: none;
    border: none;
    color: #F4E5C2;
    cursor: pointer;
    font-size: 1.5rem;
    opacity: 0.7;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    color: #F4E5C2;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    color: #FFF8E7;
    font-size: 1rem;
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .button-row {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .button-primary {
    background: linear-gradient(135deg, #B8941F, #D4AF37);
    color: #0A0A0A;
  }

  .button-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
  }

  .button-secondary {
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .button-secondary:hover {
    background: rgba(212, 175, 55, 0.2);
  }

  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
    
    .user-stats {
      flex-direction: column;
      gap: 1rem;
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="dashboard-container">
  <!-- Dashboard Header -->
  <div class="dashboard-header">
    <div class="welcome-section">
      <h1 class="welcome-title">Welcome back, {$authStore.user?.firstName || 'Legacy Keeper'}!</h1>
      <p class="welcome-subtitle">Continue building your family's digital legacy</p>
    </div>
    
    <div class="user-stats">
      <div class="stat-item">
        <div class="stat-value">Level {$userLevel}</div>
        <div class="stat-label">Current Level</div>
        <div class="level-progress">
          <div class="level-progress-fill" style="width: {$levelProgress}%"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{$engagementStore?.xp || 0}</div>
        <div class="stat-label">Total XP</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{$engagementStore?.streak || 0}</div>
        <div class="stat-label">Day Streak</div>
      </div>
      
      {#if leaderboardPosition}
        <div class="stat-item">
          <div class="stat-value">#{leaderboardPosition.position}</div>
          <div class="stat-label">Leaderboard</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Dashboard Grid -->
  <div class="dashboard-grid">
    <!-- Main Content -->
    <div class="main-content">
      <!-- Quick Actions -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Quick Actions</h2>
        </div>
        
        <div class="quick-actions">
          <div class="action-button" on:click={() => showCreateMemoryModal = true}>
            <div class="action-icon">📝</div>
            <div class="action-title">Create Memory</div>
            <div class="action-description">Share a new family memory</div>
          </div>
          
          <div class="action-button" on:click={() => showAIStoryModal = true}>
            <div class="action-icon">🤖</div>
            <div class="action-title">AI Story</div>
            <div class="action-description">Generate story from memories</div>
          </div>
          
          <div class="action-button" on:click={() => showInviteModal = true}>
            <div class="action-icon">👨‍👩‍👧‍👦</div>
            <div class="action-title">Invite Family</div>
            <div class="action-description">Add family members</div>
          </div>
          
          <div class="action-button">
            <div class="action-icon">⏰</div>
            <div class="action-title">Time Capsule</div>
            <div class="action-description">Create future message</div>
          </div>
        </div>
      </div>

      <!-- Recent Memories -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Recent Memories</h2>
          <button class="card-action">View All</button>
        </div>
        
        <div class="recent-memories">
          {#each recentMemories as memory}
            <div class="memory-item">
              <div class="memory-thumbnail">
                {memory.type === 'photo' ? '📸' : memory.type === 'audio' ? '🎵' : '📝'}
              </div>
              <div class="memory-info">
                <div class="memory-title">{memory.title}</div>
                <div class="memory-meta">
                  {new Date(memory.createdAt).toLocaleDateString()} • {memory.author?.firstName} {memory.author?.lastName}
                </div>
              </div>
            </div>
          {:else}
            <div style="text-align: center; color: #F4E5C2; opacity: 0.7; padding: 2rem;">
              No memories yet. Create your first memory to get started!
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Daily Goals -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Daily Goals</h2>
        </div>
        
        <div class="daily-goals">
          {#each $engagementStore?.dailyGoals || [] as goal}
            <div class="goal-item">
              <div class="goal-info">
                <div class="goal-title">{goal.title}</div>
                <div class="goal-description">{goal.description}</div>
              </div>
              <div class="goal-progress">
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: {(goal.current / goal.target) * 100}%"></div>
                </div>
                {#if !goal.completed && goal.current >= goal.target}
                  <button 
                    class="goal-complete-btn"
                    on:click={() => completeDailyGoal(goal.id)}
                  >
                    Complete
                  </button>
                {:else if goal.completed}
                  <span style="color: #10B981; font-size: 0.875rem;">✓ Done</span>
                {/if}
              </div>
            </div>
          {:else}
            <div style="text-align: center; color: #F4E5C2; opacity: 0.7; padding: 1rem;">
              Daily goals loading...
            </div>
          {/each}
        </div>
      </div>

      <!-- Content Prompts -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Today's Prompts</h2>
        </div>
        
        <div class="content-prompts">
          {#each $dailyPromptsStore.slice(0, 3) as prompt}
            <div class="prompt-item" on:click={() => usePrompt(prompt)}>
              <div class="prompt-header">
                <div class="prompt-title">{prompt.title}</div>
                <div class="prompt-xp">+{prompt.xpReward} XP</div>
              </div>
              <div class="prompt-description">{prompt.description}</div>
            </div>
          {:else}
            {#each CONTENT_PROMPTS.slice(0, 3) as prompt}
              <div class="prompt-item" on:click={() => usePrompt(prompt)}>
                <div class="prompt-header">
                  <div class="prompt-title">{prompt.title}</div>
                  <div class="prompt-xp">+{prompt.xpReward} XP</div>
                </div>
                <div class="prompt-description">{prompt.description}</div>
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Weekly Challenge -->
      {#if weeklyChallenge}
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Weekly Challenge</h2>
          </div>
          
          <div style="padding: 1rem; background: rgba(10, 10, 10, 0.5); border-radius: 8px;">
            <div style="color: #D4AF37; font-weight: 500; margin-bottom: 0.5rem;">
              {weeklyChallenge.title}
            </div>
            <div style="color: #F4E5C2; font-size: 0.875rem; margin-bottom: 1rem;">
              {weeklyChallenge.description}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="color: #F4E5C2; font-size: 0.875rem;">
                {weeklyChallenge.current}/{weeklyChallenge.target}
              </div>
              <div style="color: #D4AF37; font-size: 0.875rem;">
                {weeklyChallenge.participants} participants
              </div>
            </div>
            <div style="width: 100%; height: 4px; background: rgba(212, 175, 55, 0.2); border-radius: 2px; margin-top: 0.5rem;">
              <div style="height: 100%; background: #D4AF37; border-radius: 2px; width: {(weeklyChallenge.current / weeklyChallenge.target) * 100}%;"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Notifications -->
<div class="notifications">
  {#each $notificationsStore as notification}
    <div class="notification">
      <div class="notification-header">
        <div class="notification-title">
          {notification.icon} {notification.title}
        </div>
        <button 
          class="notification-close"
          on:click={() => dismissNotification(notification.id)}
        >
          ×
        </button>
      </div>
      <div class="notification-message">{notification.message}</div>
    </div>
  {/each}
</div>

<!-- Create Memory Modal -->
{#if showCreateMemoryModal}
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Create New Memory</h2>
        <button class="modal-close" on:click={() => showCreateMemoryModal = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={createMemory}>
        <div class="form-group">
          <label class="form-label">Memory Title</label>
          <input 
            type="text" 
            class="form-input" 
            bind:value={memoryForm.title}
            placeholder="Give your memory a meaningful title"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Tell Your Story</label>
          <textarea 
            class="form-textarea" 
            bind:value={memoryForm.description}
            placeholder="Share the details of this memory..."
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Memory Type</label>
          <select class="form-select" bind:value={memoryForm.type}>
            <option value="text">Text Story</option>
            <option value="photo">Photo Memory</option>
            <option value="audio">Audio Recording</option>
            <option value="document">Document</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Date (Optional)</label>
          <input 
            type="date" 
            class="form-input" 
            bind:value={memoryForm.date}
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Location (Optional)</label>
          <input 
            type="text" 
            class="form-input" 
            bind:value={memoryForm.location}
            placeholder="Where did this happen?"
          />
        </div>
        
        <div class="button-row">
          <button 
            type="button" 
            class="button button-secondary"
            on:click={() => showCreateMemoryModal = false}
          >
            Cancel
          </button>
          <button type="submit" class="button button-primary">
            Create Memory
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- AI Story Modal -->
{#if showAIStoryModal}
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Generate AI Story</h2>
        <button class="modal-close" on:click={() => showAIStoryModal = false}>×</button>
      </div>
      
      {#if !generatedStory}
        <form on:submit|preventDefault={generateAIStory}>
          <div class="form-group">
            <label class="form-label">Select Memories</label>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 1rem;">
              {#each recentMemories as memory}
                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: #F4E5C2;">
                  <input 
                    type="checkbox" 
                    bind:group={aiStoryForm.memoryIds} 
                    value={memory.id}
                  />
                  {memory.title}
                </label>
              {/each}
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Story Style</label>
            <select class="form-select" bind:value={aiStoryForm.style}>
              <option value="narrative">Narrative</option>
              <option value="poetic">Poetic</option>
              <option value="documentary">Documentary</option>
              <option value="children">Children's Story</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tone</label>
            <select class="form-select" bind:value={aiStoryForm.tone}>
              <option value="warm">Warm</option>
              <option value="nostalgic">Nostalgic</option>
              <option value="celebratory">Celebratory</option>
              <option value="reflective">Reflective</option>
              <option value="humorous">Humorous</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Custom Prompt (Optional)</label>
            <textarea 
              class="form-textarea" 
              bind:value={aiStoryForm.customPrompt}
              placeholder="Any specific instructions for the AI..."
            ></textarea>
          </div>
          
          <div class="button-row">
            <button 
              type="button" 
              class="button button-secondary"
              on:click={() => showAIStoryModal = false}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="button button-primary"
              disabled={generatingStory || aiStoryForm.memoryIds.length === 0}
            >
              {generatingStory ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </form>
      {:else}
        <div>
          <h3 style="color: #D4AF37; margin-bottom: 1rem;">{generatedStory.title}</h3>
          <div style="color: #F4E5C2; line-height: 1.6; margin-bottom: 2rem; max-height: 400px; overflow-y: auto;">
            {generatedStory.story}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; font-size: 0.875rem; color: #F4E5C2; opacity: 0.7;">
            <span>Confidence: {Math.round(generatedStory.confidence * 100)}%</span>
            <span>Generated in {generatedStory.generationTime}ms</span>
          </div>
          <div class="button-row">
            <button 
              class="button button-secondary"
              on:click={() => { generatedStory = null; aiStoryForm.memoryIds = []; }}
            >
              Generate Another
            </button>
            <button class="button button-primary">
              Save Story
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}