
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FriendChat } from '@/components/FriendChat';
import QRCode from 'react-qr-code';
import { 
  Users, 
  UserPlus, 
  Search, 
  QrCode, 
  MessageCircle,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';

interface FriendProfile {
  user_id: string;
  username: string;
  display_name: string;
}

interface Friend {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_profile?: FriendProfile;
  requested_profile?: FriendProfile;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          requester:profiles!friends_requester_id_fkey(user_id, username, display_name),
          requested:profiles!friends_requested_id_fkey(user_id, username, display_name)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`);

      if (error) throw error;

      const friendsList: Friend[] = data?.map(friendship => {
        const isRequester = friendship.requester_id === user.id;
        const friendProfile = isRequester ? friendship.requested : friendship.requester;
        
        return {
          id: friendship.id,
          user_id: friendProfile.user_id,
          username: friendProfile.username,
          display_name: friendProfile.display_name
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar lista de amigos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          created_at,
          requester:profiles!friends_requester_id_fkey(user_id, username, display_name),
          requested:profiles!friends_requested_id_fkey(user_id, username, display_name)
        `)
        .eq('status', 'pending')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`);

      if (error) throw error;

      const requestsList: FriendRequest[] = data?.map(request => ({
        id: request.id,
        requester_id: request.requester_id,
        requested_id: request.requested_id,
        status: request.status as 'pending',
        created_at: request.created_at,
        requester_profile: request.requester,
        requested_profile: request.requested
      })) || [];

      setFriendRequests(requestsList);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    try {
      const { data, error } = await supabase.rpc('search_profiles_public', {
        search_term: searchQuery
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Erro",
        description: "Falha ao buscar usuários.",
        variant: "destructive",
      });
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .or(`and(requester_id.eq.${user.id},requested_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},requested_id.eq.${user.id})`)
        .single();

      if (existingRequest) {
        toast({
          title: "Aviso",
          description: "Já existe uma solicitação de amizade entre vocês.",
        });
        return;
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user.id,
          requested_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação de amizade enviada!",
      });

      setSearchResults([]);
      setSearchQuery('');
      fetchFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar solicitação de amizade.",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: accept ? "Solicitação aceita!" : "Solicitação rejeitada!",
      });

      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: "Erro",
        description: "Falha ao responder solicitação.",
        variant: "destructive",
      });
    }
  };

  const getMyQRCode = () => {
    if (!user) return '';
    return JSON.stringify({
      type: 'friend_invite',
      user_id: user.id,
      platform: 'aula-click'
    });
  };

  if (selectedFriend) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FriendChat 
            friend={selectedFriend} 
            onBack={() => setSelectedFriend(null)}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando amigos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Amigos</h1>
          <p className="text-muted-foreground">
            Conecte-se com outros estudantes e pratique juntos
          </p>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Solicitações ({friendRequests.filter(r => r.requested_id === user?.id).length})
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum amigo ainda</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece a se conectar com outros estudantes para praticar juntos.
                  </p>
                  <Button onClick={() => document.querySelector('[value="search"]')?.click()}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar amigos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} />
                          <AvatarFallback>{friend.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{friend.display_name}</h4>
                          <p className="text-sm text-muted-foreground">@{friend.username}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setSelectedFriend(friend)}
                        className="w-full"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Conversar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {friendRequests.filter(r => r.requested_id === user?.id).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
                  <p className="text-muted-foreground">
                    Quando alguém enviar uma solicitação de amizade, ela aparecerá aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {friendRequests
                  .filter(request => request.requested_id === user?.id)
                  .map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.requester_profile?.username}`} />
                              <AvatarFallback>{request.requester_profile?.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{request.requester_profile?.display_name}</h4>
                              <p className="text-sm text-muted-foreground">@{request.requester_profile?.username}</p>
                            </div>
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
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buscar usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o nome ou username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Resultados da busca:</h4>
                    {searchResults.map((profile) => (
                      <div key={profile.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} />
                            <AvatarFallback>{profile.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{profile.display_name}</h4>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(profile.user_id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Meu QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode
                      size={200}
                      value={getMyQRCode()}
                      level="M"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe este QR Code para que outros usuários possam te adicionar como amigo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Como funciona?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Compartilhe seu QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Mostre seu QR Code para outros usuários
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Eles escaneiam</h4>
                      <p className="text-sm text-muted-foreground">
                        Quando escanearem, serão conectados automaticamente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Começem a conversar</h4>
                      <p className="text-sm text-muted-foreground">
                        Vocês se tornam amigos e podem conversar na plataforma
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
