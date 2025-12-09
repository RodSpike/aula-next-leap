import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  courses: "Cursos",
  course: "Curso",
  community: "Comunidade",
  messages: "Mensagens",
  achievements: "Conquistas",
  friends: "Amigos",
  profile: "Perfil",
  settings: "Configurações",
  certificates: "Certificados",
  "ai-chat": "Chat IA",
  "click-hangout": "Click Hangout",
  "click-of-the-week": "Click da Semana",
  "enem-course": "Curso ENEM",
  "enem-lesson": "Aula ENEM",
  "enem-exam": "Simulado ENEM",
  "enem-tutor": "Tutor ENEM",
  "level-test": "Teste de Nível",
  "placement-test": "Teste de Nivelamento",
  admin: "Admin",
  "course-management": "Gerenciar Cursos",
};

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip UUID-like segments for label but keep in path
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (!isUuid) {
        generatedItems.push({
          label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: isLast ? undefined : currentPath,
        });
      }
    });
    
    return generatedItems;
  })();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(
        "flex items-center text-sm text-muted-foreground mb-4 animate-fade-in",
        className
      )}
    >
      <ol className="flex items-center flex-wrap gap-1">
        <li>
          <Link 
            to="/dashboard" 
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Início"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {item.href ? (
              <Link 
                to={item.href}
                className="hover:text-foreground transition-colors hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

