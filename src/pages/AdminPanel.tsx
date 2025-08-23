import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Calendar,
  Crown,
  AlertTriangle,
  MessageSquare,
  Settings,
  BarChart3,
  Database,
  UserCheck,
  Edit3,
  Eye,
  Ban
} from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
  user_subscriptions: {
    plan: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
  };
  user_roles?: {
    role: string;
  }[];
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  level: string;
  created_by: string;
  is_default: boolean;
  created_at: string;
  member_count?: number;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  role: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

interface GroupPost {
  id: string;
  content: string;
  user_id: string;
  group_id: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
  community_groups: {
    name: string;
  };
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState("Basic");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchGroups(),
      fetchChatMessages(),
      fetchGroupPosts()
    ]);
  };

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsAdmin(!!data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          email,
          created_at,
          user_subscriptions (
            plan,
            trial_ends_at,
            subscription_ends_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user roles separately
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      const transformedUsers = data.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        created_at: profile.created_at,
        profiles: {
          display_name: profile.display_name || ''
        },
        user_subscriptions: Array.isArray(profile.user_subscriptions) && profile.user_subscriptions.length > 0
          ? profile.user_subscriptions[0] 
          : {
              plan: 'free',
              trial_ends_at: null,
              subscription_ends_at: null
            },
        user_roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const fetchChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          content,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get profile data separately
      const userIds = [...new Set(data?.map(msg => msg.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const messagesWithProfiles = (data || []).map(message => ({
        ...message,
        profiles: profilesData?.find(p => p.user_id === message.user_id) || {
          display_name: 'Usuário',
          email: 'Email não encontrado'
        }
      }));

      setChatMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const fetchGroupPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          id,
          content,
          user_id,
          group_id,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get profile and group data separately
      const userIds = [...new Set(data?.map(post => post.user_id) || [])];
      const groupIds = [...new Set(data?.map(post => post.group_id) || [])];
      
      const [{ data: profilesData }, { data: groupsData }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds),
        supabase.from('community_groups').select('id, name').in('id', groupIds)
      ]);

      const postsWithData = (data || []).map(post => ({
        ...post,
        profiles: profilesData?.find(p => p.user_id === post.user_id) || {
          display_name: 'Usuário',
          email: 'Email não encontrado'
        },
        community_groups: groupsData?.find(g => g.id === post.group_id) || {
          name: 'Grupo não encontrado'
        }
      }));

      setGroupPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching group posts:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('community_groups')
        .select(`
          *,
          group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCount = data.map(group => ({
        ...group,
        member_count: group.group_members?.length || 0
      }));

      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const { error } = await supabase
        .from('community_groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          level: newGroupLevel,
          created_by: user.id,
          is_default: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created successfully!",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupLevel("Basic");
      setIsCreateGroupOpen(false);
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group deleted successfully!",
      });

      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar função",
        variant: "destructive",
      });
    }
  };

  const updateUserSubscription = async (userId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          plan,
          subscription_ends_at: plan === 'paid' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano do usuário atualizado!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar plano",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Mensagem deletada!",
      });

      fetchChatMessages();
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar mensagem",
        variant: "destructive",
      });
    }
  };

  const deleteGroupPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Post deletado!",
      });

      fetchGroupPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar post",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatus = (subscription: any) => {
    if (subscription.plan === 'paid') {
      return { status: 'Paid', color: 'bg-green-100 text-green-800' };
    }
    
    if (subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        return { status: 'Free Trial', color: 'bg-blue-100 text-blue-800' };
      }
    }
    
    return { status: 'Free', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to access the admin panel.
              </p>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have admin privileges to access this panel.
              </p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Crown className="h-12 w-12 text-yellow-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Painel Administrativo
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Controle total da plataforma Aula Click.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Usuários Pagos</p>
                      <p className="text-2xl font-bold">
                        {users.filter(u => u.user_subscriptions.plan === 'paid').length}
                      </p>
                    </div>
                    <Crown className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Grupos da Comunidade</p>
                      <p className="text-2xl font-bold">{groups.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mensagens de Chat</p>
                      <p className="text-2xl font-bold">{chatMessages.length}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{user.profiles.display_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline">
                          {new Date(user.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atividade de Chat Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chatMessages.slice(0, 5).map((message) => (
                      <div key={message.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium">{message.profiles?.display_name || 'Usuário'}</p>
                          <Badge variant={message.role === 'user' ? 'secondary' : 'default'}>
                            {message.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const subscription = getSubscriptionStatus(user.user_subscriptions);
                      const userRole = user.user_roles?.[0]?.role || 'user';
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.profiles.display_name || 'Sem nome'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.user_subscriptions.plan}
                              onValueChange={(value) => updateUserSubscription(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Gratuito</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={userRole}
                              onValueChange={(value) => updateUserRole(user.id, value as 'user' | 'admin')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens de Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium">{message.profiles?.display_name || 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground">{message.profiles?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={message.role === 'user' ? 'secondary' : 'default'}>
                              {message.role}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMessage(message.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Posts de Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {groupPosts.map((post) => (
                      <div key={post.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium">{post.profiles?.display_name || 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.community_groups?.name} • {post.profiles?.email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteGroupPost(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciamento de Grupos</CardTitle>
                  <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Grupo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Grupo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Nome do grupo"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <Textarea
                          placeholder="Descrição do grupo"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                        />
                        <Select value={newGroupLevel} onValueChange={setNewGroupLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Básico">Básico</SelectItem>
                            <SelectItem value="Intermediário">Intermediário</SelectItem>
                            <SelectItem value="Avançado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={createGroup} className="w-full">
                          Criar Grupo
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          <div>
                            {group.name}
                            {group.is_default && (
                              <Badge variant="secondary" className="ml-2">Padrão</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{group.level}</TableCell>
                        <TableCell>{group.member_count || 0}</TableCell>
                        <TableCell>
                          {new Date(group.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {!group.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteGroup(group.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Banco</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>Usuários</span>
                    <span className="font-bold">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>Grupos</span>
                    <span className="font-bold">{groups.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>Mensagens de Chat</span>
                    <span className="font-bold">{chatMessages.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>Posts de Grupos</span>
                    <span className="font-bold">{groupPosts.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={fetchAllData} 
                    className="w-full"
                    variant="outline"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Recarregar Todos os Dados
                  </Button>
                  <Button 
                    onClick={() => {
                      if (confirm("Tem certeza? Isto irá recarregar todas as tabelas.")) {
                        fetchAllData();
                      }
                    }}
                    className="w-full"
                    variant="secondary"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Sincronizar Database
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Nome da Plataforma:</span>
                        <span className="font-medium">Aula Click</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Admin:</span>
                        <span className="font-medium">luccadtoledo@gmail.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuários Registrados:</span>
                        <span className="font-medium">{users.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="default">Online</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Controles Admin</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => toast({
                          title: "Configurações",
                          description: "Painel de configurações em desenvolvimento",
                        })}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações Avançadas
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => toast({
                          title: "Logs",
                          description: "Sistema de logs em desenvolvimento",
                        })}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Logs do Sistema
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => toast({
                          title: "Backup",
                          description: "Sistema de backup em desenvolvimento",
                        })}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Backup de Dados
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}