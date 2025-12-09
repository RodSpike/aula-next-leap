import { PixelFoxMascot, PixelFoxMood } from "@/components/mascot/PixelFoxMascot";
import { FoxMascot, FoxMood } from "@/components/mascot/FoxMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PixelMascotPreview = () => {
  const moods: { mood: PixelFoxMood; label: string; description: string }[] = [
    { mood: "happy", label: "Feliz 😊", description: "Estado padrão" },
    { mood: "excited", label: "Animado 🤩", description: "Acerto no exercício" },
    { mood: "thinking", label: "Pensando 🤔", description: "Aguardando resposta" },
    { mood: "waving", label: "Acenando 👋", description: "Boas-vindas" },
    { mood: "celebrating", label: "Comemorando 🎉", description: "Conquistas" },
    { mood: "studying", label: "Estudando 📚", description: "Durante lições" },
    { mood: "sleeping", label: "Dormindo 😴", description: "Inativo" },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Comparação de Mascotes 🦊</h1>
            <p className="text-muted-foreground">Versão Original vs Pixel Art (estilo The Touryst)</p>
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Original */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Versão Original (SVG)</CardTitle>
              <p className="text-muted-foreground">Estilo vetorial com gradientes</p>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <FoxMascot 
                mood="waving" 
                size="xl" 
                message="Versão atual!" 
              />
            </CardContent>
          </Card>

          {/* Pixel Art */}
          <Card className="bg-gradient-to-br from-warning/5 to-primary/5 border-warning/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Versão Pixel Art</CardTitle>
              <p className="text-muted-foreground">Estilo The Touryst - Blocky & Cute</p>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <PixelFoxMascot 
                mood="waving" 
                size="xl" 
                message="Nova versão!" 
              />
            </CardContent>
          </Card>
        </div>

        {/* All Moods Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Comparação por Expressão</h2>
        <div className="space-y-6 mb-12">
          {moods.map(({ mood, label, description }) => (
            <Card key={mood} className="overflow-hidden">
              <CardHeader className="pb-2 bg-muted/30">
                <CardTitle className="text-lg">{label} - {description}</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-4">Original</p>
                    <FoxMascot mood={mood as FoxMood} size="lg" animate={true} />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-4">Pixel Art</p>
                    <PixelFoxMascot mood={mood} size="lg" animate={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Size Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Tamanhos - Pixel Art</h2>
        <Card className="mb-12">
          <CardContent className="py-8">
            <div className="flex flex-wrap items-end justify-center gap-8">
              <div className="text-center">
                <PixelFoxMascot mood="happy" size="sm" />
                <p className="mt-2 text-sm text-muted-foreground">Small (sm)</p>
              </div>
              <div className="text-center">
                <PixelFoxMascot mood="happy" size="md" />
                <p className="mt-2 text-sm text-muted-foreground">Medium (md)</p>
              </div>
              <div className="text-center">
                <PixelFoxMascot mood="happy" size="lg" />
                <p className="mt-2 text-sm text-muted-foreground">Large (lg)</p>
              </div>
              <div className="text-center">
                <PixelFoxMascot mood="happy" size="xl" />
                <p className="mt-2 text-sm text-muted-foreground">Extra Large (xl)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Case Preview */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Preview em Contexto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle>🏠 Landing Page Hero</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <PixelFoxMascot 
                mood="waving" 
                size="xl" 
                message="Bora aprender!" 
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardHeader>
              <CardTitle>🎉 Resposta Correta</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <PixelFoxMascot 
                mood="celebrating" 
                size="xl" 
                message="+10 XP!" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Qual versão você prefere para o Click? 🦊
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/mascot-preview">
                Ver Original Completo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelMascotPreview;
