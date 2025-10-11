import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, UserPlus, Users, Camera, Save, Music, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  cambridge_level?: string;
  intro_message?: string;
  main_profile_post?: string;
  main_profile_post_updated_at?: string;
  header_bg_color?: string;
  header_image_url?: string;
  favorite_song_url?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsInCommon, setFriendsInCommon] = useState<Friend[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Edit states
  const [editedIntro, setEditedIntro] = useState('');
  const [editedMainPost, setEditedMainPost] = useState('');
  const [editedHeaderBg, setEditedHeaderBg] = useState('');
  const [editedSongUrl, setEditedSongUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userId && user) {
      setIsOwnProfile(userId === user.id);
      fetchProfile();
      fetchFriends();
      checkFriendship();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setEditedIntro(data.intro_message || '');
      setEditedMainPost(data.main_profile_post || '');
      setEditedHeaderBg(data.header_bg_color || '#4F46E5');
      setEditedSongUrl(data.favorite_song_url || '');
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

  const handleStartChat = () => {
    if (!user || !userId) return;
    window.location.href = `/friends?chat=${userId}`;
  };

  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('community-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-files')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ header_image_url: publicUrl })
        .eq('user_id', user.id);

      setProfile(prev => prev ? { ...prev, header_image_url: publicUrl } : null);
      
      toast({
        title: "Header image updated",
        description: "Your profile header has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !isOwnProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          intro_message: editedIntro || null,
          main_profile_post: editedMainPost || null,
          main_profile_post_updated_at: editedMainPost !== profile?.main_profile_post ? new Date().toISOString() : profile?.main_profile_post_updated_at,
          header_bg_color: editedHeaderBg,
          favorite_song_url: editedSongUrl || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: editedMainPost !== profile?.main_profile_post 
          ? "Your friends will be notified about your updated profile post"
          : "Your profile has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  const youtubeId = profile.favorite_song_url ? extractYoutubeId(profile.favorite_song_url) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Profile Header */}
      <div 
        className="relative h-64 bg-gradient-to-br from-primary to-secondary"
        style={{
          backgroundColor: profile.header_bg_color || '#4F46E5',
          backgroundImage: profile.header_image_url ? `url(${profile.header_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isOwnProfile && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute top-4 right-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Change Header'}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleHeaderImageUpload}
        />
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Info Card */}
          <Card>
            <CardContent className="pt-16">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Avatar className="w-32 h-32 border-4 border-background -mt-28">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-3xl">
                    {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-1">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.cambridge_level && (
                    <Badge className="mt-2">{profile.cambridge_level}</Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  {!isOwnProfile && (
                    <>
                      {!isFriend && user && (
                        <Button onClick={handleSendFriendRequest}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Friend
                        </Button>
                      )}
                      {isFriend && (
                        <Button onClick={handleStartChat}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      )}
                    </>
                  )}
                  {isOwnProfile && !isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                  {isOwnProfile && isEditing && (
                    <>
                      <Button onClick={handleSaveChanges}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        fetchProfile();
                      }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Intro Message */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  About Me
                </h3>
                {isEditing ? (
                  <Textarea
                    value={editedIntro}
                    onChange={(e) => setEditedIntro(e.target.value)}
                    placeholder="Write a short intro about yourself..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                ) : profile.intro_message ? (
                  <p className="text-muted-foreground">{profile.intro_message}</p>
                ) : (
                  <p className="text-muted-foreground italic">No intro yet</p>
                )}
              </div>

              {/* Main Profile Post */}
              {(profile.main_profile_post || isEditing) && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Main Post</h3>
                  {isEditing ? (
                    <Textarea
                      value={editedMainPost}
                      onChange={(e) => setEditedMainPost(e.target.value)}
                      placeholder="Share what's on your mind..."
                      className="min-h-[120px]"
                      maxLength={1000}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{profile.main_profile_post}</p>
                  )}
                </div>
              )}

              {/* Header Color Picker */}
              {isEditing && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Header Background Color
                  </h3>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={editedHeaderBg}
                      onChange={(e) => setEditedHeaderBg(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{editedHeaderBg}</span>
                  </div>
                </div>
              )}

              {/* Favorite Song */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Favorite Song
                </h3>
                {isEditing ? (
                  <Input
                    type="url"
                    value={editedSongUrl}
                    onChange={(e) => setEditedSongUrl(e.target.value)}
                    placeholder="Paste YouTube URL here..."
                  />
                ) : youtubeId ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="Favorite Song"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No favorite song set</p>
                )}
              </div>
            </CardContent>
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
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
