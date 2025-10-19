import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Silva",
    level: "De A1 para B1",
    text: "O Aula Click mudou minha vida! Consegui minha promoção no trabalho graças ao inglês que aprendi aqui. Os cursos são muito práticos e o tutor IA me ajudou muito.",
    avatar: "AS",
    rating: 5
  },
  {
    name: "Carlos Santos",
    level: "De A2 para B2",
    text: "Depois de 3 meses estudando na plataforma, já consigo assistir séries em inglês sem legenda. A comunidade é incrível e os professores sempre dispostos a ajudar!",
    avatar: "CS",
    rating: 5
  },
  {
    name: "Mariana Oliveira",
    level: "De B1 para C1",
    text: "Melhor investimento que já fiz! Passei no TOEFL com nota alta e agora estou fazendo meu mestrado no exterior. Muito obrigada Aula Click!",
    avatar: "MO",
    rating: 5
  },
  {
    name: "Felipe Costa",
    level: "De A1 para A2",
    text: "Comecei do zero e hoje já consigo me comunicar em inglês. As aulas são bem explicadas e os exercícios são divertidos. Recomendo demais!",
    avatar: "FC",
    rating: 5
  },
  {
    name: "Juliana Ferreira",
    level: "De B2 para C2",
    text: "Consegui meu sonho de trabalhar em uma empresa internacional! O Aula Click me preparou não só para falar inglês, mas para usar no dia a dia profissional.",
    avatar: "JF",
    rating: 5
  },
  {
    name: "Roberto Almeida",
    level: "De A2 para B1",
    text: "A flexibilidade de estudar no meu tempo foi essencial. Com trabalho e família, o Aula Click se adaptou perfeitamente à minha rotina!",
    avatar: "RA",
    rating: 5
  }
];

export function StudentTestimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Histórias reais de pessoas que transformaram suas vidas aprendendo inglês com a Aula Click
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.level}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground italic">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}