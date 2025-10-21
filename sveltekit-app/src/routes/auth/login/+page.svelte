<script>
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import LoominaryIcon from '$lib/components/icons/LoominaryIcon.svelte';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  onMount(() => {
    // Check if already authenticated
    if ($authStore.isAuthenticated) {
      goto('/vault');
    }
  });

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        authStore.login(data.user, data.token);
        goto('/vault');
      } else {
        error = data.message || 'Login failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>Sign In - Loominary</title>
  <meta name="description" content="Sign in to your Loominary vault to access your private family legacy." />
</svelte:head>

<style>
  :global(body) {
    background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
    min-height: 100vh;
  }

  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
  }

  .auth-bg {
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

  .auth-card {
    background: rgba(26, 26, 26, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 16px;
    padding: 3rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(212, 175, 55, 0.1);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-logo {
    font-family: 'Bodoni Moda', serif;
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.3em;
    color: #D4AF37;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .auth-subtitle {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #F4E5C2;
    opacity: 0.7;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: #F4E5C2;
    margin-bottom: 0.5rem;
  }

  .form-input {
    width: 100%;
    padding: 1rem;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    color: #FFF8E7;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .form-input::placeholder {
    color: rgba(244, 229, 194, 0.5);
  }

  .auth-button {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #B8941F, #D4AF37);
    border: none;
    border-radius: 8px;
    color: #0A0A0A;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .auth-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
  }

  .auth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 8px;
    padding: 1rem;
    color: #FCA5A5;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .auth-links {
    text-align: center;
    margin-top: 2rem;
  }

  .auth-link {
    color: #D4AF37;
    text-decoration: none;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
  }

  .auth-link:hover {
    color: #F4E5C2;
  }

  .divider {
    margin: 1.5rem 0;
    text-align: center;
    position: relative;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
  }

  .divider span {
    background: rgba(26, 26, 26, 0.9);
    padding: 0 1rem;
    color: rgba(244, 229, 194, 0.7);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(10, 10, 10, 0.3);
    border-radius: 50%;
    border-top-color: #0A0A0A;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

<div class="auth-bg"></div>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <div class="auth-logo">
        <LoominaryIcon name="vault" size={24} />
        LOOMINARY
      </div>
      <div class="auth-subtitle">Access Your Private Vault</div>
    </div>

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email" class="form-label">Email Address</label>
        <input
          id="email"
          type="email"
          class="form-input"
          placeholder="Enter your email"
          bind:value={email}
          on:keypress={handleKeyPress}
          disabled={loading}
          required
        />
      </div>

      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          type="password"
          class="form-input"
          placeholder="Enter your password"
          bind:value={password}
          on:keypress={handleKeyPress}
          disabled={loading}
          required
        />
      </div>

      <button type="submit" class="auth-button" disabled={loading}>
        {#if loading}
          <span class="loading-spinner"></span>
          Accessing Vault...
        {:else}
          <LoominaryIcon name="vault" size={16} />
          Enter Vault
        {/if}
      </button>
    </form>

    <div class="divider">
      <span>or</span>
    </div>

    <div class="auth-links">
      <p>Don't have a vault? <a href="/auth/register" class="auth-link">Create Your Legacy</a></p>
      <p style="margin-top: 0.5rem;">
        <a href="/auth/forgot-password" class="auth-link">Forgot Password?</a>
      </p>
    </div>
  </div>
</div>