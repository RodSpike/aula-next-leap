import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  email?: string;
}

interface UserProfilePopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  profile?: UserProfile;
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({
  isOpen,
  onOpenChange,
  userId,
  profile: initialProfile
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isOpen && userId && !initialProfile) {
      fetchUserProfile(userId);
    }
  }, [isOpen, userId, initialProfile]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const MASTER_ADMIN_EMAILS = ["rodspike2k8@gmail.com", "luccadtoledo@gmail.com"];
    setIsAdmin(!!data || (user?.email ? MASTER_ADMIN_EMAILS.includes(user.email) : false));
  };

  const fetchUserProfile = async (targetUserId: string) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, email')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !isAdmin) return;
    
    setSearchLoading(true);
    try {
      // Search by display name or username using the public search function
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_profiles_public', { search_term: searchQuery.trim() });

      if (searchError) throw searchError;

      // If admin, also search by email and exact user ID
      let additionalResults: UserProfile[] = [];
      
      if (isAdmin) {
        // Search by email (admin only)
        const { data: emailData, error: emailError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, email')
          .ilike('email', `%${searchQuery.trim()}%`);

        if (!emailError && emailData) {
          additionalResults = [...additionalResults, ...emailData];
        }

        // Search by exact user ID (admin only)
        if (searchQuery.trim().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const { data: idData, error: idError } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url, email')
            .eq('user_id', searchQuery.trim());

          if (!idError && idData) {
            additionalResults = [...additionalResults, ...idData];
          }
        }
      }

      // Combine and deduplicate results
      const allResults = [...(searchData || []), ...additionalResults];
      const uniqueResults = allResults.reduce((acc, current) => {
        const exists = acc.find(item => item.user_id === current.user_id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as UserProfile[]);

      setSearchResults(uniqueResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!profile || !user) return;

    try {
      // Find a default group to create the private chat in
      const { data: defaultGroup, error: groupError } = await supabase
        .from('community_groups')
        .select('id')
        .eq('is_default', true)
        .limit(1)
        .single();

      if (groupError || !defaultGroup) {
        toast({
          title: "Error",
          description: "Unable to find a default group for messaging",
          variant: "destructive",
        });
        return;
      }

      // Navigate to community with direct message state
      navigate('/community', {
        state: {
          openDirectMessage: true,
          groupId: defaultGroup.id,
          partnerId: profile.user_id
        }
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error opening direct message:', error);
      toast({
        title: "Error",
        description: "Failed to open direct message",
        variant: "destructive",
      });
    }
  };

  const copyUserId = () => {
    if (profile?.user_id) {
      navigator.clipboard.writeText(profile.user_id);
      toast({
        title: "Copied",
        description: "User ID copied to clipboard",
      });
    }
  };

  const selectUser = (selectedProfile: UserProfile) => {
    setProfile(selectedProfile);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Loading user profile...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>


        {profile ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                  {profile.display_name || profile.username || 'Anonymous User'}
                </h3>
                
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>ID: {profile.user_id.slice(0, 8)}...</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyUserId}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {isAdmin && profile.email && (
                  <p className="text-xs text-muted-foreground">
                    Email: {profile.email}
                  </p>
                )}
              </div>
            </div>

            {profile.user_id !== user?.id && (
              <div className="flex justify-center">
                <Button onClick={handleDirectMessage} className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Send Direct Message
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isAdmin ? 'Search for a user to view their profile' : 'No user profile found'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};