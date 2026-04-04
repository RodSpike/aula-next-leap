import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, GraduationCap, Users, Loader2, UserPlus, Copy } from "lucide-react";

export function TeacherAffiliatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "" });
  const [creating, setCreating] = useState(false);

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin-teacher-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get teachers with role but no affiliate record
  const { data: teachersWithoutAffiliate } = useQuery({
    queryKey: ["teachers-without-affiliate", affiliates],
    queryFn: async () => {
      // Get all users with teacher role
      const { data: teacherRoles } = await supabase
        .from("user_roles" as any)
        .select("user_id")
        .eq("role", "teacher");
      
      if (!teacherRoles || teacherRoles.length === 0) return [];
      
      const affiliateUserIds = new Set(affiliates?.map(a => a.user_id) || []);
      const missingIds = (teacherRoles as any[])
        .map((r: any) => r.user_id)
        .filter((id: string) => !affiliateUserIds.has(id));
      
      if (missingIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", missingIds);
      
      return profiles || [];
    },
    enabled: !!affiliates,
  });

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("teacher_affiliates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Professor ${status === "approved" ? "aprovado" : status === "suspended" ? "suspenso" : "atualizado"}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-affiliates"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const createAffiliateForTeacher = async (userId: string, fullName: string) => {
    setActionLoading(userId);
    try {
      const referralCode = `PROF${userId.substring(0, 6).toUpperCase()}`;
      const { error } = await supabase
        .from("teacher_affiliates")
        .insert({
          user_id: userId,
          full_name: fullName,
          cpf: "",
          referral_code: referralCode,
          commission_rate: 20,
          status: "approved",
        });
      if (error) throw error;
      toast({ title: "Sucesso", description: `Afiliado criado para ${fullName}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-without-affiliate"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateManual = async () => {
    if (!createForm.fullName.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Find user by email if provided
      let userId: string | null = null;
      if (createForm.email.trim()) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", createForm.email.trim().toLowerCase())
          .maybeSingle();
        userId = profile?.user_id || null;
      }

      if (!userId && createForm.email.trim()) {
        toast({ title: "Erro", description: "Usuário não encontrado com esse e-mail.", variant: "destructive" });
        setCreating(false);
        return;
      }

      const referralCode = `PROF${(userId || Date.now().toString()).substring(0, 6).toUpperCase()}`;
      
      const insertData: any = {
        full_name: createForm.fullName.trim(),
        cpf: "",
        referral_code: referralCode,
        commission_rate: 20,
        status: "approved",
      };
      
      if (userId) {
        insertData.user_id = userId;
        // Also promote to teacher role if not already
        await supabase.rpc("admin_promote_to_teacher", { target_user_id: userId });
      }

      const { error } = await supabase.from("teacher_affiliates").insert(insertData);
      if (error) throw error;

      toast({ title: "Professor adicionado!", description: `${createForm.fullName} foi cadastrado como afiliado.` });
      setCreateForm({ fullName: "", email: "" });
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-affiliates"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Link de indicação copiado." });
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      approved: { label: "Aprovado", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      suspended: { label: "Suspenso", variant: "destructive" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const pending = affiliates?.filter(a => a.status === "pending") || [];

  return (
    <div className="space-y-6">
      {/* Stats + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{affiliates?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Professores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{affiliates?.reduce((sum, a) => sum + a.total_referrals, 0) || 0}</p>
                <p className="text-xs text-muted-foreground">Total Indicações</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Teachers with role but no affiliate - auto-fix */}
      {teachersWithoutAffiliate && teachersWithoutAffiliate.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Professores sem registro de afiliado ({teachersWithoutAffiliate.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Estes usuários têm a role de professor mas não possuem link/código de indicação. Clique para criar.
            </p>
            <div className="space-y-2">
              {teachersWithoutAffiliate.map((p: any) => (
                <div key={p.user_id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="text-sm font-medium">{p.display_name || p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createAffiliateForTeacher(p.user_id, p.display_name || p.email)}
                    disabled={actionLoading === p.user_id}
                  >
                    {actionLoading === p.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Criar Afiliado"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add teacher manually */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Professor Afiliado
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Professor Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo *</Label>
              <Input
                value={createForm.fullName}
                onChange={(e) => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Nome do professor"
              />
            </div>
            <div>
              <Label>E-mail do usuário (opcional)</Label>
              <Input
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se informado, vincula ao usuário existente e concede role de professor automaticamente.
              </p>
            </div>
            <Button onClick={handleCreateManual} disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Criar Afiliado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Aprovações Pendentes ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {a.cpf ? a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "-"}
                      {a.cpf_verified && <Badge variant="outline" className="ml-2 text-primary">✓</Badge>}
                    </TableCell>
                    <TableCell>{a.specialties?.join(", ") || "-"}</TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(a.id, "approved")}
                          disabled={actionLoading === a.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(a.id, "rejected")}
                          disabled={actionLoading === a.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All affiliates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos os Professores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Código / Link</TableHead>
                <TableHead>Indicações</TableHead>
                <TableHead>Ganhos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(affiliates || []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{a.referral_code}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyLink(a.referral_code)}
                        title="Copiar link de indicação"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{a.total_referrals}</TableCell>
                  <TableCell>R$ {Number(a.total_earnings).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {a.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "suspended")}>
                          Suspender
                        </Button>
                      )}
                      {a.status === "suspended" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "approved")}>
                          Reativar
                        </Button>
                      )}
                      {a.status === "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "approved")}>
                          Aprovar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}