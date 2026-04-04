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
import { CheckCircle, XCircle, Clock, GraduationCap, Users, DollarSign, Loader2, UserPlus, Copy, Link2 } from "lucide-react";
export function TeacherAffiliatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("teacher_affiliates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Professor ${status === "approved" ? "aprovado" : "rejeitado"}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-affiliates"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
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
  const others = affiliates?.filter(a => a.status !== "pending") || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xl font-bold">{affiliates?.reduce((sum, a) => sum + a.total_referrals, 0) || 0}</p>
              <p className="text-xs text-muted-foreground">Total Indicações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
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
                      {a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                      {a.cpf_verified && <Badge variant="outline" className="ml-2 text-green-600">✓</Badge>}
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
                <TableHead>Código</TableHead>
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
                  <TableCell className="font-mono text-sm">{a.referral_code}</TableCell>
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
