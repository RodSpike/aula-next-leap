import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  MessageCircle, 
  Send, 
  Users, 
  MessageSquare, 
  X,
  Bot,
  User as UserIcon,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OnlineStatus } from "./OnlineStatus";

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_profile?: {
    display_name: string;
    avatar_url: string;
  };
  receiver_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

interface GroupMember {
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
    username: string;
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
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ai-tutor' | 'direct' | 'group'>('ai-tutor');
  const [selectedUser, setSelectedUser] = useState<GroupMember | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchDirectMessages();
      subscribeToDirectMessages();
    }
  }, [isOpen, selectedUser]);

  const fetchDirectMessages = async () => {
    if (!user || !selectedUser) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${user.id})`)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profile data separately to avoid relationship issues
      const enrichedMessages = await Promise.all(
        (data || []).map(async (message) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', message.sender_id)
            .single();

          const { data: receiverProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', message.receiver_id)
            .single();

          return {
            ...message,
            sender_profile: senderProfile || { display_name: 'Unknown', avatar_url: '' },
            receiver_profile: receiverProfile || { display_name: 'Unknown', avatar_url: '' },
          };
        })
      );

      setDirectMessages(enrichedMessages);
      scrollToBottom();
    } catch (error: any) {
      console.error('Error fetching direct messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const subscribeToDirectMessages = () => {
    if (!user || !selectedUser) return;

    const channel = supabase
      .channel(`direct-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (
            newMessage && 
            typeof newMessage === 'object' &&
            'sender_id' in newMessage &&
            'receiver_id' in newMessage &&
            ((newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.user_id) ||
            (newMessage.sender_id === selectedUser.user_id && newMessage.receiver_id === user.id))
          ) {
            setDirectMessages(prev => [...prev, newMessage as DirectMessage]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendDirectMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.user_id,
          content: newMessage.trim(),
          group_id: groupId,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
                                    <AvatarFallback className="text-xs">
                                      {getAvatarFallback(member)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <OnlineStatus 
                                    userId={member.user_id} 
                                    groupId={groupId} 
                                    showBadge={false}
                                    className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {getDisplayName(member)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Chat Area */}
                      <div className="flex-1 flex flex-col">
                        {selectedUser ? (
                          <>
                            {/* Chat Header */}
                            <div className="p-3 border-b flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedUser.profiles?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {getAvatarFallback(selectedUser)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">
                                  {getDisplayName(selectedUser)}
                                </h3>
                                <OnlineStatus 
                                  userId={selectedUser.user_id} 
                                  groupId={groupId}
                                  className="text-xs"
                                />
                              </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-3">
                              <div className="space-y-3">
                                {directMessages.map((message) => {
                                  const isOwn = message.sender_id === user?.id;
                                  return (
                                    <div
                                      key={message.id}
                                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[70%] p-3 rounded-lg ${
                                          isOwn
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}
                                      >
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        }`}>
                                          {new Date(message.created_at).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                                <div ref={messagesEndRef} />
                              </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-3 border-t">
                              <div className="flex gap-2">
                                <Input
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  onKeyPress={handleKeyPress}
                                  placeholder="Type a message..."
                                  className="flex-1"
                                />
                                <Button 
                                  onClick={sendDirectMessage}
                                  disabled={!newMessage.trim()}
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
                              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Select a member to start chatting</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="group" className="flex-1 flex flex-col mt-0">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Group Chat
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Users className="h-16 w-16 text-muted-foreground mx-auto" />
                          <h3 className="text-lg font-semibold">Group Chat Coming Soon</h3>
                          <p className="text-muted-foreground">
                            Group chat functionality will be available soon, allowing all members 
                            to communicate together in one shared space.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
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