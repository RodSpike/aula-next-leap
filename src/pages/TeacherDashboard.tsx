import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  GraduationCap, Users, DollarSign, Copy, ExternalLink,
  ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
      return data;
    },
    enabled: !!user,
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

        {/* Stats */}
        {affiliate && (
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
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
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
        )}

        {/* Referral Link */}
        {affiliate?.status === "approved" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seu Link de Indicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm font-mono truncate">
                  {referralUrl}
                </div>
                <Button onClick={copyLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Compartilhe este link com seus alunos. Cada inscrição gera comissão para você.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Teacher's Guide - Course List */}
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
    </div>
  );
}
