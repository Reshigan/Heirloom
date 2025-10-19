<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  // Global app state
  let isOnline = true;
  let theme = 'heirloom';
  
  onMount(() => {
    // Check online status
    const updateOnlineStatus = () => {
      isOnline = navigator.onLine;
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Load user preferences
    const savedTheme = localStorage.getItem('heirloom-theme');
    if (savedTheme) {
      theme = savedTheme;
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });
  
  function toggleTheme() {
    theme = theme === 'heirloom' ? 'dark' : 'heirloom';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('heirloom-theme', theme);
  }
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0ea5e9" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Offline Indicator -->
{#if !isOnline}
  <div class="fixed top-0 left-0 right-0 bg-error text-error-content text-center py-2 text-sm z-50">
    📡 You're offline. Some features may be limited.
  </div>
{/if}

<!-- Main App Container -->
<div class="min-h-screen bg-base-100 text-base-content">
  <main>
    <slot />
  </main>
</div>

<!-- Global Theme Toggle (Development) -->
{#if $page.url.searchParams.has('dev')}
  <button 
    class="fixed bottom-4 right-4 btn btn-circle btn-sm z-50"
    on:click={toggleTheme}
    title="Toggle Theme"
  >
    {theme === 'heirloom' ? '🌙' : '☀️'}
  </button>
{/if}

<!-- Global Styles -->
<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }
  
  /* Custom scrollbar for webkit browsers */
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }
  
  :global(::-webkit-scrollbar-track) {
    background: hsl(var(--b2));
    border-radius: 4px;
  }
  
  :global(::-webkit-scrollbar-thumb) {
    background: hsl(var(--bc) / 0.3);
    border-radius: 4px;
  }
  
  :global(::-webkit-scrollbar-thumb:hover) {
    background: hsl(var(--bc) / 0.5);
  }
  
  /* Focus styles for accessibility */
  :global(*:focus-visible) {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }
  
  /* Smooth transitions for theme changes */
  :global(*) {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  
  /* Disable transitions during theme change to prevent flash */
  :global(.theme-transition-disable *) {
    transition: none !important;
  }
</style>