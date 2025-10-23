import { Navigation } from "@/components/Navigation";
import { UnifiedChatInterface } from "@/components/UnifiedChatInterface";
import { DirectMessageChat } from "@/components/DirectMessageChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showDirectChat, setShowDirectChat] = useState(false);
  const [friendData, setFriendData] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    const friendId = searchParams.get('userId');
    if (friendId && user) {
      loadFriendData(friendId);
    }
  }, [searchParams, user]);

  const loadFriendData = async (friendId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .eq('user_id', friendId)
      .single();

    if (profile) {
      setFriendData({
        id: profile.user_id,
        name: profile.display_name || profile.username || 'Unknown',
        avatar: profile.avatar_url
      });
      setShowDirectChat(true);
    }
  };

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

  if (showDirectChat && friendData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-[calc(100vh-4rem)]">
          <DirectMessageChat
            friendId={friendData.id}
            friendName={friendData.name}
            friendAvatar={friendData.avatar}
            onBack={() => {
              setShowDirectChat(false);
              setFriendData(null);
              window.history.replaceState({}, '', '/messages');
            }}
          />
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
