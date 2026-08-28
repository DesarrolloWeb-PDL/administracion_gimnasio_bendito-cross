'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setPlatform('android');
    } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setPlatform('ios');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstall(false);
    });

    // Show install banner after 3 seconds if not dismissed
    const timer = setTimeout(() => {
      if (sessionStorage.getItem('pwa-install-dismissed') !== 'true') {
        setShowInstall(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome Android: native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS or unsupported: show instructions
      setPlatform((p) => p); // keep current
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Install Button - fixed in corner */}
      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Instalar Bendito Cross</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {platform === 'ios'
                    ? 'Tocá el botón de compartir y después "Agregar a pantalla de inicio"'
                    : 'Accedé rápido desde tu pantalla de inicio'}
                </p>
                <div className="flex gap-2 mt-3">
                  {platform === 'android' && deferredPrompt ? (
                    <button
                      onClick={handleInstall}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      Instalar
                    </button>
                  ) : platform === 'ios' ? (
                    <button
                      onClick={() => setPlatform('ios')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      Cómo instalar
                    </button>
                  ) : (
                    <button
                      onClick={handleInstall}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      Instalar
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs font-medium rounded-md transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
              <button onClick={handleDismiss} className="shrink-0 text-zinc-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {platform === 'ios' && showInstall && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismiss();
          }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4">Instalar en iPhone</h3>
            <div className="space-y-4 text-sm text-zinc-300">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                <p>Tocá el botón <strong className="text-white">Compartir</strong> (cuadro con flecha hacia arriba) en la barra de abajo</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                <p>Desplazá hacia abajo y tocá <strong className="text-white">"Agregar a pantalla de inicio"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                <p>Tocá <strong className="text-white">"Agregar"</strong> en la esquina superior derecha</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full mt-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
