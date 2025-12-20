import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MobileInstallPrompt = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const now = new Date();
      // Show again after 7 days
      if (now.getTime() - dismissedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Check if mobile
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
    } else {
      navigate('/install');
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:hidden">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <img src="/navicon.png" alt="Aula Click" className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Instale o Aula Click</p>
            <p className="text-xs text-muted-foreground">Acesso rápido na tela inicial</p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleDismiss}
          >
            Agora não
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleInstall}
          >
            <Download className="w-4 h-4 mr-1" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileInstallPrompt;
