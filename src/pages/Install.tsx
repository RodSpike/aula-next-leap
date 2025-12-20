import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, Share, MoreVertical, PlusSquare } from 'lucide-react';
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
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O Aula Click já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <img src="/navicon.png" alt="Aula Click" className="w-14 h-14" />
          </div>
          <CardTitle className="text-2xl">Instalar Aula Click</CardTitle>
          <CardDescription>
            Instale o app para acesso rápido e experiência completa offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <span>Acesso offline às suas aulas</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <span>Ícone na tela inicial</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <span>Experiência em tela cheia</span>
            </div>
          </div>

          {/* Android Installation */}
          {isAndroid && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#3DDC84]/10 rounded-lg border border-[#3DDC84]/20">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#3DDC84">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
                </svg>
                <div>
                  <p className="font-medium text-[#3DDC84]">Android</p>
                  <p className="text-xs text-muted-foreground">Instalação automática</p>
                </div>
              </div>
              
              {deferredPrompt ? (
                <Button onClick={handleInstallClick} className="w-full bg-[#3DDC84] hover:bg-[#32C770] text-black" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Como instalar:</p>
                  <ol className="text-sm text-muted-foreground space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</span>
                      <span>Toque no ícone <MoreVertical className="w-4 h-4 inline" /> (menu) do navegador</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</span>
                      <span>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</span>
                      <span>Confirme tocando em <strong>"Instalar"</strong></span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* iOS Installation */}
          {isIOS && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="font-medium">iPhone / iPad</p>
                  <p className="text-xs text-muted-foreground">Instalação manual via Safari</p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <p className="text-sm font-medium">Siga os passos abaixo:</p>
                <ol className="text-sm text-muted-foreground space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</span>
                    <div className="flex-1">
                      <span>Toque no botão <strong>Compartilhar</strong></span>
                      <div className="mt-2 flex items-center gap-2 text-primary">
                        <Share className="w-5 h-5" />
                        <span className="text-xs">(ícone de quadrado com seta para cima)</span>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</span>
                    <div className="flex-1">
                      <span>Role para baixo e toque em:</span>
                      <div className="mt-2 flex items-center gap-2 bg-background p-2 rounded-lg border">
                        <PlusSquare className="w-5 h-5 text-primary" />
                        <span className="font-medium">Adicionar à Tela de Início</span>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</span>
                    <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Desktop */}
          {!isIOS && !isAndroid && (
            <div className="space-y-4">
              {deferredPrompt ? (
                <Button onClick={handleInstallClick} className="w-full" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Como instalar no computador:</p>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Clique no ícone de instalação na barra de endereços</li>
                    <li>Ou acesse Menu → "Instalar Aula Click..."</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Voltar para o site
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
