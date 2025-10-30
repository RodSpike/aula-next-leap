import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import lobbyBg from "@/assets/room-lobby-bg.png";
import studyBg from "@/assets/room-study-bg.png";
import socialBg from "@/assets/room-social-bg.png";
import avatarSprite from "@/assets/avatar-sprite-sheet.png";

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
}

const VirtualCampusMap = ({ room, myAvatar, otherAvatars, onMove }: VirtualCampusMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState<Avatar | null>(null);
  const animationFrameRef = useRef<number>();
  const frameCounterRef = useRef<number>(0);
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const avatarSpriteRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const AVATAR_SIZE = 64;
  const SPRITE_SIZE = 16; // Size of each frame in sprite sheet
  const MAP_WIDTH = room.map_data?.width || 800;
  const MAP_HEIGHT = room.map_data?.height || 600;

  useEffect(() => {
    // Load images
    const bgImage = new Image();
    const roomType = room.room_type;
    bgImage.src = roomType === "lobby" ? lobbyBg : roomType === "study" ? studyBg : socialBg;
    
    const avatarImg = new Image();
    avatarImg.src = avatarSprite;

    let bgLoaded = false;
    let spriteLoaded = false;

    const checkLoaded = () => {
      if (bgLoaded && spriteLoaded) {
        bgImageRef.current = bgImage;
        avatarSpriteRef.current = avatarImg;
        setImagesLoaded(true);
      }
    };

    bgImage.onload = () => {
      bgLoaded = true;
      checkLoaded();
    };

    avatarImg.onload = () => {
      spriteLoaded = true;
      checkLoaded();
    };

    return () => {
      bgImageRef.current = null;
      avatarSpriteRef.current = null;
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

  const drawRoomDecorations = (ctx: CanvasRenderingContext2D) => {
    // Room decorations are now part of the background image
    // This function can be removed or used for dynamic decorations
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean) => {
    if (!avatarSpriteRef.current) return;

    const x = avatar.position_x;
    const y = avatar.position_y;

    // Check if avatar is moving
    const lastPos = lastPositionsRef.current.get(avatar.user_id);
    const isMoving = lastPos && (lastPos.x !== x || lastPos.y !== y);
    lastPositionsRef.current.set(avatar.user_id, { x, y });

    // Animation frame (cycles every 10 frames for walk animation)
    const walkFrame = Math.floor(frameCounterRef.current / 10) % 3;
    const frame = isMoving ? walkFrame : 1; // Use middle frame (idle) when not moving

    // Direction mapping to sprite sheet rows
    const dir = avatar.direction || "down";
    const directionRow: { [key: string]: number } = {
      down: 0,
      up: 1,
      left: 2,
      right: 3
    };
    const row = directionRow[dir] || 0;

    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(x, y + AVATAR_SIZE / 2 - 4, AVATAR_SIZE / 3, AVATAR_SIZE / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calculate sprite position in sheet (assuming 3 columns x 4 rows layout)
    const spriteX = frame * SPRITE_SIZE;
    const spriteY = row * SPRITE_SIZE;

    // Draw avatar sprite
    ctx.drawImage(
      avatarSpriteRef.current,
      spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE,
      x - AVATAR_SIZE / 2, y - AVATAR_SIZE / 2, AVATAR_SIZE, AVATAR_SIZE
    );

    // Apply color tint for different users (optional)
    if (!isMe) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#10b981";
      ctx.fillRect(x - AVATAR_SIZE / 2, y - AVATAR_SIZE / 2, AVATAR_SIZE, AVATAR_SIZE);
      ctx.globalAlpha = 1.0;
    }

    // Draw name label with background
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    
    const textWidth = ctx.measureText(displayName).width;
    const padding = 6;
    
    // Background for name
    ctx.fillStyle = isMe ? "rgba(59, 130, 246, 0.9)" : "rgba(16, 185, 129, 0.9)";
    ctx.fillRect(x - textWidth / 2 - padding, y - AVATAR_SIZE / 2 - 20, textWidth + padding * 2, 18);
    
    // Name text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, y - AVATAR_SIZE / 2 - 6);

    // Draw speaking indicator if needed
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, AVATAR_SIZE / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain to map bounds
    const constrainedX = Math.max(AVATAR_SIZE, Math.min(MAP_WIDTH - AVATAR_SIZE, x));
    const constrainedY = Math.max(AVATAR_SIZE, Math.min(MAP_HEIGHT - AVATAR_SIZE, y));

    onMove(Math.round(constrainedX), Math.round(constrainedY));
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
    <Card className="relative">
      <div className="p-4">
        <h3 className="font-semibold mb-2">{room.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click anywhere to move your avatar
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
                Position: ({hoveredAvatar.position_x}, {hoveredAvatar.position_y})
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 text-xs text-muted-foreground">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Click on the map to move</li>
            <li>Hover over avatars to see user info</li>
            <li>Get close to others to enable voice chat</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default VirtualCampusMap;
