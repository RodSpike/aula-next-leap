import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeacherRecruitSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-8 md:p-12">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Icon */}
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Você é professor de inglês?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                Use nosso material didático com IA, acompanhe o progresso dos seus alunos em tempo real 
                e <span className="text-primary font-semibold">ganhe comissão por cada aluno</span> que 
                você trouxer para a plataforma. Tudo pronto para suas aulas online.
              </p>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              <Button asChild size="lg" className="gap-2 text-base px-8">
                <Link to="/para-professores">
                  Saiba Mais
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}