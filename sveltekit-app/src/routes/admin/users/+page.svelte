<script lang="ts">
  import { onMount } from 'svelte';
  import { adminStore } from '$lib/stores/admin';
  import { 
    Search, 
    Filter, 
    Download, 
    Plus,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    AlertCircle,
    Mail,
    Phone,
    Calendar
  } from 'lucide-svelte';
  import UserModal from '$lib/components/admin/UserModal.svelte';
  import BulkActions from '$lib/components/admin/BulkActions.svelte';

  let users: any[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let selectedUsers: string[] = [];
  let showUserModal = false;
  let selectedUser: any = null;
  let currentPage = 1;
  let totalPages = 1;
  let totalUsers = 0;
  let filters = {
    status: 'all',
    subscription: 'all',
    role: 'all',
    dateRange: 'all'
  };

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    try {
      const response = await adminStore.getUsers({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        ...filters
      });
      users = response.users;
      totalPages = response.totalPages;
      totalUsers = response.total;
    } catch (err) {
      error = 'Failed to load users';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleSearch() {
    currentPage = 1;
    loadUsers();
  }

  function handleFilterChange() {
    currentPage = 1;
    loadUsers();
  }

  function selectUser(userId: string) {
    if (selectedUsers.includes(userId)) {
      selectedUsers = selectedUsers.filter(id => id !== userId);
    } else {
      selectedUsers = [...selectedUsers, userId];
    }
  }

  function selectAllUsers() {
    if (selectedUsers.length === users.length) {
      selectedUsers = [];
    } else {
      selectedUsers = users.map(user => user.id);
    }
  }

  function editUser(user: any) {
    selectedUser = user;
    showUserModal = true;
  }

  function createUser() {
    selectedUser = null;
    showUserModal = true;
  }

  async function deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await adminStore.deleteUser(userId);
        await loadUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  }

  async function banUser(userId: string) {
    if (confirm('Are you sure you want to ban this user?')) {
      try {
        await adminStore.banUser(userId);
        await loadUsers();
      } catch (err) {
        alert('Failed to ban user');
      }
    }
  }

  async function exportUsers() {
    try {
      const blob = await adminStore.exportUsers(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export users');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-warning';
      case 'banned': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  function getSubscriptionBadge(subscription: string) {
    switch (subscription) {
      case 'basic': return 'badge-ghost';
      case 'premium': return 'badge-primary';
      case 'family': return 'badge-secondary';
      case 'enterprise': return 'badge-accent';
      default: return 'badge-ghost';
    }
  }
</script>

<svelte:head>
  <title>User Management - Heirloom Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-base-content">User Management</h1>
      <p class="text-base-content/70 mt-1">Manage and monitor all platform users</p>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-outline" on:click={exportUsers}>
        <Download class="w-4 h-4 mr-2" />
        Export
      </button>
      <button class="btn btn-primary" on:click={createUser}>
        <Plus class="w-4 h-4 mr-2" />
        Add User
      </button>
    </div>
  </div>

  <!-- Search and filters -->
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="form-control">
            <div class="input-group">
              <input 
                type="text" 
                placeholder="Search users..." 
                class="input input-bordered flex-1"
                bind:value={searchQuery}
                on:keydown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button class="btn btn-square" on:click={handleSearch}>
                <Search class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex gap-2">
          <select class="select select-bordered" bind:value={filters.status} on:change={handleFilterChange}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>

          <select class="select select-bordered" bind:value={filters.subscription} on:change={handleFilterChange}>
            <option value="all">All Subscriptions</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="family">Family</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select class="select select-bordered" bind:value={filters.role} on:change={handleFilterChange}>
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <!-- Results summary -->
      <div class="flex justify-between items-center mt-4">
        <span class="text-sm text-base-content/70">
          Showing {users.length} of {totalUsers} users
        </span>
        {#if selectedUsers.length > 0}
          <BulkActions 
            selectedCount={selectedUsers.length}
            on:delete={() => console.log('Bulk delete')}
            on:ban={() => console.log('Bulk ban')}
            on:export={() => console.log('Bulk export')}
          />
        {/if}
      </div>
    </div>
  </div>

  <!-- Users table -->
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body p-0">
      {#if loading}
        <div class="flex justify-center items-center h-64">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else if error}
        <div class="alert alert-error m-6">
          <AlertCircle class="w-5 h-5" />
          <span>{error}</span>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    class="checkbox" 
                    checked={selectedUsers.length === users.length && users.length > 0}
                    on:change={selectAllUsers}
                  />
                </th>
                <th>User</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr>
                  <td>
                    <input 
                      type="checkbox" 
                      class="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      on:change={() => selectUser(user.id)}
                    />
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-12 h-12">
                          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} alt="Avatar" />
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{user.firstName} {user.lastName}</div>
                        <div class="text-sm text-base-content/70">ID: {user.id.slice(0, 8)}...</div>
                        {#if user.role !== 'user'}
                          <div class="badge badge-outline badge-xs">{user.role}</div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 text-sm">
                        <Mail class="w-3 h-3" />
                        {user.email}
                      </div>
                      {#if user.phoneNumber}
                        <div class="flex items-center gap-2 text-sm text-base-content/70">
                          <Phone class="w-3 h-3" />
                          {user.phoneNumber}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="badge {getStatusBadge(user.status)}">{user.status}</div>
                  </td>
                  <td>
                    <div class="badge {getSubscriptionBadge(user.subscription)}">{user.subscription}</div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2 text-sm">
                      <Calendar class="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div class="text-sm">
                      {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-outline" on:click={() => editUser(user)}>
                        <Edit class="w-3 h-3" />
                      </button>
                      {#if user.status !== 'banned'}
                        <button class="btn btn-xs btn-warning" on:click={() => banUser(user.id)}>
                          <Ban class="w-3 h-3" />
                        </button>
                      {/if}
                      <button class="btn btn-xs btn-error" on:click={() => deleteUser(user.id)}>
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex justify-center p-4">
            <div class="btn-group">
              <button 
                class="btn" 
                class:btn-disabled={currentPage === 1}
                on:click={() => { currentPage = Math.max(1, currentPage - 1); loadUsers(); }}
              >
                «
              </button>
              {#each Array(Math.min(5, totalPages)) as _, i}
                {@const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i))}
                <button 
                  class="btn" 
                  class:btn-active={page === currentPage}
                  on:click={() => { currentPage = page; loadUsers(); }}
                >
                  {page}
                </button>
              {/each}
              <button 
                class="btn" 
                class:btn-disabled={currentPage === totalPages}
                on:click={() => { currentPage = Math.min(totalPages, currentPage + 1); loadUsers(); }}
              >
                »
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- User modal -->
{#if showUserModal}
  <UserModal 
    user={selectedUser}
    on:close={() => { showUserModal = false; selectedUser = null; }}
    on:save={() => { showUserModal = false; selectedUser = null; loadUsers(); }}
  />
{/if}