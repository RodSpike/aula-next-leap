import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle, Users, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DirectMessageChat } from "./DirectMessageChat";
import { SimpleChatWindow } from "./SimpleChatWindow";

interface ChatConversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  participantId?: string;
}

export const UnifiedChatInterface = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // Load direct messages (private chats)
      const { data: dmGroups } = await supabase
        .from('community_groups')
        .select('*')
        .eq('is_private_chat', true);

      // Load group chats where user is a member
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id, community_groups(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const allConversations: ChatConversation[] = [];

      // Process direct messages
      if (dmGroups) {
        for (const group of dmGroups) {
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id)
            .neq('user_id', user.id);

          if (members && members.length > 0) {
            const otherId = members[0].user_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, avatar_url')
              .eq('user_id', otherId)
              .single();

            const { data: lastMsg } = await supabase
              .from('group_chat_messages')
              .select('content, created_at')
              .eq('group_id', group.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            allConversations.push({
              id: group.id,
              name: profile?.display_name || profile?.username || 'Unknown',
              type: 'direct',
              avatar: profile?.avatar_url,
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at,
              unreadCount: 0,
              participantId: otherId
            });
          }
        }
      }

      // Process group chats
      if (memberGroups) {
        for (const member of memberGroups) {
          const group = member.community_groups;
          if (group && !group.is_private_chat) {
            const { data: lastMsg } = await supabase
              .from('group_chat_messages')
              .select('content, created_at')
              .eq('group_id', group.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            allConversations.push({
              id: group.id,
              name: group.name,
              type: 'group',
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at,
              unreadCount: 0
            });
          }
        }
      }

      // Sort by last message time
      allConversations.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages'
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedChat) {
    if (selectedChat.type === 'direct' && selectedChat.participantId) {
      return (
        <div className="h-screen flex flex-col">
          <DirectMessageChat
            friendId={selectedChat.participantId}
            friendName={selectedChat.name}
            friendAvatar={selectedChat.avatar}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      );
    } else {
      return (
        <SimpleChatWindow
          groupId={selectedChat.id}
          groupName={selectedChat.name}
          onClose={() => setSelectedChat(null)}
        />
      );
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Conversations List */}
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start chatting with friends or join a group!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <Button
                      key={conv.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => setSelectedChat(conv)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback>
                            {conv.type === 'direct' ? (
                              <User className="h-6 w-6" />
                            ) : (
                              <Users className="h-6 w-6" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{conv.name}</p>
                            <Badge variant={conv.type === 'direct' ? 'secondary' : 'default'} className="text-xs">
                              {conv.type === 'direct' ? 'DM' : 'Group'}
                            </Badge>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
