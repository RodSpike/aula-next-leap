import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onFileSelect,
  className = "",
  accept = "image/*,application/pdf,.doc,.docx,.txt",
  maxSize = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }

    onFileSelect(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`h-8 w-8 p-0 hover:bg-muted ${className}`}
        onClick={handleFileSelect}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};