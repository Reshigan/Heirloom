<script>
  export let name = '';
  export let size = 24;
  export let color = '#D4AF37';
  export let strokeWidth = 1.5;
  export let className = '';
</script>

<style>
  .icon {
    display: inline-block;
    vertical-align: middle;
    transition: all 0.3s ease;
  }
  
  .icon:hover {
    filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
  }
</style>

<svg 
  class="icon {className}" 
  width={size} 
  height={size} 
  viewBox="0 0 24 24" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
>
  {#if name === 'vault'}
    <!-- Private Vault Icon -->
    <defs>
      <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect x="3" y="11" width="18" height="10" rx="2" stroke="url(#vaultGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="16" r="2" stroke="url(#vaultGradient)" stroke-width={strokeWidth} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="url(#vaultGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <path d="M12 18v1" stroke="url(#vaultGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="12" cy="16" r="0.5" fill="url(#vaultGradient)" />
    
  {:else if name === 'inheritance-token'}
    <!-- Inheritance Token Icon -->
    <defs>
      <linearGradient id="tokenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect x="4" y="8" width="16" height="10" rx="3" stroke="url(#tokenGradient)" stroke-width={strokeWidth} />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="url(#tokenGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="13" r="1.5" fill="url(#tokenGradient)" opacity="0.3" />
    <path d="M10 13h4M12 11v4" stroke="url(#tokenGradient)" stroke-width="1" stroke-linecap="round" />
    <path d="M6 20l2-2M18 20l-2-2" stroke="url(#tokenGradient)" stroke-width="1" stroke-linecap="round" />
    
  {:else if name === 'sealed-vault'}
    <!-- Sealed Vault Icon -->
    <defs>
      <linearGradient id="sealedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect x="3" y="11" width="18" height="10" rx="2" stroke="url(#sealedGradient)" stroke-width={strokeWidth} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="url(#sealedGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="12" cy="16" r="2" stroke="url(#sealedGradient)" stroke-width={strokeWidth} />
    <path d="M10.5 16L11.5 17L13.5 15" stroke="url(#sealedGradient)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M2 12h2M20 12h2M2 16h2M20 16h2" stroke="url(#sealedGradient)" stroke-width="0.5" opacity="0.5" />
    
  {:else if name === 'private-memory'}
    <!-- Private Memory Icon -->
    <defs>
      <linearGradient id="privateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" stroke="url(#privateGradient)" stroke-width={strokeWidth} />
    <path d="M8 8h8M8 12h6M8 16h4" stroke="url(#privateGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="18" cy="6" r="2" stroke="url(#privateGradient)" stroke-width="1" />
    <path d="M17 6h2" stroke="url(#privateGradient)" stroke-width="0.5" stroke-linecap="round" />
    
  {:else if name === 'legacy-plan'}
    <!-- Legacy Plan Icon -->
    <defs>
      <linearGradient id="legacyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#legacyGradient)" stroke-width={strokeWidth} />
    <path d="M14 2v6h6" stroke="url(#legacyGradient)" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
    <path d="M8 13h2M8 17h6M8 10h1" stroke="url(#legacyGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="16" cy="13" r="1" fill="url(#legacyGradient)" />
    <circle cx="16" cy="17" r="1" fill="url(#legacyGradient)" />
    
  {:else if name === 'time-capsule'}
    <!-- Time Capsule Icon -->
    <defs>
      <linearGradient id="capsuleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect x="6" y="8" width="12" height="10" rx="2" stroke="url(#capsuleGradient)" stroke-width={strokeWidth} />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="url(#capsuleGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="13" r="2" stroke="url(#capsuleGradient)" stroke-width={strokeWidth} />
    <path d="M12 11v4M10 13h4" stroke="url(#capsuleGradient)" stroke-width="1" stroke-linecap="round" />
    <path d="M12 20v2" stroke="url(#capsuleGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="9" cy="21" r="0.5" fill="url(#capsuleGradient)" opacity="0.5" />
    <circle cx="15" cy="21" r="0.5" fill="url(#capsuleGradient)" opacity="0.5" />
    
  {:else if name === 'wisdom'}
    <!-- Wisdom Icon -->
    <defs>
      <linearGradient id="wisdomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" stroke="url(#wisdomGradient)" stroke-width={strokeWidth} />
    <path d="M9 9h6M9 13h6" stroke="url(#wisdomGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="12" cy="17" r="1" fill="url(#wisdomGradient)" />
    <path d="M8 6l8 0M8 18l8 0" stroke="url(#wisdomGradient)" stroke-width="0.5" opacity="0.3" />
    
  {:else if name === 'family-tree'}
    <!-- Family Tree Icon -->
    <defs>
      <linearGradient id="treeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="6" r="3" stroke="url(#treeGradient)" stroke-width={strokeWidth} />
    <circle cx="7" cy="15" r="2.5" stroke="url(#treeGradient)" stroke-width={strokeWidth} />
    <circle cx="17" cy="15" r="2.5" stroke="url(#treeGradient)" stroke-width={strokeWidth} />
    <path d="M12 9v3M9.5 12L7 12.5M14.5 12L17 12.5" stroke="url(#treeGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <path d="M12 18v3" stroke="url(#treeGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="12" cy="21" r="1" fill="url(#treeGradient)" opacity="0.5" />
    
  {:else if name === 'voice-message'}
    <!-- Voice Message Icon -->
    <defs>
      <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="url(#voiceGradient)" stroke-width={strokeWidth} />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="url(#voiceGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <path d="M12 18v4M8 22h8" stroke="url(#voiceGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="12" cy="8" r="1" fill="url(#voiceGradient)" opacity="0.5" />
    <path d="M16 6c1 0 2 1 2 2M18 4c2 0 4 2 4 4" stroke="url(#voiceGradient)" stroke-width="1" stroke-linecap="round" opacity="0.5" />
    
  {:else if name === 'privacy-levels'}
    <!-- Privacy Levels Icon -->
    <defs>
      <linearGradient id="privacyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="3" stroke="url(#privacyGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="12" r="6" stroke="url(#privacyGradient)" stroke-width="1" opacity="0.5" />
    <circle cx="12" cy="12" r="9" stroke="url(#privacyGradient)" stroke-width="0.5" opacity="0.3" />
    <path d="M12 9v6M9 12h6" stroke="url(#privacyGradient)" stroke-width="1" stroke-linecap="round" />
    <circle cx="12" cy="12" r="1" fill="url(#privacyGradient)" />
    
  {:else if name === 'constellation'}
    <!-- Constellation/Connection Icon -->
    <defs>
      <linearGradient id="constellationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="5" cy="6" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="4" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <circle cx="19" cy="6" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <circle cx="7" cy="14" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <circle cx="17" cy="14" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <circle cx="12" cy="20" r="2" stroke="url(#constellationGradient)" stroke-width={strokeWidth} />
    <path d="M7 6l5-2M12 6l7 0M7 8l0 4M17 8l0 4M9 16l6 0M9 16l3 2M15 16l-3 2" stroke="url(#constellationGradient)" stroke-width="1" opacity="0.5" />
    
  {:else if name === 'achievement'}
    <!-- Achievement Icon -->
    <defs>
      <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="url(#achievementGradient)" stroke-width={strokeWidth} fill="url(#achievementGradient)" fill-opacity="0.1" />
    <path d="M8 12l2 2 4-4" stroke="url(#achievementGradient)" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
    
  {:else if name === 'streak'}
    <!-- Streak Icon -->
    <defs>
      <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="url(#streakGradient)" stroke-width={strokeWidth} fill="url(#streakGradient)" fill-opacity="0.1" />
    <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="url(#streakGradient)" opacity="0.5" />
    
  {:else if name === 'ai-story'}
    <!-- AI Story Generation Icon -->
    <defs>
      <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="url(#aiGradient)" stroke-width={strokeWidth} />
    <path d="M7 9h4M7 13h6M7 17h3" stroke="url(#aiGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <circle cx="17" cy="11" r="2" stroke="url(#aiGradient)" stroke-width={strokeWidth} />
    <path d="M15.5 9.5L18.5 12.5M18.5 9.5L15.5 12.5" stroke="url(#aiGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    <path d="M19 15l2 2M19 17l2-2" stroke="url(#aiGradient)" stroke-width="0.5" stroke-linecap="round" opacity="0.5" />
    
  {:else if name === 'photo'}
    <!-- Photo Icon -->
    <defs>
      <linearGradient id="photoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="url(#photoGradient)" stroke-width={strokeWidth} />
    <circle cx="8.5" cy="10.5" r="2.5" stroke="url(#photoGradient)" stroke-width={strokeWidth} />
    <path d="M21 15l-5-5L5 21" stroke="url(#photoGradient)" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="17" cy="8" r="1" fill="url(#photoGradient)" />
    
  {:else if name === 'settings'}
    <!-- Settings Icon -->
    <defs>
      <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="3" stroke="url(#settingsGradient)" stroke-width={strokeWidth} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="url(#settingsGradient)" stroke-width={strokeWidth} />
    
  {:else if name === 'close'}
    <!-- Close Icon -->
    <defs>
      <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M18 6L6 18M6 6l12 12" stroke="url(#closeGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    
  {:else if name === 'menu'}
    <!-- Menu Icon -->
    <defs>
      <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F4E5C2;stop-opacity:1" />
        <stop offset="50%" style="stop-color:{color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B8941F;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M3 12h18M3 6h18M3 18h18" stroke="url(#menuGradient)" stroke-width={strokeWidth} stroke-linecap="round" />
    
  {:else}
    <!-- Default/Fallback Icon -->
    <circle cx="12" cy="12" r="10" stroke={color} stroke-width={strokeWidth} />
    <path d="M12 8v8M8 12h8" stroke={color} stroke-width={strokeWidth} stroke-linecap="round" />
  {/if}
</svg>