<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { engagementActions, CONTENT_PROMPTS } from '$lib/stores/engagement';

  let currentStep = 0;
  let completedSteps = [];
  let showCelebration = false;
  let userProfile = {
    avatar: '',
    familyRole: '',
    interests: [],
    goals: []
  };

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Legacy Journey',
      description: 'Let\'s get you started on preserving your family\'s most precious memories',
      icon: '🌟',
      action: 'continue'
    },
    {
      id: 'profile',
      title: 'Tell Us About Yourself',
      description: 'Help us personalize your experience',
      icon: '👤',
      action: 'setup_profile'
    },
    {
      id: 'first_memory',
      title: 'Create Your First Memory',
      description: 'Start your legacy with a meaningful memory',
      icon: '📝',
      action: 'create_memory'
    },
    {
      id: 'invite_family',
      title: 'Invite Your Family',
      description: 'Share the journey with those who matter most',
      icon: '👨‍👩‍👧‍👦',
      action: 'invite_family'
    },
    {
      id: 'explore',
      title: 'Discover Features',
      description: 'Learn about AI stories, time capsules, and more',
      icon: '🚀',
      action: 'explore_features'
    }
  ];

  const familyRoles = [
    { id: 'parent', label: 'Parent/Guardian', icon: '👨‍👩‍👧‍👦' },
    { id: 'grandparent', label: 'Grandparent', icon: '👴👵' },
    { id: 'child', label: 'Child/Young Adult', icon: '👶' },
    { id: 'sibling', label: 'Sibling', icon: '👫' },
    { id: 'other', label: 'Other Family Member', icon: '👥' }
  ];

  const interests = [
    { id: 'photography', label: 'Photography', icon: '📸' },
    { id: 'storytelling', label: 'Storytelling', icon: '📚' },
    { id: 'genealogy', label: 'Family History', icon: '🌳' },
    { id: 'cooking', label: 'Family Recipes', icon: '👨‍🍳' },
    { id: 'travel', label: 'Travel Memories', icon: '✈️' },
    { id: 'traditions', label: 'Family Traditions', icon: '🎭' },
    { id: 'music', label: 'Music & Songs', icon: '🎵' },
    { id: 'crafts', label: 'Arts & Crafts', icon: '🎨' }
  ];

  const goals = [
    { id: 'preserve', label: 'Preserve family history', icon: '🏛️' },
    { id: 'connect', label: 'Connect with relatives', icon: '🤝' },
    { id: 'stories', label: 'Share family stories', icon: '📖' },
    { id: 'future', label: 'Leave legacy for future generations', icon: '🌱' },
    { id: 'organize', label: 'Organize family photos/documents', icon: '📁' },
    { id: 'discover', label: 'Discover family roots', icon: '🔍' }
  ];

  let selectedMemoryPrompt = null;
  let memoryContent = {
    title: '',
    description: '',
    date: '',
    location: '',
    tags: []
  };

  onMount(() => {
    // Track onboarding start
    engagementActions.trackAction('onboarding_started');
    
    // Initialize engagement system
    if ($authStore.user) {
      engagementActions.initialize($authStore.user.id);
    }
  });

  function nextStep() {
    if (currentStep < onboardingSteps.length - 1) {
      completedSteps = [...completedSteps, currentStep];
      currentStep++;
      
      // Track step completion
      engagementActions.trackAction('onboarding_step_completed', {
        step: onboardingSteps[currentStep - 1].id
      });
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      completedSteps = completedSteps.filter(step => step !== currentStep);
    }
  }

  async function completeOnboarding() {
    try {
      // Save user profile
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      });

      // Track onboarding completion
      await engagementActions.trackAction('onboarding_completed');
      
      // Show celebration
      showCelebration = true;
      
      // Redirect to dashboard after celebration
      setTimeout(() => {
        goto('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }

  function selectMemoryPrompt(prompt) {
    selectedMemoryPrompt = prompt;
    memoryContent.title = prompt.title;
  }

  async function createFirstMemory() {
    if (!memoryContent.title || !memoryContent.description) {
      return;
    }

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...memoryContent,
          type: 'text',
          isFirstMemory: true
        })
      });

      if (response.ok) {
        // Track first memory creation
        await engagementActions.trackAction('first_memory_created');
        nextStep();
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  }

  function toggleInterest(interestId) {
    if (userProfile.interests.includes(interestId)) {
      userProfile.interests = userProfile.interests.filter(id => id !== interestId);
    } else {
      userProfile.interests = [...userProfile.interests, interestId];
    }
  }

  function toggleGoal(goalId) {
    if (userProfile.goals.includes(goalId)) {
      userProfile.goals = userProfile.goals.filter(id => id !== goalId);
    } else {
      userProfile.goals = [...userProfile.goals, goalId];
    }
  }

  async function inviteFamily() {
    // This would open an invite modal or redirect to invite page
    await engagementActions.trackAction('family_invite_initiated');
    nextStep();
  }

  function exploreFeatures() {
    // Track feature exploration
    engagementActions.trackAction('features_explored');
    completeOnboarding();
  }
