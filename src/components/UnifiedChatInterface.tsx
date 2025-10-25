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
import { SimpleChatWindow } from "./SimpleChatWindow";
import { DirectMessageChat } from "./DirectMessageChat";

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
      setLoading(true);
      const allConversations: ChatConversation[] = [];

      // Load direct messages from community_groups (is_private_chat = true)
      const { data: dmData } = await supabase
        .from('group_members')
        .select(`
          group_id,
          community_groups!inner (
            id,
            name,
            is_private_chat
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('community_groups.is_private_chat', true);

      if (dmData) {
        for (const dm of dmData) {
          if (!dm.community_groups) continue;
          const group = dm.community_groups as any;

          // Get other participant
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id)
            .eq('status', 'accepted')
            .neq('user_id', user.id);

          if (!members || members.length === 0) continue;
          const otherUserId = members[0].user_id;

          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('user_id', otherUserId)
            .single();

          // Get last message from group_chat_messages
          const { data: lastMessage } = await supabase
            .from('group_chat_messages')
            .select('content, created_at, sender_id')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { data: conversationState } = await supabase
            .from('direct_conversation_state')
            .select('deleted_before')
            .eq('user_id', user.id)
            .eq('group_id', group.id)
            .maybeSingle();

          let unreadCount = 0;
          if (conversationState?.deleted_before) {
            const { count } = await supabase
              .from('group_chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .neq('sender_id', user.id)
              .gt('created_at', conversationState.deleted_before);
            unreadCount = count || 0;
          } else if (lastMessage) {
            unreadCount = 1;
          }

          allConversations.push({
            id: group.id,
            name: profile?.display_name || profile?.username || 'Unknown',
            type: 'direct',
            avatar: profile?.avatar_url,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            unreadCount,
            participantId: otherUserId
          });
        }
      }

      // Load group chats from community_groups (is_private_chat = false)
      const { data: groupData } = await supabase
        .from('group_members')
        .select(`
          group_id,
          community_groups!inner (
            id,
            name,
            is_private_chat
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('community_groups.is_private_chat', false);

      if (groupData) {
        for (const groupMember of groupData) {
          if (!groupMember.community_groups) continue;
          const group = groupMember.community_groups as any;

          // Get last message from group_chat_messages
          const { data: lastMessage } = await supabase
            .from('group_chat_messages')
            .select('content, created_at')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          allConversations.push({
            id: group.id,
            name: group.name,
            type: 'group',
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            unreadCount: 0
          });
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
      .channel('unified-chat-changes')
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
    if (selectedChat.type === 'direct') {
      return (
        <DirectMessageChat
          friendId={selectedChat.participantId!}
          friendName={selectedChat.name}
          friendAvatar={selectedChat.avatar}
          onBack={() => setSelectedChat(null)}
        />
      );
    }
    
    return (
      <SimpleChatWindow
        groupId={selectedChat.id}
        groupName={selectedChat.name}
        onClose={() => setSelectedChat(null)}
      />
    );
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