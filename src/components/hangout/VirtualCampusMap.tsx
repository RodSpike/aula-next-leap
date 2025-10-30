import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmojiPickerComponent } from "@/components/enhanced/EmojiPicker";
import lobbyBg from "@/assets/room-lobby-bg.png";
import studyBg from "@/assets/room-study-bg.png";
import socialBg from "@/assets/room-social-bg.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Avatar {
  id: string;
  user_id: string;
  position_x: number;
  position_y: number;
  direction: string;
  avatar_style: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  room_type: string;
  map_data: any;
}

interface VirtualCampusMapProps {
  room: Room;
  myAvatar: Avatar;
  otherAvatars: Avatar[];
  onMove: (x: number, y: number) => void;
  onEmojiChange: (emoji: string) => void;
}

const VirtualCampusMap = ({ room, myAvatar, otherAvatars, onMove, onEmojiChange }: VirtualCampusMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState<Avatar | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const animationFrameRef = useRef<number>();
  const frameCounterRef = useRef<number>(0);
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const AVATAR_SIZE = 48;
  const MAP_WIDTH = room.map_data?.width || 800;
  const MAP_HEIGHT = room.map_data?.height || 600;

  useEffect(() => {
    const bgImage = new Image();
    const roomType = room.room_type;
    bgImage.src = roomType === "lobby" ? lobbyBg : roomType === "study" ? studyBg : socialBg;

    bgImage.onload = () => {
      bgImageRef.current = bgImage;
      setImagesLoaded(true);
    };

    return () => {
      bgImageRef.current = null;
    };
  }, [room.room_type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      frameCounterRef.current += 1;

      // Draw background (only once per frame)
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      }

      // Draw other avatars
      otherAvatars.forEach((avatar) => {
        drawAvatar(ctx, avatar, false);
      });

      // Draw my avatar (on top)
      drawAvatar(ctx, myAvatar, true);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [myAvatar, otherAvatars, MAP_WIDTH, MAP_HEIGHT, imagesLoaded]);

  // Normalize avatar_style values to a valid emoji. Treat 'default', empty or null as 😀
  const resolveEmoji = (style?: string | null) => {
    if (!style) return "😀";
    const s = String(style).trim();
    if (!s || s.toLowerCase() === "default") return "😀";
    return s;
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean) => {
    const x = avatar.position_x;
    const y = avatar.position_y;
    
    // Resolve emoji, using 😀 as the default when style is missing or 'default'
    const emoji = resolveEmoji(avatar.avatar_style);
    
    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y + AVATAR_SIZE / 2 + 4, AVATAR_SIZE / 3, AVATAR_SIZE / 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw emoji
    ctx.font = `${AVATAR_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Ensure full opacity after drawing semi-transparent shadow
    ctx.globalAlpha = 1;
    ctx.fillStyle = "hsl(0 0% 0% / 1)";
    ctx.fillText(emoji, x, y);
    
    // Name label - positioned ABOVE the avatar
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    const textWidth = ctx.measureText(displayName).width;
    const padding = 6;
    
    // Position the label above the emoji
    const labelY = y - AVATAR_SIZE / 2 - 10;
    
    ctx.fillStyle = isMe ? "rgba(59, 130, 246, 0.9)" : "rgba(16, 185, 129, 0.9)";
    ctx.fillRect(x - textWidth / 2 - padding, labelY - 16, textWidth + padding * 2, 18);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, labelY - 4);
    
    // Clickable indicator for my avatar
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, AVATAR_SIZE / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on my avatar
    const distanceToMyAvatar = Math.sqrt(
      Math.pow(myAvatar.position_x - x, 2) + Math.pow(myAvatar.position_y - y, 2)
    );
    
    if (distanceToMyAvatar <= AVATAR_SIZE / 2 + 8) {
      // Clicked on my avatar, open emoji picker
      setShowEmojiPicker(true);
      return;
    }

    // Otherwise move avatar
    const constrainedX = Math.max(AVATAR_SIZE, Math.min(MAP_WIDTH - AVATAR_SIZE, x));
    const constrainedY = Math.max(AVATAR_SIZE, Math.min(MAP_HEIGHT - AVATAR_SIZE, y));

    onMove(Math.round(constrainedX), Math.round(constrainedY));
  };

  const handleEmojiSelect = async (emoji: string) => {
    try {
      await onEmojiChange(emoji);
      setShowEmojiPicker(false);
      toast.success("Avatar updated!");
    } catch (error) {
      console.error("Error updating emoji:", error);
      toast.error("Failed to update avatar");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over any avatar
    const allAvatars = [myAvatar, ...otherAvatars];
    const hovered = allAvatars.find((avatar) => {
      const distance = Math.sqrt(
        Math.pow(avatar.position_x - x, 2) + Math.pow(avatar.position_y - y, 2)
      );
      return distance <= AVATAR_SIZE / 2;
    });

    setHoveredAvatar(hovered || null);
  };

  return (
    <>
      <Card className="relative">
        <div className="p-4">
          <h3 className="font-semibold mb-2">{room.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click anywhere to move. Click your emoji to customize it!
          </p>
          
          <div className="relative border border-border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="cursor-pointer"
            />
            
            {/* Hover tooltip */}
            {hoveredAvatar && (
              <div className="absolute bottom-4 left-4 bg-popover text-popover-foreground p-2 rounded-md shadow-lg text-sm">
                <p className="font-semibold">
                  {hoveredAvatar.profiles?.display_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resolveEmoji(hoveredAvatar.avatar_style)}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 text-xs text-muted-foreground">
            <p>💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Click on the map to move</li>
              <li>Click your emoji avatar to change it</li>
              <li>Get close to others to enable voice chat</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Emoji Picker Dialog */}
      <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Your Avatar Emoji</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VirtualCampusMap;
