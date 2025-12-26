/**
 * PWA Install Prompt Component
 */
import { useState, useEffect } from 'react';
import {
  promptInstall,
  isInstalled,
  onInstallAvailable,
  canInstall,
} from '../utils/pwa';

interface InstallPromptProps {
  language?: 'en' | 'no';
  delayMs?: number;
}

export function InstallPrompt({ language = 'en', delayMs = 10000 }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isInstalled()) {
      setIsAppInstalled(true);
      return;
    }

    // Listen for install availability
    const unsubscribe = onInstallAvailable(() => {
      // Show prompt after delay
      const timer = setTimeout(() => {
        if (canInstall()) {
          setShowPrompt(true);
        }
      }, delayMs);

      return () => clearTimeout(timer);
    });

    // Check if already available
    if (canInstall()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delayMs);

      return () => {
        clearTimeout(timer);
        unsubscribe();
      };
    }

    return unsubscribe;
  }, [delayMs]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsAppInstalled(true);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isAppInstalled || !showPrompt) return null;

  // Check if dismissed this session
  if (sessionStorage.getItem('install-prompt-dismissed')) return null;

  const text = {
    en: {
      title: 'Install KROG Chess',
      description: 'Add to your home screen for quick access and offline play!',
      install: 'Install',
      later: 'Maybe Later',
    },
    no: {
      title: 'Installer KROG Chess',
      description: 'Legg til pa hjemmeskjermen for rask tilgang og offline-spill!',
      install: 'Installer',
      later: 'Kanskje senere',
    },
  };

  const t = text[language];

  return (
    <div className="install-prompt">
      <div className="install-content">
        <div className="install-icon">
          <img src="/logo.png" alt="KROG Chess" style={{ width: 48, height: 48, borderRadius: 12 }} />
        </div>
        <div className="install-text">
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <div className="install-actions">
          <button className="btn-primary" onClick={handleInstall}>
            {t.install}
          </button>
          <button className="btn-secondary" onClick={handleDismiss}>
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline Indicator Component
 */
export function OfflineIndicator({ language = 'en' }: { language?: 'en' | 'no' }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  const text = language === 'en' ? 'You are offline' : 'Du er frakoblet';

  return (
    <div className="offline-indicator">
      <span>📴</span> {text}
    </div>
  );
}

/**
 * Update Available Banner Component
 */
interface UpdateBannerProps {
  language?: 'en' | 'no';
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ language = 'en', onUpdate, onDismiss }: UpdateBannerProps) {
  const text = {
    en: {
      message: 'New version available!',
      update: 'Update',
      later: 'Later',
    },
    no: {
      message: 'Ny versjon tilgjengelig!',
      update: 'Oppdater',
      later: 'Senere',
    },
  };

  const t = text[language];

  return (
    <div className="update-banner">
      <p>{t.message}</p>
      <button onClick={onUpdate}>{t.update}</button>
      <button onClick={onDismiss}>{t.later}</button>
    </div>
  );
}

export default InstallPrompt;
