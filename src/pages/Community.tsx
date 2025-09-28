import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PostInteractions } from "@/components/PostInteractions";
import { NavigationPersistence } from "@/components/NavigationPersistence";
import { OnlineStatus } from "@/components/OnlineStatus";
import { MessagingSystem } from "@/components/MessagingSystem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PersonalProgress } from "@/components/PersonalProgress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  UserPlus, 
  Settings,
  Send,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Lock,
  Building2,
  User,
  Filter,
  MoreVertical,
  Edit2,
  Archive,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { ClickableUserProfile } from "@/components/ClickableUserProfile";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { useUserProfileClick } from "@/hooks/useUserProfileClick";

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  level: string;
  created_by: string;
  is_default: boolean;
  max_members: number;
  created_at: string;
  group_type: 'open' | 'closed';
  invite_code?: string;
  member_count?: number;
  is_member?: boolean;
  can_post?: boolean;
  archived?: boolean;
}

interface GroupPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  attachments?: {
    url: string;
    type: string;
    name: string;
    thumbnail?: string;
    videoId?: string;
  }[];
  profiles: {
    display_name: string;
    avatar_url?: string;
  } | null;
  is_admin?: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState("A1");
  const [newGroupObjective, setNewGroupObjective] = useState("");
  const [newGroupType, setNewGroupType] = useState<'open' | 'closed'>('open');
  const [joinCode, setJoinCode] = useState("");
  const [newPost, setNewPost] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinCodeDialogOpen, setIsJoinCodeDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | "official" | "user">("all");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedGroupForCode, setSelectedGroupForCode] = useState<CommunityGroup | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialTab, setChatInitialTab] = useState<'ai-tutor' | 'direct' | 'group'>('direct');
  const [chatInitialUserId, setChatInitialUserId] = useState<string | undefined>(undefined);
  const { isPopupOpen, selectedUserId, selectedProfile, openUserProfile, setIsPopupOpen } = useUserProfileClick();

  useEffect(() => {
    if (user) {
      // First fetch user profile, then groups to ensure auto-join works correctly
      fetchUserProfile().then(() => {
        fetchGroups();
      });
    }
  }, [user]);

  // Handle navigation state for auto-opening chats
  useEffect(() => {
    const state = location.state as any;
    if (state && groups.length > 0) {
      if (state.openGroupChat && state.groupId) {
        const groupToOpen = groups.find(g => g.id === state.groupId);
        if (groupToOpen) {
          setSelectedGroup(groupToOpen);
          setChatInitialTab('group');
          setChatInitialUserId(undefined);
          setIsChatOpen(true);
          // Do NOT replace history; just clear location state locally to preserve Back behavior
          history.replaceState({ ...history.state, usr: undefined }, '');
        }
      } else if (state.openDirectMessage && state.groupId && state.partnerId) {
        const groupToOpen = groups.find(g => g.id === state.groupId);
        if (groupToOpen) {
          setSelectedGroup(groupToOpen);
          setChatInitialTab('direct');
          setChatInitialUserId(state.partnerId);
          setIsChatOpen(true);
          history.replaceState({ ...history.state, usr: undefined }, '');
        }
      }
    }
  }, [groups, location.state]);

  // Admin role check and immediate visibility updates
  useEffect(() => {
    const MASTER_ADMIN_EMAILS = ["rodspike2k8@gmail.com", "luccadtoledo@gmail.com"];
    const checkAdminStatus = async () => {
      if (!user) return;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (error) {
        console.error('Error checking admin role via RPC:', error);
      }
      setIsAdmin((data === true) || (user?.email ? MASTER_ADMIN_EMAILS.includes(user.email) : false));
    };

    checkAdminStatus();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkAdminStatus();
    };
    window.addEventListener('focus', checkAdminStatus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', checkAdminStatus as any);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchPosts(selectedGroup.id);
      fetchGroupMembers(selectedGroup.id);
      
      // Update selected group with latest membership info
      const updatedGroup = groups.find(g => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    }
  }, [selectedGroup?.id, groups]);

  // Auto-select group from URL (?group=ID) or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const groupId = params.get('group');
    const savedGroupId = localStorage.getItem('selectedGroupId');
    
    if (groups.length > 0) {
      let targetGroupId = groupId || savedGroupId;
      if (targetGroupId) {
        const match = groups.find(g => g.id === targetGroupId);
        if (match) {
          setSelectedGroup(match);
          // Clear localStorage after using it
          if (savedGroupId) {
            localStorage.removeItem('selectedGroupId');
          }
        }
      }
    }
  }, [location.search, groups]);

  const fetchGroups = async () => {
    try {
      // First get all community groups
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .eq('archived', false)
        .eq('is_private_chat', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts for each group separately
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact' })
            .eq('group_id', group.id)
            .eq('status', 'accepted');
          
          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      // Auto-join user to their level group if they have a cambridge_level but aren't already in the group
      if (userProfile?.cambridge_level) {
        const userLevelGroup = groupsWithCounts.find(g => 
          g.level === userProfile.cambridge_level && g.is_default
        );
        
        if (userLevelGroup) {
          // Check if user is already a member
          const { data: existingMembership, error: membershipError } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', userLevelGroup.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (!membershipError && !existingMembership) {
            // Auto-join user to their level group
            const { error: joinError } = await supabase
              .from('group_members')
              .upsert({
                group_id: userLevelGroup.id,
                user_id: user?.id,
                status: 'accepted',
                can_post: true
              }, {
                onConflict: 'group_id,user_id'
              });
            
            if (joinError) {
              console.error('Error auto-joining group:', joinError);
            } else {
              console.log('Auto-joined user to level group:', userLevelGroup.name);
            }
          }
        }
      }

      // Get user memberships (refresh after potential auto-join)
      const { data: memberships, error: membershipsFetchError } = await supabase
        .from('group_members')
        .select('group_id, can_post, status')
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (membershipsFetchError) {
        console.error('Error fetching memberships:', membershipsFetchError);
      }

      const groupsWithMembership = groupsWithCounts.map(group => ({
        ...group,
        group_type: (group.group_type as 'open' | 'closed') || 'open',
        is_member: memberships?.some(m => m.group_id === group.id) || false,
        can_post: memberships?.find(m => m.group_id === group.id)?.can_post || false
      }));

      console.log('Groups with membership info:', groupsWithMembership.map(g => ({
        name: g.name,
        is_member: g.is_member,
        can_post: g.can_post,
        is_default: g.is_default,
        level: g.level
      })));

      setGroups(groupsWithMembership);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load community groups",
        variant: "destructive",
      });
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('cambridge_level')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
      return data; // Return data for chaining
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const fetchPosts = async (groupId: string) => {
    try {
      // First get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Then get the profile information for each post
      const posts = [];
      for (const post of postsData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', post.user_id)
          .single();

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', post.user_id)
          .eq('role', 'admin')
          .maybeSingle();

        posts.push({
          ...post,
          profiles: profileData || { display_name: 'Unknown User', avatar_url: null },
          is_admin: !!adminData
        });
      }

      setPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      // First get the group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          status
        `)
        .eq('group_id', groupId)
        .eq('status', 'accepted');

      if (membersError) throw membersError;

      // Then get profiles for each member
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, username')
            .eq('user_id', member.user_id)
            .single();

          return {
            ...member,
            profiles: profileData || { 
              display_name: 'Unknown User', 
              avatar_url: null, 
              username: 'unknown' 
            }
          };
        })
      );

      console.log('Fetched group members:', membersWithProfiles);
      setGroupMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers([]); // Set empty array on error to prevent undefined issues
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const inviteCode = newGroupType === 'closed' ? 
        Math.random().toString(36).substring(2, 15) : null;

      const { error } = await supabase
        .from('community_groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          level: newGroupLevel,
          created_by: user.id,
          group_type: newGroupType,
          invite_code: inviteCode
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Group created successfully! ${inviteCode ? `Invite code: ${inviteCode}` : ''}`,
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupLevel("A1");
      setNewGroupType('open');
      setIsCreateGroupOpen(false);
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const joinGroup = async (groupId: string, inviteCode?: string) => {
    if (!user) return;

    try {
      // Check if group is closed and requires invite code
      const group = groups.find(g => g.id === groupId);
      if (group?.group_type === 'closed' && !inviteCode) {
        setSelectedGroupForCode(group);
        setIsJoinCodeDialogOpen(true);
        return;
      }

      if (group?.group_type === 'closed' && inviteCode && group.invite_code !== inviteCode) {
        toast({
          title: "Error",
          description: "Invalid invitation code",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .upsert({
          group_id: groupId,
          user_id: user.id,
          status: 'accepted',
          can_post: true
        }, {
          onConflict: 'group_id,user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined group successfully!",
      });

      setIsJoinCodeDialogOpen(false);
      setJoinCode("");
      setSelectedGroupForCode(null);
      fetchGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left group successfully!",
      });

      fetchGroups();
      
      // If user left the currently selected group, deselect it
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  const archiveGroup = async (group: CommunityGroup) => {
    const proceed = confirm(group.archived ? 'Restore this group?' : 'Archive this group? It will be hidden from public view.');
    if (!proceed) return;
    try {
      const { error } = await supabase
        .from('community_groups')
        .update({ archived: !group.archived })
        .eq('id', group.id);
      if (error) throw error;
      toast({ title: 'Success', description: group.archived ? 'Group restored' : 'Group archived' });
      if (selectedGroup?.id === group.id && !group.archived) {
        setSelectedGroup(null);
      }
      fetchGroups();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update group', variant: 'destructive' });
    }
  };

  const deleteGroup = async (group: CommunityGroup) => {
    if (!confirm('Delete this group permanently? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', group.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Group deleted' });
      if (selectedGroup?.id === group.id) setSelectedGroup(null);
      fetchGroups();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete group', variant: 'destructive' });
    }
  };

  const createPost = async () => {
    if (!user || !selectedGroup || (!newPost.trim() && selectedFiles.length === 0)) return;

    try {
      let attachments: any[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('community-files')
            .upload(fileName, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('community-files')
            .getPublicUrl(data.path);

          return {
            url: publicUrl,
            type: file.type,
            name: file.name
          };
        });

        attachments = await Promise.all(uploadPromises);
      }

      // Process YouTube links in content
      let processedContent = newPost;
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
      const youtubeMatches = [...newPost.matchAll(youtubeRegex)];
      
      for (const match of youtubeMatches) {
        const videoId = match[1];
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        attachments.push({
          url: match[0],
          type: 'youtube',
          name: `YouTube Video`,
          thumbnail: thumbnailUrl,
          videoId: videoId
        });
      }

      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          content: processedContent,
          attachments: attachments
        });

      if (error) throw error;

      setNewPost("");
      setSelectedFiles([]);
      fetchPosts(selectedGroup.id);
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Validate file types and sizes
      const validFiles = fileArray.filter(file => {
        const isValidType = file.type.startsWith('image/') || 
                           file.type === 'application/pdf' ||
                           file.type.startsWith('text/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        
        if (!isValidType) {
          toast({
            title: "Erro",
            description: `Tipo de arquivo não suportado: ${file.name}`,
            variant: "destructive",
          });
          return false;
        }
        
        if (!isValidSize) {
          toast({
            title: "Erro", 
            description: `Arquivo muito grande: ${file.name}`,
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      });
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getLevelHierarchy = (level: string): number => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels.indexOf(level);
  };

  const canAccessGroup = (groupLevel: string): boolean => {
    if (!userProfile?.cambridge_level) return false;
    const userLevelIndex = getLevelHierarchy(userProfile.cambridge_level);
    const groupLevelIndex = getLevelHierarchy(groupLevel);
    return userLevelIndex >= groupLevelIndex;
  };

  const filteredGroups = groups
    .filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = groupFilter === "all" || 
        (groupFilter === "official" && group.is_default) ||
        (groupFilter === "user" && !group.is_default);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Joined groups first
      if (a.is_member !== b.is_member) {
        return a.is_member ? -1 : 1;
      }
      
      // User's current level group first (among joined groups)
      if (userProfile?.cambridge_level) {
        if (a.level === userProfile.cambridge_level && a.is_default) return -1;
        if (b.level === userProfile.cambridge_level && b.is_default) return 1;
      }
      
      // Then by level hierarchy
      const aLevelIndex = getLevelHierarchy(a.level);
      const bLevelIndex = getLevelHierarchy(b.level);
      
      if (aLevelIndex !== bLevelIndex) {
        return aLevelIndex - bLevelIndex;
      }
      
      // Official groups before user groups
      if (a.is_default !== b.is_default) {
        return a.is_default ? -1 : 1;
      }
      
      return a.name.localeCompare(b.name);
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Join the Community</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to access community groups and connect with other English learners.
              </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationPersistence />
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-subtle py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Comunidade de Aprendizado
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conecte-se com outros estudantes, pratique juntos e compartilhe seu progresso.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Groups</h2>
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                       <Textarea
                         placeholder="Group description"
                         value={newGroupDescription}
                         onChange={(e) => setNewGroupDescription(e.target.value)}
                       />
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={newGroupLevel}
                        onChange={(e) => setNewGroupLevel(e.target.value)}
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={newGroupType}
                        onChange={(e) => setNewGroupType(e.target.value as 'open' | 'closed')}
                      >
                        <option value="open">Open Group (Anyone can join)</option>
                        <option value="closed">Closed Group (Invite code required)</option>
                      </select>
                       <Button onClick={createGroup} className="w-full" disabled={!newGroupName.trim()}>
                         Create Group
                       </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={groupFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={groupFilter === "official" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupFilter("official")}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Official
                </Button>
                <Button
                  variant={groupFilter === "user" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupFilter("user")}
                >
                  <User className="h-3 w-3 mr-1" />
                  User
                </Button>
              </div>

              {/* Groups List */}
              <div className="space-y-3">
                {filteredGroups.map((group) => {
                  const isUserCurrentLevel = userProfile?.cambridge_level === group.level && group.is_default;
                  const canAccess = canAccessGroup(group.level);
                  const isLocked = !canAccess && group.is_default;
                  
                  return (
                    <Card 
                      key={group.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''
                      } ${isUserCurrentLevel ? 'bg-primary/5 border-primary/20' : ''} ${
                        isLocked ? 'opacity-75' : ''
                      }`}
                      onClick={() => !isLocked && setSelectedGroup(group)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {group.is_default ? (
                              <Building2 className="h-3 w-3 text-primary" />
                            ) : (
                              <User className="h-3 w-3 text-muted-foreground" />
                            )}
                            <h3 className={`font-semibold text-sm ${isUserCurrentLevel ? 'text-primary' : ''}`}>
                              {group.name}
                              {isUserCurrentLevel && ' (Your Level)'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                            <Badge variant={isUserCurrentLevel ? "default" : "outline"} className="text-xs">
                              {group.level}
                            </Badge>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); archiveGroup(group); }}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive Group
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); deleteGroup(group); }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Group
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {group.member_count || 0} members
                        </div>
                         {!group.is_member && !isLocked && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={(e) => {
                               e.stopPropagation();
                               joinGroup(group.id);
                             }}
                           >
                             <UserPlus className="h-3 w-3 mr-1" />
                             Join
                           </Button>
                         )}
                         {group.is_member && !group.is_default && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={(e) => {
                               e.stopPropagation();
                               leaveGroup(group.id);
                             }}
                           >
                             Leave
                           </Button>
                         )}
                        {isLocked && (
                          <div className="text-xs text-muted-foreground">
                            Reach {group.level} level to join
                          </div>
                        )}
                      </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Join Code Dialog */}
              <Dialog open={isJoinCodeDialogOpen} onOpenChange={setIsJoinCodeDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Private Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This is a private group. Please enter the invitation code to join.
                    </p>
                    <Input
                      placeholder="Enter invitation code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => selectedGroupForCode && joinGroup(selectedGroupForCode.id, joinCode)} 
                        disabled={!joinCode.trim()}
                        className="flex-1"
                      >
                        Join Group
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsJoinCodeDialogOpen(false);
                          setJoinCode("");
                          setSelectedGroupForCode(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="space-y-6">
                 {/* Group Header */}
                 <Card>
                   <CardHeader>
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <CardTitle className="flex items-center gap-2">
                           {selectedGroup.is_default ? (
                             <Building2 className="h-4 w-4 text-primary" />
                           ) : (
                             <User className="h-4 w-4 text-muted-foreground" />
                           )}
                           {selectedGroup.name}
                           <Badge variant="outline">{selectedGroup.level}</Badge>
                           {selectedGroup.group_type === 'closed' && (
                             <Badge variant="secondary" className="text-xs">
                               <Lock className="h-3 w-3 mr-1" />
                               Private
                             </Badge>
                           )}
                         </CardTitle>
                         
                         {/* Welcome Message */}
                         <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                           <h4 className="font-semibold text-primary mb-2">
                             {selectedGroup.is_default ? '🏫 Official Aula Click Community' : '👥 User Community'}
                           </h4>
                           {selectedGroup.is_default ? (
                             <p className="text-sm text-muted-foreground">
                               Welcome to the official {selectedGroup.level} level community! 
                               This is your space to practice English, get help from peers, and improve together. 
                               Connect with other learners at your level and enhance your language skills.
                             </p>
                           ) : null}
                         </div>
                         
                         {selectedGroup.description && (
                           <p className="text-muted-foreground mt-2">
                             {selectedGroup.description}
                           </p>
                         )}
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="flex items-center text-sm text-muted-foreground">
                           <Users className="h-4 w-4 mr-1" />
                           {selectedGroup.member_count || 0} members
                         </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setChatInitialTab('group');
                              setChatInitialUserId(undefined);
                              setIsChatOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Group Chat
                          </Button>
                       </div>
                     </div>
                     
                     {/* Online Members */}
                     {groupMembers.length > 0 && (
                       <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="text-sm font-medium">Members Online:</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {groupMembers.slice(0, 8).map((member) => (
                              <ClickableUserProfile
                                key={member.user_id}
                                userId={member.user_id}
                                profile={{
                                  user_id: member.user_id,
                                  display_name: member.profiles?.display_name || 'Unknown',
                                  username: member.profiles?.username,
                                  avatar_url: member.profiles?.avatar_url
                                }}
                                onClick={openUserProfile}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.profiles?.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {member.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <OnlineStatus 
                                    userId={member.user_id} 
                                    groupId={selectedGroup.id}
                                    showBadge={false}
                                    className="w-2 h-2"
                                  />
                                  <span className="text-xs text-muted-foreground hover:underline">
                                    {member.profiles?.display_name || 'Unknown'}
                                  </span>
                                </div>
                              </ClickableUserProfile>
                            ))}
                           {groupMembers.length > 8 && (
                             <span className="text-xs text-muted-foreground">
                               +{groupMembers.length - 8} more
                             </span>
                           )}
                         </div>
                       </div>
                     )}
                   </CardHeader>
                 </Card>

                  {/* Personal Progress for English Learning Group */}
                  {selectedGroup.is_default && selectedGroup.name === 'English Learning' && (
                    <PersonalProgress level={selectedGroup.level} className="mb-6" />
                  )}

                 {/* Create Post */}
                {selectedGroup.can_post && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Share something with the group..."
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                        />
                        
                        {/* File Upload */}
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf,.txt,.doc,.docx"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Anexar Arquivos
                            </Button>
                          </div>
                          
                          {/* Selected Files Preview */}
                          {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    {file.type.startsWith('image/') ? (
                                      <ImageIcon className="h-4 w-4" />
                                    ) : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={createPost} 
                            disabled={!newPost.trim() && selectedFiles.length === 0}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Post
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Posts */}
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <ClickableUserProfile
                                userId={post.user_id}
                                profile={{
                                  user_id: post.user_id,
                                  display_name: post.profiles?.display_name || 'Unknown User',
                                  avatar_url: post.profiles?.avatar_url
                                }}
                                onClick={openUserProfile}
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={post.profiles?.avatar_url} />
                                  <AvatarFallback>
                                    {post.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              </ClickableUserProfile>
                              <div>
                                <div className="flex items-center gap-2">
                                  <ClickableUserProfile
                                    userId={post.user_id}
                                    profile={{
                                      user_id: post.user_id,
                                      display_name: post.profiles?.display_name || 'Unknown User',
                                      avatar_url: post.profiles?.avatar_url
                                    }}
                                    onClick={openUserProfile}
                                  >
                                    <p className="font-medium text-sm hover:underline">
                                      {post.profiles?.display_name || 'Unknown User'}
                                    </p>
                                  </ClickableUserProfile>
                                  {post.is_admin && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Settings className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                           <p className="text-sm">{post.content}</p>
                           
                            {/* Post Attachments */}
                            {post.attachments && post.attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {post.attachments.map((attachment, index) => (
                                  <div key={index}>
                                     {attachment.type === 'youtube' ? (
                                       <div className="border rounded-lg overflow-hidden">
                                         <div className="aspect-video">
                                           <iframe
                                             src={`https://www.youtube.com/embed/${attachment.videoId}`}
                                             title="YouTube Video"
                                             className="w-full h-full"
                                             frameBorder="0"
                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                             allowFullScreen
                                           />
                                         </div>
                                       </div>
                                    ) : attachment.type.startsWith('image/') ? (
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-full h-auto rounded-lg border"
                                        style={{ maxHeight: '300px' }}
                                      />
                                    ) : (
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted transition-colors"
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">{attachment.name}</span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Post Interactions */}
                            <PostInteractions 
                              postId={post.id}
                              userId={post.user_id}
                              isAdmin={isAdmin}
                              onEditPost={() => {
                                setEditPostId(post.id);
                                setEditPostContent(post.content);
                                setIsEditPostOpen(true);
                              }}
                              onDeletePost={async () => {
                                if (!confirm('Delete this post?')) return;
                                try {
                                  const { error } = await supabase.rpc('admin_delete_post', { post_id: post.id });
                                  if (error) throw error;
                                  toast({ title: 'Success', description: 'Post deleted' });
                                  fetchPosts(selectedGroup.id);
                                } catch (error: any) {
                                  toast({ title: 'Error', description: error.message || 'Failed to delete post', variant: 'destructive' });
                                }
                              }}
                            />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center p-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No posts yet</h3>
                        <p className="text-muted-foreground">
                          {selectedGroup.can_post 
                            ? "Be the first to start a conversation!" 
                            : "Join this group to participate in discussions."
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center p-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Group</h3>
                  <p className="text-muted-foreground">
                    Choose a group from the sidebar to view posts and discussions.
                  </p>
                </CardContent>
              </Card>
            )}
           </div>
         </div>
       </div>

      {/* Edit Post Dialog */}
      <Dialog open={isEditPostOpen} onOpenChange={setIsEditPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPostOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editPostId) return;
                try {
                  const { error } = await supabase
                    .from('group_posts')
                    .update({ content: editPostContent })
                    .eq('id', editPostId);
                  if (error) throw error;
                  toast({ title: 'Success', description: 'Post updated' });
                  setIsEditPostOpen(false);
                  if (selectedGroup) fetchPosts(selectedGroup.id);
                } catch (error: any) {
                  toast({ title: 'Error', description: error.message || 'Failed to update post', variant: 'destructive' });
                }
              }}>Save</Button>
            </div>
          </div>
         </DialogContent>
       </Dialog>

        {/* Messaging System */}
        {selectedGroup && groupMembers && (
          <MessagingSystem
            isOpen={isChatOpen}
            onClose={() => {
              setIsChatOpen(false);
              setChatInitialTab('direct');
              setChatInitialUserId(undefined);
            }}
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            groupLevel={selectedGroup.level}
            initialTab={chatInitialTab}
            initialSelectedUserId={chatInitialUserId}
            members={groupMembers.map(m => {
              console.log('Mapping member:', m); // Debug log
              return {
                user_id: m.user_id,
                status: m.status || 'accepted',
                profiles: {
                  display_name: m.profiles?.display_name || 'Unknown',
                  avatar_url: m.profiles?.avatar_url || '',
                  username: m.profiles?.username || m.profiles?.display_name || 'Unknown'
                }
              };
            })}
          />
         )}

         <UserProfilePopup
           isOpen={isPopupOpen}
           onOpenChange={setIsPopupOpen}
           userId={selectedUserId}
           profile={selectedProfile}
         />
       </div>
     );
   }