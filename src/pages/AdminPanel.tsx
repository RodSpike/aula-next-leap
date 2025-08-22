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
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Calendar,
  Crown,
  AlertTriangle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
  user_subscriptions: {
    plan: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
  };
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  level: string;
  created_by: string;
  is_default: boolean;
  created_at: string;
  member_count?: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState("Basic");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchGroups();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsAdmin(!!data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          email,
          created_at,
          user_subscriptions (
            plan,
            trial_ends_at,
            subscription_ends_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedUsers = data.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        created_at: profile.created_at,
        profiles: {
          display_name: profile.display_name || ''
        },
        user_subscriptions: Array.isArray(profile.user_subscriptions) && profile.user_subscriptions.length > 0
          ? profile.user_subscriptions[0] 
          : {
              plan: 'free',
              trial_ends_at: null,
              subscription_ends_at: null
            }
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('community_groups')
        .select(`
          *,
          group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCount = data.map(group => ({
        ...group,
        member_count: group.group_members?.length || 0
      }));

      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
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
          created_by: user.id,
          is_default: false
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

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group deleted successfully!",
      });

      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      // First delete from profiles table (this will cascade to related tables)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatus = (subscription: any) => {
    if (subscription.plan === 'paid') {
      return { status: 'Paid', color: 'bg-green-100 text-green-800' };
    }
    
    if (subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        return { status: 'Free Trial', color: 'bg-blue-100 text-blue-800' };
      }
    }
    
    return { status: 'Free', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to access the admin panel.
              </p>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have admin privileges to access this panel.
              </p>
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
            <div className="flex items-center justify-center gap-3">
              <Crown className="h-12 w-12 text-yellow-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Admin Panel
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage users, groups, and platform settings.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Users</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.user_subscriptions.plan === 'paid').length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Community Groups</p>
                  <p className="text-2xl font-bold">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => {
                  const subscription = getSubscriptionStatus(user.user_subscriptions);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {user.profiles.display_name || 'No name'}
                          </p>
                          <Badge className={subscription.color}>
                            {subscription.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Groups Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Groups Management
                </CardTitle>
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{group.name}</p>
                        <Badge variant="outline">{group.level}</Badge>
                        {group.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {group.member_count || 0} members • Created: {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!group.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteGroup(group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}