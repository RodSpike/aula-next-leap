import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { ConversationStatus } from '@/types/speech-tutor';

interface ControlButtonProps {
  status: ConversationStatus;
  onClick: () => void;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ status, onClick }) => {
  const getButtonConfig = () => {
    switch (status) {
      case ConversationStatus.Idle:
        return {
          icon: <Mic className="h-5 w-5" />,
          label: 'Start Session',
          variant: 'default' as const,
          disabled: false
        };
      case ConversationStatus.Connecting:
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          label: 'Connecting...',
          variant: 'secondary' as const,
          disabled: true
        };
      case ConversationStatus.Listening:
        return {
          icon: <Square className="h-4 w-4" />,
          label: 'Stop Session',
          variant: 'destructive' as const,
          disabled: false
        };
      case ConversationStatus.Error:
        return {
          icon: <Mic className="h-5 w-5" />,
          label: 'Try Again',
          variant: 'default' as const,
          disabled: false
        };
      default:
        return {
          icon: <Mic className="h-5 w-5" />,
          label: 'Start Session',
          variant: 'default' as const,
          disabled: false
        };
    }
  };

  const config = getButtonConfig();

  return (
    <Button
      onClick={onClick}
      disabled={config.disabled}
      variant={config.variant}
      size="lg"
      className="w-full gap-2"
    >
      {config.icon}
      {config.label}
    </Button>
  );
};
