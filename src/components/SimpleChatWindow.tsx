import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";
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
    // Optimized query: fetch messages with profiles in a single query
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
      .limit(100); // Limit to last 100 messages for performance

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
    <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[600px] bg-card md:border md:rounded-lg md:shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/50 safe-area-top">
        <h3 className="font-semibold truncate flex-1">{groupName}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation!
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
                    className="w-8 h-8 mr-2 flex-shrink-0"
                  />
                )}
                <div className={`max-w-[75%] ${isFromCurrentUser ? 'ml-4' : 'mr-4'}`}>
                  {!isFromCurrentUser && (
                    <div className="text-xs text-muted-foreground mb-1">
                      {message.sender?.display_name || message.sender?.username || 'Anonymous'}
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl ${
                    isFromCurrentUser 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    <p className="text-sm break-words">{message.content}</p>
                    <span className={`text-xs ${
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
                    className="w-8 h-8 ml-2 flex-shrink-0"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-muted/50" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
