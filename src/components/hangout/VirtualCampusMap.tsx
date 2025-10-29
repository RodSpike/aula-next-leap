import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

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

  const AVATAR_SIZE = 32;
  const MAP_WIDTH = room.map_data?.width || 800;
  const MAP_HEIGHT = room.map_data?.height || 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TILE_SIZE = 32;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Draw floor tiles (checkered pattern)
      for (let x = 0; x < MAP_WIDTH; x += TILE_SIZE) {
        for (let y = 0; y < MAP_HEIGHT; y += TILE_SIZE) {
          const isLight = (Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0;
          ctx.fillStyle = isLight ? "#e8f4f8" : "#d4e8f0";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }

      // Draw tile borders for pixel effect
      ctx.strokeStyle = "#b8d4e0";
      ctx.lineWidth = 1;
      for (let x = 0; x <= MAP_WIDTH; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= MAP_HEIGHT; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_WIDTH, y);
        ctx.stroke();
      }

      // Draw room decorations (furniture, walls)
      drawRoomDecorations(ctx);

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
  }, [myAvatar, otherAvatars, MAP_WIDTH, MAP_HEIGHT]);

  const drawRoomDecorations = (ctx: CanvasRenderingContext2D) => {
    // Draw simple furniture/decorations based on room type
    const roomType = room.room_type;

    // Draw walls (border)
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, MAP_WIDTH - 8, MAP_HEIGHT - 8);

    // Draw entrance/doors
    ctx.fillStyle = "#f0e68c";
    ctx.fillRect(MAP_WIDTH / 2 - 40, MAP_HEIGHT - 8, 80, 8);

    if (roomType === "study") {
      // Draw desks
      ctx.fillStyle = "#8b7355";
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillRect(100 + i * 200, 100 + j * 200, 80, 60);
        }
      }
    } else if (roomType === "social") {
      // Draw tables
      ctx.fillStyle = "#daa520";
      ctx.beginPath();
      ctx.arc(200, 200, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(600, 200, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(400, 400, 50, 0, Math.PI * 2);
      ctx.fill();
    } else if (roomType === "lobby") {
      // Draw welcome mat
      ctx.fillStyle = "#dc143c";
      ctx.fillRect(MAP_WIDTH / 2 - 60, MAP_HEIGHT / 2 - 40, 120, 80);
      
      // Draw info board
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(50, 50, 100, 150);
    }
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean) => {
    const x = avatar.position_x;
    const y = avatar.position_y;

    // Avatar colors
    const avatarColors = {
      me: { body: "#3b82f6", outline: "#1e40af", eyes: "#ffffff" },
      other: { body: "#10b981", outline: "#059669", eyes: "#ffffff" }
    };
    
    const colors = isMe ? avatarColors.me : avatarColors.other;

    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y + AVATAR_SIZE / 2 + 2, AVATAR_SIZE / 2 - 2, AVATAR_SIZE / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw body (main circle)
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.arc(x, y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = colors.eyes;
    ctx.beginPath();
    ctx.arc(x - 8, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils (looking in direction)
    const pupilOffsets: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    
    const offset = pupilOffsets[avatar.direction] || { x: 0, y: 0 };
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x - 8 + offset.x, y - 4 + offset.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8 + offset.x, y - 4 + offset.y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw mouth
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 4, 6, 0, Math.PI);
    ctx.stroke();

    // Draw name label with background
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    
    const textWidth = ctx.measureText(displayName).width;
    const padding = 4;
    
    // Background for name
    ctx.fillStyle = isMe ? "#3b82f6" : "#10b981";
    ctx.fillRect(x - textWidth / 2 - padding, y - AVATAR_SIZE - 18, textWidth + padding * 2, 16);
    
    // Name text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, y - AVATAR_SIZE - 6);

    // Draw speaking indicator if needed
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
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
