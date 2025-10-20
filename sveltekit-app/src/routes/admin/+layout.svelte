<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { adminStore } from '$lib/stores/admin';
  import { 
    Users, 
    BarChart3, 
    Settings, 
    Shield, 
    FileText, 
    Home,
    Bell,
    Search,
    Menu,
    X
  } from 'lucide-svelte';

  let sidebarOpen = true;
  let user: any = null;
  let adminStats: any = null;

  onMount(async () => {
    // Check if user is admin
    const currentUser = $authStore.user;
    if (!currentUser || currentUser.role !== 'admin') {
      goto('/dashboard');
      return;
    }
    
    user = currentUser;
    
    // Load admin dashboard stats
    try {
      adminStats = await adminStore.getDashboardStats();
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    }
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Settings }
  ];

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function isCurrentPage(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<div class="min-h-screen bg-base-200">
  <!-- Sidebar -->
  <div class="drawer lg:drawer-open">
    <input id="admin-drawer" type="checkbox" class="drawer-toggle" bind:checked={sidebarOpen} />
    
    <!-- Main content -->
    <div class="drawer-content flex flex-col">
      <!-- Top navigation -->
      <div class="navbar bg-base-100 shadow-sm border-b">
        <div class="flex-none lg:hidden">
          <label for="admin-drawer" class="btn btn-square btn-ghost">
            <Menu class="w-6 h-6" />
          </label>
        </div>
        
        <div class="flex-1">
          <h1 class="text-xl font-bold text-primary">Heirloom Admin</h1>
        </div>
        
        <div class="flex-none gap-2">
          <!-- Search -->
          <div class="form-control">
            <input type="text" placeholder="Search..." class="input input-bordered w-24 md:w-auto" />
          </div>
          
          <!-- Notifications -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
              <div class="indicator">
                <Bell class="w-5 h-5" />
                <span class="badge badge-xs badge-primary indicator-item"></span>
              </div>
            </div>
            <div tabindex="0" class="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow">
              <div class="card-body">
                <span class="font-bold text-lg">Notifications</span>
                <span class="text-info">New user registrations: 12</span>
                <span class="text-warning">Pending content reviews: 5</span>
                <span class="text-error">Security alerts: 2</span>
              </div>
            </div>
          </div>
          
          <!-- User menu -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-10 rounded-full">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Admin" />
              </div>
            </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><a href="/dashboard">User Dashboard</a></li>
              <li><a href="/admin/settings/profile">Profile</a></li>
              <li><button on:click={() => authStore.logout()}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Page content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side">
      <label for="admin-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="min-h-full w-64 bg-base-100 text-base-content">
        <!-- Logo -->
        <div class="p-4 border-b">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
            <span class="text-lg font-bold">Admin Panel</span>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="p-4">
          <ul class="menu menu-vertical gap-2">
            {#each navigation as item}
              <li>
                <a 
                  href={item.href}
                  class="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  class:bg-primary={isCurrentPage(item.href)}
                  class:text-primary-content={isCurrentPage(item.href)}
                >
                  <svelte:component this={item.icon} class="w-5 h-5" />
                  {item.name}
                </a>
              </li>
            {/each}
          </ul>
        </nav>
        
        <!-- Quick stats -->
        {#if adminStats}
          <div class="p-4 border-t mt-auto">
            <h3 class="font-semibold mb-3">Quick Stats</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Total Users</span>
                <span class="font-bold">{adminStats.totalUsers?.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>Active Today</span>
                <span class="font-bold text-success">{adminStats.activeToday?.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>Total Memories</span>
                <span class="font-bold">{adminStats.totalMemories?.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>Revenue (MTD)</span>
                <span class="font-bold text-primary">${adminStats.monthlyRevenue?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>

<style>
  :global(.admin-layout) {
    font-family: 'Inter', sans-serif;
  }
</style>