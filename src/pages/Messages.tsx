import { Navigation } from "@/components/Navigation";
import { UnifiedChatInterface } from "@/components/UnifiedChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-4">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Messages</h2>
            <p className="text-muted-foreground">
              Sign in to view your messages
            </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <UnifiedChatInterface />
    </div>
  );
}
