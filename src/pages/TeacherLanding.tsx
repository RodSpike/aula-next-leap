import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, BookOpen, BarChart3, DollarSign, Monitor,
  Users, CheckCircle, ArrowRight, Star, Sparkles, FileDown
} from "lucide-react";

const benefits = [
  {
    icon: BookOpen,
    title: "Material Didático Completo",
    description: "Planos de aula gerados por IA, conteúdo interativo para compartilhar tela e atividades prontas para aulas online 1-on-1.",
  },
  {
    icon: Monitor,
    title: "Lousa Virtual Integrada",
    description: "Compartilhe sua tela no Google Meet e use nosso material como lousa. Adicione anotações em tempo real durante a aula.",
  },
  {
    icon: FileDown,
    title: "Exportação PDF Pós-Aula",
    description: "Ao final da aula, exporte o material com anotações e respostas em PDF e envie ao aluno como resumo da aula.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    description: "Acompanhe o progresso de cada aluno com relatórios detalhados. Saiba exatamente onde cada aluno precisa melhorar.",
  },
  {
    icon: DollarSign,
    title: "Ganhe Comissão (20%)",
    description: "Receba 20% de comissão por cada aluno que assinar a plataforma através do seu link. A partir do 6º aluno, seu acesso é gratuito.",
  },
  {
    icon: Users,
    title: "Acesso Gratuito com 5 Alunos",
    description: "Indique 5 alunos ativos e seu acesso à plataforma é totalmente gratuito. Sem custos, só benefícios.",
  },
];

const steps = [
  { step: "1", title: "Cadastre-se", description: "Crie sua conta e registre-se como professor afiliado com validação de CPF." },
  { step: "2", title: "Acesse o Material", description: "Explore o Teacher's Guide com planos de aula interativos para todos os níveis." },
  { step: "3", title: "Dê suas Aulas", description: "Use a lousa virtual via Google Meet. Anote, responda exercícios e exporte o PDF." },
  { step: "4", title: "Indique e Ganhe", description: "Compartilhe seu link de indicação e ganhe comissão a cada aluno que assinar." },
];

export default function TeacherLanding() {
  usePageMeta({
    title: "Para Professores - Aula Click | Ganhe Comissão Ensinando Inglês",
    description: "Seja professor parceiro da Aula Click. Material didático com IA, lousa virtual, relatórios de alunos e comissão de 20% por indicação.",
    canonicalPath: "/para-professores",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Programa de Professores Parceiros
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Ensine inglês com
            <span className="text-primary"> tecnologia e IA</span>,
            <br className="hidden md:block" />
            ganhe por cada aluno
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            A Aula Click oferece tudo que você precisa para dar aulas online de qualidade: 
            material didático inteligente, lousa virtual, relatórios automáticos e comissão 
            por indicação. Foque no que importa — ensinar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 text-lg px-8 py-6">
              <Link to="/teacher/register">
                <GraduationCap className="h-5 w-5" />
                Quero ser Professor Parceiro
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
              <a href="#beneficios">
                Ver Benefícios
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">20%</p>
            <p className="text-sm text-muted-foreground">Comissão por aluno</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">A1–C2</p>
            <p className="text-sm text-muted-foreground">Todos os níveis</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">100%</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">IA</p>
            <p className="text-sm text-muted-foreground">Material inteligente</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para dar aulas incríveis
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para professores que querem elevar a qualidade das suas aulas online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-lg text-muted-foreground">
              Em 4 passos simples, você começa a ganhar.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-6 p-6 rounded-xl bg-background border">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Breakdown */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Quanto posso ganhar?
            </h2>
          </div>

          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">1–4 alunos</p>
                  <p className="text-2xl font-bold text-foreground mb-1">7 dias grátis</p>
                  <p className="text-sm text-muted-foreground">Trial de acesso + comissão</p>
                </div>
                <div className="p-8 text-center bg-primary/5">
                  <div className="inline-flex items-center gap-1 bg-primary/15 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">5+ alunos ativos</p>
                  <p className="text-2xl font-bold text-primary mb-1">Acesso Gratuito</p>
                  <p className="text-sm text-muted-foreground">Plataforma 100% grátis pra você</p>
                </div>
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">6+ alunos</p>
                  <p className="text-2xl font-bold text-foreground mb-1">20% comissão</p>
                  <p className="text-sm text-muted-foreground">Por cada mensalidade paga</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Sem taxa de adesão
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Pagamentos mensais
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Painel de controle completo
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para transformar suas aulas?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Cadastre-se agora, é rápido e gratuito. Comece a usar o material e ganhar comissão hoje mesmo.
          </p>
          <Button asChild size="lg" className="gap-2 text-lg px-10 py-6">
            <Link to="/teacher/register">
              <GraduationCap className="h-5 w-5" />
              Cadastrar como Professor
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Aula Click. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}