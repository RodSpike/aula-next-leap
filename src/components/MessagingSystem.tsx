import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Bot, Users, UserIcon, X, Minimize2, Maximize2, Trash2, UserPlus, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OnlineStatus } from './OnlineStatus';
import { GroupChat } from './GroupChat';
import { PrivateGroupChat } from './PrivateGroupChat';
import { EnhancedChatInput } from './enhanced/EnhancedChatInput';
import { EnhancedAIChatInterface } from './enhanced/EnhancedAIChatInterface';
import { Link } from "react-router-dom";

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

interface ConversationSummary {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
}

interface MessagingSystemProps {
  groupId: string;
  groupName: string;
  groupLevel?: string;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ai-tutor' | 'direct' | 'group';
  initialSelectedUserId?: string;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  groupId, 
  groupName, 
  groupLevel,
  members, 
  isOpen, 
  onClose,
  initialTab = 'direct',
  initialSelectedUserId
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai-tutor' | 'direct' | 'group'>(initialTab);
  const [selectedUser, setSelectedUser] = useState<GroupMember | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddPeopleDialog, setShowAddPeopleDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const [privateGroupName, setPrivateGroupName] = useState('');
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  const [privateGroupId, setPrivateGroupId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'direct' && user) {
      fetchConversations();
    }
  }, [isOpen, activeTab, user]);

  // Auto-select user when initialSelectedUserId is provided
  useEffect(() => {
    if (initialSelectedUserId && members.length > 0 && !selectedUser) {
      const userToSelect = members.find(member => member.user_id === initialSelectedUserId);
      if (userToSelect) {
        setSelectedUser(userToSelect);
      }
    }
  }, [initialSelectedUserId, members, selectedUser]);

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchDirectMessages();
      subscribeToDirectMessages();
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get conversation state
      const { data: conversationStates } = await supabase
        .from('direct_conversation_state')
        .select('other_user_id, deleted_before')
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      const stateMap = new Map(
        conversationStates?.map(state => [state.other_user_id, state.deleted_before]) || []
      );

      // Get all direct messages for this user and group
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select(`
          sender_id,
          receiver_id,
          content,
          created_at
        `)
        .eq('group_id', groupId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner and get latest message
      const conversationMap = new Map<string, ConversationSummary>();

      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const deletedBefore = stateMap.get(partnerId);

        // Skip if message was sent before user deleted conversation
        if (deletedBefore && new Date(msg.created_at) <= new Date(deletedBefore)) {
          continue;
        }

        if (!conversationMap.has(partnerId)) {
          // Get partner profile
          const partnerMember = members.find(m => m.user_id === partnerId);
          if (partnerMember) {
            conversationMap.set(partnerId, {
              user_id: partnerId,
              display_name: partnerMember.profiles?.display_name || partnerMember.profiles?.username || 'Anonymous',
              username: partnerMember.profiles?.username || '',
              avatar_url: partnerMember.profiles?.avatar_url,
              last_message: msg.content,
              last_message_time: msg.created_at
            });
          }
        }
      }

      // Also add private group chats (created for DMs) where user is a member
      // Step 1: fetch memberships
      const { data: memberships }: any = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const groupIds = (memberships || []).map(m => m.group_id);

      if (groupIds.length > 0) {
        // Step 2: fetch only private-chat groups where user is still a member
        const { data: privateGroups } = await (supabase as any)
          .from('community_groups')
          .select('id, name')
          .in('id', groupIds)
          .eq('is_private_chat', true);

        // Step 3: fetch last message for each private group (sequential to keep TS simple)
        for (const g of privateGroups || []) {
          // Double-check user is still a member of this group
          const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', g.id)
            .eq('user_id', user.id)
            .eq('status', 'accepted')
            .maybeSingle();

          if (membership) {
            const { data: lastMsg } = await supabase
              .from('group_chat_messages')
              .select('content, created_at')
              .eq('group_id', g.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            conversationMap.set(`group_${g.id}`, {
              user_id: `group_${g.id}`,
              display_name: g.name,
              username: '',
              avatar_url: undefined,
              last_message: lastMsg?.content || 'New private group',
              last_message_time: lastMsg?.created_at || new Date().toISOString()
            });
          }
        }
      }


      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const deleteConversation = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if this is a private group chat
      if (otherUserId.startsWith('group_')) {
        const groupId = otherUserId.replace('group_', '');
        
        // Get user's display name for the system message
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', user.id)
          .single();

        const displayName = userProfile?.display_name || userProfile?.username || 'Anonymous User';
        
        // Add system message that user left the group
        await supabase
          .from('group_chat_messages')
          .insert({
            group_id: groupId,
            sender_id: user.id,
            content: `${displayName} has left the group`,
            is_system_message: true
          });

        // Remove user from the group (leave the group)
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Refresh conversations and clear selection
        await fetchConversations();
        if (selectedUser?.user_id === otherUserId) {
          setSelectedUser(null);
          setMessages([]);
          setIsPrivateGroup(false);
          setPrivateGroupId(null);
        }
      } else {
        // Handle regular direct message conversation deletion
        await supabase
          .from('direct_conversation_state')
          .upsert({
            user_id: user.id,
            other_user_id: otherUserId,
            group_id: groupId,
            deleted_before: new Date().toISOString()
          }, {
            onConflict: 'user_id,other_user_id,group_id'
          });

        // Refresh conversations and clear selection if this was the selected user
        await fetchConversations();
        if (selectedUser?.user_id === otherUserId) {
          setSelectedUser(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

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
            setMessages(prev => [...prev, newMessage]);
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
    if (!selectedUser || !message.trim() || !user) return;

    // Optimistic UI update
    const optimistic: DirectMessage = {
      id: crypto.randomUUID(),
      content: message.trim(),
      created_at: new Date().toISOString(),
      sender_id: user.id,
      receiver_id: selectedUser.user_id,
    } as any;
    setMessages(prev => [...prev, optimistic]);
    setMessage('');
    scrollToBottom();

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.user_id,
          content: optimistic.content,
          group_id: groupId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending direct message:', error);
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

  const createPrivateGroup = async (participantIds: string[]) => {
    if (!user || !selectedUser) return;

    try {
      console.log('Creating private group with participants:', participantIds);
      console.log('Current user:', user.id);
      console.log('Selected user:', selectedUser.user_id);

      const allowedLevels = ['Basic','Intermediate','Advanced','A1','A2','B1','B2','C1','C2'] as const;
      const levelToUse = allowedLevels.includes((groupLevel as any)) ? (groupLevel as any) : 'B1';

      const payload = {
        name: privateGroupName || `Chat with ${getDisplayName(selectedUser)}`,
        description: 'Private chat group',
        level: levelToUse,
        group_type: 'closed',
        created_by: user.id,
        max_members: 10,
        is_private_chat: true
      } as const;

      console.log('Group payload:', payload);

      // Create private group
      const { data: groupData, error: groupError } = await supabase
        .from('community_groups')
        .insert(payload)
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        throw groupError;
      }

      console.log('Group created successfully:', groupData);

      // Add all participants as members
      const allParticipants = [user.id, selectedUser.user_id, ...participantIds];
      console.log('Adding participants:', allParticipants);

      const memberInserts = allParticipants.map(userId => ({
        group_id: groupData.id,
        user_id: userId,
        status: 'accepted',
        can_post: true,
        invited_by: user.id
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error adding members:', membersError);
        throw membersError;
      }

      console.log('Members added successfully');

      // Stay in direct messages and refresh conversations
      setShowAddPeopleDialog(false);
      setSelectedUsersToAdd([]);
      await fetchConversations();
      
      console.log('Private group creation completed successfully');
      
    } catch (error) {
      console.error('Error creating private group:', error);
      // Add user-friendly error display
      alert(`Failed to create group chat: ${error.message || 'Unknown error'}`);
    }
  };

  const updateGroupName = async (newName: string) => {
    if (!privateGroupId || !user) return;

    try {
      const { error } = await supabase
        .from('community_groups')
        .update({ name: newName })
        .eq('id', privateGroupId)
        .eq('created_by', user.id);

      if (error) throw error;
      
      setPrivateGroupName(newName);
      setShowEditGroupDialog(false);
    } catch (error) {
      console.error('Error updating group name:', error);
    }
  };

  const handleAddPeople = async () => {
    if (selectedUsersToAdd.length === 0 || isCreatingGroup) return;
    
    console.log('handleAddPeople called with users:', selectedUsersToAdd);
    setIsCreatingGroup(true);
    
    try {
      await createPrivateGroup(selectedUsersToAdd);
    } catch (error) {
      console.error('Error in handleAddPeople:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsersToAdd(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getDisplayName = (member: GroupMember) => {
    return member.profiles?.display_name || member.profiles?.username || 'Anonymous User';
  };

  const getAvatarFallback = (member: GroupMember) => {
    const name = getDisplayName(member);
    return name.charAt(0).toUpperCase();
  };

  const availableMembers = members.filter(member => member.user_id !== user?.id);
  
  // Debug logging
  console.log('MessagingSystem Debug:', {
    totalMembers: members.length,
    availableMembers: availableMembers.length,
    membersData: members,
    currentUserId: user?.id,
    availableMembersData: availableMembers
  });

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
                        <Bot className="h-16 w-16 text-primary mx-auto animate-pulse" />
                        <h3 className="text-lg font-semibold">🤖 AI Tutor Assistant</h3>
                        <p className="text-muted-foreground">
                          Your personal AI English tutor is ready to help! Get instant feedback, 
                          practice conversations, and receive personalized learning assistance.
                        </p>
                        <div className="space-y-2">
                          <Button className="mt-4 bg-gradient-to-r from-primary to-primary/80" asChild>
                            <Link to="/ai-chat">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Start AI Conversation
                            </Link>
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            💡 Supports voice input, document analysis, and works in Portuguese & English!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                  <TabsContent value="direct" className="flex-1 flex flex-col mt-0">
                    <div className="flex-1 flex">
                      {/* Left side: Conversations and Member selector */}
                      <div className="w-1/3 border-r flex flex-col">
                        {!selectedUser ? (
                          <div className="flex-1 flex flex-col p-3">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Start New Conversation</h4>
                                <Select onValueChange={(userId) => {
                                  const member = availableMembers.find(m => m.user_id === userId);
                                  if (member) setSelectedUser(member);
                                }}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a member..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableMembers
                                      .filter(member => member.status === 'accepted')
                                      .map(member => (
                                        <SelectItem key={member.user_id} value={member.user_id}>
                                          <div className="flex items-center gap-2 w-full">
                                            <OnlineStatus 
                                              userId={member.user_id} 
                                              groupId={groupId} 
                                              showBadge={false}
                                              className="w-2 h-2"
                                            />
                                            <span>
                                              {getDisplayName(member)}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {conversations.length > 0 && (
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm mb-2">Ongoing Conversations</h4>
                                  <ScrollArea className="h-[300px]">
                                    <div className="space-y-2">
                                      {conversations.map(conv => (
                                         <div
                                           key={conv.user_id}
                                           className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                                           onClick={() => {
                                             if (conv.user_id.startsWith('group_')) {
                                               // Handle private group selection
                                               const groupId = conv.user_id.replace('group_', '');
                                               setPrivateGroupId(groupId);
                                               setIsPrivateGroup(true);
                                               setPrivateGroupName(conv.display_name);
                                               // Create a placeholder user for the UI
                                               setSelectedUser({
                                                 user_id: conv.user_id,
                                                 status: 'accepted',
                                                 profiles: {
                                                   display_name: conv.display_name,
                                                   username: '',
                                                   avatar_url: conv.avatar_url
                                                 }
                                               });
                                             } else {
                                               // Handle regular user selection
                                               const member = members.find(m => m.user_id === conv.user_id);
                                               if (member) {
                                                 setSelectedUser(member);
                                                 setIsPrivateGroup(false);
                                                 setPrivateGroupId(null);
                                               }
                                             }
                                           }}
                                         >
                                             <div className="flex items-center gap-2 flex-1 min-w-0">
                                               <Avatar className="w-8 h-8">
                                                 <AvatarImage src={conv.avatar_url} />
                                                 <AvatarFallback>
                                                   {conv.user_id.startsWith('group_') ? 
                                                     <Users className="w-4 h-4" /> : 
                                                     conv.display_name.charAt(0).toUpperCase()
                                                   }
                                                 </AvatarFallback>
                                               </Avatar>
                                               <div className="flex-1 min-w-0">
                                                 <div className="flex items-center gap-1">
                                                   {!conv.user_id.startsWith('group_') && (
                                                     <OnlineStatus 
                                                       userId={conv.user_id} 
                                                       groupId={groupId} 
                                                       showBadge={false}
                                                       className="w-2 h-2"
                                                     />
                                                   )}
                                                   <p className="text-sm font-medium truncate flex items-center gap-1">
                                                     {conv.user_id.startsWith('group_') && (
                                                       <Users className="w-3 h-3" />
                                                     )}
                                                     {conv.display_name}
                                                   </p>
                                                 </div>
                                                 <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                                               </div>
                                             </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setUserToDelete(conv.user_id);
                                              setShowDeleteDialog(true);
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 border-b">
                            <div className="flex items-center justify-between">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                ← Back
                              </Button>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAddPeopleDialog(true)}
                                  title="Add people to create group chat"
                                >
                                  <UserPlus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(selectedUser.user_id);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedUser.profiles?.avatar_url} />
                                <AvatarFallback>{getAvatarFallback(selectedUser)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm">{getDisplayName(selectedUser)}</h3>
                                  {isPrivateGroup && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0"
                                      onClick={() => {
                                        setPrivateGroupName(groupName);
                                        setShowEditGroupDialog(true);
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <OnlineStatus userId={selectedUser.user_id} groupId={groupId} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right side: Chat Area */}
                      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        {selectedUser ? (
                           <>
                             {selectedUser.user_id.startsWith('group_') ? (
                               <PrivateGroupChat
                                 groupId={privateGroupId!}
                                 groupName={privateGroupName}
                               />
                             ) : (
                               <>
                                <ScrollArea className="flex-1 px-3">
                                  <div className="space-y-4 py-4">
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

                                 <div className="flex-shrink-0 border-t bg-background p-3">
                                    <EnhancedChatInput
                                      value={message}
                                      onChange={setMessage}
                                      onSend={sendDirectMessage}
                                      placeholder={`Message ${getDisplayName(selectedUser)}...`}
                                      disabled={loading}
                                      showVoiceInput={false}
                                      className="w-full"
                                    />
                                 </div>
                               </>
                             )}
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

                   <TabsContent value="group" className="flex-1 min-h-0 flex flex-col mt-0">
                     <GroupChat 
                       groupId={groupId} 
                       groupName={groupName} 
                     />
                   </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </SheetContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This will only delete it for you - the other person will still see their copy of the conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteConversation(userToDelete);
                  setUserToDelete(null);
                }
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAddPeopleDialog} onOpenChange={setShowAddPeopleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add People to Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name (optional)</Label>
              <Input
                id="group-name"
                value={privateGroupName}
                onChange={(e) => setPrivateGroupName(e.target.value)}
                placeholder={`Chat with ${selectedUser ? getDisplayName(selectedUser) : 'others'}`}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Select people to add:</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {availableMembers
                  .filter(member => member.user_id !== selectedUser?.user_id && member.status === 'accepted')
                  .map(member => (
                    <div key={member.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${member.user_id}`}
                        checked={selectedUsersToAdd.includes(member.user_id)}
                        onCheckedChange={() => toggleUserSelection(member.user_id)}
                      />
                      <Label 
                        htmlFor={`user-${member.user_id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.profiles?.avatar_url} />
                          <AvatarFallback>{getAvatarFallback(member)}</AvatarFallback>
                        </Avatar>
                        <span>{getDisplayName(member)}</span>
                        <OnlineStatus userId={member.user_id} groupId={groupId} showBadge={false} className="w-2 h-2" />
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPeopleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPeople}
              disabled={selectedUsersToAdd.length === 0 || isCreatingGroup}
            >
              {isCreatingGroup ? 'Creating...' : 'Create Group Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditGroupDialog} onOpenChange={setShowEditGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={privateGroupName}
                onChange={(e) => setPrivateGroupName(e.target.value)}
                placeholder="Enter group name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGroupDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateGroupName(privateGroupName)}
              disabled={!privateGroupName.trim()}
            >
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};