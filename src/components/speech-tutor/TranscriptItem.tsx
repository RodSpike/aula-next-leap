import React from 'react';
import { User, Bot } from 'lucide-react';
import { TranscriptEntry } from '@/types/speech-tutor';

interface TranscriptItemProps {
  entry: TranscriptEntry;
}

export const TranscriptItem: React.FC<TranscriptItemProps> = ({ entry }) => {
  const isUser = entry.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary' : 'bg-accent'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-foreground" />
        )}
      </div>
      <div className={`flex-1 p-3 rounded-lg ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
      }`}>
        <p className="text-sm">{entry.text}</p>
      </div>
    </div>
  );
};
