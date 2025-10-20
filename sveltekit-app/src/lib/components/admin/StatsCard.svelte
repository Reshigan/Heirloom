<script lang="ts">
  import { TrendingUp, TrendingDown } from 'lucide-svelte';
  
  export let title: string;
  export let value: string | number;
  export let change: number | undefined = undefined;
  export let icon: any;
  export let color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' = 'primary';

  $: isPositive = change !== undefined && change > 0;
  $: isNegative = change !== undefined && change < 0;
  $: changeText = change !== undefined ? `${change > 0 ? '+' : ''}${change}%` : '';
</script>

<div class="card bg-base-100 shadow-sm">
  <div class="card-body">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-lg bg-{color}/10">
          <svelte:component this={icon} class="w-6 h-6 text-{color}" />
        </div>
        <div>
          <p class="text-sm text-base-content/70">{title}</p>
          <p class="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
      
      {#if change !== undefined}
        <div class="flex items-center gap-1" class:text-success={isPositive} class:text-error={isNegative}>
          {#if isPositive}
            <TrendingUp class="w-4 h-4" />
          {:else if isNegative}
            <TrendingDown class="w-4 h-4" />
          {/if}
          <span class="text-sm font-medium">{changeText}</span>
        </div>
      {/if}
    </div>
  </div>
</div>