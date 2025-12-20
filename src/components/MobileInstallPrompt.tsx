import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally so it persists across component remounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

const MobileInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const now = new Date();
      // Show again after 3 days
      if (now.getTime() - dismissedAt.getTime() < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Check if mobile
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Listen for beforeinstallprompt - this is the key event for PWA installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      // Show popup immediately when we get the install prompt
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If we already have a deferred prompt, show the popup
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setTimeout(() => setShow(true), 2000);
    } else {
      // Show prompt after delay even without beforeinstallprompt (for iOS or manual instructions)
      const timer = setTimeout(() => {
        setShow(true);
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('install-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShow(false);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error('Install prompt error:', error);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback: open install page with instructions
      window.location.href = '/install';
    }
  };

  // Check if already installed
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };
    checkInstalled();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  if (!show || isInstalled) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500 md:hidden">
      <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-foreground">Instalar Aula Click</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {deferredPrompt 
                ? 'Tenha acesso rápido como um app real!' 
                : 'Adicione à tela inicial para acesso rápido'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-11"
            onClick={handleDismiss}
          >
            Depois
          </Button>
          <Button
            size="sm"
            className="flex-1 h-11 gap-2 font-semibold"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <span className="animate-pulse">Instalando...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {deferredPrompt ? 'Instalar App' : 'Ver como instalar'}
              </>
            )}
          </Button>
        </div>
        {deferredPrompt && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            Clique em "Instalar App" e confirme no popup do Chrome
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileInstallPrompt;
