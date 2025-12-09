import { PixelFoxMascot, PixelFoxMood } from "@/components/mascot/PixelFoxMascot";
import { FoxMascot, FoxMood } from "@/components/mascot/FoxMascot";
import { ChibiFoxMascot, ChibiFoxMood } from "@/components/mascot/ChibiFoxMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";

type MascotStyle = "original" | "pixel" | "chibi";

const MascotComparison = () => {
  const [selectedStyle, setSelectedStyle] = useState<MascotStyle | null>(null);

  const moods: { mood: FoxMood; label: string }[] = [
    { mood: "happy", label: "Feliz" },
    { mood: "excited", label: "Animado" },
    { mood: "thinking", label: "Pensando" },
    { mood: "waving", label: "Acenando" },
    { mood: "celebrating", label: "Comemorando" },
    { mood: "studying", label: "Estudando" },
    { mood: "sleeping", label: "Dormindo" },
  ];

  const styles = [
    { 
      id: "original" as MascotStyle, 
      name: "Original (SVG)", 
      description: "Estilo vetorial com gradientes suaves e detalhes",
      pros: ["Alta qualidade em qualquer tamanho", "Visual polido e profissional", "Expressões detalhadas"],
    },
    { 
      id: "pixel" as MascotStyle, 
      name: "Pixel Art", 
      description: "Estilo retrô inspirado em The Touryst",
      pros: ["Nostálgico e único", "Estilo de games", "Visual marcante"],
    },
    { 
      id: "chibi" as MascotStyle, 
      name: "Chibi/Kawaii", 
      description: "Estilo fofo com cabeça grande e olhos expressivos",
      pros: ["Extremamente fofo", "Apelo universal", "Animações fluidas"],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
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
            <h1 className="text-3xl font-bold text-foreground">Escolha a Mascote 🦊</h1>
            <p className="text-muted-foreground">Compare os 3 estilos e escolha o Click definitivo!</p>
          </div>
        </div>

        {/* Main Comparison - All 3 side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {styles.map((style) => (
            <Card 
              key={style.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedStyle === style.id 
                  ? "ring-4 ring-primary shadow-xl scale-[1.02]" 
                  : "hover:shadow-lg hover:scale-[1.01]"
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-xl">{style.name}</CardTitle>
                  {selectedStyle === style.id && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{style.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                {style.id === "original" && (
                  <FoxMascot mood="waving" size="xl" message="Olá!" />
                )}
                {style.id === "pixel" && (
                  <PixelFoxMascot mood="waving" size="xl" message="Olá!" />
                )}
                {style.id === "chibi" && (
                  <ChibiFoxMascot mood="waving" size="xl" message="Olá!" />
                )}
                
                <ul className="mt-6 space-y-1 text-sm">
                  {style.pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary">✓</span> {pro}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* All Moods Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Todas as Expressões</h2>
        <div className="space-y-4 mb-12">
          {moods.map(({ mood, label }) => (
            <Card key={mood} className="overflow-hidden">
              <CardContent className="py-4">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="text-center">
                    <span className="font-semibold text-foreground">{label}</span>
                  </div>
                  <div className="flex justify-center">
                    <FoxMascot mood={mood} size="md" animate={true} />
                  </div>
                  <div className="flex justify-center">
                    <PixelFoxMascot mood={mood as PixelFoxMood} size="md" animate={true} />
                  </div>
                  <div className="flex justify-center">
                    <ChibiFoxMascot mood={mood as ChibiFoxMood} size="md" animate={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Size Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Comparação de Tamanhos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Original</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-4 py-6">
              <FoxMascot mood="happy" size="sm" />
              <FoxMascot mood="happy" size="md" />
              <FoxMascot mood="happy" size="lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Pixel Art</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-4 py-6">
              <PixelFoxMascot mood="happy" size="sm" />
              <PixelFoxMascot mood="happy" size="md" />
              <PixelFoxMascot mood="happy" size="lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Chibi</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-4 py-6">
              <ChibiFoxMascot mood="happy" size="sm" />
              <ChibiFoxMascot mood="happy" size="md" />
              <ChibiFoxMascot mood="happy" size="lg" />
            </CardContent>
          </Card>
        </div>

        {/* Context Examples */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Preview em Contexto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">🏠 Hero da Landing</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around py-4">
              <FoxMascot mood="waving" size="md" />
              <PixelFoxMascot mood="waving" size="md" />
              <ChibiFoxMascot mood="waving" size="md" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardHeader>
              <CardTitle className="text-lg">✅ Resposta Correta</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around py-4">
              <FoxMascot mood="celebrating" size="md" />
              <PixelFoxMascot mood="celebrating" size="md" />
              <ChibiFoxMascot mood="celebrating" size="md" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardHeader>
              <CardTitle className="text-lg">📚 Durante Estudo</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around py-4">
              <FoxMascot mood="studying" size="md" />
              <PixelFoxMascot mood="studying" size="md" />
              <ChibiFoxMascot mood="studying" size="md" />
            </CardContent>
          </Card>
        </div>

        {/* Selection Result */}
        {selectedStyle && (
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="py-6 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Você escolheu: {styles.find(s => s.id === selectedStyle)?.name}! 🎉
              </h3>
              <p className="text-muted-foreground">
                Clique em outro estilo para mudar sua escolha.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MascotComparison;
