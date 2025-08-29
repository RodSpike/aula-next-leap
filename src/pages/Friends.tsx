
import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FriendChat } from "@/components/FriendChat";
import { 
  Users, 
  UserPlus, 
  QrCode, 
  Camera, 
  Search,
  Check,
  X,
  Copy,
  MessageCircle,
  Share2
} from "lucide-react";
import { Link } from "react-router-dom";
import QRCodeReact from "react-qr-code";
import QrScanner from "qr-scanner";

interface Friend {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  requester_profile?: {
    display_name: string;
    username: string;
  };
  requested_profile?: {
    display_name: string;
    username: string;
  };
}

interface UserProfile {
  user_id: string;
  display_name: string;
  username: string;
}

interface FriendProfile extends UserProfile {
  friendship_id: string;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [myQRValue, setMyQRValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (user) {
      generateMyQRCode();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  const generateMyQRCode = () => {
    if (user) {
      const qrData = {
        type: "aula_click_friend",
        platform: "aula_click",
        user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        timestamp: Date.now()
      };
      setMyQRValue(JSON.stringify(qrData));
    }
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`);

      if (error) throw error;

      // Get profile info for each friend
      const friendsWithProfiles = await Promise.all(
        (data || []).map(async (friendship) => {
          const friendId = friendship.requester_id === user.id 
            ? friendship.requested_id 
            : friendship.requester_id;

          const { data: friendProfile } = await supabase
            .from('profiles')
            .select('user_id, display_name, username')
            .eq('user_id', friendId)
            .single();

          return {
            friendship_id: friendship.id,
            user_id: friendId,
            display_name: friendProfile?.display_name || 'Unknown',
            username: friendProfile?.username || 'unknown',
          };
        })
      );

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('requested_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get requester profile info
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', request.requester_id)
            .single();

          return {
            ...request,
            status: request.status as 'pending' | 'accepted' | 'rejected' | 'blocked',
            requester_profile: requesterProfile,
          };
        })
      );

      setFriendRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchUsername.trim()) return;

    try {
      const { data, error } = await supabase
        .rpc('search_profiles_public', { search_term: searchUsername });

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
      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user.id,
          requested_id: targetUserId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Aviso",
            description: "Solicitação de amizade já enviada.",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Solicitação de amizade enviada!",
        });
        setSearchResults([]);
        setSearchUsername("");
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar solicitação de amizade.",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (friendId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: status === 'accepted' ? "Amizade aceita!" : "Solicitação rejeitada.",
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

  const startScanning = async () => {
    if (videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        videoRef.current.srcObject = stream;
        
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => handleQRResult(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        
        await qrScannerRef.current.start();
        setIsScannerOpen(true);
      } catch (error) {
        console.error('Error starting camera:', error);
        toast({
          title: "Erro",
          description: "Não foi possível acessar a câmera.",
          variant: "destructive",
        });
      }
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
    }
    setIsScannerOpen(false);
  };

  const handleQRResult = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData);
      if (data.type === 'aula_click_friend' && 
          data.platform === 'aula_click' && 
          data.user_id && 
          data.user_id !== user?.id) {
        await sendFriendRequest(data.user_id);
        stopScanning();
      } else {
        toast({
          title: "QR Code inválido",
          description: "Este QR code não é válido para o Aula Click.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "QR Code inválido",
        description: "Formato de QR code não reconhecido.",
        variant: "destructive",
      });
    }
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(myQRValue);
      toast({
        title: "Copiado!",
        description: "QR code copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar QR code.",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Adicione-me no Aula Click!',
          text: 'Escaneie este QR code para me adicionar como amigo no Aula Click',
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyQRCode();
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
              <h3 className="text-lg font-semibold mb-2">Sistema de Amigos</h3>
              <p className="text-muted-foreground mb-4">
                Entre para acessar o sistema de amigos e conectar-se com outros usuários.
              </p>
              <Button asChild>
                <Link to="/login">Entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-subtle py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Sistema de Amigos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conecte-se com outros estudantes, compartilhe seu progresso e pratique inglês juntos.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar
              {friendRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meus Amigos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {friend.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{friend.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedFriend(friend)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Você ainda não tem amigos.</p>
                    <p className="text-sm text-muted-foreground">Use o QR code ou busque por nome de usuário!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Friends */}
          <TabsContent value="add" className="space-y-6">
            {/* Search by Username */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar por Nome de Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o nome de usuário..."
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    />
                  </div>
                  <Button onClick={searchUsers}>Buscar</Button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((profile) => (
                      <div key={profile.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {profile.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
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

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Amizade ({friendRequests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {request.requester_profile?.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{request.requester_profile?.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{request.requester_profile?.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => respondToFriendRequest(request.id, 'accepted')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => respondToFriendRequest(request.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QR Code */}
          <TabsContent value="qr" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* My QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Meu QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center p-6 bg-white rounded-lg border">
                    <QRCodeReact value={myQRValue} size={200} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Compartilhe este QR code para outros usuários te adicionarem
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={copyQRCode} variant="outline" className="flex-1">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button onClick={shareQRCode} variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scan QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Escanear QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para abrir a câmera
                        </p>
                      </div>
                    </div>
                    <Button onClick={startScanning} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Escanear QR Code
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o QR code de um amigo para adicionar instantaneamente
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-80 max-w-[90vw]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Escanear QR Code
                <Button variant="ghost" size="sm" onClick={stopScanning}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-lg"
                  autoPlay
                  playsInline
                />
                <p className="text-sm text-muted-foreground text-center">
                  Aponte a câmera para o QR code do Aula Click
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
