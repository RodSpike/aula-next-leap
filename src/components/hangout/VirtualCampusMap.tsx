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
  const frameCounterRef = useRef<number>(0);
  const lastPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const AVATAR_SIZE = 32;
  const PIXEL_SIZE = 2; // Scale factor for pixelated look
  const MAP_WIDTH = room.map_data?.width || 800;
  const MAP_HEIGHT = room.map_data?.height || 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TILE_SIZE = 32;

    const render = () => {
      frameCounterRef.current += 1;
      
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

    // Get avatar colors (from avatar_data or defaults)
    const defaultColors = {
      skin: isMe ? "#d4a373" : "#c68642",
      hair: isMe ? "#8b4513" : "#4a2511",
      torso: isMe ? "#3b82f6" : "#10b981",
      pants: isMe ? "#1e40af" : "#059669"
    };
    
    const colors = avatar.avatar_style === "default" ? defaultColors : defaultColors;

    // Check if avatar is moving
    const lastPos = lastPositionsRef.current.get(avatar.user_id);
    const isMoving = lastPos && (lastPos.x !== x || lastPos.y !== y);
    lastPositionsRef.current.set(avatar.user_id, { x, y });

    // Animation frame (cycles every 15 frames for walk animation)
    const walkFrame = Math.floor(frameCounterRef.current / 15) % 3;
    const frame = isMoving ? walkFrame : 1; // Use middle frame when idle

    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x - 8 * PIXEL_SIZE, y + 14 * PIXEL_SIZE, 16 * PIXEL_SIZE, 2 * PIXEL_SIZE);

    // Helper function to draw a pixel
    const drawPixel = (px: number, py: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x + (px - 8) * PIXEL_SIZE,
        y + (py - 16) * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    };

    // Draw pixelated avatar based on direction and frame
    const dir = avatar.direction || "down";
    
    // LEGS (bottom, animated based on walk frame)
    drawPixel(5, 13, colors.pants); // Left leg
    drawPixel(5, 14, colors.pants);
    drawPixel(5, 15, colors.pants);
    
    drawPixel(10, 13, colors.pants); // Right leg
    drawPixel(10, 14, colors.pants);
    drawPixel(10, 15, colors.pants);

    // Leg animation for walking
    if (isMoving && dir === "down") {
      if (frame === 0) {
        drawPixel(4, 15, colors.pants); // Left leg forward
        drawPixel(11, 15, colors.pants); // Right leg back
      } else if (frame === 2) {
        drawPixel(6, 15, colors.pants); // Left leg back
        drawPixel(9, 15, colors.pants); // Right leg forward
      }
    } else if (isMoving && dir === "up") {
      if (frame === 0) {
        drawPixel(4, 13, colors.pants);
      } else if (frame === 2) {
        drawPixel(11, 13, colors.pants);
      }
    } else if (isMoving && dir === "left") {
      if (frame === 0) {
        drawPixel(4, 15, colors.pants);
      } else if (frame === 2) {
        drawPixel(6, 15, colors.pants);
      }
    } else if (isMoving && dir === "right") {
      if (frame === 0) {
        drawPixel(11, 15, colors.pants);
      } else if (frame === 2) {
        drawPixel(9, 15, colors.pants);
      }
    }

    // TORSO/BODY
    for (let px = 5; px <= 10; px++) {
      for (let py = 8; py <= 12; py++) {
        drawPixel(px, py, colors.torso);
      }
    }

    // ARMS (on sides of torso)
    for (let py = 9; py <= 11; py++) {
      drawPixel(4, py, colors.torso); // Left arm
      drawPixel(11, py, colors.torso); // Right arm
    }

    // ARM ANIMATION for walking
    if (isMoving) {
      if (frame === 0) {
        drawPixel(4, 12, colors.torso); // Left arm swing
      } else if (frame === 2) {
        drawPixel(11, 12, colors.torso); // Right arm swing
      }
    }

    // HANDS
    drawPixel(4, 12, colors.skin);
    drawPixel(11, 12, colors.skin);

    // HEAD (skin color)
    for (let px = 5; px <= 10; px++) {
      for (let py = 3; py <= 7; py++) {
        drawPixel(px, py, colors.skin);
      }
    }

    // HAIR (on top of head)
    for (let px = 5; px <= 10; px++) {
      drawPixel(px, 2, colors.hair);
      drawPixel(px, 3, colors.hair);
    }
    drawPixel(5, 4, colors.hair);
    drawPixel(10, 4, colors.hair);

    // FACE FEATURES
    // Eyes (black pixels)
    if (dir === "down") {
      drawPixel(6, 5, "#000000");
      drawPixel(9, 5, "#000000");
    } else if (dir === "up") {
      // Eyes not visible when looking up (back of head)
      for (let px = 5; px <= 10; px++) {
        drawPixel(px, 5, colors.hair);
      }
    } else if (dir === "left") {
      drawPixel(6, 5, "#000000");
    } else if (dir === "right") {
      drawPixel(9, 5, "#000000");
    }

    // Mouth (small smile)
    if (dir === "down" || dir === "left" || dir === "right") {
      drawPixel(7, 6, "#000000");
      drawPixel(8, 6, "#000000");
    }

    // Draw outline (black border around entire sprite)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - 8 * PIXEL_SIZE,
      y - 16 * PIXEL_SIZE,
      16 * PIXEL_SIZE,
      32 * PIXEL_SIZE
    );

    // Draw name label with background
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    
    const textWidth = ctx.measureText(displayName).width;
    const padding = 4;
    
    // Background for name
    ctx.fillStyle = isMe ? "#3b82f6" : "#10b981";
    ctx.fillRect(x - textWidth / 2 - padding, y - AVATAR_SIZE - 14, textWidth + padding * 2, 16);
    
    // Name text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, y - AVATAR_SIZE - 2);

    // Draw speaking indicator if needed
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, AVATAR_SIZE + 2, 0, Math.PI * 2);
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
