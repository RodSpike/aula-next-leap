import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight } from 'lucide-react';

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  targetElement: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const onboardingSteps: { [key: string]: TooltipStep[] } = {
  '/': [
    {
      id: 'hero',
      title: 'Bem-vindo ao Aula Click! 👋',
      description: 'Sua jornada para dominar o inglês começa aqui. Vamos mostrar os recursos principais.',
      targetElement: '.hero-section',
      position: 'bottom'
    }
  ],
  '/courses': [
    {
      id: 'courses-intro',
      title: 'Cursos de Inglês 📚',
      description: 'Explore nossos cursos organizados por nível. Comece do básico ou avance para níveis mais altos.',
      targetElement: '.courses-section',
      position: 'top'
    }
  ],
  '/community': [
    {
      id: 'community-posts',
      title: 'Comunidade 💬',
      description: 'Conecte-se com outros alunos, faça perguntas e compartilhe seu progresso.',
      targetElement: '.community-feed',
      position: 'top'
    },
    {
      id: 'community-create',
      title: 'Criar Postagem ✍️',
      description: 'Compartilhe suas dúvidas, conquistas ou inicie uma conversa com a comunidade.',
      targetElement: '.create-post-button',
      position: 'left'
    }
  ],
  '/aichat': [
    {
      id: 'ai-tutor',
      title: 'Tutor IA 🤖',
      description: 'Seu assistente pessoal de inglês 24/7. Faça perguntas, pratique conversação e receba feedback instantâneo.',
      targetElement: '.ai-chat-container',
      position: 'top'
    },
    {
      id: 'ai-upload',
      title: 'Enviar Documentos 📄',
      description: 'Envie PDFs, imagens ou documentos para o tutor IA analisar e ajudar você.',
      targetElement: '.file-upload-button',
      position: 'left'
    }
  ],
  '/dashboard': [
    {
      id: 'dashboard-progress',
      title: 'Seu Progresso 📊',
      description: 'Acompanhe suas conquistas, pontuações e tempo de estudo.',
      targetElement: '.progress-card',
      position: 'bottom'
    },
    {
      id: 'dashboard-continue',
      title: 'Continue Aprendendo ▶️',
      description: 'Retome de onde parou ou inicie uma nova lição.',
      targetElement: '.continue-learning',
      position: 'top'
    }
  ]
};

export function FirstTimeUserExperience() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [completedPaths, setCompletedPaths] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has seen onboarding for this path
    const savedProgress = localStorage.getItem('ftue-completed');
    const completed = savedProgress ? JSON.parse(savedProgress) : [];
    setCompletedPaths(completed);

    // Show onboarding if not completed for current path
    if (!completed.includes(currentPath) && onboardingSteps[currentPath]) {
      setTimeout(() => setIsVisible(true), 500);
    }

    // Listen for route changes
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentStepIndex(0);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [currentPath]);

  const currentSteps = onboardingSteps[currentPath] || [];
  const currentStep = currentSteps[currentStepIndex];

  if (!isVisible || !currentStep || completedPaths.includes(currentPath)) {
    return null;
  }

  const handleNext = () => {
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    const updated = [...completedPaths, currentPath];
    setCompletedPaths(updated);
    localStorage.setItem('ftue-completed', JSON.stringify(updated));
    setIsVisible(false);
  };

  const getTooltipPosition = () => {
    const element = document.querySelector(currentStep.targetElement);
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = element.getBoundingClientRect();
    const position = currentStep.position;

    switch (position) {
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)'
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={completeOnboarding}
      />

      {/* Tooltip */}
      <Card 
        className="fixed z-50 w-80 animate-scale-in shadow-xl"
        style={getTooltipPosition()}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg">{currentStep.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={completeOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {currentSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    index === currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} size="sm">
              {currentStepIndex < currentSteps.length - 1 ? (
                <>
                  Próximo <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Entendi!'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
