import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User, Chrome, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const { signUp, signInWithGoogle, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Não redirecionar automaticamente: permite sair e criar outra conta nesta página
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: "Erro",
        description: "Nome de usuário deve conter apenas letras, números e underscore.",
        variant: "destructive",
      });
      return;
    }

    if (formData.username.length < 3) {
      toast({
        title: "Erro",
        description: "Nome de usuário deve ter pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem!",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, formData.name, formData.username);
      
      if (error) {
        let errorMessage = "Erro ao criar conta. Tente novamente.";
        
        if (error.message === "User already registered") {
          errorMessage = "Este email já está cadastrado. Se você já tem uma conta, clique em 'Fazer login' abaixo.";
        }
        
        toast({
          title: "Erro no cadastro", 
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email e clique no link de confirmação para fazer login.",
          duration: 8000,
        });
        
        // Don't redirect immediately, let user confirm email first
        // They will be redirected after email confirmation
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!formData.agreeToTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: "Erro ao criar conta com Google. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Gift className="h-6 w-6 text-primary" />
              <span className="bg-gradient-primary bg-clip-text text-transparent font-semibold">
                7 DIAS GRÁTIS
              </span>
            </div>
            <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
            <p className="text-muted-foreground">
              Comece sua jornada de aprendizado hoje mesmo
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {user && (
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm mb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">Você já está logado</div>
                    <p className="text-blue-800 dark:text-blue-200">Se deseja criar outra conta, saia primeiro.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dashboard">Ir para o Dashboard</Link>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={async () => { await signOut(); toast({ title: "Saiu da conta", description: "Agora você pode criar uma nova conta." }); }}>
                      Sair e criar outra conta
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Google Signup Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continuar com Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou cadastre-se com email
                </span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="@seunomeusuario"
                    className="pl-10"
                    value={formData.username}
                    onChange={handleInputChange("username")}
                    required
                    minLength={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Apenas letras, números e underscore. Mínimo 3 caracteres.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  Aceito os{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    termos de uso
                  </Link>{" "}
                  e{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    política de privacidade
                  </Link>
                </Label>
              </div>
              
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Começar Teste Grátis"}
              </Button>
            </form>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link to="/login" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </div>
            
            {/* Trial Info */}
            <div className="bg-accent/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                ✓ 7 dias de acesso completo grátis<br />
                ✓ Sem compromisso • Cancele quando quiser
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}