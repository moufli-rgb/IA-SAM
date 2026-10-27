import { useEffect, useState } from 'react';

/**
 * Installation de SAM sur l'écran d'accueil (PWA).
 * Android / Chrome : on garde l'événement `beforeinstallprompt` pour afficher la vraie fenêtre d'installation.
 * iPhone / iPad : pas de fenêtre automatique, on affiche les étapes (Partager → Sur l'écran d'accueil).
 */
let deferred: any = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    installed: isStandalone(),
    canPrompt: !!deferred,
    ios: isIOS(),
    /** Ouvre la fenêtre d'installation si possible, sinon les instructions. */
    install: async () => {
      if (deferred) {
        deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        deferred = null;
        notify();
        return choice?.outcome === 'accepted';
      }
      window.dispatchEvent(new CustomEvent('sam:install-help'));
      return false;
    },
  };
}
