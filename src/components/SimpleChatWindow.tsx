import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProfileAvatar } from "@/components/ProfileAvatar";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_system_message?: boolean;
  sender?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface SimpleChatWindowProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export const SimpleChatWindow: React.FC<SimpleChatWindowProps> = ({ 
  groupId, 
  groupName, 
  onClose 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('group_chat_messages')
      .select(`
        id, 
        content, 
        created_at, 
        sender_id, 
        is_system_message,
        profiles!group_chat_messages_sender_id_fkey(display_name, username, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        sender: (msg as any).profiles
      }));
      setMessages(messagesWithProfiles);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('group_chat_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-none bg-card border-b px-3 md:px-6 py-3 md:py-4 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold truncate flex-1">{groupName}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground text-sm">
              <p>Nenhuma mensagem ainda. Comece a conversar!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isFromCurrentUser = message.sender_id === user?.id;
            const isSystemMessage = message.is_system_message;
            
            if (isSystemMessage) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={message.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isFromCurrentUser && (
                  <ProfileAvatar
                    userId={message.sender_id}
                    avatarUrl={message.sender?.avatar_url}
                    fallback={message.sender?.display_name?.charAt(0) || 'U'}
                    className="w-8 h-8 mr-2 mt-1 flex-shrink-0"
                  />
                )}
                <div className={`max-w-[80%] md:max-w-[70%] ${isFromCurrentUser ? 'ml-auto' : ''}`}>
                  {!isFromCurrentUser && (
                    <div className="text-xs text-muted-foreground mb-1 ml-1">
                      {message.sender?.display_name || message.sender?.username || 'Anonymous'}
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
                  <ProfileAvatar
                    userId={message.sender_id}
                    avatarUrl={message.sender?.avatar_url}
                    fallback={message.sender?.display_name?.charAt(0) || 'U'}
                    className="w-8 h-8 ml-2 mt-1 flex-shrink-0"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
