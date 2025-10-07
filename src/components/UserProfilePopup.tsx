import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Copy, UserPlus, Search } from "lucide-react";
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

  // Keep local state in sync with incoming prop
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

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

  const handleSendFriendRequest = async () => {
    if (!profile || !user) return;

    try {
      // Check if already friends or request exists
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(requester_id.eq.${user.id},requested_id.eq.${profile.user_id}),and(requester_id.eq.${profile.user_id},requested_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Friend request already sent",
          description: "You've already sent a friend request to this user.",
          variant: "destructive",
        });
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user.id,
          requested_id: profile.user_id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend request sent",
        description: `Friend request sent to ${profile.display_name || profile.username}`,
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive",
      });
    }
  };

  const handleDirectMessage = async () => {
    if (!profile || !user) return;

    try {
      // Create or get private group for DM
      const groupName = `DM: ${user.id}-${profile.user_id}`;
      
      // Check if private chat group exists
      const { data: existingGroup } = await supabase
        .from('community_groups')
        .select('id')
        .eq('is_private_chat', true)
        .or(`name.eq.DM: ${user.id}-${profile.user_id},name.eq.DM: ${profile.user_id}-${user.id}`)
        .maybeSingle();

      let groupId;
      
      if (existingGroup) {
        groupId = existingGroup.id;
      } else {
        // Create new private chat group
        const { data: newGroup, error: groupError } = await supabase
          .from('community_groups')
          .insert({
            name: groupName,
            description: 'Private chat',
            level: 'A1',
            is_private_chat: true,
            created_by: user.id,
            group_type: 'private'
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;

        // Add both users as members
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([
            { group_id: groupId, user_id: user.id, status: 'accepted', can_post: true },
            { group_id: groupId, user_id: profile.user_id, status: 'accepted', can_post: true }
          ]);

        if (memberError) throw memberError;
      }

      // Navigate to community with the group selected
      navigate('/community', { 
        state: { 
          selectedGroupId: groupId,
          openMessaging: true 
        } 
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating/opening DM:', error);
      toast({
        title: "Error",
        description: "Failed to open direct message.",
        variant: "destructive",
      });
    }
  };

  const selectUser = (selectedProfile: UserProfile) => {
    setProfile(selectedProfile);
    setSearchQuery('');
    setSearchResults([]);
  };

  const copyUserId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.user_id);
    toast({
      title: "Copied",
      description: "User ID copied to clipboard",
    });
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


        {(() => {
          const p = profile ?? initialProfile ?? null;
          if (!p && userId) {
            // We will rely on fetch effect + loading state
          }

          if (!p) {
            return (
              <div className="text-center py-8 text-muted-foreground">No user selected</div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={p.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {p.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">
                    {p.display_name || 'User'}
                  </h3>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>ID: {p.user_id.slice(0, 8)}...</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyUserId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    navigate(`/profile/${p.user_id}`);
                    onOpenChange(false);
                  }} 
                  className="w-full" 
                  variant="secondary"
                >
                  Visitar Perfil
                </Button>
                
                {p.user_id !== user?.id && (
                  <>
                    <Button onClick={handleSendFriendRequest} className="w-full" variant="default">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Send Friend Request
                    </Button>
                    <Button onClick={handleDirectMessage} className="w-full" variant="outline">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send Direct Message
                    </Button>
                  </>
                )}
              </div>

              {isAdmin && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search users (admin)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    />
                    <Button onClick={searchUsers} size="icon" disabled={searchLoading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.user_id}
                          className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted cursor-pointer"
                          onClick={() => selectUser(result)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={result.avatar_url} />
                            <AvatarFallback>
                              {result.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.display_name || result.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      </DialogContent>
    </Dialog>
  );
};