import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gift, BookOpen, Bot, Mic, Users, Trophy, CheckCircle2,
  Sparkles, GraduationCap, MessageSquare, Star, ArrowDown, Shield
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ReferralLanding() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const [teacherName, setTeacherName] = useState<string | null>(null);

  usePageMeta({
    title: "Indicação Especial - Aula Click",
    description: "Você foi indicado por um professor parceiro. Aproveite condições especiais para aprender inglês com IA.",
    keywords: "indicação professor, desconto aula click, aprender inglês",
    canonicalPath: `/signup?ref=${referralCode}`,
  });

  useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem("teacher_referral_code", referralCode);
      supabase
        .from("teacher_affiliates")
        .select("full_name")
        .eq("referral_code", referralCode)
        .eq("status", "approved")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setTeacherName(data.full_name);
        });
    }
  }, [referralCode]);

  const features = [
    {
      icon: BookOpen,
      title: "Material Didático Exclusivo",
      description: "Cursos do A1 ao C2 com conteúdo interativo, áudio nativo e exercícios práticos criados por especialistas.",
    },
    {
      icon: Bot,
      title: "Tutor com Inteligência Artificial",
      description: "Tire dúvidas 24h por dia com um tutor IA que entende seu nível e adapta as respostas para você.",
    },
    {
      icon: Mic,
      title: "AI Speech Tutor",
      description: "Converse por áudio com um professor IA! Pratique pronúncia, fluência e receba feedback instantâneo — como uma aula particular.",
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Participe de grupos por nível, interaja com outros alunos e pratique inglês em um ambiente colaborativo.",
    },
    {
      icon: Trophy,
      title: "Gamificação e Conquistas",
      description: "Ganhe XP, suba de nível, desbloqueie conquistas e participe de desafios semanais para se manter motivado.",
    },
    {
      icon: GraduationCap,
      title: "Certificados de Conclusão",
      description: "Receba certificados ao concluir cursos para comprovar seu progresso e evolução no inglês.",
    },
  ];

  const plans = [
    {
      name: "Mensal",
      price: "R$ 99,90",
      period: "/mês",
      monthly: "R$ 99,90/mês",
    },
    {
      name: "Semestral",
      price: "R$ 479,52",
      period: "/6 meses",
      monthly: "R$ 79,92/mês",
      badge: "20% OFF",
      popular: true,
    },
    {
      name: "Anual",
      price: "R$ 838,44",
      period: "/ano",
      monthly: "R$ 69,87/mês",
      badge: "30% OFF",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Referral Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2.5 mb-6">
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">
              Indicação de Professor{teacherName ? `: ${teacherName}` : ""}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
            Aprenda inglês de verdade com{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              condições especiais
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Você foi indicado por {teacherName ? `professor(a) ${teacherName}` : "um professor parceiro"}.
            Aproveite acesso completo à plataforma com material exclusivo, tutoria com IA e muito mais.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {["Tutor IA 24h", "Aulas por áudio", "Material interativo", "Certificados"].map((item) => (
              <Badge key={item} variant="secondary" className="px-3 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {item}
              </Badge>
            ))}
          </div>

          <Button size="lg" variant="hero" className="text-lg px-8 py-6" asChild>
            <a href="#cadastro">
              <Sparkles className="mr-2 h-5 w-5" />
              Quero começar agora
              <ArrowDown className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Tudo o que você precisa para aprender inglês
            </h2>
            <p className="text-muted-foreground text-lg">
              Uma plataforma completa com tecnologia de ponta
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Speech Tutor Highlight */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Mic className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div>
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                    <Star className="h-3 w-3 mr-1" /> Destaque
                  </Badge>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    AI Speech Tutor — Fale com um professor IA por áudio
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Imagine ter um professor particular disponível a qualquer hora. Com o AI Speech Tutor,
                    você simplesmente fala pelo microfone e o professor IA responde em tempo real,
                    corrigindo sua pronúncia, gramática e ajudando na fluência. É como uma aula particular — sem agendamento.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Correção de pronúncia", "Feedback em tempo real", "Prática de conversação", "Sem agendamento"].map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Condições especiais por indicação</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Escolha seu plano
            </h2>
            <p className="text-muted-foreground">
              Acesso completo a todos os recursos. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative transition-all duration-300 ${
                  plan.popular
                    ? "border-primary shadow-xl scale-[1.02] ring-2 ring-primary/20"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                {plan.badge && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8 text-center">
                  <h3 className="font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{plan.monthly}</p>
                  <ul className="text-sm text-left space-y-2 mb-6">
                    {[
                      "Todos os cursos (A1–C2)",
                      "Tutor IA ilimitado",
                      "AI Speech Tutor",
                      "Comunidade e grupos",
                      "Exercícios interativos",
                      "Certificados",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Signup CTA */}
      <section id="cadastro" className="py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
            <Gift className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-1">
              Você foi indicado por {teacherName ? `professor(a) ${teacherName}` : "um professor parceiro"}.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Crie sua conta e escolha seu plano para ter acesso completo.
            </p>
            <Button size="lg" variant="hero" className="w-full text-lg py-6" asChild>
              <Link to={`/signup?ref=${referralCode}&form=1`}>
                Criar minha conta
              </Link>
            </Button>
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Seus dados estão seguros. Cancele a qualquer momento.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Alunos ativos" },
              { value: "50+", label: "Lições interativas" },
              { value: "24/7", label: "Tutor IA disponível" },
              { value: "A1–C2", label: "Todos os níveis" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Aula Click — Plataforma de aprendizado de inglês com inteligência artificial.
        </p>
      </div>
    </div>
  );
}
