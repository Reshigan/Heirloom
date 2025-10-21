<script>
  import { createEventDispatcher } from 'svelte';
  
  export let selectedItems = [];
  export let totalItems = 0;
  export let actions = [];

  const dispatch = createEventDispatcher();

  function handleAction(action) {
    dispatch('action', {
      action: action.id,
      items: selectedItems
    });
  }

  function selectAll() {
    dispatch('selectAll');
  }

  function clearSelection() {
    dispatch('clearSelection');
  }

  $: hasSelection = selectedItems.length > 0;
  $: allSelected = selectedItems.length === totalItems && totalItems > 0;
</script>

<style>
  .bulk-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(26, 26, 26, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .selection-info {
    color: #F4E5C2;
    font-size: 0.875rem;
  }

  .selection-controls {
    display: flex;
    gap: 0.5rem;
  }

  .control-button {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #D4AF37;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .control-button:hover {
    background: rgba(212, 175, 55, 0.2);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }

  .action-button {
    background: linear-gradient(135deg, #B8941F, #D4AF37);
    border: none;
    color: #0A0A0A;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  .action-button.danger {
    background: linear-gradient(135deg, #DC2626, #EF4444);
    color: white;
  }

  .action-button.danger:hover {
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }

  .hidden {
    display: none;
  }
</style>

<div class="bulk-actions" class:hidden={!hasSelection}>
  <div class="selection-info">
    {selectedItems.length} of {totalItems} items selected
  </div>
  
  <div class="selection-controls">
    {#if !allSelected}
      <button class="control-button" on:click={selectAll}>
        Select All
      </button>
    {/if}
    
    <button class="control-button" on:click={clearSelection}>
      Clear Selection
    </button>
  </div>
  
  <div class="actions">
    {#each actions as action}
      <button 
        class="action-button" 
        class:danger={action.type === 'danger'}
        on:click={() => handleAction(action)}
        disabled={!hasSelection}
      >
        {#if action.icon}
          <span class="icon">{action.icon}</span>
        {/if}
        {action.label}
      </button>
    {/each}
  </div>
</div>