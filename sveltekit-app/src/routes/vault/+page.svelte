<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { vaultStore, vaultActions, vaultStats, PRIVACY_LEVELS, CONTENT_CATEGORIES } from '$lib/stores/vault';
  import { engagementActions } from '$lib/stores/engagement';
  import LoominaryIcon from '$lib/components/icons/LoominaryIcon.svelte';

  let showCreateMemoryModal = false;
  let showInheritanceModal = false;
  let showLegacyPlanModal = false;
  let selectedPrivacyLevel = 'PERSONAL';
  let selectedCategory = 'childhood';
  
  let memoryForm = {
    title: '',
    content: '',
    type: 'memory',
    privacyLevel: 'PERSONAL',
    categories: [],
    inheritanceInstructions: ''
  };

  let inheritanceForm = {
    grantee: '',
    permissions: [],
    conditions: [],
    personalMessage: ''
  };

  let vaultContent = [];
  let filteredContent = [];
  let searchQuery = '';
  let selectedCategoryFilter = 'all';
  let selectedPrivacyFilter = 'all';

  onMount(async () => {
    if ($authStore.user) {
      // Initialize or load vault
      await vaultActions.initializeVault($authStore.user.id, $authStore.user.familyId);
      
      if ($vaultStore) {
        await vaultActions.loadVault($vaultStore.id);
      }
      
      // Track vault visit
      engagementActions.trackAction('DAILY_VAULT_VISIT');
    }
  });

  $: if (vaultContent) {
    filteredContent = vaultContent.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || 
                             item.categories.includes(selectedCategoryFilter);
      const matchesPrivacy = selectedPrivacyFilter === 'all' || 
                            item.privacyLevel === selectedPrivacyFilter;
      
      return matchesSearch && matchesCategory && matchesPrivacy;
    });
  }

  async function createMemory() {
    if (!memoryForm.title || !memoryForm.content) return;

    try {
      const newContent = await vaultActions.addContent({
        ...memoryForm,
        vaultId: $vaultStore.id,
        metadata: {
          wordCount: memoryForm.content.split(' ').length,
          createdFrom: 'vault_dashboard'
        },
        isEncrypted: memoryForm.privacyLevel === 'PERSONAL'
      });

      if (newContent) {
        vaultContent = [newContent, ...vaultContent];
        
        // Track achievement
        await engagementActions.trackAction('CREATE_MEMORY', {
          privacyLevel: memoryForm.privacyLevel,
          category: memoryForm.categories[0]
        });

        // Reset form
        memoryForm = {
          title: '',
          content: '',
          type: 'memory',
          privacyLevel: 'PERSONAL',
          categories: [],
          inheritanceInstructions: ''
        };
        
        showCreateMemoryModal = false;
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  }

  async function createInheritanceToken() {
    if (!inheritanceForm.grantee) return;

    try {
      const token = await vaultActions.createInheritanceToken({
        vaultId: $vaultStore.id,
        grantee: inheritanceForm.grantee,
        permissions: inheritanceForm.permissions,
        conditions: inheritanceForm.conditions.map(condition => ({
          type: condition,
          status: 'PENDING',
          details: {}
        })),
        isActive: true
      });

      if (token) {
        // Track achievement
        await engagementActions.trackAction('CREATE_INHERITANCE_TOKEN');
        
        // Reset form
        inheritanceForm = {
          grantee: '',
          permissions: [],
          conditions: [],
          personalMessage: ''
        };
        
        showInheritanceModal = false;
        
        // Show success message
        alert(`Inheritance token created successfully!\nToken Code: ${token.tokenCode}\n\nShare this code securely with ${inheritanceForm.grantee}.`);
      }
    } catch (error) {
      console.error('Failed to create inheritance token:', error);
    }
  }

  function toggleCategory(categoryId) {
    if (memoryForm.categories.includes(categoryId)) {
      memoryForm.categories = memoryForm.categories.filter(id => id !== categoryId);
    } else {
      memoryForm.categories = [...memoryForm.categories, categoryId];
    }
  }

  function togglePermission(contentType) {
    const existingIndex = inheritanceForm.permissions.findIndex(p => p.contentType === contentType);
    
    if (existingIndex >= 0) {
      inheritanceForm.permissions = inheritanceForm.permissions.filter((_, i) => i !== existingIndex);
    } else {
      inheritanceForm.permissions = [...inheritanceForm.permissions, {
        contentType,
        categories: ['all'],
        accessLevel: 'VIEW_ONLY'
      }];
    }
  }

  function getPrivacyIcon(level) {
    return PRIVACY_LEVELS[level]?.icon || '🔒';
  }

  function getPrivacyColor(level) {
    return PRIVACY_LEVELS[level]?.color || '#DC2626';
  }
</script>

<svelte:head>
  <title>My Private Vault - Loominary</title>
</svelte:head>

<style>
  .vault-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
    padding: 2rem;
  }

  .vault-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .vault-title {
    font-family: 'Bodoni Moda', serif;
    font-size: 2.5rem;
    color: #D4AF37;
    margin-bottom: 0.5rem;
  }

  .vault-subtitle {
    color: #F4E5C2;
    opacity: 0.8;
    font-size: 1rem;
  }

  .vault-stats {
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

  .vault-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .action-button {
    background: linear-gradient(135deg, #B8941F, #D4AF37);
    border: none;
    border-radius: 8px;
    color: #0A0A0A;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
  }

  .action-button.secondary {
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .action-button.secondary:hover {
    background: rgba(212, 175, 55, 0.2);
  }

  .vault-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
  }

  .vault-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .vault-main {
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

  .card-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #D4AF37;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .search-bar {
    width: 100%;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    color: #FFF8E7;
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-bar:focus {
    outline: none;
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .filter-group {
    margin-bottom: 1.5rem;
  }

  .filter-label {
    display: block;
    color: #F4E5C2;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .filter-select {
    width: 100%;
    padding: 0.75rem;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    color: #FFF8E7;
    font-size: 0.875rem;
  }

  .privacy-levels {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .privacy-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #F4E5C2;
  }

  .content-grid {
    display: grid;
    gap: 1rem;
  }

  .content-item {
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.1);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }

  .content-item:hover {
    border-color: rgba(212, 175, 55, 0.3);
    background: rgba(212, 175, 55, 0.05);
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .content-title {
    color: #D4AF37;
    font-weight: 500;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  .content-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .content-privacy {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .content-body {
    color: #F4E5C2;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .content-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .category-tag {
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
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
    max-width: 600px;
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

  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(10, 10, 10, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .checkbox-item:hover {
    border-color: rgba(212, 175, 55, 0.3);
  }

  .checkbox-item.selected {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }

  .button-row {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
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

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    .vault-content {
      grid-template-columns: 1fr;
    }
    
    .vault-stats {
      flex-direction: column;
      gap: 1rem;
    }
    
    .vault-actions {
      flex-direction: column;
    }
  }
</style>

<div class="vault-container">
  <!-- Vault Header -->
  <div class="vault-header">
    <div>
      <h1 class="vault-title">
        <LoominaryIcon name="vault" size={32} />
        My Private Vault
      </h1>
      <p class="vault-subtitle">Your secure family legacy repository</p>
    </div>
    
    {#if $vaultStats}
      <div class="vault-stats">
        <div class="stat-item">
          <div class="stat-value">{$vaultStats.totalMemories}</div>
          <div class="stat-label">Memories</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{Math.round($vaultStats.totalSize / 1024)}KB</div>
          <div class="stat-label">Vault Size</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{$vaultStats.daysSinceCreation}</div>
          <div class="stat-label">Days Active</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value" style="color: {$vaultStats.isSealed ? '#DC2626' : '#10B981'}">
            {$vaultStats.isSealed ? 'SEALED' : 'ACTIVE'}
          </div>
          <div class="stat-label">Status</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Vault Actions -->
  <div class="vault-actions">
    <button class="action-button" on:click={() => showCreateMemoryModal = true}>
      <LoominaryIcon name="private-memory" size={16} />
      Add Memory
    </button>
    
    <button class="action-button secondary" on:click={() => showInheritanceModal = true}>
      <LoominaryIcon name="inheritance-token" size={16} />
      Create Inheritance Token
    </button>
    
    <button class="action-button secondary" on:click={() => showLegacyPlanModal = true}>
      <LoominaryIcon name="legacy-plan" size={16} />
      Legacy Planning
    </button>
    
    <button class="action-button secondary">
      <LoominaryIcon name="time-capsule" size={16} />
      Time Capsule
    </button>
  </div>

  <!-- Vault Content -->
  <div class="vault-content">
    <!-- Sidebar -->
    <div class="vault-sidebar">
      <!-- Search -->
      <div class="card">
        <input 
          type="text" 
          class="search-bar" 
          placeholder="Search your memories..."
          bind:value={searchQuery}
        />
        
        <div class="filter-group">
          <label class="filter-label">Category</label>
          <select class="filter-select" bind:value={selectedCategoryFilter}>
            <option value="all">All Categories</option>
            {#each CONTENT_CATEGORIES as category}
              <option value={category.id}>{category.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Privacy Level</label>
          <select class="filter-select" bind:value={selectedPrivacyFilter}>
            <option value="all">All Privacy Levels</option>
            {#each Object.entries(PRIVACY_LEVELS) as [key, level]}
              <option value={key}>{level.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Privacy Levels Guide -->
      <div class="card">
        <h3 class="card-title">
          <LoominaryIcon name="privacy-levels" size={20} />
          Privacy Levels
        </h3>
        
        <div class="privacy-levels">
          {#each Object.entries(PRIVACY_LEVELS) as [key, level]}
            <div class="privacy-item">
              <span>{level.icon}</span>
              <div>
                <div style="font-weight: 500; color: {level.color};">{level.label}</div>
                <div style="font-size: 0.75rem; opacity: 0.8;">{level.description}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="vault-main">
      <div class="card">
        <h2 class="card-title">
          <LoominaryIcon name="constellation" size={20} />
          Your Memories ({filteredContent.length})
        </h2>
        
        {#if filteredContent.length > 0}
          <div class="content-grid">
            {#each filteredContent as item}
              <div class="content-item">
                <div class="content-header">
                  <div>
                    <h3 class="content-title">{item.title}</h3>
                    <div class="content-meta">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.type}</span>
                      {#if item.categories.length > 0}
                        <span>•</span>
                        <span>{item.categories.length} categories</span>
                      {/if}
                    </div>
                  </div>
                  
                  <div 
                    class="content-privacy" 
                    style="background: {getPrivacyColor(item.privacyLevel)}20; color: {getPrivacyColor(item.privacyLevel)};"
                  >
                    <span>{getPrivacyIcon(item.privacyLevel)}</span>
                    <span>{PRIVACY_LEVELS[item.privacyLevel]?.label || item.privacyLevel}</span>
                  </div>
                </div>
                
                <div class="content-body">
                  {item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}
                </div>
                
                {#if item.categories.length > 0}
                  <div class="content-categories">
                    {#each item.categories as categoryId}
                      {@const category = CONTENT_CATEGORIES.find(c => c.id === categoryId)}
                      {#if category}
                        <span class="category-tag">
                          {category.icon} {category.label}
                        </span>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <div class="empty-state-icon">🏛️</div>
            <h3>Your vault is waiting for its first memory</h3>
            <p>Start building your family legacy by adding your first memory.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Create Memory Modal -->
{#if showCreateMemoryModal}
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Add Memory to Vault</h2>
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
          <label class="form-label">Your Story</label>
          <textarea 
            class="form-textarea" 
            bind:value={memoryForm.content}
            placeholder="Share the details of this memory..."
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Privacy Level</label>
          <select class="form-select" bind:value={memoryForm.privacyLevel}>
            {#each Object.entries(PRIVACY_LEVELS) as [key, level]}
              <option value={key}>{level.icon} {level.label}</option>
            {/each}
          </select>
          <div style="font-size: 0.75rem; color: #F4E5C2; opacity: 0.7; margin-top: 0.5rem;">
            {PRIVACY_LEVELS[memoryForm.privacyLevel]?.description}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Categories (Select all that apply)</label>
          <div class="checkbox-grid">
            {#each CONTENT_CATEGORIES as category}
              <div 
                class="checkbox-item" 
                class:selected={memoryForm.categories.includes(category.id)}
                on:click={() => toggleCategory(category.id)}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </div>
            {/each}
          </div>
        </div>
        
        {#if memoryForm.privacyLevel === 'INHERITABLE' || memoryForm.privacyLevel === 'PUBLIC_ON_DEATH'}
          <div class="form-group">
            <label class="form-label">Inheritance Instructions (Optional)</label>
            <textarea 
              class="form-textarea" 
              bind:value={memoryForm.inheritanceInstructions}
              placeholder="Special instructions for future recipients of this memory..."
            ></textarea>
          </div>
        {/if}
        
        <div class="button-row">
          <button 
            type="button" 
            class="button button-secondary"
            on:click={() => showCreateMemoryModal = false}
          >
            Cancel
          </button>
          <button type="submit" class="button button-primary">
            Add to Vault
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Inheritance Token Modal -->
{#if showInheritanceModal}
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Create Inheritance Token</h2>
        <button class="modal-close" on:click={() => showInheritanceModal = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={createInheritanceToken}>
        <div class="form-group">
          <label class="form-label">Recipient Name/Email</label>
          <input 
            type="text" 
            class="form-input" 
            bind:value={inheritanceForm.grantee}
            placeholder="Who should receive this inheritance token?"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Content Permissions</label>
          <div class="checkbox-grid">
            {#each ['memories', 'photos', 'audio', 'documents', 'stories', 'time_capsules'] as contentType}
              <div 
                class="checkbox-item" 
                class:selected={inheritanceForm.permissions.some(p => p.contentType === contentType)}
                on:click={() => togglePermission(contentType)}
              >
                <LoominaryIcon name={contentType === 'memories' ? 'private-memory' : contentType === 'time_capsules' ? 'time-capsule' : contentType} size={16} />
                <span>{contentType.replace('_', ' ').toUpperCase()}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Activation Conditions</label>
          <div class="checkbox-grid">
            {#each ['DEATH_CERTIFICATE', 'TIME_DELAY', 'MANUAL_APPROVAL'] as condition}
              <div 
                class="checkbox-item" 
                class:selected={inheritanceForm.conditions.includes(condition)}
                on:click={() => {
                  if (inheritanceForm.conditions.includes(condition)) {
                    inheritanceForm.conditions = inheritanceForm.conditions.filter(c => c !== condition);
                  } else {
                    inheritanceForm.conditions = [...inheritanceForm.conditions, condition];
                  }
                }}
              >
                <span>
                  {condition === 'DEATH_CERTIFICATE' ? '📜' : 
                   condition === 'TIME_DELAY' ? '⏰' : '✋'}
                </span>
                <span>{condition.replace('_', ' ')}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Personal Message (Optional)</label>
          <textarea 
            class="form-textarea" 
            bind:value={inheritanceForm.personalMessage}
            placeholder="A personal message to accompany this inheritance..."
          ></textarea>
        </div>
        
        <div class="button-row">
          <button 
            type="button" 
            class="button button-secondary"
            on:click={() => showInheritanceModal = false}
          >
            Cancel
          </button>
          <button type="submit" class="button button-primary">
            Create Token
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}