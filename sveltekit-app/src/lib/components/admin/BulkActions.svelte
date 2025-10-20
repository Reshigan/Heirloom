<script>
  export let selectedItems = [];
  export let onBulkAction = () => {};
  
  let showActions = false;
  
  $: showActions = selectedItems.length > 0;
</script>

{#if showActions}
  <div class="flex items-center space-x-2 p-4 bg-base-200 rounded-lg mb-4">
    <span class="text-sm font-medium">{selectedItems.length} items selected</span>
    
    <div class="flex space-x-2 ml-auto">
      <button 
        class="btn btn-sm btn-outline btn-success"
        on:click={() => onBulkAction('activate')}
      >
        Activate
      </button>
      
      <button 
        class="btn btn-sm btn-outline btn-warning"
        on:click={() => onBulkAction('suspend')}
      >
        Suspend
      </button>
      
      <button 
        class="btn btn-sm btn-outline btn-error"
        on:click={() => onBulkAction('delete')}
      >
        Delete
      </button>
      
      <button 
        class="btn btn-sm btn-outline"
        on:click={() => onBulkAction('export')}
      >
        Export
      </button>
    </div>
  </div>
{/if}
