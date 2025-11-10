import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, X, ImageIcon, FileIcon, FileText, Video } from 'lucide-react';
import { EmojiPickerComponent } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedPostCreatorProps {
  onSubmit: (content: string, attachments: any[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  groupId?: string;
  userId?: string;
}

export const EnhancedPostCreator: React.FC<EnhancedPostCreatorProps> = ({
  onSubmit,
  placeholder = "What's on your mind?",
  disabled = false,
  className = "",
  groupId,
  userId
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
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

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => new Map(prev).set(file.name, url));
    }

    setAttachments(prev => [...prev, file]);
    toast({
      title: 'File attached',
      description: `${file.name} has been attached to your post.`,
    });
  };

  const removeAttachment = (index: number) => {
    const file = attachments[index];
    
    // Revoke preview URL if exists
    const url = previewUrls.get(file.name);
    if (url) {
      URL.revokeObjectURL(url);
      setPreviewUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });
    }
    
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      // Upload files to Supabase Storage if we have groupId and userId
      let uploadedAttachments: any[] = [];
      
      if (attachments.length > 0 && groupId && userId) {
        const uploadPromises = attachments.map(async (file) => {
          // Create a unique filename with timestamp
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop();
          const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${groupId}/${userId}/${fileName}`;

          try {
            const { data, error } = await supabase.storage
              .from('group-post-attachments')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('group-post-attachments')
              .getPublicUrl(filePath);

            return {
              type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
              name: file.name,
              size: file.size,
              mimeType: file.type,
              url: publicUrl,
              path: filePath
            };
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            throw error;
          }
        });

        uploadedAttachments = await Promise.all(uploadPromises);
      } else {
        // Fallback to base64 for backward compatibility (if groupId/userId not provided)
        uploadedAttachments = await Promise.all(
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
              return {
                type: 'file',
                name: file.name,
                size: file.size,
                mimeType: file.type
              };
            }
          })
        );
      }

      await onSubmit(content.trim(), uploadedAttachments);
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls(new Map());
      
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
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (file.type.includes('doc')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
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
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
            
            {/* Image previews */}
            {attachments.some(f => f.type.startsWith('image/')) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachments
                  .map((file, index) => ({ file, index }))
                  .filter(({ file }) => file.type.startsWith('image/'))
                  .map(({ file, index }) => {
                    const previewUrl = previewUrls.get(file.name);
                    return (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            
            {/* Other file types */}
            {attachments.some(f => !f.type.startsWith('image/')) && (
              <div className="flex flex-wrap gap-2">
                {attachments
                  .map((file, index) => ({ file, index }))
                  .filter(({ file }) => !file.type.startsWith('image/'))
                  .map(({ file, index }) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      {getFileTypeIcon(file)}
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <MediaUpload
              onFileSelect={handleFileSelect}
              accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
              maxSize={10}
              multiple={true}
            />
            <span className="text-sm text-muted-foreground">
              Add images, videos, or documents (max 10MB each)
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