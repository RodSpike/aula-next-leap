import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Users, Eye, EyeOff } from "lucide-react";

interface FreeUser {
  id: string;
  email: string;
  active: boolean;
  granted_by: string;
  created_at: string;
  admin_email?: string;
  registration_status: 'pending' | 'registered';
  registered_at?: string;
  user_id?: string;
}

export function AdminFreeUsers() {
  const [freeUsers, setFreeUsers] = useState<FreeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFreeUsers();
  }, []);

  const fetchFreeUsers = async () => {
    try {
      setLoading(true);
      
      const { data: freeUsersData, error } = await supabase
        .from('admin_free_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get admin emails and registration status for each user
      const usersWithAdminInfo = await Promise.all(
        (freeUsersData || []).map(async (user) => {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', user.granted_by)
            .maybeSingle();

          // Check if the free user has registered
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('user_id, created_at')
            .eq('email', user.email)
            .maybeSingle();

          return {
            ...user,
            admin_email: adminProfile?.email || 'Sistema',
            registration_status: userProfile ? 'registered' as const : 'pending' as const,
            registered_at: userProfile?.created_at,
            user_id: userProfile?.user_id
          };
        })
      );

      setFreeUsers(usersWithAdminInfo);
    } catch (error) {
      console.error('Error fetching free users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários com acesso gratuito",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantFreeAccess = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('grant-free-access', {
        body: { email: newUserEmail.toLowerCase().trim() }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Acesso gratuito concedido com sucesso"
      });

      setNewUserEmail("");
      setIsDialogOpen(false);
      fetchFreeUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conceder acesso gratuito",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async (email: string) => {
    if (!confirm(`⚠️ ATENÇÃO: Isso irá:\n\n1. DELETAR completamente a conta do usuário ${email}\n2. Remover o acesso gratuito\n3. Forçar o usuário a se registrar novamente e PAGAR\n\nDeseja continuar?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('revoke-free-access', {
        body: { email: email.toLowerCase(), delete_account: true }
      });

      if (error) throw error;

      toast({
        title: "✅ Conta deletada",
        description: `Conta de ${email} foi deletada. Usuário deve se registrar novamente e pagar.`,
      });

      fetchFreeUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar conta",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFreeAccessOnly = async (email: string) => {
    if (!confirm(`⚠️ ATENÇÃO: Isso irá:\n\n1. Manter a conta do usuário ${email}\n2. Remover APENAS o acesso gratuito\n3. Forçar o usuário a PAGAR no próximo login\n\nDeseja continuar?`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('revoke-free-access', {
        body: { email: email.toLowerCase(), delete_account: false }
      });

      if (error) throw error;

      toast({
        title: "✅ Acesso gratuito removido",
        description: `${email} deverá pagar no próximo login.`,
      });

      fetchFreeUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover acesso gratuito",
        variant: "destructive"
      });
    }
  };

  const handleCreateFreeUser = async () => {
    const { email, name, password } = createUserForm;

    if (!email.trim() || !name.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const { data, error } = await supabase.functions.invoke('admin-create-free-user', {
        body: { 
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password 
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Conta criada com sucesso!",
        description: `Compartilhe as credenciais com o usuário:\nEmail: ${email}\nSenha: ${password}\n\nO usuário pode alterá-la em Configurações.`,
      });

      setCreateUserForm({ email: "", name: "", password: "" });
      setIsCreateDialogOpen(false);
      fetchFreeUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <CardTitle>Usuários com Acesso Gratuito</CardTitle>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2" variant="default">
                <UserPlus className="h-4 w-4" />
                <span>Criar Conta Gratuita</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Conta de Usuário Gratuito</DialogTitle>
                <DialogDescription>
                  Crie uma conta diretamente para o usuário. Ele poderá fazer login imediatamente sem precisar se registrar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    placeholder="email@example.com"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    type="email"
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Nome Completo</Label>
                  <Input
                    id="create-name"
                    placeholder="João Silva"
                    value={createUserForm.name}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-password">Senha Inicial</Label>
                  <div className="relative">
                    <Input
                      id="create-password"
                      placeholder="Mínimo 6 caracteres"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                      type={showPassword ? "text" : "password"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O usuário pode alterar esta senha nas Configurações
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFreeUser} disabled={creating}>
                  {creating ? "Criando..." : "Criar Conta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2" variant="outline">
                <UserPlus className="h-4 w-4" />
                <span>Conceder Acesso</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conceder Acesso Gratuito</DialogTitle>
                <DialogDescription>
                  Digite o email do usuário para conceder acesso gratuito. O usuário ainda precisa se registrar normalmente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="email@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  type="email"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGrantFreeAccess}>
                  Conceder Acesso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : freeUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário com acesso gratuito encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Concedido por</TableHead>
                <TableHead>Data Concessão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freeUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.registration_status === 'registered' ? "default" : "outline"}>
                      {user.registration_status === 'registered' 
                        ? `Registrado: ${new Date(user.registered_at!).toLocaleDateString('pt-BR')}`
                        : "Pendente Registro"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.admin_email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {user.active && (
                      <div className="flex gap-2">
                        {user.registration_status === 'registered' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAccount(user.email)}
                            className="flex items-center space-x-1"
                          >
                            <UserMinus className="h-3 w-3" />
                            <span>Deletar Conta</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFreeAccessOnly(user.email)}
                          className="flex items-center space-x-1"
                        >
                          <UserMinus className="h-3 w-3" />
                          <span>Remover Acesso</span>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}