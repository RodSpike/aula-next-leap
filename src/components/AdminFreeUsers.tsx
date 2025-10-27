import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, UserMinus, Users } from "lucide-react";

interface FreeUser {
  id: string;
  email: string;
  active: boolean;
  granted_by: string;
  created_at: string;
  admin_email?: string;
}

export function AdminFreeUsers() {
  const [freeUsers, setFreeUsers] = useState<FreeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

      // Get admin emails for each granted_by user
      const usersWithAdminInfo = await Promise.all(
        (freeUsersData || []).map(async (user) => {
          const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', user.granted_by)
            .maybeSingle();

          return {
            ...user,
            admin_email: adminProfile?.email || 'Sistema'
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

  const handleRevokeFreeAccess = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('revoke-free-access', {
        body: { email: email.toLowerCase() }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Acesso gratuito revogado com sucesso"
      });

      fetchFreeUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao revogar acesso gratuito",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <CardTitle>Usuários com Acesso Gratuito</CardTitle>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Conceder Acesso</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conceder Acesso Gratuito</DialogTitle>
              <DialogDescription>
                Digite o email do usuário para conceder acesso gratuito à plataforma.
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
                <TableHead>Concedido por</TableHead>
                <TableHead>Data</TableHead>
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
                  <TableCell>{user.admin_email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {user.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeFreeAccess(user.email)}
                        className="flex items-center space-x-1"
                      >
                        <UserMinus className="h-3 w-3" />
                        <span>Revogar</span>
                      </Button>
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