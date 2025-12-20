import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import VirtualCampusMap from "@/components/hangout/VirtualCampusMap";
import RoomChatInterface from "@/components/hangout/RoomChatInterface";
import ProximityVoiceChat from "@/components/hangout/ProximityVoiceChat";
import { useUserProfileClick } from "@/hooks/useUserProfileClick";
import { UserProfilePopup } from "@/components/UserProfilePopup";

interface Room {
  id: string;
  name: string;
  room_type: string;
  current_users: number;
  capacity: number;
  map_data: any;
}

interface Avatar {
  id: string;
  user_id: string;
  position_x: number;
  position_y: number;
  direction: string;
  avatar_style: string;
  current_room_id: string | null;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const ClickHangout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [myAvatar, setMyAvatar] = useState<Avatar | null>(null);
  const [otherAvatars, setOtherAvatars] = useState<Avatar[]>([]);
  const [showChat, setShowChat] = useState(true);
  const { isPopupOpen, selectedUserId, selectedProfile, openUserProfile, closeUserProfile, setIsPopupOpen } = useUserProfileClick();

  // Check user authentication
  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting to login");
      toast.error("Please log in to access Click Hangout");
      navigate("/login");
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  // Load rooms
  useEffect(() => {
    if (!user) return;

    const loadRooms = async () => {
      const { data, error } = await supabase
        .from("virtual_rooms")
        .select("*")
        .order("position_x");

      if (error) {
        console.error("Error loading rooms:", error);
        toast.error("Failed to load rooms");
        return;
      }

      setRooms(data || []);
      
      // Set lobby as default room
      const lobby = data?.find((r) => r.room_type === "lobby");
      if (lobby) {
        setCurrentRoom(lobby);
      }
    };

    loadRooms();
  }, [user]);

