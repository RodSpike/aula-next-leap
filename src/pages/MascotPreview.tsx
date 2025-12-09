import { FoxMascot, FoxMood } from "@/components/mascot/FoxMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const MascotPreview = () => {
  const moods: { mood: FoxMood; label: string; description: string }[] = [
    { mood: "happy", label: "Feliz 😊", description: "Estado padrão, acolhedor" },
    { mood: "excited", label: "Animado 🤩", description: "Quando usuário acerta exercício" },
    { mood: "thinking", label: "Pensando 🤔", description: "Quando usuário está respondendo" },
    { mood: "waving", label: "Acenando 👋", description: "Boas-vindas na landing" },
    { mood: "celebrating", label: "Comemorando 🎉", description: "Conquistas e level up" },
    { mood: "studying", label: "Estudando 📚", description: "Durante as lições" },
    { mood: "sleeping", label: "Dormindo 😴", description: "Usuário inativo" },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Preview do Mascote 🦊</h1>
            <p className="text-muted-foreground">Raposinha Estudiosa - "Click" o mascote da Aula Click</p>
          </div>
        </div>

        {/* Main Preview */}
        <Card className="mb-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Conheça o Click! 🦊</CardTitle>
            <p className="text-muted-foreground">
              Uma raposinha estudiosa, ágil e sempre pronta para ajudar você a aprender inglês!
            </p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <FoxMascot 
              mood="waving" 
              size="xl" 
              message="Oi! Eu sou o Click! Bora aprender inglês juntos? 🇬🇧" 
            />
          </CardContent>
        </Card>

        {/* All Moods Grid */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Expressões e Estados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {moods.map(({ mood, label, description }) => (
            <Card key={mood} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{label}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <FoxMascot mood={mood} size="md" animate={true} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Size Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Tamanhos Disponíveis</h2>
        <Card className="mb-12">
          <CardContent className="py-8">
            <div className="flex flex-wrap items-end justify-center gap-8">
              <div className="text-center">
                <FoxMascot mood="happy" size="sm" />
                <p className="mt-2 text-sm text-muted-foreground">Small (sm)</p>
              </div>
              <div className="text-center">
                <FoxMascot mood="happy" size="md" />
                <p className="mt-2 text-sm text-muted-foreground">Medium (md)</p>
              </div>
              <div className="text-center">
                <FoxMascot mood="happy" size="lg" />
                <p className="mt-2 text-sm text-muted-foreground">Large (lg)</p>
              </div>
              <div className="text-center">
                <FoxMascot mood="happy" size="xl" />
                <p className="mt-2 text-sm text-muted-foreground">Extra Large (xl)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Exemplos de Uso por Seção</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle>🏠 Landing Page (Hero)</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <FoxMascot 
                mood="waving" 
                size="lg" 
                message="Aprenda inglês comigo! É divertido! 🎮" 
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader>
              <CardTitle>📚 Durante Lições</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <FoxMascot 
                mood="studying" 
                size="lg" 
                message="Vamos ver essa gramática! 📖" 
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardHeader>
              <CardTitle>🎉 Resposta Correta</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <FoxMascot 
                mood="celebrating" 
                size="lg" 
                message="Muito bem! +10 XP! 🏆" 
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardHeader>
              <CardTitle>🤔 Aguardando Resposta</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <FoxMascot 
                mood="thinking" 
                size="lg" 
                message="Hmm, qual será a resposta...?" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            O Click representa agilidade, inteligência e curiosidade - perfeito para uma plataforma de aprendizado! 🦊✨
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/">
              Ver na Landing Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MascotPreview;
