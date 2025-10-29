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

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Draw background
      ctx.fillStyle = "hsl(var(--muted))";
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Draw grid
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 1;
      for (let x = 0; x < MAP_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < MAP_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_WIDTH, y);
        ctx.stroke();
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
  }, [myAvatar, otherAvatars, MAP_WIDTH, MAP_HEIGHT]);

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean) => {
    const x = avatar.position_x;
    const y = avatar.position_y;

    // Draw circle for avatar
    ctx.beginPath();
    ctx.arc(x, y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = isMe ? "hsl(var(--primary))" : "hsl(var(--accent))";
    ctx.fill();
    ctx.strokeStyle = isMe ? "hsl(var(--primary-foreground))" : "hsl(var(--accent-foreground))";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw name label
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.textAlign = "center";
    ctx.fillText(displayName, x, y - AVATAR_SIZE);

    // Draw direction indicator
    ctx.save();
    ctx.translate(x, y);
    
    const directionAngles: Record<string, number> = {
      up: -Math.PI / 2,
      down: Math.PI / 2,
      left: Math.PI,
      right: 0,
    };
    
    ctx.rotate(directionAngles[avatar.direction] || 0);
    ctx.beginPath();
    ctx.moveTo(AVATAR_SIZE / 4, 0);
    ctx.lineTo(0, -AVATAR_SIZE / 4);
    ctx.lineTo(0, AVATAR_SIZE / 4);
    ctx.closePath();
    ctx.fillStyle = isMe ? "hsl(var(--primary-foreground))" : "hsl(var(--accent-foreground))";
    ctx.fill();
    ctx.restore();
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
