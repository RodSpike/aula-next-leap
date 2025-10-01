import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnhancedChatInput } from "./enhanced/EnhancedChatInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClickableUserProfile } from "@/components/ClickableUserProfile";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { useUserProfileClick } from "@/hooks/useUserProfileClick";

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  user_roles?: {
    role: string;
  }[];
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isPopupOpen, selectedUserId, selectedProfile, openUserProfile, setIsPopupOpen } = useUserProfileClick();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (groupId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // First get the messages
      const { data: messageData, error: messageError } = await supabase
        .from('group_chat_messages')
        .select('id, content, created_at, sender_id')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messageError) throw messageError;

      // Then get profiles and roles separately
      const messagesWithData = await Promise.all((messageData || []).map(async (message) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', message.sender_id)
          .single();

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', message.sender_id)
          .eq('role', 'admin');
        
        return {
          ...message,
          profiles: profileData,
          user_roles: roleData || []
        };
      }));

      setMessages(messagesWithData);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          fetchMessages(); // Refetch to get profile data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    // Optimistic UI
    const optimistic = {
      id: crypto.randomUUID(),
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_id: user.id,
      profiles: { display_name: 'You', username: '', avatar_url: '' },
      user_roles: []
    } as any;
    setMessages(prev => [...prev, optimistic]);
    const toSend = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: toSend,
        });

      if (error) throw error;
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

  const getDisplayName = (message: GroupMessage) => {
    return message.profiles?.display_name || message.profiles?.username || 'Anonymous User';
  };

  const getAvatarFallback = (message: GroupMessage) => {
    const name = getDisplayName(message);
    return name.charAt(0).toUpperCase();
  };

  const isAdmin = (message: GroupMessage) => {
    return message.user_roles?.some(role => role.role === 'admin');
  };

  if (loading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {groupName} - Group Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 mb-4 min-h-0">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <ClickableUserProfile
                    userId={message.sender_id}
                    profile={{
                      user_id: message.sender_id,
                      display_name: getDisplayName(message),
                      username: message.profiles?.username,
                      avatar_url: message.profiles?.avatar_url
                    }}
                    onClick={openUserProfile}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.profiles?.avatar_url} />
                      <AvatarFallback>{getAvatarFallback(message)}</AvatarFallback>
                    </Avatar>
                  </ClickableUserProfile>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <ClickableUserProfile
                        userId={message.sender_id}
                        profile={{
                          user_id: message.sender_id,
                          display_name: getDisplayName(message),
                          username: message.profiles?.username,
                          avatar_url: message.profiles?.avatar_url
                        }}
                        onClick={openUserProfile}
                      >
                        <span className="font-semibold text-sm hover:underline">
                          {getDisplayName(message)}
                        </span>
                      </ClickableUserProfile>
                      {isAdmin(message) && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 bg-background border-t pt-3 flex-shrink-0">
          <EnhancedChatInput
            value={newMessage}
            onChange={setNewMessage}
            onSend={sendMessage}
            placeholder="Type a message..."
            disabled={false}
            showVoiceInput={false}
            className="w-full"
          />
        </div>
      </CardContent>
      
      <UserProfilePopup
        isOpen={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        userId={selectedUserId}
        profile={selectedProfile}
      />
    </Card>
  );
};