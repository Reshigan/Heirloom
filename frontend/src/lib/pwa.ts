
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

export function checkPWAInstallability() {
  if (typeof window === 'undefined') return null;
  
  let deferredPrompt: any = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ PWA installable');
  });
  
  return {
    prompt: async () => {
      if (!deferredPrompt) {
        console.log('❌ PWA install prompt not available');
        return false;
      }
      
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      deferredPrompt = null;
      
      return outcome === 'accepted';
    }
  };
}