</script>

<svelte:head>
  <title>Welcome to Loominary - Get Started</title>
</svelte:head>

<style>
  :global(body) {
    background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
    min-height: 100vh;
  }

  .onboarding-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
  }

  .onboarding-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
      linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 50%, #0A0A0A 100%);
    z-index: -1;
  }

  .onboarding-card {
    background: rgba(26, 26, 26, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 16px;
    padding: 3rem;
    width: 100%;
    max-width: 600px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(212, 175, 55, 0.1);
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 3px;
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #B8941F, #D4AF37);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .step-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .step-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .step-title {
    font-family: 'Bodoni Moda', serif;
    font-size: 1.75rem;
    font-weight: 300;
    color: #D4AF37;
    margin-bottom: 0.5rem;
  }

  .step-description {
    color: #F4E5C2;
    opacity: 0.8;
    line-height: 1.6;
  }

  .step-content {
    margin-bottom: 2rem;
  }

  .role-grid, .interest-grid, .goal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .option-card {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .option-card:hover {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }

  .option-card.selected {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.2);
  }

  .option-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .option-label {
    color: #F4E5C2;
    font-size: 0.875rem;
  }

  .memory-prompts {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .prompt-card {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .prompt-card:hover {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }

  .prompt-card.selected {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.2);
  }

  .prompt-title {
    color: #D4AF37;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .prompt-description {
    color: #F4E5C2;
    font-size: 0.875rem;
    opacity: 0.8;
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

  .form-input, .form-textarea {
    width: 100%;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    color: #FFF8E7;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .button-row {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  .onboarding-button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
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

  .celebration-modal {
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

  .celebration-card {
    background: rgba(26, 26, 26, 0.95);
    border: 2px solid #D4AF37;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    max-width: 400px;
    animation: celebrationPop 0.5s ease;
  }

  @keyframes celebrationPop {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .celebration-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .feature-card {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-title {
    color: #D4AF37;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .feature-description {
    color: #F4E5C2;
    font-size: 0.875rem;
    opacity: 0.8;
  }
</style>

<div class="onboarding-bg"></div>

<div class="onboarding-container">
  <div class="onboarding-card">
    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" style="width: {((currentStep + 1) / onboardingSteps.length) * 100}%"></div>
    </div>

    <!-- Step Content -->
    {#if currentStep === 0}
      <!-- Welcome Step -->
      <div class="step-header">
        <div class="step-icon">🌟</div>
        <h1 class="step-title">Welcome to Your Legacy Journey</h1>
        <p class="step-description">
          You're about to embark on an incredible journey of preserving and sharing your family's most precious memories. 
          Let's get you started with a personalized experience that will help you create a lasting legacy.
        </p>
      </div>

      <div class="step-content">
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <div class="feature-title">Preserve Memories</div>
            <div class="feature-description">Capture and organize your family's stories, photos, and moments</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <div class="feature-title">AI-Powered Stories</div>
            <div class="feature-description">Transform memories into beautiful narratives with AI assistance</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⏰</div>
            <div class="feature-title">Time Capsules</div>
            <div class="feature-description">Create messages for future generations to discover</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👨‍👩‍👧‍👦</div>
            <div class="feature-title">Family Connection</div>
            <div class="feature-description">Invite family members to contribute and share memories</div>
          </div>
        </div>
      </div>

    {:else if currentStep === 1}
      <!-- Profile Setup Step -->
      <div class="step-header">
        <div class="step-icon">👤</div>
        <h1 class="step-title">Tell Us About Yourself</h1>
        <p class="step-description">Help us personalize your Loominary experience</p>
      </div>

      <div class="step-content">
        <div class="form-group">
          <label class="form-label">What's your role in the family?</label>
          <div class="role-grid">
            {#each familyRoles as role}
              <div 
                class="option-card" 
                class:selected={userProfile.familyRole === role.id}
                on:click={() => userProfile.familyRole = role.id}
              >
                <div class="option-icon">{role.icon}</div>
                <div class="option-label">{role.label}</div>
              </div>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">What interests you most? (Select all that apply)</label>
          <div class="interest-grid">
            {#each interests as interest}
              <div 
                class="option-card" 
                class:selected={userProfile.interests.includes(interest.id)}
                on:click={() => toggleInterest(interest.id)}
              >
                <div class="option-icon">{interest.icon}</div>
                <div class="option-label">{interest.label}</div>
              </div>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">What are your main goals? (Select all that apply)</label>
          <div class="goal-grid">
            {#each goals as goal}
              <div 
                class="option-card" 
                class:selected={userProfile.goals.includes(goal.id)}
                on:click={() => toggleGoal(goal.id)}
              >
                <div class="option-icon">{goal.icon}</div>
                <div class="option-label">{goal.label}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>

    {:else if currentStep === 2}
      <!-- First Memory Step -->
      <div class="step-header">
        <div class="step-icon">📝</div>
        <h1 class="step-title">Create Your First Memory</h1>
        <p class="step-description">Start your legacy with a meaningful memory. Choose a prompt or create your own.</p>
      </div>

      <div class="step-content">
        {#if !selectedMemoryPrompt}
          <div class="memory-prompts">
            {#each CONTENT_PROMPTS.slice(0, 3) as prompt}
              <div 
                class="prompt-card"
                on:click={() => selectMemoryPrompt(prompt)}
              >
                <div class="prompt-title">{prompt.title}</div>
                <div class="prompt-description">{prompt.description}</div>
              </div>
            {/each}
            <div 
              class="prompt-card"
              on:click={() => selectMemoryPrompt({ title: 'My Own Memory', description: 'Create your own unique memory' })}
            >
              <div class="prompt-title">Create Your Own</div>
              <div class="prompt-description">Share any memory that's special to you</div>
            </div>
          </div>
        {:else}
          <div class="form-group">
            <label class="form-label">Memory Title</label>
            <input 
              type="text" 
              class="form-input" 
              bind:value={memoryContent.title}
              placeholder="Give your memory a title"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Tell Your Story</label>
            <textarea 
              class="form-textarea" 
              bind:value={memoryContent.description}
              placeholder="Share the details of this memory..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">When did this happen? (Optional)</label>
            <input 
              type="date" 
              class="form-input" 
              bind:value={memoryContent.date}
            />
          </div>

          <div class="form-group">
            <label class="form-label">Where did this happen? (Optional)</label>
            <input 
              type="text" 
              class="form-input" 
              bind:value={memoryContent.location}
              placeholder="Location"
            />
          </div>
        {/if}
      </div>

    {:else if currentStep === 3}
      <!-- Invite Family Step -->
      <div class="step-header">
        <div class="step-icon">👨‍👩‍👧‍👦</div>
        <h1 class="step-title">Invite Your Family</h1>
        <p class="step-description">
          Memories are better when shared. Invite family members to join your legacy journey.
          You'll earn bonus XP for each successful invitation!
        </p>
      </div>

      <div class="step-content">
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📧</div>
            <div class="feature-title">Email Invitations</div>
            <div class="feature-description">Send personalized invites to family members</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <div class="feature-title">Share Link</div>
            <div class="feature-description">Share your unique referral link</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎁</div>
            <div class="feature-title">Referral Rewards</div>
            <div class="feature-description">Earn free months for successful referrals</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👑</div>
            <div class="feature-title">Family Admin</div>
            <div class="feature-description">Manage your family's shared memories</div>
          </div>
        </div>
      </div>

    {:else if currentStep === 4}
      <!-- Explore Features Step -->
      <div class="step-header">
        <div class="step-icon">🚀</div>
        <h1 class="step-title">Discover Amazing Features</h1>
        <p class="step-description">
          Explore the powerful tools that will help you create an incredible family legacy.
        </p>
      </div>

      <div class="step-content">
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <div class="feature-title">AI Story Generation</div>
            <div class="feature-description">Transform your memories into beautiful stories with AI</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⏰</div>
            <div class="feature-title">Time Capsules</div>
            <div class="feature-description">Create messages to be opened in the future</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏆</div>
            <div class="feature-title">Achievement System</div>
            <div class="feature-description">Earn XP and unlock achievements as you build your legacy</div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <div class="feature-title">Mobile App</div>
            <div class="feature-description">Access your memories anywhere with our mobile app</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Navigation Buttons -->
    <div class="button-row">
      {#if currentStep > 0}
        <button class="onboarding-button button-secondary" on:click={prevStep}>
          Back
        </button>
      {:else}
        <div></div>
      {/if}

      {#if currentStep === 2 && selectedMemoryPrompt}
        <button 
          class="onboarding-button button-primary" 
          on:click={createFirstMemory}
          disabled={!memoryContent.title || !memoryContent.description}
        >
          Create Memory
        </button>
      {:else if currentStep === 3}
        <button class="onboarding-button button-primary" on:click={inviteFamily}>
          Invite Family
        </button>
      {:else if currentStep === 4}
        <button class="onboarding-button button-primary" on:click={exploreFeatures}>
          Start My Journey
        </button>
      {:else}
        <button 
          class="onboarding-button button-primary" 
          on:click={nextStep}
          disabled={currentStep === 1 && !userProfile.familyRole}
        >
          Continue
        </button>
      {/if}
    </div>
  </div>
</div>

<!-- Celebration Modal -->
{#if showCelebration}
  <div class="celebration-modal">
    <div class="celebration-card">
      <div class="celebration-icon">🎉</div>
      <h2 style="color: #D4AF37; margin-bottom: 1rem;">Welcome to Loominary!</h2>
      <p style="color: #F4E5C2; margin-bottom: 2rem;">
        Congratulations! You've completed the onboarding and earned your first achievements. 
        Your legacy journey begins now!
      </p>
      <div style="font-size: 0.875rem; color: rgba(244, 229, 194, 0.7);">
        Taking you to your dashboard...
      </div>
    </div>
  </div>
{/if}