import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, BookOpen, Star, Clock } from "lucide-react";

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
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user && !loading) {
      checkAdminAccess();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

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
            Manage users and monitor platform activity
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, user) => sum + user.active_courses, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Active enrollments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, user) => sum + user.study_hours, 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, user) => sum + user.certificates, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Issued total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Search and Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, level..."
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
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No users found matching your search.
                  </p>
                ) : (
                  filteredUsers.map((userData) => (
                    <div key={userData.user_id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {userData.display_name || userData.username || 'Unnamed User'}
                            </h3>
                            {userData.cambridge_level && (
                              <Badge variant="secondary">
                                Level {userData.cambridge_level}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">{userData.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(userData.created_at).toLocaleDateString()}
                            {userData.birthdate && ` • Age: ${new Date().getFullYear() - new Date(userData.birthdate).getFullYear()}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{userData.active_courses}</div>
                          <div className="text-xs text-muted-foreground">Active Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{userData.study_hours}h</div>
                          <div className="text-xs text-muted-foreground">Study Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{userData.groups_joined}</div>
                          <div className="text-xs text-muted-foreground">Groups</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{userData.certificates}</div>
                          <div className="text-xs text-muted-foreground">Certificates</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}