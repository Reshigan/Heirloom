<script>
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import LoominaryIcon from '$lib/components/icons/LoominaryIcon.svelte';

  let step = 1;
  let formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false,
    subscribeNewsletter: true
  };
  
  let loading = false;
  let error = '';
  let passwordStrength = 0;
  let showWelcomeRewards = false;

  // Engagement features
  let completionProgress = 0;
  let referralBenefit = null;

  onMount(() => {
    // Check if already authenticated
    if ($authStore.isAuthenticated) {
      goto('/vault');
    }

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      formData.referralCode = referralCode;
      checkReferralCode(referralCode);
    }

    updateProgress();
  });

  function updateProgress() {
    const fields = ['firstName', 'lastName', 'email', 'password'];
    const completed = fields.filter(field => formData[field].trim() !== '').length;
    completionProgress = (completed / fields.length) * 100;
  }

  function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    passwordStrength = strength;
  }

  async function checkReferralCode(code) {
    try {
      const response = await fetch(`/api/referrals/validate/${code}`);
      if (response.ok) {
        const data = await response.json();
        referralBenefit = data;
      }
    } catch (err) {
      console.log('Referral code validation failed');
    }
  }

  async function handleRegister() {
    if (step < 3) {
      nextStep();
      return;
    }

    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'web_registration'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show welcome rewards
        showWelcomeRewards = true;
        
        // Auto-login after successful registration
        setTimeout(() => {
          authStore.login(data.user, data.token);
          goto('/onboarding/welcome');
        }, 3000);
      } else {
        error = data.message || 'Registration failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function validateForm() {
    if (!formData.firstName.trim()) {
      error = 'First name is required';
      return false;
    }
    if (!formData.lastName.trim()) {
      error = 'Last name is required';
      return false;
    }
    if (!formData.email.trim()) {
      error = 'Email is required';
      return false;
    }
    if (formData.password.length < 8) {
      error = 'Password must be at least 8 characters';
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      error = 'Passwords do not match';
      return false;
    }
    if (!formData.agreeToTerms) {
      error = 'Please agree to the terms and conditions';
      return false;
    }
    return true;
  }

  function nextStep() {
    if (step === 1 && (!formData.firstName || !formData.lastName)) {
      error = 'Please enter your name';
      return;
    }
    if (step === 2 && (!formData.email || passwordStrength < 50)) {
      error = 'Please complete all fields with a strong password';
      return;
    }
    
    error = '';
    step++;
    updateProgress();
  }

  function prevStep() {
    if (step > 1) {
      step--;
      error = '';
    }
  }

  $: {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    }
    updateProgress();
  }
</script>

