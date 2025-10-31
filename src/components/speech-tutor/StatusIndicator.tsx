import React from 'react';
import { ConversationStatus } from '@/types/speech-tutor';

interface StatusIndicatorProps {
  status: ConversationStatus;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ConversationStatus.Idle:
        return { color: 'bg-muted', label: 'Idle', pulse: false };
      case ConversationStatus.Connecting:
        return { color: 'bg-yellow-500', label: 'Connecting...', pulse: true };
      case ConversationStatus.Listening:
        return { color: 'bg-green-500', label: 'Listening...', pulse: true };
      case ConversationStatus.Error:
        return { color: 'bg-destructive', label: 'Error', pulse: false };
      default:
        return { color: 'bg-muted', label: 'Unknown', pulse: false };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        {config.pulse && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      <span className="text-sm font-medium text-foreground">{config.label}</span>
    </div>
  );
};
