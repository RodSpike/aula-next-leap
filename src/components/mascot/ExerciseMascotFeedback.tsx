import React, { useState, useEffect } from 'react';
import { CupheadFoxMascot, CupheadFoxMood } from './CupheadFoxMascot';
import { gameSounds } from '@/utils/gameSounds';

interface ExerciseMascotFeedbackProps {
  isCorrect?: boolean | null;
  isComplete?: boolean;
  score?: number;
  total?: number;
  className?: string;
}

export const ExerciseMascotFeedback: React.FC<ExerciseMascotFeedbackProps> = ({
  isCorrect,
  isComplete,
  score,
  total,
  className = ''
}) => {
  const [mood, setMood] = useState<CupheadFoxMood>('thinking');
  const [message, setMessage] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isComplete && score !== undefined && total !== undefined) {
      const percentage = (score / total) * 100;
      
      if (percentage === 100) {
        setMood('celebrating');
        setMessage('PERFEITO! Você acertou tudo!');
        setShowCelebration(true);
        gameSounds.playCelebration();
      } else if (percentage >= 70) {
        setMood('happy');
        setMessage(`Muito bem! ${score}/${total} corretas!`);
        gameSounds.playCorrect();
      } else if (percentage >= 50) {
        setMood('thinking');
        setMessage('Bom esforço! Continue praticando!');
      } else {
        setMood('studying');
        setMessage('Não desista! Revise o conteúdo!');
      }
    } else if (isCorrect === true) {
      setMood('celebrating');
      setMessage(getRandomCorrectMessage());
      setShowCelebration(true);
      gameSounds.playCorrect();
      setTimeout(() => setShowCelebration(false), 2000);
    } else if (isCorrect === false) {
      setMood('thinking');
      setMessage(getRandomIncorrectMessage());
      gameSounds.playIncorrect();
    } else {
      setMood('thinking');
      setMessage('Pense bem antes de responder!');
    }
  }, [isCorrect, isComplete, score, total]);

  const getRandomCorrectMessage = () => {
    const messages = [
      'Excelente! 🎯',
      'Isso aí! Mandou bem!',
      'Perfeito! Continue assim!',
      'Você é demais!',
      'Acertou na mosca!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomIncorrectMessage = () => {
    const messages = [
      'Quase lá! Tente novamente!',
      'Não desanime! Você consegue!',
      'Hmm, vamos revisar isso!',
      'Errar é aprender!',
      'A próxima você acerta!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Celebration Effects */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
          
          {/* Sparkle effects */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-2xl animate-sparkle"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 40}%`,
                animationDelay: `${Math.random() * 0.3}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
      
      {/* Mascot with dynamic animation */}
      <div className={`transition-all duration-300 ${
        isCorrect === true ? 'scale-110 animate-bounce-subtle' : 
        isCorrect === false ? 'animate-shake' : ''
      }`}>
        <CupheadFoxMascot 
          mood={mood} 
          size="md" 
          animate={true}
          message={message}
        />
      </div>

      {/* Feedback badge */}
      {isCorrect !== null && (
        <div className={`mt-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
          isCorrect 
            ? 'bg-green-500/20 text-green-600 border-2 border-green-500 animate-pulse' 
            : 'bg-red-500/20 text-red-600 border-2 border-red-500'
        }`}>
          {isCorrect ? '✓ CORRETO!' : '✗ INCORRETO'}
        </div>
      )}

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(200px) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0) scale(1.1);
          }
          50% {
            transform: translateY(-8px) scale(1.15);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        
        .animate-confetti {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confetti 2s ease-out forwards;
        }
        
        .animate-sparkle {
          animation: sparkle 0.8s ease-out forwards;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
