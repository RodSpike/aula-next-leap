import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, X, ImageIcon } from 'lucide-react';
import { EmojiPickerComponent } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPostCreatorProps {
  onSubmit: (content: string, attachments: any[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const EnhancedPostCreator: React.FC<EnhancedPostCreatorProps> = ({
  onSubmit,
  placeholder = "What's on your mind?",
  disabled = false,
  className = ""
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  const handleFileSelect = (file: File) => {
    // Check if file is already added
    if (attachments.some(f => f.name === file.name && f.size === file.size)) {
      toast({
        title: 'File already attached',
        description: 'This file has already been added to your post.',
        variant: 'destructive',
      });
      return;
    }

    setAttachments(prev => [...prev, file]);
    toast({
      title: 'File attached',
      description: `${file.name} has been attached to your post.`,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      // Convert files to base64 for storage
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  type: 'image',
                  name: file.name,
                  size: file.size,
                  mimeType: file.type,
                  data: reader.result
                });
              };
              reader.readAsDataURL(file);
            });
          } else {
            // For non-image files, just store metadata
            return {
              type: 'file',
              name: file.name,
              size: file.size,
              mimeType: file.type
            };
          }
        })
      );

      await onSubmit(content.trim(), processedAttachments);
      setContent('');
      setAttachments([]);
      
      toast({
        title: 'Post created',
        description: 'Your post has been shared successfully!',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('doc')) return '📝';
    return '📎';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Create a Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className="min-h-[100px] resize-none pr-12"
            maxLength={2000}
          />
          <div className="absolute bottom-2 right-2">
            <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{content.length}/2000 characters</span>
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <span>{getFileTypeIcon(file)}</span>
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <MediaUpload
              onFileSelect={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx,.txt"
              maxSize={10}
            />
            <span className="text-sm text-muted-foreground">
              Add photos, documents, or files
            </span>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || (!content.trim() && attachments.length === 0)}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};