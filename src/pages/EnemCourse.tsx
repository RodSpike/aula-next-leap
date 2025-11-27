import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, FileText, Microscope, Globe, Users, Calculator, Atom } from "lucide-react";
import { useNavigate } from "react-router-dom";

const enemSubjects = [
  { id: 'portugues', name: 'Português e Literatura', icon: BookOpen, color: 'text-blue-500' },
  { id: 'redacao', name: 'Redação', icon: FileText, color: 'text-purple-500' },
  { id: 'matematica', name: 'Matemática', icon: Calculator, color: 'text-green-500' },
  { id: 'fisica', name: 'Física', icon: Atom, color: 'text-red-500' },
  { id: 'quimica', name: 'Química', icon: Microscope, color: 'text-yellow-500' },
  { id: 'biologia', name: 'Biologia', icon: Microscope, color: 'text-emerald-500' },
  { id: 'historia', name: 'História', icon: BookOpen, color: 'text-orange-500' },
  { id: 'geografia', name: 'Geografia', icon: Globe, color: 'text-cyan-500' },
  { id: 'filosofia', name: 'Filosofia', icon: Brain, color: 'text-indigo-500' },
  { id: 'sociologia', name: 'Sociologia', icon: Users, color: 'text-pink-500' },
  { id: 'ingles', name: 'Inglês', icon: Globe, color: 'text-sky-500' },
  { id: 'espanhol', name: 'Espanhol', icon: Globe, color: 'text-amber-500' },
];

export default function EnemCourse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Preparação ENEM & Vestibulares
          </h1>
          <p className="text-lg text-muted-foreground">
            Escolha a matéria que deseja estudar. Cada matéria inclui conteúdo completo e simulado ao final.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {enemSubjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-8 w-8 ${subject.color}`} />
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Conteúdo completo + Simulado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(`/enem-lesson/${subject.id}`)}
                    className="w-full"
                  >
                    Estudar Matéria
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Tutor ENEM com IA
            </CardTitle>
            <CardDescription>
              Tire dúvidas, receba dicas de estudo e reforce o aprendizado com nosso tutor especializado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/enem-tutor')} variant="outline">
              Conversar com Tutor IA
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
