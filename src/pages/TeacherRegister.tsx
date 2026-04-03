import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import { GraduationCap, Shield, Users, DollarSign, ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
}

export default function TeacherRegister() {
  usePageMeta({
    title: 'Seja um Professor Afiliado - Aula Click',
    description: 'Cadastre-se como professor afiliado na Aula Click e ganhe comissões indicando alunos.',
    canonicalPath: '/teacher/register',
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    cpf: "",
    bio: "",
    specialties: "",
  });
  const [cpfError, setCpfError] = useState("");

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setForm(prev => ({ ...prev, cpf: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11 && !validateCPF(digits)) {
      setCpfError("CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (!validateCPF(cpfDigits)) {
      setCpfError("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const referralCode = `prof_${cpfDigits.slice(-4)}_${Date.now().toString(36)}`;
      const specialtiesArray = form.specialties
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const { error } = await supabase.from("teacher_affiliates").insert({
        user_id: user.id,
        full_name: form.fullName,
        cpf: cpfDigits,
        referral_code: referralCode,
        bio: form.bio || null,
        specialties: specialtiesArray,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Erro", description: "Você já possui um cadastro de professor afiliado.", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Cadastro enviado!", description: "Seu cadastro será analisado pela equipe. Você será notificado quando aprovado." });
      navigate("/teacher/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ title: "Erro", description: error.message || "Erro ao cadastrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: DollarSign, text: "Ganhe comissão por cada aluno indicado" },
    { icon: Users, text: "Acesse o Teacher's Guide de todas as lições" },
    { icon: GraduationCap, text: "Material didático profissional" },
    { icon: Shield, text: "Dados protegidos e verificados" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <Link to="/" className="font-bold text-lg text-primary">Aula Click</Link>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <GraduationCap className="h-4 w-4 mr-2" />
            Programa de Afiliados
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Seja um Professor Afiliado</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cadastre-se, compartilhe seu link e ganhe comissões por cada aluno que se inscrever através da sua indicação.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Benefits */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vantagens do Programa</h2>
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 bg-card rounded-lg p-4 border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{b.text}</span>
              </div>
            ))}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-primary mb-2">Como funciona?</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Preencha o cadastro com seu CPF</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Aguarde a aprovação da equipe</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Receba seu link de indicação exclusivo</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Compartilhe e ganhe por cada novo aluno</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Professor</CardTitle>
              <CardDescription>Preencha seus dados para se tornar um afiliado</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Seu nome completo"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    required
                    value={form.cpf}
                    onChange={e => handleCPFChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {cpfError && <p className="text-sm text-destructive mt-1">{cpfError}</p>}
                </div>

                <div>
                  <Label htmlFor="bio">Sobre você</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Fale um pouco sobre sua experiência como professor..."
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="specialties">Especialidades</Label>
                  <Input
                    id="specialties"
                    value={form.specialties}
                    onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))}
                    placeholder="Ex: Inglês, Conversação, Business English"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separe por vírgula</p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || !!cpfError}>
                  {loading ? "Enviando..." : "Enviar Cadastro"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao se cadastrar, você concorda com os termos do programa de afiliados.
                  Seu CPF será verificado para segurança.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
