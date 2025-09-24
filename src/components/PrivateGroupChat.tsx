import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface PrivateGroupChatProps {
  groupId: string;
  groupName: string;
}

export const PrivateGroupChat: React.FC<PrivateGroupChatProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles separately
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender: profile
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`private-group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          fetchMessages(); // Refetch to get sender profile
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDisplayName = (sender?: { display_name?: string; username?: string }) => {
    return sender?.display_name || sender?.username || 'Anonymous User';
  };

  const getAvatarFallback = (sender?: { display_name?: string; username?: string }) => {
    const name = getDisplayName(sender);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isFromCurrentUser = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {!isFromCurrentUser && (
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>{getAvatarFallback(message.sender)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${isFromCurrentUser ? 'ml-4' : 'mr-4'}`}>
                    {!isFromCurrentUser && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {getDisplayName(message.sender)}
                      </div>
                    )}
                    <div className={`p-3 rounded-lg ${
                      isFromCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <span className={`text-xs ${
                        isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {isFromCurrentUser && (
                    <Avatar className="w-8 h-8 ml-2">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>{getAvatarFallback(message.sender)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};