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
  onAvatarClick?: (userId: string, profile?: { user_id: string; display_name: string; avatar_url?: string | null }) => void;
}

const VirtualCampusMap = ({ room, myAvatar, otherAvatars, onMove, onEmojiChange, onAvatarClick }: VirtualCampusMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState<Avatar | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const animationFrameRef = useRef<number>();
  const frameCounterRef = useRef<number>(0);
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const AVATAR_SIZE = 48;
  const BASE_MAP_WIDTH = room.map_data?.width || 800;
  const BASE_MAP_HEIGHT = room.map_data?.height || 600;

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = BASE_MAP_HEIGHT / BASE_MAP_WIDTH;
        const newWidth = Math.min(containerWidth, BASE_MAP_WIDTH);
        const newHeight = Math.round(newWidth * aspectRatio);
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [BASE_MAP_WIDTH, BASE_MAP_HEIGHT]);

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
        ctx.drawImage(bgImageRef.current, 0, 0, canvasSize.width, canvasSize.height);
      }

      // Draw other avatars with scaled positions
      const scaleX = canvasSize.width / BASE_MAP_WIDTH;
      const scaleY = canvasSize.height / BASE_MAP_HEIGHT;

      otherAvatars.forEach((avatar) => {
        drawAvatar(ctx, avatar, false, scaleX, scaleY);
      });

      // Draw my avatar (on top)
      drawAvatar(ctx, myAvatar, true, scaleX, scaleY);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [myAvatar, otherAvatars, canvasSize, imagesLoaded, BASE_MAP_WIDTH, BASE_MAP_HEIGHT]);

  // Normalize avatar_style values to a valid emoji. Treat 'default', empty or null as 😀
  const resolveEmoji = (style?: string | null) => {
    if (!style) return "😀";
    const s = String(style).trim();
    if (!s || s.toLowerCase() === "default") return "😀";
    return s;
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean, scaleX: number = 1, scaleY: number = 1) => {
    const x = avatar.position_x * scaleX;
    const y = avatar.position_y * scaleY;
    const scaledAvatarSize = AVATAR_SIZE * Math.min(scaleX, scaleY);
    
    // Resolve emoji, using 😀 as the default when style is missing or 'default'
    const emoji = resolveEmoji(avatar.avatar_style);
    
    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y + scaledAvatarSize / 2 + 4, scaledAvatarSize / 3, scaledAvatarSize / 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw emoji
    ctx.font = `${scaledAvatarSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Ensure full opacity after drawing semi-transparent shadow
    ctx.globalAlpha = 1;
    ctx.fillStyle = "hsl(0 0% 0% / 1)";
    ctx.fillText(emoji, x, y);
    
    // Name label - positioned ABOVE the avatar
    const displayName = avatar.profiles?.display_name || "User";
    const fontSize = Math.max(10, 12 * Math.min(scaleX, scaleY));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    const textWidth = ctx.measureText(displayName).width;
    const padding = 4;
    
    // Position the label above the emoji
    const labelY = y - scaledAvatarSize / 2 - 8;
    
    ctx.fillStyle = isMe ? "rgba(59, 130, 246, 0.9)" : "rgba(16, 185, 129, 0.9)";
    ctx.fillRect(x - textWidth / 2 - padding, labelY - fontSize, textWidth + padding * 2, fontSize + 4);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, labelY - 2);
    
    // Clickable indicator for my avatar
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, scaledAvatarSize / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate scale for coordinate conversion
    const scaleX = canvasSize.width / BASE_MAP_WIDTH;
    const scaleY = canvasSize.height / BASE_MAP_HEIGHT;

    // Check if clicking on my avatar (using scaled avatar position)
    const myAvatarScreenX = myAvatar.position_x * scaleX;
    const myAvatarScreenY = myAvatar.position_y * scaleY;
    const distanceToMyAvatar = Math.sqrt(
      Math.pow(myAvatarScreenX - clickX, 2) + Math.pow(myAvatarScreenY - clickY, 2)
    );
    
    const scaledAvatarSize = AVATAR_SIZE * Math.min(scaleX, scaleY);
    
    if (distanceToMyAvatar <= scaledAvatarSize / 2 + 8) {
      // Clicked on my avatar, open emoji picker
      setShowEmojiPicker(true);
      return;
    }

    // Check if clicking on another user's avatar
    if (onAvatarClick) {
      for (const avatar of otherAvatars) {
        const avatarScreenX = avatar.position_x * scaleX;
        const avatarScreenY = avatar.position_y * scaleY;
        const distance = Math.sqrt(
          Math.pow(avatarScreenX - clickX, 2) + Math.pow(avatarScreenY - clickY, 2)
        );
        
        if (distance <= scaledAvatarSize / 2 + 8) {
          // Clicked on another user's avatar
          onAvatarClick(avatar.user_id, {
            user_id: avatar.user_id,
            display_name: avatar.profiles?.display_name || "User",
            avatar_url: avatar.profiles?.avatar_url || null
          });
          return;
        }
      }
    }

    // Otherwise move avatar - convert click position to base coordinates
    const baseX = clickX / scaleX;
    const baseY = clickY / scaleY;
    
    const constrainedX = Math.max(AVATAR_SIZE, Math.min(BASE_MAP_WIDTH - AVATAR_SIZE, baseX));
    const constrainedY = Math.max(AVATAR_SIZE, Math.min(BASE_MAP_HEIGHT - AVATAR_SIZE, baseY));

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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleX = canvasSize.width / BASE_MAP_WIDTH;
    const scaleY = canvasSize.height / BASE_MAP_HEIGHT;
    const scaledAvatarSize = AVATAR_SIZE * Math.min(scaleX, scaleY);

    // Check if hovering over any avatar
    const allAvatars = [myAvatar, ...otherAvatars];
    const hovered = allAvatars.find((avatar) => {
      const avatarScreenX = avatar.position_x * scaleX;
      const avatarScreenY = avatar.position_y * scaleY;
      const distance = Math.sqrt(
        Math.pow(avatarScreenX - mouseX, 2) + Math.pow(avatarScreenY - mouseY, 2)
      );
      return distance <= scaledAvatarSize / 2;
    });

    setHoveredAvatar(hovered || null);
  };

  return (
    <>
      <Card className="relative">
        <div className="p-4">
          <h3 className="font-semibold mb-2">{room.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click anywhere to move. Click your emoji to customize it. Click others' emojis to view their profile!
          </p>
          
          <div ref={containerRef} className="relative border border-border rounded-lg overflow-hidden w-full">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="cursor-pointer w-full"
              style={{ touchAction: 'manipulation' }}
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
              <li>Click other users' avatars to view their profile</li>
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
