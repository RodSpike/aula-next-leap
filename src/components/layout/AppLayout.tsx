import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const AppLayout = ({ children, showSidebar = true }: AppLayoutProps) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show sidebar for non-logged in users
  const shouldShowSidebar = showSidebar && user;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {shouldShowSidebar && !isMobile && <AppSidebar />}
      
      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        shouldShowSidebar && !isMobile && "md:pl-64",
        shouldShowSidebar && isMobile && "pb-20" // Add padding for mobile nav
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {shouldShowSidebar && isMobile && <MobileNavigation />}
    </div>
  );
};
