import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageCircle, Send, Bot, Users, UserIcon, X, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OnlineStatus } from './OnlineStatus';
import { GroupChat } from './GroupChat';

interface DirectMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at?: string;
  sender_profile?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  receiver_profile?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface GroupMember {
  user_id: string;
  status: string;
  profiles?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface MessagingSystemProps {
  groupId: string;
  groupName: string;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  groupId, 
  groupName, 
  members, 
  isOpen, 
  onClose 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai-tutor' | 'direct' | 'group'>('direct');
  const [selectedUser, setSelectedUser] = useState<GroupMember | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchDirectMessages();
      subscribeToDirectMessages();
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDirectMessages = async () => {
    if (!selectedUser || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          read_at
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${user.id})`)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profile data for messages
      const messagesWithProfiles = await Promise.all((data || []).map(async (msg) => {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', msg.sender_id)
          .single();

        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', msg.receiver_id)
          .single();

        return {
          ...msg,
          sender_profile: senderProfile,
          receiver_profile: receiverProfile
        };
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDirectMessages = () => {
    if (!selectedUser || !user) return;

    const channel = supabase
      .channel(`direct-messages-${groupId}-${user.id}-${selectedUser.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.user_id) ||
            (newMessage.sender_id === selectedUser.user_id && newMessage.receiver_id === user.id)
          ) {
            fetchDirectMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendDirectMessage = async () => {
    if (!selectedUser || !message.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.user_id,
          content: message.trim(),
          group_id: groupId
        });

      if (error) throw error;

      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending direct message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'direct') {
        sendDirectMessage();
      }
    }
  };

  const getDisplayName = (member: GroupMember) => {
    return member.profiles?.display_name || member.profiles?.username || 'Anonymous User';
  };

  const getAvatarFallback = (member: GroupMember) => {
    const name = getDisplayName(member);
    return name.charAt(0).toUpperCase();
  };

  const availableMembers = members.filter(member => member.user_id !== user?.id);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {groupName} - Chat
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {!isMinimized && (
            <div className="flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 m-4">
                  <TabsTrigger value="ai-tutor" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Tutor
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Direct Messages
                  </TabsTrigger>
                  <TabsTrigger value="group" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group Chat
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 flex flex-col px-4">
                  <TabsContent value="ai-tutor" className="flex-1 flex flex-col mt-0">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="h-5 w-5 text-primary" />
                          AI English Tutor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Bot className="h-16 w-16 text-primary mx-auto" />
                          <h3 className="text-lg font-semibold">AI Tutor Integration</h3>
                          <p className="text-muted-foreground">
                            The AI Tutor feature will be integrated here, allowing you to practice English 
                            and get instant feedback from our AI assistant.
                          </p>
                          <Button className="mt-4">
                            Start AI Conversation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="direct" className="flex-1 flex flex-col mt-0">
                    <div className="flex-1 flex">
                      {/* Members List */}
                      <div className="w-1/3 border-r">
                        <div className="p-3 border-b">
                          <h3 className="font-semibold text-sm">Members</h3>
                        </div>
                        <ScrollArea className="h-[400px]">
                          <div className="p-2 space-y-2">
                            {availableMembers.map((member) => (
                              <div
                                key={member.user_id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                                  selectedUser?.user_id === member.user_id ? 'bg-muted' : ''
                                }`}
                                onClick={() => setSelectedUser(member)}
                              >
                                <div className="relative">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={member.profiles?.avatar_url} />
                                    <AvatarFallback>{getAvatarFallback(member)}</AvatarFallback>
                                  </Avatar>
                                  <OnlineStatus
                                    userId={member.user_id}
                                    groupId={groupId}
                                    showBadge={false}
                                    className="absolute -bottom-1 -right-1 border-2 border-background"
                                  />
                                </div>
                                <span className="text-sm font-medium">
                                  {getDisplayName(member)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Chat Area */}
                      <div className="flex-1 flex flex-col">
                        {selectedUser ? (
                          <>
                            <div className="p-3 border-b">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={selectedUser.profiles?.avatar_url} />
                                  <AvatarFallback>{getAvatarFallback(selectedUser)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-sm">{getDisplayName(selectedUser)}</h3>
                                  <OnlineStatus userId={selectedUser.user_id} groupId={groupId} />
                                </div>
                              </div>
                            </div>

                            <ScrollArea className="flex-1 p-3">
                              <div className="space-y-4">
                                {messages.length === 0 ? (
                                  <div className="text-center text-muted-foreground py-8">
                                    No messages yet. Start a conversation!
                                  </div>
                                ) : (
                                  messages.map((msg) => {
                                    const isFromCurrentUser = msg.sender_id === user?.id;
                                    return (
                                      <div key={msg.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg ${
                                          isFromCurrentUser 
                                            ? 'bg-primary text-primary-foreground ml-4' 
                                            : 'bg-muted mr-4'
                                        }`}>
                                          <p className="text-sm">{msg.content}</p>
                                          <span className={`text-xs ${
                                            isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                          }`}>
                                            {new Date(msg.created_at).toLocaleTimeString()}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                                <div ref={messagesEndRef} />
                              </div>
                            </ScrollArea>

                            <div className="p-3 border-t">
                              <div className="flex gap-2">
                                <Input
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  onKeyPress={handleKeyPress}
                                  placeholder={`Message ${getDisplayName(selectedUser)}...`}
                                  className="flex-1"
                                />
                                <Button 
                                  onClick={sendDirectMessage} 
                                  disabled={!message.trim() || loading}
                                  size="sm"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <UserIcon className="h-16 w-16 mx-auto mb-4" />
                              <p>Select a member to start chatting</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="group" className="flex-1 flex flex-col mt-0">
                    <GroupChat groupId={groupId} groupName={groupName} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};