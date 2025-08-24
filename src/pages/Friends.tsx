import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  QrCode, 
  Camera, 
  Search,
  Check,
  X,
  Copy,
  Scan
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

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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
        type: "friend_request",
        user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0]
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
        (data || []).map(async (friend) => {
          const requesterId = friend.requester_id;
          const requestedId = friend.requested_id;

          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', requesterId)
            .single();

          const { data: requestedProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', requestedId)
            .single();

          return {
            ...friend,
            status: friend.status as 'pending' | 'accepted' | 'rejected' | 'blocked',
            requester_profile: requesterProfile,
            requested_profile: requestedProfile,
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
        .from('profiles')
        .select('user_id, display_name, username')
        .ilike('username', `%${searchUsername}%`)
        .neq('user_id', user?.id)
        .limit(10);

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
      if (data.type === 'friend_request' && data.user_id && data.user_id !== user?.id) {
        await sendFriendRequest(data.user_id);
        stopScanning();
      } else {
        toast({
          title: "QR Code inválido",
          description: "Este QR code não é válido para adicionar amigos.",
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

  const copyQRCode = () => {
    navigator.clipboard.writeText(myQRValue);
    toast({
      title: "Copiado!",
      description: "QR code copiado para a área de transferência.",
    });
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
              Conecte-se com outros estudantes, adicione amigos por nome de usuário ou QR code.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Add Friends */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Adicionar Amigos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search by Username */}
                <div className="space-y-3">
                  <h4 className="font-medium">Por Nome de Usuário</h4>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome de usuário..."
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={searchUsers}>Buscar</Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((profile) => (
                        <div key={profile.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
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
                </div>

                {/* QR Code Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Por QR Code</h4>
                  <div className="flex gap-2">
                    <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <QrCode className="h-4 w-4 mr-2" />
                          Meu QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Meu QR Code de Amizade</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center p-4 bg-white rounded-lg">
                            <QRCodeReact value={myQRValue} size={200} />
                          </div>
                          <Button onClick={copyQRCode} className="w-full">
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar QR Code
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button onClick={startScanning} variant="outline" className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Escanear QR
                    </Button>
                  </div>
                </div>
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
                      <div>
                        <p className="font-medium">{request.requester_profile?.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{request.requester_profile?.username}</p>
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
          </div>

          {/* Friends List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meus Amigos ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map((friend) => {
                      const friendProfile = friend.requester_id === user.id 
                        ? friend.requested_profile 
                        : friend.requester_profile;
                      
                      return (
                        <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{friendProfile?.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{friendProfile?.username}</p>
                          </div>
                          <Badge variant="secondary">Amigo</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Você ainda não tem amigos.</p>
                    <p className="text-sm text-muted-foreground">Comece adicionando alguns!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
                  Aponte a câmera para o QR code de um amigo
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}