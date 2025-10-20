<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { adminStore } from '$lib/stores/admin';
  import { X, Save, User, Mail, Phone, Calendar, Shield } from 'lucide-svelte';

  export let user: any = null;

  const dispatch = createEventDispatcher();

  let formData = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    bio: user?.bio || '',
    location: user?.location || '',
    role: user?.role || 'user',
    status: user?.status || 'active',
    subscription: user?.subscription || 'basic'
  };

  let loading = false;
  let error = '';

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      if (user) {
        await adminStore.updateUser(user.id, formData);
      } else {
        await adminStore.createUser(formData);
      }
      dispatch('save');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save user';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="modal modal-open">
  <div class="modal-box w-11/12 max-w-2xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="font-bold text-lg">
        {user ? 'Edit User' : 'Create New User'}
      </h3>
      <button class="btn btn-sm btn-circle btn-ghost" on:click={handleClose}>
        <X class="w-4 h-4" />
      </button>
    </div>

    {#if error}
      <div class="alert alert-error mb-4">
        <span>{error}</span>
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- Basic Information -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h4 class="card-title text-base">
            <User class="w-4 h-4" />
            Basic Information
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">First Name *</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered" 
                bind:value={formData.firstName}
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Last Name *</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered" 
                bind:value={formData.lastName}
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Email *</span>
              </label>
              <input 
                type="email" 
                class="input input-bordered" 
                bind:value={formData.email}
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Phone Number</span>
              </label>
              <input 
                type="tel" 
                class="input input-bordered" 
                bind:value={formData.phoneNumber}
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Date of Birth</span>
              </label>
              <input 
                type="date" 
                class="input input-bordered" 
                bind:value={formData.dateOfBirth}
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Location</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered" 
                bind:value={formData.location}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Bio</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-20" 
              bind:value={formData.bio}
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h4 class="card-title text-base">
            <Shield class="w-4 h-4" />
            Account Settings
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Role</span>
              </label>
              <select class="select select-bordered" bind:value={formData.role}>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Status</span>
              </label>
              <select class="select select-bordered" bind:value={formData.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Subscription</span>
              </label>
              <select class="select select-bordered" bind:value={formData.subscription}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="family">Family</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" on:click={handleClose}>
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <Save class="w-4 h-4 mr-2" />
          {/if}
          {user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  </div>
</div>