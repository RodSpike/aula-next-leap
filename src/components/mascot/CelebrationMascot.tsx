import React, { useState, useEffect } from 'react';
import { CupheadFoxMascot } from './CupheadFoxMascot';

type CelebrationType = 'level_up' | 'achievement' | 'streak' | 'perfect_score' | 'course_complete';

interface CelebrationMascotProps {
  type: CelebrationType;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const CelebrationMascot: React.FC<CelebrationMascotProps> = ({
  type,
  title,
  subtitle,
  onClose,
  autoClose = true,
  autoCloseDelay = 4000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 500);
  };

  const getCelebrationConfig = () => {
    switch (type) {
      case 'level_up':
        return {
          icon: '⬆️',
          defaultTitle: 'LEVEL UP!',
          defaultSubtitle: 'Você subiu de nível!',
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-400'
        };
      case 'achievement':
        return {
          icon: '🏆',
          defaultTitle: 'CONQUISTA DESBLOQUEADA!',
          defaultSubtitle: 'Você desbloqueou uma nova conquista!',
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-400'
        };
      case 'streak':
        return {
          icon: '🔥',
          defaultTitle: 'STREAK!',
          defaultSubtitle: 'Você manteve sua sequência!',
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-400'
        };
      case 'perfect_score':
        return {
          icon: '💯',
          defaultTitle: 'PONTUAÇÃO PERFEITA!',
          defaultSubtitle: 'Você acertou tudo!',
          color: 'from-green-400 to-emerald-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400'
        };
      case 'course_complete':
        return {
          icon: '🎓',
          defaultTitle: 'CURSO COMPLETO!',
          defaultSubtitle: 'Parabéns por completar o curso!',
          color: 'from-blue-400 to-indigo-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400'
        };
      default:
        return {
          icon: '🎉',
          defaultTitle: 'PARABÉNS!',
          defaultSubtitle: 'Você conseguiu!',
          color: 'from-primary to-primary/80',
          bgColor: 'bg-primary/20',
          borderColor: 'border-primary'
        };
    }
  };

  const config = getCelebrationConfig();

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Fireworks/Particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-firework"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3'][Math.floor(Math.random() * 6)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main celebration card */}
      <div 
        className={`relative ${config.bgColor} ${config.borderColor} border-4 rounded-3xl p-8 max-w-md w-full shadow-2xl transition-all duration-500 ${
          isExiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100 animate-celebration-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing border effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.color} rounded-3xl opacity-30 blur-xl -z-10`} />
        
        {/* Icon burst */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl animate-bounce-in">
          {config.icon}
        </div>

        {/* Content */}
        <div className="text-center pt-8 space-y-4">
          {/* Title with gradient */}
          <h2 className={`text-3xl font-black bg-gradient-to-r ${config.color} bg-clip-text text-transparent animate-pulse`}>
            {title || config.defaultTitle}
          </h2>

          {/* Mascot */}
          <div className="flex justify-center py-4">
            <div className="animate-mascot-celebration">
              <CupheadFoxMascot 
                mood="celebrating" 
                size="lg" 
                animate={true}
              />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-lg text-foreground/80 font-medium">
            {subtitle || config.defaultSubtitle}
          </p>

          {/* Stars decoration */}
          <div className="flex justify-center gap-2 text-2xl">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className="animate-star-pop"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Close hint */}
          <p className="text-sm text-muted-foreground mt-4">
            Clique em qualquer lugar para fechar
          </p>
        </div>
      </div>

      <style>{`
        @keyframes firework {
          0% {
            transform: scale(0) translateY(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.5) translateY(-100px);
            opacity: 0;
          }
        }
        
        @keyframes celebration-enter {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(3deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: translateX(-50%) scale(0) translateY(-50px);
          }
          60% {
            transform: translateX(-50%) scale(1.3) translateY(10px);
          }
          100% {
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
        
        @keyframes mascot-celebration {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(-5deg);
          }
          50% {
            transform: scale(1.05) rotate(0deg);
          }
          75% {
            transform: scale(1.1) rotate(5deg);
          }
        }
        
        @keyframes star-pop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.3) rotate(20deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-firework {
          animation: firework 3s ease-out infinite;
        }
        
        .animate-celebration-enter {
          animation: celebration-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-mascot-celebration {
          animation: mascot-celebration 1s ease-in-out infinite;
        }
        
        .animate-star-pop {
          animation: star-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

// Hook para usar celebrações programaticamente
export const useCelebration = () => {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType;
    title?: string;
    subtitle?: string;
  } | null>(null);

  const celebrate = (type: CelebrationType, title?: string, subtitle?: string) => {
    setCelebration({ type, title, subtitle });
  };

  const closeCelebration = () => {
    setCelebration(null);
  };

  return { celebration, celebrate, closeCelebration };
};
