import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  GraduationCap, Users, DollarSign, Copy, ExternalLink,
  ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, Loader2, Save,
  Info, UserPlus, Link2, Share2, Eye, EyeOff
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeacherDashboard() {
  usePageMeta({
    title: 'Painel do Professor - Aula Click',
    description: 'Gerencie suas indicações, visualize comissões e acesse o Teacher\'s Guide.',
    canonicalPath: '/teacher/dashboard',
  });

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return data === true;
    },
    enabled: !!user,
  });

  const { data: isTeacher, isLoading: teacherLoading } = useQuery({
    queryKey: ["is-teacher", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'teacher' });
      return data === true;
    },
    enabled: !!user,
  });

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ["teacher-affiliate", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("teacher_affiliates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      
      // Auto-create affiliate record for teachers/admins who don't have one
      if (!data && (isAdmin || isTeacher)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", user.id)
          .single();
        
        const referralCode = `PROF${user.id.substring(0, 6).toUpperCase()}`;
        const { data: newAffiliate, error: insertError } = await supabase
          .from("teacher_affiliates")
          .insert({
            user_id: user.id,
            full_name: profile?.display_name || profile?.email || user.email || "Professor",
            cpf: "",
            referral_code: referralCode,
            commission_rate: 20,
            status: "approved",
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("Error auto-creating affiliate:", insertError);
          return null;
        }
        return newAffiliate;
      }
      
      return data;
    },
    enabled: !!user && !adminLoading && !teacherLoading,
  });

  const { data: referrals } = useQuery({
    queryKey: ["teacher-referrals", affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return [];
      const { data, error } = await supabase
        .from("teacher_referrals")
        .select("*")
        .eq("teacher_id", affiliate.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!affiliate,
  });

  const { data: courses } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, level, course_type, admin_only")
        .or("admin_only.is.null,admin_only.eq.false")
        .order("order_index");
      if (error) throw error;
      return data || [];
    },
  });

  const rolesLoading = adminLoading || teacherLoading;

  if (authLoading || isLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins and teachers can access even without affiliate record
  if (!affiliate && !isAdmin && !isTeacher) {
    return <Navigate to="/teacher/register" replace />;
  }

  const referralUrl = affiliate ? `${window.location.origin}/signup?ref=${affiliate.referral_code}` : '';

  const copyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    toast({ title: "Link copiado!", description: "Compartilhe com seus alunos." });
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: any }> = {
    pending: { label: "Aguardando Aprovação", variant: "secondary", icon: Clock },
    approved: { label: "Aprovado", variant: "default", icon: CheckCircle },
    rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
    suspended: { label: "Suspenso", variant: "destructive", icon: XCircle },
  };

  const status = affiliate ? (statusConfig[affiliate.status] || statusConfig.pending) : statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <span className="font-bold text-lg text-primary">Painel do Professor</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {/* Status + Name */}
        {affiliate && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {affiliate.full_name.split(" ")[0]}!</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={status.variant}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {affiliate.cpf_verified && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  CPF Verificado
                </Badge>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Admin greeting when no affiliate */}
        {!affiliate && isAdmin && (
          <div>
            <h1 className="text-2xl font-bold">Painel do Professor</h1>
            <p className="text-muted-foreground">Acesso administrativo aos guias e materiais didáticos.</p>
          </div>
        )}

        {/* Teacher's Guide - Course List (NOW AT THE TOP) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Teacher's Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse o guia do professor para cada lição. Material didático com planos de aula, atividades e dicas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses?.map((course) => (
                <Link
                  key={course.id}
                  to={`/teacher/guide/${course.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.level}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Management Section - with visibility toggle */}
        {affiliate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Gerenciamento de Indicações</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                className="gap-2"
              >
                {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSensitiveInfo ? "Ocultar dados" : "Mostrar dados"}
              </Button>
            </div>

            {showSensitiveInfo && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{affiliate.total_referrals}</p>
                        <p className="text-sm text-muted-foreground">Alunos Indicados</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          R$ {Number(affiliate.total_earnings).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{affiliate.commission_rate}%</p>
                        <p className="text-sm text-muted-foreground">Taxa de Comissão</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Link */}
                {referralUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Seu Link e Código de Indicação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Link de indicação</Label>
                        <div className="flex gap-2 mt-1">
                          <div className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm font-mono truncate">
                            {referralUrl}
                          </div>
                          <Button onClick={copyLink} variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Código de indicação</Label>
                        <div className="flex gap-2 mt-1">
                          <div className="bg-muted rounded-lg px-4 py-2 text-sm font-mono">
                            {affiliate.referral_code}
                          </div>
                          <Button onClick={() => {
                            navigator.clipboard.writeText(affiliate.referral_code);
                            toast({ title: "Código copiado!" });
                          }} variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Compartilhe o link ou código com seus alunos. Cada inscrição gera comissão para você.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* How it works */}
                <Card className="border-primary/20">
                  <CardHeader className="bg-primary/5 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Como funciona o sistema de indicações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <UserPlus className="h-4 w-4 text-primary" />
                        Novo aluno — Como se cadastrar pelo seu link
                      </h3>
                      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                        <li>Compartilhe seu <strong>link de indicação</strong> (acima) com o aluno via WhatsApp, e-mail ou redes sociais.</li>
                        <li>O aluno abre o link e é direcionado para a página de cadastro com seu código já vinculado.</li>
                        <li>Ao criar a conta, o aluno fica automaticamente vinculado a você como professor indicador.</li>
                        <li>Você pode acompanhar as indicações na seção "Indicações Recentes" abaixo.</li>
                      </ol>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <Link2 className="h-4 w-4 text-primary" />
                        Aluno já cadastrado — Como vincular a você
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Se um aluno já possui conta na plataforma, ele pode se vincular a você de duas formas:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>O aluno acessa seu <strong>link de indicação</strong> e faz login — o sistema reconhece o código e registra o vínculo.</li>
                          <li>Ou informe seu <strong>código de indicação</strong> (<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{affiliate.referral_code}</code>) para que o aluno insira na plataforma.</li>
                        </ol>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Regras de comissão e acesso
                      </h3>
                      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                        <li>O <strong>primeiro mês</strong> é obrigatório (taxa reduzida para professores).</li>
                        <li>A partir do <strong>segundo mês</strong>, com <strong>5 alunos ativos</strong> vinculados, seu acesso mensal é <strong>gratuito</strong>.</li>
                        <li>A partir do <strong>6º aluno</strong>, você recebe <strong>20% do valor pago</strong> por cada aluno extra, enquanto a conta dele estiver ativa.</li>
                        <li>Exemplo: 7 alunos → 5 garantem seu acesso gratuito + 20% de comissão sobre os 2 alunos adicionais.</li>
                        <li>Cadastre sua <strong>chave PIX</strong> abaixo para receber os pagamentos.</li>
                      </ul>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <Share2 className="h-4 w-4 text-primary" />
                        Dicas para compartilhar
                      </h3>
                      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                        <li>Compartilhe o link nas suas redes sociais e grupos de WhatsApp.</li>
                        <li>Na comunidade da plataforma, alunos veem sua <strong>tag de Professor</strong> — isso gera confiança e contatos para aulas particulares.</li>
                        <li>Se tiver inatividade (0 alunos por 2 meses), seu acesso volta ao valor padrão de aluno.</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* PIX Key */}
                <PixKeyCard affiliateId={affiliate.id} currentPixKey={(affiliate as any).pix_key} />

                {/* Recent Referrals */}
                {referrals && referrals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Indicações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {referrals.slice(0, 10).map((ref: any) => (
                          <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium">{ref.referred_email || "Aluno"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(ref.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant={ref.status === "converted" ? "default" : "secondary"}>
                              {ref.status === "converted" ? "Convertido" : "Pendente"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PixKeyCard({ affiliateId, currentPixKey }: { affiliateId: string; currentPixKey?: string | null }) {
  const [pixKey, setPixKey] = useState(currentPixKey || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const savePixKey = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("teacher_affiliates")
        .update({ pix_key: pixKey.trim() || null } as any)
        .eq("id", affiliateId);
      if (error) throw error;
      toast({ title: "Chave PIX salva!", description: "Sua chave PIX foi atualizada com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Chave PIX para Comissões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Cadastre sua chave PIX para receber o pagamento das comissões.
        </p>
        <div className="flex gap-2">
          <Input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className="flex-1"
          />
          <Button onClick={savePixKey} disabled={saving} variant="outline">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
