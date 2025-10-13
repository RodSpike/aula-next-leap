
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  QrCode, 
  Search,
  Check,
  X,
  Copy,
  Share2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCode from 'react-qr-code';

interface FriendProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url?: string | null;
}

interface Friend {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  requester_profile?: FriendProfile;
  requested_profile?: FriendProfile;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending';
  created_at: string;
  requester_profile: FriendProfile;
  requested_profile: FriendProfile;
}

export default function Friends() {
  const { user } = useAuth();
  const { addXP, updateAchievement } = useGamification();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [myQRCode, setMyQRCode] = useState("");
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
      generateMyQRCode();
    }
  }, [user]);

  // Auto-open chat if ?chat= param is present - Navigate to messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatUserId = params.get('chat');
    
    if (chatUserId && friends.length > 0) {
      const friendToOpen = friends.find(friend => {
        const friendProfile = getFriendProfile(friend);
        return friendProfile?.user_id === chatUserId;
      });

      if (friendToOpen) {
        const friendProfile = getFriendProfile(friendToOpen);
        if (friendProfile) {
          handleStartChat(friendProfile.user_id);
        }
        window.history.replaceState(null, '', location.pathname);
      }
    }
  }, [location.search, friends]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        searchUsers();
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      // Get basic friend relationships
      const { data: friendData, error } = await supabase
        .from('friends')
        .select('*')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Get profiles for friends
      const friendProfiles: Friend[] = [];
      for (const friendship of friendData || []) {
        const friendUserId = friendship.requester_id === user.id 
          ? friendship.requested_id 
          : friendship.requester_id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', friendUserId)
          .single();
        
        if (profile) {
          friendProfiles.push({
            ...friendship,
            status: friendship.status as 'pending' | 'accepted',
            requester_profile: friendship.requester_id === user.id ? undefined : {
              user_id: profile.user_id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url
            },
            requested_profile: friendship.requested_id === user.id ? undefined : {
              user_id: profile.user_id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url
            }
          });
        }
      }

      setFriends(friendProfiles);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const { data: requestData, error } = await supabase
        .from('friends')
        .select('*')
        .eq('requested_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get profiles for requesters
      const requests: FriendRequest[] = [];
      for (const request of requestData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', request.requester_id)
          .single();
        
        if (profile) {
          requests.push({
            ...request,
            status: 'pending',
            requester_profile: {
              user_id: profile.user_id,
              username: profile.username,
              display_name: profile.display_name
            },
            requested_profile: {
              user_id: user.id,
              username: '',
              display_name: ''
            }
          });
        }
      }

      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .rpc('search_profiles_public', { search_term: searchQuery });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const sendFriendRequest = async (requestedUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user.id,
          requested_id: requestedUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
      });

      setSearchResults(results => 
        results.filter(result => result.user_id !== requestedUserId)
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('id', requestId);

        if (error) throw error;

      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });
      
      // Gamification
      await addXP(15, 'friend_added', 'Made a new friend');
      await updateAchievement('first_friend');
      await updateAchievement('social_butterfly');
      await updateAchievement('popular');
      } else {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Friend Request Declined",
          description: "The friend request has been declined.",
        });
      }

      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
        variant: "destructive",
      });
    }
  };

  const generateMyQRCode = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', user.id)
        .single();

      const qrData = {
        type: 'friend_request',
        user_id: user.id,
        username: profile?.username,
        display_name: profile?.display_name
      };

      setMyQRCode(JSON.stringify(qrData));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(myQRCode);
      toast({
        title: "Copied!",
        description: "QR code data copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying QR code:', error);
      toast({
        title: "Error",
        description: "Failed to copy QR code",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me as a friend',
          text: 'Scan this QR code to add me as a friend!',
          url: window.location.origin + '/friends?invite=' + encodeURIComponent(myQRCode)
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyQRCode();
    }
  };

  const getFriendProfile = (friend: Friend): FriendProfile | null => {
    if (!user) return null;
    
    if (friend.requester_id === user.id && friend.requested_profile) {
      return friend.requested_profile;
    } else if (friend.requested_id === user.id && friend.requester_profile) {
      return friend.requester_profile;
    }
    return null;
  };

  const handleStartChat = async (friendUserId: string) => {
    if (!user) return;

    try {
      // Check if private chat group already exists
      const { data: existingMemberships } = await supabase
        .from('group_members')
        .select('group_id, community_groups!inner(id, is_private_chat)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('community_groups.is_private_chat', true);

      let targetGroupId = null;

      // Check each group to see if the friend is also a member
      if (existingMemberships) {
        for (const membership of existingMemberships) {
          const { data: friendMembership } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', membership.group_id)
            .eq('user_id', friendUserId)
            .eq('status', 'accepted')
            .maybeSingle();

          if (friendMembership) {
            targetGroupId = membership.group_id;
            break;
          }
        }
      }

      // If no existing group, create one
      if (!targetGroupId) {
        const groupName = `DM: ${user.id}-${friendUserId}`;
        
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
        targetGroupId = newGroup.id;

        // Add both users as members
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([
            { group_id: targetGroupId, user_id: user.id, status: 'accepted', can_post: true },
            { group_id: targetGroupId, user_id: friendUserId, status: 'accepted', can_post: true }
          ]);

        if (memberError) throw memberError;
      }

      // Navigate to messages page
      navigate('/messages');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Friends Network</h3>
              <p className="text-muted-foreground mb-4">
                Connect with other learners and practice together!
              </p>
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-hero py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Connect</span> & Learn Together
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build your learning network, practice with friends, and achieve your goals together!
            </p>
            
            {/* Friend stats */}
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{friends.length}</div>
                <div className="text-sm text-muted-foreground">Friends</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{friendRequests.length}</div>
                <div className="text-sm text-muted-foreground">Requests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friend Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Friends */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-hero">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  Discover Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 rounded-lg border-2"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Search Results</h4>
                    {searchResults.map((result) => (
                      <div
                        key={result.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {result.display_name || result.username}
                          </p>
                          {result.username && result.display_name && (
                            <p className="text-sm text-muted-foreground">
                              @{result.username}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(result.user_id)}
                        >
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showQRCode && myQRCode && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-medium text-center">Your Friend QR Code</h4>
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <QRCode value={myQRCode} size={150} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={copyQRCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareQRCode}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {request.requester_profile.display_name || request.requester_profile.username}
                          </p>
                          {request.requester_profile.username && request.requester_profile.display_name && (
                            <p className="text-sm text-muted-foreground">
                              @{request.requester_profile.username}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => respondToFriendRequest(request.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToFriendRequest(request.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
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
                <CardTitle>Your Friends ({friends.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading friends...</p>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No friends yet. Start by searching for people to connect with!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => {
                      const friendProfile = getFriendProfile(friend);
                      if (!friendProfile) return null;

                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium">
                              {friendProfile.display_name || friendProfile.username}
                            </p>
                            {friendProfile.username && friendProfile.display_name && (
                              <p className="text-sm text-muted-foreground">
                                @{friendProfile.username}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartChat(friendProfile.user_id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Friends</span>
                  <Badge variant="secondary">{friends.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Requests</span>
                  <Badge variant="secondary">{friendRequests.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Use the QR code to quickly add friends in person</p>
                <p>• Practice English together in the chat</p>
                <p>• Share your progress and motivate each other</p>
                <p>• Join study groups and challenges</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
