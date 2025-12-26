/**
 * PWA utilities for KROG Chess
 */

// Store the deferred install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Callbacks for PWA events
type PWACallback = () => void;
const installCallbacks: PWACallback[] = [];
const updateCallbacks: PWACallback[] = [];
const offlineCallbacks: PWACallback[] = [];
const onlineCallbacks: PWACallback[] = [];

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[PWA] New version available! Reload to update.');
            updateCallbacks.forEach(cb => cb());
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  } else {
    console.log('[PWA] Service Workers not supported');
  }
  return undefined;
}

/**
 * Setup install prompt listener
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt available');
    installCallbacks.forEach(cb => cb());
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

/**
 * Check if install prompt is available
 */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/**
 * Check if app is installed (standalone mode)
 */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Prompt user to install the app
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
}

/**
 * Setup online/offline status listeners
 */
export function setupOnlineStatus(): void {
  window.addEventListener('online', () => {
    console.log('[PWA] Back online');
    onlineCallbacks.forEach(cb => cb());
    syncPendingData();
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Offline');
    offlineCallbacks.forEach(cb => cb());
  });
}

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync pending data when back online
 */
async function syncPendingData(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-moves');
      console.log('[PWA] Background sync registered');
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
    }
  }
}

/**
 * Force update service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();

    // Tell the waiting service worker to activate
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Reload the page
    window.location.reload();
  }
}

/**
 * Register callback for when install becomes available
 */
export function onInstallAvailable(callback: PWACallback): () => void {
  installCallbacks.push(callback);
  // If already available, call immediately
  if (deferredPrompt) {
    callback();
  }
  return () => {
    const index = installCallbacks.indexOf(callback);
    if (index > -1) installCallbacks.splice(index, 1);
  };
}

/**
 * Register callback for when update is available
 */
export function onUpdateAvailable(callback: PWACallback): () => void {
  updateCallbacks.push(callback);
  return () => {
    const index = updateCallbacks.indexOf(callback);
    if (index > -1) updateCallbacks.splice(index, 1);
  };
}

/**
 * Register callback for offline event
 */
export function onOffline(callback: PWACallback): () => void {
  offlineCallbacks.push(callback);
  return () => {
    const index = offlineCallbacks.indexOf(callback);
    if (index > -1) offlineCallbacks.splice(index, 1);
  };
}

/**
 * Register callback for online event
 */
export function onOnline(callback: PWACallback): () => void {
  onlineCallbacks.push(callback);
  return () => {
    const index = onlineCallbacks.indexOf(callback);
    if (index > -1) onlineCallbacks.splice(index, 1);
  };
}

/**
 * Cache daily puzzle for offline use
 */
export async function cacheDailyPuzzle(puzzleData: unknown): Promise<void> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('krog-puzzles');
      const response = new Response(JSON.stringify(puzzleData), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put('/api/daily-puzzle', response);
      console.log('[PWA] Daily puzzle cached');
    } catch (error) {
      console.error('[PWA] Failed to cache puzzle:', error);
    }
  }
}

/**
 * Get cached daily puzzle
 */
export async function getCachedPuzzle(): Promise<unknown | null> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('krog-puzzles');
      const response = await cache.match('/api/daily-puzzle');
      if (response) {
        return await response.json();
      }
    } catch (error) {
      console.error('[PWA] Failed to get cached puzzle:', error);
    }
  }
  return null;
}

/**
 * Clear all caches (for debugging/reset)
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  }
}
