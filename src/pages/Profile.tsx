import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SimpleChatWindow } from "@/components/SimpleChatWindow";

interface UserProfile {
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  cambridge_level?: string;
}

interface Friend {
  id: string;
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
}

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsInCommon, setFriendsInCommon] = useState<Friend[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [chatGroupName, setChatGroupName] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchFriends();
      checkFriendship();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchFriends = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (data) {
      const friendIds = data.map(f => 
        f.requester_id === userId ? f.requested_id : f.requester_id
      );

      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', friendIds);

      if (friendProfiles) {
        setFriends(friendProfiles.map(p => ({
          id: p.user_id,
          user_id: p.user_id,
          display_name: p.display_name,
          username: p.username,
          avatar_url: p.avatar_url
        })));
      }

      // If viewing someone else's profile, check friends in common
      if (user && userId !== user.id) {
        const { data: myFriends } = await supabase
          .from('friends')
          .select('*')
          .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (myFriends) {
          const myFriendIds = myFriends.map(f => 
            f.requester_id === user.id ? f.requested_id : f.requester_id
          );

          const commonIds = friendIds.filter(id => myFriendIds.includes(id));

          const { data: commonProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .in('user_id', commonIds);

          if (commonProfiles) {
            setFriendsInCommon(commonProfiles.map(p => ({
              id: p.user_id,
              user_id: p.user_id,
              display_name: p.display_name,
              username: p.username,
              avatar_url: p.avatar_url
            })));
          }
        }
      }
    }
  };

  const checkFriendship = async () => {
    if (!user || !userId || userId === user.id) return;

    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`and(requester_id.eq.${user.id},requested_id.eq.${userId}),and(requester_id.eq.${userId},requested_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle();

    setIsFriend(!!data);
  };

  const handleSendFriendRequest = async () => {
    if (!user || !userId) return;

    const { error } = await supabase
      .from('friends')
      .insert({
        requester_id: user.id,
        requested_id: userId,
        status: 'pending'
      });

    if (!error) {
      toast({
        title: "Friend request sent",
        description: `Request sent to ${profile?.display_name || profile?.username}`,
      });
    }
  };

  const handleStartChat = async (friendId: string, friendName: string) => {
    if (!user) return;

    const groupName = `DM: ${user.id}-${friendId}`;
    
    const { data: existingGroup } = await supabase
      .from('community_groups')
      .select('id, name')
      .eq('is_private_chat', true)
      .or(`name.eq.DM: ${user.id}-${friendId},name.eq.DM: ${friendId}-${user.id}`)
      .maybeSingle();

    if (existingGroup) {
      setChatGroupId(existingGroup.id);
      setChatGroupName(friendName);
    } else {
      const { data: newGroup, error } = await supabase
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

      if (!error && newGroup) {
        await supabase
          .from('group_members')
          .insert([
            { group_id: newGroup.id, user_id: user.id, status: 'accepted', can_post: true },
            { group_id: newGroup.id, user_id: friendId, status: 'accepted', can_post: true }
          ]);

        setChatGroupId(newGroup.id);
        setChatGroupName(friendName);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    {profile.display_name || profile.username}
                  </CardTitle>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.cambridge_level && (
                    <Badge className="mt-2">{profile.cambridge_level}</Badge>
                  )}
                </div>
                {user && userId !== user.id && !isFriend && (
                  <Button onClick={handleSendFriendRequest}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Friends in Common */}
          {friendsInCommon.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends in Common ({friendsInCommon.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {friendsInCommon.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>
                          {friend.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {friend.display_name || friend.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Friends ({friends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No friends yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>
                          {friend.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {friend.display_name || friend.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{friend.username}
                        </p>
                      </div>
                      {user && userId === user.id && (
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleStartChat(friend.user_id, friend.display_name || friend.username || 'Friend')}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Window */}
      {chatGroupId && (
        <SimpleChatWindow
          groupId={chatGroupId}
          groupName={chatGroupName}
          onClose={() => setChatGroupId(null)}
        />
      )}
    </div>
  );
}
