import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Share, Plus, MoreVertical, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-border">
            <img src="/navicon.png" alt="Click English" className="w-full h-full object-cover" />
          </div>
          <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">App Instalado!</h1>
          <p className="text-muted-foreground">O Click English já está na sua tela inicial.</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Abrir App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-sm w-full">
          {/* App Icon */}
          <div className="w-28 h-28 mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-border">
            <img src="/navicon.png" alt="Click English" className="w-full h-full object-cover" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Instalar Click English</h1>
            <p className="text-muted-foreground text-sm">Acesso rápido direto da sua tela inicial</p>
          </div>

          {/* Android Section */}
          {isAndroid && (
            <div className="space-y-4">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-4 px-6 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <PlayStoreIcon />
                  <span className="font-semibold">Instalar via Google Play</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-5 space-y-4 text-left border border-border">
                    <p className="text-sm text-center text-muted-foreground mb-2">No Chrome, siga os passos:</p>
                    <Step number={1} icon={<MoreVertical className="w-5 h-5" />}>
                      Toque no menu <strong className="text-foreground">⋮</strong> do navegador
                    </Step>
                    <Step number={2} icon={<Plus className="w-5 h-5" />}>
                      Selecione <strong className="text-foreground">"Adicionar à tela inicial"</strong>
                    </Step>
                    <Step number={3} icon={<Check className="w-5 h-5" />}>
                      Confirme tocando em <strong className="text-foreground">"Adicionar"</strong>
                    </Step>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* iOS Section */}
          {isIOS && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-5 space-y-4 text-left border border-border">
                <p className="text-sm text-center text-muted-foreground mb-2">No Safari, siga os passos:</p>
                <Step number={1} icon={<Share className="w-5 h-5" />}>
                  Toque no botão <strong className="text-foreground">Compartilhar</strong>
                </Step>
                <Step number={2} icon={<Plus className="w-5 h-5" />}>
                  Selecione <strong className="text-foreground">"Adicionar à Tela de Início"</strong>
                </Step>
                <Step number={3} icon={<Check className="w-5 h-5" />}>
                  Toque em <strong className="text-foreground">"Adicionar"</strong>
                </Step>
              </div>
            </div>
          )}

          {/* Desktop fallback */}
          {!isIOS && !isAndroid && (
            <div className="space-y-4">
              {deferredPrompt ? (
                <Button onClick={handleInstallClick} size="lg" className="w-full">
                  Instalar Aplicativo
                </Button>
              ) : (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Acesse pelo celular para instalar o app, ou use o menu do navegador para adicionar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
  </svg>
);

const Step = ({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="flex-1 pt-2">
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  </div>
);

export default Install;