<svelte:head>
  <title>Create Your Legacy Vault - Loominary</title>
  <meta name="description" content="Create your private family vault and start preserving your legacy for future generations." />
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
    max-width: 500px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(212, 175, 55, 0.1);
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 2px;
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #B8941F, #D4AF37);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .step-indicator {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .step-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.3);
    transition: all 0.3s ease;
  }

  .step-dot.active {
    background: #D4AF37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  }

  .step-dot.completed {
    background: #D4AF37;
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

  .form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
    flex: 1;
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

  .password-strength {
    margin-top: 0.5rem;
    height: 4px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }

  .password-strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
  }

  .strength-weak { background: #DC2626; width: 25%; }
  .strength-fair { background: #F59E0B; width: 50%; }
  .strength-good { background: #10B981; width: 75%; }
  .strength-strong { background: #059669; width: 100%; }

  .checkbox-group {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .checkbox {
    margin-top: 0.25rem;
  }

  .checkbox-label {
    font-size: 0.875rem;
    color: #F4E5C2;
    line-height: 1.5;
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

  .button-row {
    display: flex;
    gap: 1rem;
  }

  .button-secondary {
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .button-secondary:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
  }

  .referral-bonus {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
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

  .welcome-rewards {
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

  .rewards-card {
    background: rgba(26, 26, 26, 0.95);
    border: 2px solid #D4AF37;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    max-width: 400px;
    animation: popIn 0.5s ease;
  }

  @keyframes popIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>

<div class="auth-bg"></div>

<div class="auth-container">
  <div class="auth-card">
    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" style="width: {completionProgress}%"></div>
    </div>

    <!-- Step Indicator -->
    <div class="step-indicator">
      {#each [1, 2, 3] as stepNum}
        <div class="step-dot" class:active={step === stepNum} class:completed={step > stepNum}></div>
      {/each}
    </div>

    <div class="auth-header">
      <div class="auth-logo">
        <LoominaryIcon name="vault" size={24} />
        LOOMINARY
      </div>
      <div class="auth-subtitle">
        {step === 1 ? 'Create Your Legacy' : step === 2 ? 'Secure Your Vault' : 'Almost Ready!'}
      </div>
    </div>

    {#if referralBenefit}
      <div class="referral-bonus">
        🎁 <strong>Referral Bonus!</strong><br>
        You'll receive {referralBenefit.bonus} free months when you complete registration
      </div>
    {/if}

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleRegister}>
      {#if step === 1}
        <!-- Step 1: Personal Information -->
        <div class="form-row">
          <div class="form-group">
            <label for="firstName" class="form-label">First Name</label>
            <input
              id="firstName"
              type="text"
              class="form-input"
              placeholder="Your first name"
              bind:value={formData.firstName}
              disabled={loading}
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName" class="form-label">Last Name</label>
            <input
              id="lastName"
              type="text"
              class="form-input"
              placeholder="Your last name"
              bind:value={formData.lastName}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="referralCode" class="form-label">Referral Code (Optional)</label>
          <input
            id="referralCode"
            type="text"
            class="form-input"
            placeholder="Enter referral code for bonus months"
            bind:value={formData.referralCode}
            on:blur={() => formData.referralCode && checkReferralCode(formData.referralCode)}
            disabled={loading}
          />
        </div>

      {:else if step === 2}
        <!-- Step 2: Account Security -->
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            bind:value={formData.email}
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
            placeholder="Create a strong password"
            bind:value={formData.password}
            disabled={loading}
            required
          />
          <div class="password-strength">
            <div class="password-strength-fill" 
                 class:strength-weak={passwordStrength === 25}
                 class:strength-fair={passwordStrength === 50}
                 class:strength-good={passwordStrength === 75}
                 class:strength-strong={passwordStrength === 100}></div>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            class="form-input"
            placeholder="Confirm your password"
            bind:value={formData.confirmPassword}
            disabled={loading}
            required
          />
        </div>

      {:else if step === 3}
        <!-- Step 3: Final Details -->
        <div class="checkbox-group">
          <input
            id="agreeToTerms"
            type="checkbox"
            class="checkbox"
            bind:checked={formData.agreeToTerms}
            disabled={loading}
            required
          />
          <label for="agreeToTerms" class="checkbox-label">
            I agree to the <a href="/terms" target="_blank" style="color: #D4AF37;">Terms of Service</a> 
            and <a href="/privacy" target="_blank" style="color: #D4AF37;">Privacy Policy</a>
          </label>
        </div>

        <div class="checkbox-group">
          <input
            id="subscribeNewsletter"
            type="checkbox"
            class="checkbox"
            bind:checked={formData.subscribeNewsletter}
            disabled={loading}
          />
          <label for="subscribeNewsletter" class="checkbox-label">
            Send me legacy preservation tips and platform updates
          </label>
        </div>
      {/if}

      <div class="button-row">
        {#if step > 1}
          <button type="button" class="auth-button button-secondary" on:click={prevStep} disabled={loading}>
            <LoominaryIcon name="close" size={16} />
            Back
          </button>
        {/if}
        
        <button type="submit" class="auth-button" disabled={loading}>
          {#if loading}
            <span class="loading-spinner"></span>
            Creating Vault...
          {:else if step < 3}
            Continue
            <LoominaryIcon name="vault" size={16} />
          {:else}
            Create My Vault
            <LoominaryIcon name="vault" size={16} />
          {/if}
        </button>
      </div>
    </form>

    {#if step === 1}
      <div style="text-align: center; margin-top: 2rem;">
        <p>Already have a vault? <a href="/auth/login" style="color: #D4AF37;">Sign In</a></p>
      </div>
    {/if}
  </div>
</div>

<!-- Welcome Rewards Modal -->
{#if showWelcomeRewards}
  <div class="welcome-rewards">
    <div class="rewards-card">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🏛️</div>
      <h2 style="color: #D4AF37; margin-bottom: 1rem;">Your Vault is Ready!</h2>
      <p style="color: #F4E5C2; margin-bottom: 2rem;">
        Welcome to Loominary! Your private family vault has been created. 
        Start preserving your legacy for future generations.
      </p>
      <div style="font-size: 0.875rem; color: rgba(244, 229, 194, 0.7);">
        Taking you to vault setup...
      </div>
    </div>
  </div>
{/if}