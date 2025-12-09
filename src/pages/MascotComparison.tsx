import { PixelFoxMascot, PixelFoxMood } from "@/components/mascot/PixelFoxMascot";
import { FoxMascot, FoxMood } from "@/components/mascot/FoxMascot";
import { ChibiFoxMascot, ChibiFoxMood } from "@/components/mascot/ChibiFoxMascot";
import { CupheadFoxMascot, CupheadFoxMood } from "@/components/mascot/CupheadFoxMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";

type MascotStyle = "original" | "pixel" | "chibi" | "cuphead";

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
      description: "Estilo vetorial com gradientes suaves",
      pros: ["Alta qualidade", "Visual profissional", "Expressões detalhadas"],
    },
    { 
      id: "pixel" as MascotStyle, 
      name: "Pixel Art", 
      description: "Estilo retrô inspirado em The Touryst",
      pros: ["Nostálgico", "Estilo de games", "Visual marcante"],
    },
    { 
      id: "chibi" as MascotStyle, 
      name: "Chibi/Kawaii", 
      description: "Estilo fofo com cabeça grande",
      pros: ["Extremamente fofo", "Apelo universal", "Animações fluidas"],
    },
    { 
      id: "cuphead" as MascotStyle, 
      name: "Cuphead (1930s)", 
      description: "Animação vintage rubber hose style",
      pros: ["Único e memorável", "Olhos pie-cut icônicos", "Estética retrô premium"],
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
            <p className="text-muted-foreground">Compare os 4 estilos e escolha o Click definitivo!</p>
          </div>
        </div>

        {/* Main Comparison - All 4 side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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
                  <CardTitle className="text-lg">{style.name}</CardTitle>
                  {selectedStyle === style.id && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{style.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                {style.id === "original" && (
                  <FoxMascot mood="waving" size="lg" />
                )}
                {style.id === "pixel" && (
                  <PixelFoxMascot mood="waving" size="lg" />
                )}
                {style.id === "chibi" && (
                  <ChibiFoxMascot mood="waving" size="lg" />
                )}
                {style.id === "cuphead" && (
                  <CupheadFoxMascot mood="waving" size="lg" />
                )}
                
                <ul className="mt-4 space-y-1 text-xs">
                  {style.pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-1 text-muted-foreground">
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
                <div className="grid grid-cols-5 gap-2 items-center">
                  <div className="text-center">
                    <span className="font-semibold text-foreground text-sm">{label}</span>
                  </div>
                  <div className="flex justify-center">
                    <FoxMascot mood={mood} size="sm" animate={true} />
                  </div>
                  <div className="flex justify-center">
                    <PixelFoxMascot mood={mood as PixelFoxMood} size="sm" animate={true} />
                  </div>
                  <div className="flex justify-center">
                    <ChibiFoxMascot mood={mood as ChibiFoxMood} size="sm" animate={true} />
                  </div>
                  <div className="flex justify-center">
                    <CupheadFoxMascot mood={mood as CupheadFoxMood} size="sm" animate={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Size Comparison */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Comparação de Tamanhos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Original</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-2 py-4">
              <FoxMascot mood="happy" size="sm" />
              <FoxMascot mood="happy" size="md" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Pixel Art</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-2 py-4">
              <PixelFoxMascot mood="happy" size="sm" />
              <PixelFoxMascot mood="happy" size="md" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Chibi</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-2 py-4">
              <ChibiFoxMascot mood="happy" size="sm" />
              <ChibiFoxMascot mood="happy" size="md" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Cuphead</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-center gap-2 py-4">
              <CupheadFoxMascot mood="happy" size="sm" />
              <CupheadFoxMascot mood="happy" size="md" />
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
            <CardContent className="flex justify-around py-4 flex-wrap gap-2">
              <FoxMascot mood="waving" size="sm" />
              <PixelFoxMascot mood="waving" size="sm" />
              <ChibiFoxMascot mood="waving" size="sm" />
              <CupheadFoxMascot mood="waving" size="sm" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardHeader>
              <CardTitle className="text-lg">✅ Resposta Correta</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around py-4 flex-wrap gap-2">
              <FoxMascot mood="celebrating" size="sm" />
              <PixelFoxMascot mood="celebrating" size="sm" />
              <ChibiFoxMascot mood="celebrating" size="sm" />
              <CupheadFoxMascot mood="celebrating" size="sm" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardHeader>
              <CardTitle className="text-lg">📚 Durante Estudo</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around py-4 flex-wrap gap-2">
              <FoxMascot mood="studying" size="sm" />
              <PixelFoxMascot mood="studying" size="sm" />
              <ChibiFoxMascot mood="studying" size="sm" />
              <CupheadFoxMascot mood="studying" size="sm" />
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
