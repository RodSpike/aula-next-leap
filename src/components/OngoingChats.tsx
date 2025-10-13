import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ConversationItem {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  partner_id?: string;
  group_id?: string;
}

export const OngoingChats: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const conversationsList: ConversationItem[] = [];

      // Get all groups user is member of to fetch conversations from
      const { data: memberships } = await supabase
        .from('group_members')
        .select(`
          group_id,
          community_groups!inner(
            id,
            name,
            is_private_chat
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (memberships) {
        // Get direct message conversations
        for (const membership of memberships) {
          const groupId = membership.group_id;

          // Get conversation state for this group
          const { data: conversationStates } = await supabase
            .from('direct_conversation_state')
            .select('other_user_id, deleted_before')
            .eq('user_id', user.id)
            .eq('group_id', groupId);

          const stateMap = new Map(
            conversationStates?.map(state => [state.other_user_id, state.deleted_before]) || []
          );

          // Get direct messages for this group
          const { data: directMessages } = await supabase
            .from('direct_messages')
            .select(`
              sender_id,
              receiver_id,
              content,
              created_at,
              read_at
            `)
            .eq('group_id', groupId)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

          // Process direct message conversations
          const conversationMap = new Map<string, ConversationItem>();

          for (const msg of directMessages || []) {
            const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const deletedBefore = stateMap.get(partnerId);

            // Skip if message was sent before user deleted conversation
            if (deletedBefore && new Date(msg.created_at) <= new Date(deletedBefore)) {
              continue;
            }

            if (!conversationMap.has(partnerId)) {
              // Get partner profile
              const { data: partnerProfile } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url')
                .eq('user_id', partnerId)
                .single();

              if (partnerProfile) {
                conversationMap.set(partnerId, {
                  id: `direct-${partnerId}-${groupId}`,
                  type: 'direct',
                  name: partnerProfile.display_name || partnerProfile.username || 'Anonymous',
                  avatar_url: partnerProfile.avatar_url,
                  last_message: msg.content,
                  last_message_time: msg.created_at,
                  unread_count: 0,
                  partner_id: partnerId,
                  group_id: groupId
                });
              }
            }
          }

          // Count unread messages for each conversation
          for (const [partnerId, conversation] of conversationMap) {
            const { count } = await supabase
              .from('direct_messages')
              .select('*', { count: 'exact' })
              .eq('group_id', groupId)
              .eq('sender_id', partnerId)
              .eq('receiver_id', user.id)
              .is('read_at', null);

            conversation.unread_count = count || 0;
          }

          conversationsList.push(...conversationMap.values());

          // Handle private group chats
          if (membership.community_groups.is_private_chat) {
            const { data: lastGroupMessage } = await supabase
              .from('group_chat_messages')
              .select('content, created_at, sender_id')
              .eq('group_id', groupId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastGroupMessage) {
              conversationsList.push({
                id: `group-${groupId}`,
                type: 'group',
                name: membership.community_groups.name,
                last_message: lastGroupMessage.content,
                last_message_time: lastGroupMessage.created_at,
                unread_count: 0, // Group chat read status is more complex, keeping simple for now
                group_id: groupId
              });
            }
          }
        }
      }

      // Sort by last message time
      conversationsList.sort((a, b) => 
        new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
      );

      setConversations(conversationsList.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: ConversationItem) => {
    // Navigate to the /messages page which uses UnifiedChatInterface
    navigate('/messages');
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unread_count, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Ongoing Chats</span>
            {getTotalUnreadCount() > 0 && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                {getTotalUnreadCount()}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.avatar_url} />
                    <AvatarFallback>
                      {conversation.type === 'group' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        conversation.name.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm truncate">{conversation.name}</p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="bg-primary text-primary-foreground px-2 py-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(conversation.last_message_time)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">No conversations yet</p>
            <Button size="sm" onClick={() => navigate('/community')}>
              Join Groups to Start Chatting
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};