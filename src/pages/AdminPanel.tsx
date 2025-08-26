import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth"; 
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, BookOpen, Star, Clock, Trash2, UserPlus, Shield, History, Settings, MessageSquare, Edit } from "lucide-react";

interface UserData {
  user_id: string;
  email: string;
  display_name: string;
  username: string;
  cambridge_level: string;
  birthdate: string;
  created_at: string;
  active_courses: number;
  study_hours: number;
  groups_joined: number;
  certificates: number;
  is_admin?: boolean;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  level: string;
  created_by: string;
  created_at: string;
  creator_display_name: string;
  member_count: number;
}

interface PostData {
  id: string;
  content: string;
  created_at: string;
  group_id: string;
  group_name: string;
  user_id: string;
  user_display_name: string;
}

interface AuditLogData {
  id: string;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: string;
  description: string;
  created_at: string;
  target_data: any;
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // User Management States
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Group Management States
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  
  // Post Management States  
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  
  // Audit Log States
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user && !loading) {
      checkAdminAccess();
    }
  }, [user, loading, navigate]);

  // Fetch admin data based on active tab
  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      fetchAllUsers();
    } else if (isAdmin && activeTab === "groups") {
      fetchAllGroups();
    } else if (isAdmin && activeTab === "posts") {
      fetchAllPosts();
    } else if (isAdmin && activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [isAdmin, activeTab]);

  const fetchAllGroups = async () => {
    try {
      setGroupsLoading(true);
      
      const { data: groupsData } = await supabase
        .from('community_groups')
        .select(`
          id,
          name,
          description,
          level,
          created_by,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (!groupsData) return;

      const groupsWithStats = await Promise.all(
        groupsData.map(async (group) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact' })
            .eq('group_id', group.id)
            .eq('status', 'accepted');

          // Get creator display name
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', group.created_by)
            .single();

          return {
            ...group,
            creator_display_name: creatorData?.display_name || 'Unknown',
            member_count: memberCount || 0
          };
        })
      );

      setGroups(groupsWithStats);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setPostsLoading(true);
      
      const { data: postsData } = await supabase
        .from('group_posts')
        .select(`
          id,
          content,
          created_at,
          group_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!postsData) return;

      const formattedPosts = await Promise.all(
        postsData.map(async (post) => {
          // Get group name
          const { data: groupData } = await supabase
            .from('community_groups')
            .select('name')
            .eq('id', post.group_id)
            .single();

          // Get user display name
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', post.user_id)
            .single();

          return {
            ...post,
            group_name: groupData?.name || 'Unknown Group',
            user_display_name: userData?.display_name || 'Unknown User'
          };
        })
      );

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (logsData) {
        setAuditLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
        admin_description: 'User deleted via Admin Panel'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been deleted successfully.",
      });

      // Refresh users list
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_promote_user', {
        target_user_id: userId,
        admin_description: 'User promoted to admin via Admin Panel'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been promoted to admin.",
      });

      // Refresh users list
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to promote user",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_post', {
        post_id: postId,
        admin_description: 'Post deleted via Admin Panel'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post has been deleted successfully.",
      });

      // Refresh posts list
      fetchAllPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGroup = async (groupId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('community_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group has been updated successfully.",
      });

      // Refresh groups list
      fetchAllGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update group", 
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cambridge_level?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const checkAdminAccess = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .single();
      
      if (!data) {
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      navigate("/dashboard");
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      
      // Get all profiles with aggregated data
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          display_name,
          username,
          cambridge_level,
          birthdate,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (!profilesData) return;

      // Get aggregated stats for each user
      const usersWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          // Get active courses count
          const { count: activeCourses } = await supabase
            .from('user_courses')
            .select('*', { count: 'exact' })
            .eq('user_id', profile.user_id)
            .eq('status', 'active');

          // Get total study hours (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data: studySessions } = await supabase
            .from('study_sessions')
            .select('hours_studied')
            .eq('user_id', profile.user_id)
            .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0]);

          const studyHours = studySessions?.reduce((sum, session) => sum + Number(session.hours_studied), 0) || 0;

          // Get groups count
          const { count: groupsJoined } = await supabase
            .from('group_members')
            .select('*', { count: 'exact' })
            .eq('user_id', profile.user_id)
            .eq('status', 'accepted');

          // Get certificates count
          const { count: certificates } = await supabase
            .from('certificates')
            .select('*', { count: 'exact' })
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            active_courses: activeCourses || 0,
            study_hours: Math.round(studyHours * 10) / 10,
            groups_joined: groupsJoined || 0,
            certificates: certificates || 0
          };
        })
      );

      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Comprehensive platform administration and monitoring
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groups.length}</div>
                  <p className="text-xs text-muted-foreground">Community groups</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{posts.length}</div>
                  <p className="text-xs text-muted-foreground">Last 100 posts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditLogs.length}</div>
                  <p className="text-xs text-muted-foreground">Logged actions</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Management
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={fetchAllUsers} disabled={usersLoading}>
                    {usersLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userData) => (
                        <TableRow key={userData.user_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {userData.display_name || userData.username || 'Unnamed User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined: {new Date(userData.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{userData.email}</TableCell>
                          <TableCell>
                            {userData.cambridge_level && (
                              <Badge variant="secondary">
                                {userData.cambridge_level}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>Courses: {userData.active_courses}</div>
                              <div>Hours: {userData.study_hours}h</div>
                              <div>Groups: {userData.groups_joined}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedUser(userData)}
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Promote User to Admin</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to promote {userData.display_name || userData.email} to admin?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setSelectedUser(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        handlePromoteUser(userData.user_id);
                                        setSelectedUser(null);
                                      }}
                                    >
                                      Promote
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setSelectedUser(userData)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete User Account</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to permanently delete {userData.display_name || userData.email}? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setSelectedUser(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => {
                                        handleDeleteUser(userData.user_id);
                                        setSelectedUser(null);
                                      }}
                                    >
                                      Delete Account
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Group Moderation
                </CardTitle>
                <Button onClick={fetchAllGroups} disabled={groupsLoading}>
                  {groupsLoading ? 'Loading...' : 'Refresh Groups'}
                </Button>
              </CardHeader>
              <CardContent>
                {groupsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading groups...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{group.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {group.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{group.level}</Badge>
                          </TableCell>
                          <TableCell>{group.creator_display_name}</TableCell>
                          <TableCell>{group.member_count}</TableCell>
                          <TableCell>
                            {new Date(group.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedGroup(group)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Group Edit Dialog */}
            {selectedGroup && (
              <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Group: {selectedGroup.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Group Name</label>
                      <Input 
                        defaultValue={selectedGroup.name}
                        onChange={(e) => setSelectedGroup({...selectedGroup, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input 
                        defaultValue={selectedGroup.description}
                        onChange={(e) => setSelectedGroup({...selectedGroup, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      handleUpdateGroup(selectedGroup.id, {
                        name: selectedGroup.name,
                        description: selectedGroup.description
                      });
                      setSelectedGroup(null);
                    }}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Post Moderation
                </CardTitle>
                <Button onClick={fetchAllPosts} disabled={postsLoading}>
                  {postsLoading ? 'Loading...' : 'Refresh Posts'}
                </Button>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading posts...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-3 text-sm">
                              {post.content}
                            </p>
                          </TableCell>
                          <TableCell>{post.user_display_name}</TableCell>
                          <TableCell>{post.group_name}</TableCell>
                          <TableCell>
                            {new Date(post.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => setSelectedPost(post)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Post</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedPost(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => {
                                      handleDeletePost(post.id);
                                      setSelectedPost(null);
                                    }}
                                  >
                                    Delete Post
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Admin Action Audit Log
                </CardTitle>
                <Button onClick={fetchAuditLogs} disabled={auditLogsLoading}>
                  {auditLogsLoading ? 'Loading...' : 'Refresh Logs'}
                </Button>
              </CardHeader>
              <CardContent>
                {auditLogsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant={
                              log.action_type.includes('delete') ? 'destructive' : 
                              log.action_type.includes('promote') ? 'default' : 
                              'secondary'
                            }>
                              {log.action_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            Aula Click (by: {log.admin_email})
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.target_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2 text-sm">
                              {log.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}