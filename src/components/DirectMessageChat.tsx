import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { OnlineStatus } from "@/components/OnlineStatus";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_profile?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface DirectMessageChatProps {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  onBack: () => void;
}

export const DirectMessageChat: React.FC<DirectMessageChatProps> = ({
  friendId,
  friendName,
  friendAvatar,
  onBack
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && friendId) {
      initializeChat();
    }
  }, [user, friendId]);

  useEffect(() => {
    if (groupId) {
      fetchMessages();
      const channel = supabase
        .channel(`chat-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            fetchMessages();
            // Show toast notification if message is from the other user
            const newMsg = payload.new as any;
            if (newMsg.sender_id !== user?.id) {
              toast({
                title: `New message from ${friendName}`,
                description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [groupId, user, friendName, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    if (!user) return;

    const groupName = `DM: ${user.id}-${friendId}`;
    
    const { data: existingGroup } = await supabase
      .from('community_groups')
      .select('id')
      .eq('is_private_chat', true)
      .or(`name.eq.DM: ${user.id}-${friendId},name.eq.DM: ${friendId}-${user.id}`)
      .maybeSingle();

    if (existingGroup) {
      setGroupId(existingGroup.id);
    } else {
      const { data: newGroup, error } = await supabase
        .from('community_groups')
        .insert({
          name: groupName,
          description: 'Private chat',
          level: 'A1',
          is_private_chat: true,
          created_by: user.id
        })
        .select()
        .single();

      if (!error && newGroup) {
        await supabase
          .from('group_members')
          .insert([
            { group_id: newGroup.id, user_id: user.id, status: 'accepted', can_post: true },
            { group_id: newGroup.id, user_id: friendId, status: 'accepted', can_post: true }
          ]);
        setGroupId(newGroup.id);
      }
    }
  };

  const fetchMessages = async () => {
    if (!groupId) return;

    // Optimized: fetch messages with profiles in a single query using sender_id join
    const { data } = await supabase
      .from('group_chat_messages')
      .select(`
        id, 
        content, 
        created_at, 
        sender_id, 
        is_system_message
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (data) {
      // Batch fetch all unique profiles at once
      const uniqueSenderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', uniqueSenderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id)
      }));
      
      setMessages(messagesWithProfiles);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !groupId) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX

    // Optimistic update - add message to UI immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender_profile: {
        display_name: user.email?.split('@')[0],
        avatar_url: undefined
      }
    };
    setMessages(prev => [...prev, optimisticMessage]);

    const { error } = await supabase
      .from('group_chat_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: messageContent
      });

    if (error) {
      // Rollback on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageContent);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - fixed */}
      <div className="flex-none bg-card border-b px-3 md:px-6 py-3 md:py-4 safe-area-top">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${friendId}`)}>
              <AvatarImage src={friendAvatar} />
              <AvatarFallback>{friendName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base md:text-lg truncate">{friendName}</h2>
                {groupId && <OnlineStatus userId={friendId} groupId={groupId} showBadge={false} />}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Direct Message</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0 md:hidden" onClick={() => navigate(`/profile/${friendId}`)}>
            <User className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => navigate(`/profile/${friendId}`)}>
            <User className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
        </div>
      </div>

      {/* Messages - scrollable */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Nenhuma mensagem ainda. Comece a conversar!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isFromCurrentUser = message.sender_id === user?.id;
            
            return (
              <div key={message.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isFromCurrentUser && (
                  <Avatar className="w-8 h-8 mr-2 mt-1 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback>
                      {message.sender_profile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[80%] md:max-w-[70%] ${isFromCurrentUser ? 'ml-auto' : ''}`}>
                  {!isFromCurrentUser && (
                    <div className="text-xs text-muted-foreground mb-1 ml-1">
                      {message.sender_profile?.display_name || message.sender_profile?.username || 'Anonymous'}
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl ${
                    isFromCurrentUser 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    <p className="text-sm break-words">{message.content}</p>
                    <span className={`text-xs mt-1 block ${
                      isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {isFromCurrentUser && (
                  <Avatar className="w-8 h-8 ml-2 mt-1 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback>
                      {message.sender_profile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-none bg-card border-t px-3 md:px-6 py-3 md:py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <form onSubmit={sendMessage} className="flex gap-2 md:gap-3">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-12"
          />
          <Button type="submit" size="lg" className="px-4 md:px-8 h-12" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
