import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Mic, MicOff, X } from 'lucide-react';
import { EmojiPickerComponent } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';
import { useToast } from '@/hooks/use-toast';

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
  showVoiceInput?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
  className?: string;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  placeholder = "Type a message...",
  disabled = false,
  showVoiceInput = true,
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleEmojiSelect = (emoji: string) => {
    const currentValue = value;
    const cursorPosition = inputRef.current?.selectionStart || currentValue.length;
    const newValue = 
      currentValue.slice(0, cursorPosition) + 
      emoji + 
      currentValue.slice(cursorPosition);
    onChange(newValue);
    
    // Focus input after emoji selection
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
    }, 0);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
    toast({
      title: 'File attached',
      description: `${file.name} has been attached to your message.`,
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() && !selectedFile) return;
    onSend();
    setSelectedFile(null);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* File preview */}
      {selectedFile && (
        <Card className="p-2 flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">📎 {selectedFile.name}</span>
            <span className="text-muted-foreground">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </Card>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-20"
          />
          
          {/* Action buttons inside input */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
            
            {onFileSelect && (
              <MediaUpload 
                onFileSelect={handleFileSelect}
                maxSize={10}
              />
            )}
            
            {showVoiceInput && onVoiceStart && onVoiceStop && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isListening ? 'text-red-500 animate-pulse' : 'hover:bg-muted'}`}
                onClick={handleVoiceToggle}
                disabled={disabled}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSend}
          disabled={disabled || (!value.trim() && !selectedFile)}
          size="sm"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};