  // Subscribe to room updates for user counts
  useEffect(() => {
    if (!user || rooms.length === 0) return;

    const channel = supabase
      .channel('virtual_rooms_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'virtual_rooms'
        },
        (payload) => {
          const updatedRoom = payload.new as Room;
          setRooms(prev => prev.map(room => 
            room.id === updatedRoom.id ? updatedRoom : room
          ));
          
          // Update current room if it's the one that changed
          if (currentRoom?.id === updatedRoom.id) {
            setCurrentRoom(updatedRoom);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, rooms.length, currentRoom?.id]);

  // Initialize or load user avatar
  useEffect(() => {
    if (!user || !currentRoom) return;

    const initAvatar = async () => {
      // Check if avatar exists
      const { data: existingAvatar, error: fetchError } = await supabase
        .from("user_avatars")
        .select("*, profiles(display_name, avatar_url)")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching avatar:", fetchError);
        return;
      }

      if (existingAvatar) {
        // Update room
        const { data: updatedAvatar, error: updateError } = await supabase
          .from("user_avatars")
          .update({
            current_room_id: currentRoom.id,
            last_active: new Date().toISOString(),
            status: "online",
          })
          .eq("user_id", user.id)
          .select("*, profiles(display_name, avatar_url)")
          .single();

        if (!updateError && updatedAvatar) {
          setMyAvatar(updatedAvatar);
        }
      } else {
        // Create new avatar
        const spawnData = currentRoom.map_data?.spawn_x ? currentRoom.map_data : { spawn_x: 400, spawn_y: 300 };
        
        const { data: newAvatar, error: createError } = await supabase
          .from("user_avatars")
          .insert({
            user_id: user.id,
            current_room_id: currentRoom.id,
            position_x: spawnData.spawn_x,
            position_y: spawnData.spawn_y,
            direction: "down",
            avatar_style: "default",
            status: "online",
          })
          .select("*, profiles(display_name, avatar_url)")
          .single();

        if (!createError && newAvatar) {
          setMyAvatar(newAvatar);
        }
      }
    };

    initAvatar();
  }, [user, currentRoom]);

  // Heartbeat: update last_active every 60 seconds to keep presence fresh
  useEffect(() => {
    if (!user) return;

    const heartbeat = async () => {
      await supabase
        .from("user_avatars")
        .update({ last_active: new Date().toISOString() })
        .eq("user_id", user.id);
    };

    const interval = setInterval(heartbeat, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Load other avatars in room (only active users from last 2 hours)
  useEffect(() => {
    if (!currentRoom || !user) return;

    const INACTIVITY_HOURS = 2;

    const loadOtherAvatars = async () => {
      const cutoffTime = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("user_avatars")
        .select("*, profiles(display_name, avatar_url)")
        .eq("current_room_id", currentRoom.id)
        .neq("user_id", user.id)
        .eq("status", "online")
        .gte("last_active", cutoffTime);

      if (!error && data) {
        setOtherAvatars(data);
      }
    };

    loadOtherAvatars();

    // Periodically refresh to remove stale avatars (every 30 seconds)
    const refreshInterval = setInterval(loadOtherAvatars, 30000);

    // Subscribe to avatar updates
    const channel = supabase
      .channel(`room:${currentRoom.id}:avatars`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_avatars",
          filter: `current_room_id=eq.${currentRoom.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const avatar = payload.new as Avatar & { status?: string; last_active?: string };
            
            // Only show online users with recent activity
            const cutoffTime = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000).toISOString();
            const isActive = avatar.status === "online" && avatar.last_active && avatar.last_active >= cutoffTime;
            
            if (avatar.user_id !== user.id) {
              if (isActive) {
                // Fetch profile data for this avatar
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("user_id", avatar.user_id)
                  .single();

                setOtherAvatars((prev) => {
                  const filtered = prev.filter((a) => a.user_id !== avatar.user_id);
                  return [...filtered, { ...avatar, profiles: profileData || undefined }];
                });
              } else {
                // User went offline or inactive, remove from list
                setOtherAvatars((prev) => prev.filter((a) => a.user_id !== avatar.user_id));
              }
            }
          } else if (payload.eventType === "DELETE") {
            const avatar = payload.old as Avatar;
            setOtherAvatars((prev) => prev.filter((a) => a.user_id !== avatar.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [currentRoom, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        supabase
          .from("user_avatars")
          .update({ status: "offline", current_room_id: null })
          .eq("user_id", user.id)
          .then(() => console.log("Avatar status updated to offline"));
      }
    };
  }, [user]);

  const handleEmojiChange = async (emoji: string) => {
    if (!myAvatar) return;

    try {
      const { error } = await supabase
        .from("user_avatars")
        .update({ avatar_style: emoji })
        .eq("id", myAvatar.id);

      if (error) throw error;

      // Update local state
      setMyAvatar({ ...myAvatar, avatar_style: emoji });
    } catch (error) {
      console.error("Error updating emoji:", error);
      throw error;
    }
  };

  const handleMoveAvatar = async (targetX: number, targetY: number) => {
    if (!myAvatar || !user) return;

    // Start smooth movement animation
    const startX = myAvatar.position_x;
    const startY = myAvatar.position_y;
    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
    const steps = Math.ceil(distance / 3); // Move 3 pixels per step
    
    if (steps === 0) return;

    const dx = (targetX - startX) / steps;
    const dy = (targetY - startY) / steps;

    // Determine direction based on movement
    let direction = myAvatar.direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? "right" : "left";
    } else {
      direction = dy > 0 ? "down" : "up";
    }

    // Animate movement locally
    for (let i = 1; i <= steps; i++) {
      const currentX = Math.round(startX + dx * i);
      const currentY = Math.round(startY + dy * i);
      
      setMyAvatar((prev) => (prev ? { 
        ...prev, 
        position_x: currentX, 
        position_y: currentY,
        direction 
      } : null));
      
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
    }

    // Update final position in database
    const { error } = await supabase
      .from("user_avatars")
      .update({
        position_x: targetX,
        position_y: targetY,
        direction,
        last_active: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating avatar position:", error);
    }
  };

  const handleRoomChange = async (newRoom: Room) => {
    if (!user || !myAvatar) return;

    const { error } = await supabase
      .from("user_avatars")
      .update({
        current_room_id: newRoom.id,
        position_x: newRoom.map_data?.spawn_x || 400,
        position_y: newRoom.map_data?.spawn_y || 300,
      })
      .eq("user_id", user.id);

    if (!error) {
      setCurrentRoom(newRoom);
      toast.success(`Entered ${newRoom.name}`);
      
      // Refresh rooms to get updated counts
      const { data: updatedRooms } = await supabase
        .from("virtual_rooms")
        .select("*")
        .order("position_x");
      
      if (updatedRooms) {
        setRooms(updatedRooms);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-2 md:p-4 pb-24">
        <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        {/* Header */}
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div>
                <h1 className="text-lg md:text-2xl font-bold">Click Hangout 🎮</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Virtual Campus
                </p>
              </div>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Beta Testing</Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                <Users className="w-4 h-4" />
                <span className="text-xs md:text-sm">
                  {currentRoom?.current_users || 0}/{currentRoom?.capacity || 0}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content - Stack on mobile, grid on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-4">
          {/* Campus Map - Full width on mobile */}
          <Card className="lg:col-span-2 p-2 md:p-4">
            {currentRoom && myAvatar ? (
              <VirtualCampusMap
                room={currentRoom}
                myAvatar={myAvatar}
                otherAvatars={otherAvatars}
                onMove={handleMoveAvatar}
                onEmojiChange={handleEmojiChange}
                onAvatarClick={openUserProfile}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] md:h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </Card>

          {/* Sidebar - Below map on mobile */}
          <div className="space-y-3 md:space-y-4">
            {/* Room List - Horizontal scroll on mobile */}
            <Card className="p-3 md:p-4">
              <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Rooms</h3>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {rooms.map((room) => (
                  <Button
                    key={room.id}
                    variant={currentRoom?.id === room.id ? "default" : "outline"}
                    className="flex-shrink-0 lg:w-full justify-start text-xs md:text-sm"
                    size="sm"
                    onClick={() => handleRoomChange(room)}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{room.name}</span>
                      <span className="text-xs">
                        {room.current_users}/{room.capacity}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Chat - Collapsible on mobile */}
            {showChat && currentRoom && (
              <RoomChatInterface roomId={currentRoom.id} roomName={currentRoom.name} />
            )}
          </div>
        </div>

        {/* Proximity Voice Chat */}
        {myAvatar && currentRoom && (
          <ProximityVoiceChat
            myAvatar={myAvatar}
            otherAvatars={otherAvatars}
            roomId={currentRoom.id}
            proximityRadius={150}
          />
        )}
        </div>
      </div>

      {/* User Profile Popup */}
      <UserProfilePopup
        isOpen={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        userId={selectedUserId}
        profile={selectedProfile}
      />
    </AppLayout>
  );
};

export default ClickHangout;
