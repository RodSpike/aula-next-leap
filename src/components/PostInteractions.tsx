import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClickableUserProfile } from "@/components/ClickableUserProfile";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { useUserProfileClick } from "@/hooks/useUserProfileClick";

interface PostInteractionsProps {
  postId: string;
  userId: string;
  isAdmin?: boolean;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
  } | null;
}

export const PostInteractions: React.FC<PostInteractionsProps> = ({
  postId,
  userId,
  isAdmin = false,
  onEditPost,
  onDeletePost,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const { isPopupOpen, selectedUserId, selectedProfile, openUserProfile, setIsPopupOpen } = useUserProfileClick();

  useEffect(() => {
    if (user) {
      fetchLikes();
      fetchComments();
    }
  }, [postId, user]);

  const fetchLikes = async () => {
    try {
      // Get total likes count
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact' })
        .eq('post_id', postId);

      setLikes(count || 0);

      // Check if current user has liked
      if (user) {
        const { data } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = (data || []).map((comment) => ({
        ...comment,
        profiles: { display_name: 'Member' }
      }));

      setComments(commentsWithProfiles);
      setCommentCount(commentsWithProfiles.length);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select('*')
        .single();

      if (error) throw error;

      // Get profile data for the new comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const commentWithProfile = {
        ...data,
        profiles: profileData || { display_name: 'Unknown User' }
      };

      if (error) throw error;

      setComments(prev => [...prev, commentWithProfile]);
      setCommentCount(prev => prev + 1);
      setNewComment("");

      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const commentsSection = (
    <div className="space-y-4">
      <ScrollArea className="max-h-80">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3 mb-4">
            <ClickableUserProfile
              userId={comment.user_id}
              profile={{
                user_id: comment.user_id,
                display_name: comment.profiles?.display_name || 'Unknown User'
              }}
              onClick={openUserProfile}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {comment.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </ClickableUserProfile>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <ClickableUserProfile
                    userId={comment.user_id}
                    profile={{
                      user_id: comment.user_id,
                      display_name: comment.profiles?.display_name || 'Unknown User'
                    }}
                    onClick={openUserProfile}
                  >
                    <span className="font-medium text-sm hover:underline">
                      {comment.profiles?.display_name || 'Unknown User'}
                    </span>
                  </ClickableUserProfile>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
      
      <div className="flex space-x-2 pt-4 border-t">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
          disabled={isSubmittingComment}
        />
        <Button 
          size="sm" 
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || isSubmittingComment}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between pt-3">
      <div className="flex items-center space-x-4">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className="flex items-center space-x-2 hover:bg-transparent"
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
          />
          <span className="text-sm font-medium">{likes}</span>
        </Button>

        {/* Comments Button */}
        {isDesktop ? (
          <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:bg-transparent"
              >
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{commentCount}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              {commentsSection}
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:bg-transparent"
              >
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{commentCount}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Comments</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4">
                {commentsSection}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Admin Menu */}
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditPost?.(postId)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeletePost?.(postId)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <UserProfilePopup
        isOpen={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        userId={selectedUserId}
        profile={selectedProfile}
      />
    </div>
  );
};