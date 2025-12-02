import React from 'react';
import { ConversationStatus } from '@/types/speech-tutor';

interface StatusIndicatorProps {
  status: ConversationStatus;
  interimText?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, interimText }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ConversationStatus.Idle:
        return { color: 'bg-muted', label: 'Pronto', pulse: false };
      case ConversationStatus.Connecting:
        return { color: 'bg-yellow-500', label: 'Conectando...', pulse: true };
      case ConversationStatus.Listening:
        return { color: 'bg-green-500', label: 'Ouvindo...', pulse: true };
      case ConversationStatus.Error:
        return { color: 'bg-destructive', label: 'Erro', pulse: false };
      default:
        return { color: 'bg-muted', label: 'Desconhecido', pulse: false };
    }
  };

  const config = getStatusConfig();
  const isDetectingSound = status === ConversationStatus.Listening && interimText;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color} ${isDetectingSound ? 'scale-125' : ''} transition-transform`} />
          {config.pulse && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-ping opacity-75`} />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">{config.label}</span>
        
        {/* Audio level bars animation when detecting sound */}
        {isDetectingSound && (
          <div className="flex items-end gap-0.5 h-4 ml-auto">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className="w-1 bg-green-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 100}%`,
                  minHeight: '4px',
                  animationDelay: `${bar * 0.1}s`,
                  animationDuration: '0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Show interim text being detected */}
      {isDetectingSound && (
        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400 italic animate-pulse">
            "{interimText}"
          </p>
        </div>
      )}
    </div>
  );
};
