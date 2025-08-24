import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  X
} from "lucide-react";
import { Link } from "react-router-dom";

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  level: string;
  created_by: string;
  is_default: boolean;
  max_members: number;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  can_post?: boolean;
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
  }[];
  profiles: {
    display_name: string;
  } | null;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState("Basic");
  const [newPost, setNewPost] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchPosts(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('community_groups')
        .select(`
          *,
          group_members!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, can_post, status')
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      const groupsWithMembership = data.map(group => ({
        ...group,
        member_count: group.group_members?.length || 0,
        is_member: memberships?.some(m => m.group_id === group.id),
        can_post: memberships?.find(m => m.group_id === group.id)?.can_post || false
      }));

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
          .select('display_name')
          .eq('user_id', post.user_id)
          .single();

        posts.push({
          ...post,
          profiles: profileData || { display_name: 'Unknown User' }
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

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const { error } = await supabase
        .from('community_groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          level: newGroupLevel,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created successfully!",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupLevel("Basic");
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

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          status: 'accepted',
          can_post: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined group successfully!",
      });

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

      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          content: newPost,
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

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <Button onClick={createGroup} className="w-full">
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

              {/* Groups List */}
              <div className="space-y-3">
                {filteredGroups.map((group) => (
                  <Card 
                    key={group.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{group.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {group.level}
                        </Badge>
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
                        {!group.is_member && (
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedGroup.name}
                          <Badge variant="outline">{selectedGroup.level}</Badge>
                        </CardTitle>
                        {selectedGroup.description && (
                          <p className="text-muted-foreground mt-2">
                            {selectedGroup.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {selectedGroup.member_count || 0} members
                      </div>
                    </div>
                  </CardHeader>
                </Card>

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
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {post.profiles?.display_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {post.profiles?.display_name || 'Unknown User'}
                                </p>
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
                                  {attachment.type.startsWith('image/') ? (
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
    </div>
  );
}