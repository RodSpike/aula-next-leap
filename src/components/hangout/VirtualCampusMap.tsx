import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import lobbyBg from "@/assets/room-lobby-bg.png";
import studyBg from "@/assets/room-study-bg.png";
import socialBg from "@/assets/room-social-bg.png";

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
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const AVATAR_SIZE = 64;
  const PIXEL_SIZE = 4;
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

  const drawRoomDecorations = (ctx: CanvasRenderingContext2D) => {
    // Room decorations are now part of the background image
    // This function can be removed or used for dynamic decorations
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, avatar: Avatar, isMe: boolean) => {
    const x = avatar.position_x;
    const y = avatar.position_y;

    // Get avatar colors
    const defaultColors = {
      skin: isMe ? "#ffdbac" : "#f4c2a0",
      hair: isMe ? "#8b4513" : "#654321",
      torso: isMe ? "#3b82f6" : "#10b981",
      pants: isMe ? "#1e40af" : "#059669"
    };

    // Check if avatar is moving
    const lastPos = lastPositionsRef.current.get(avatar.user_id);
    const isMoving = lastPos && (lastPos.x !== x || lastPos.y !== y);
    lastPositionsRef.current.set(avatar.user_id, { x, y });

    // Animation frame (4 frames, cycles every 6 frames for smoother animation)
    const walkCycle = Math.floor(frameCounterRef.current / 6) % 4;
    const dir = avatar.direction || "down";

    // Helper to draw pixels
    const drawPixel = (px: number, py: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x + (px - 8) * PIXEL_SIZE,
        y + (py - 16) * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    };

    // Draw shadow - much closer to feet
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4 * PIXEL_SIZE, 5 * PIXEL_SIZE, 1.5 * PIXEL_SIZE, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calculate leg positions for walk animation
    let leftLegX = 5;
    let rightLegX = 10;
    
    if (isMoving) {
      if (walkCycle === 0) {
        leftLegX = 4; // Left leg forward
        rightLegX = 10;
      } else if (walkCycle === 1) {
        leftLegX = 5; // Center
        rightLegX = 10;
      } else if (walkCycle === 2) {
        leftLegX = 5;
        rightLegX = 11; // Right leg forward
      } else {
        leftLegX = 5; // Center
        rightLegX = 10;
      }
    }

    // LEGS with animation
    for (let py = 12; py <= 15; py++) {
      drawPixel(leftLegX, py, defaultColors.pants);
      drawPixel(rightLegX, py, defaultColors.pants);
    }

    // BODY
    for (let px = 5; px <= 10; px++) {
      for (let py = 8; py <= 11; py++) {
        drawPixel(px, py, defaultColors.torso);
      }
    }

    // ARMS with swing animation
    let leftArmY = 10;
    let rightArmY = 10;
    
    if (isMoving) {
      if (walkCycle === 0) {
        leftArmY = 11; // Left arm back
        rightArmY = 9;  // Right arm forward
      } else if (walkCycle === 2) {
        leftArmY = 9;  // Left arm forward
        rightArmY = 11; // Right arm back
      }
    }
    
    for (let py = 9; py <= 11; py++) {
      drawPixel(4, py, defaultColors.skin);
      drawPixel(11, py, defaultColors.skin);
    }
    // Hands at different positions for animation
    drawPixel(4, leftArmY, defaultColors.skin);
    drawPixel(11, rightArmY, defaultColors.skin);

    // HEAD
    for (let px = 5; px <= 10; px++) {
      for (let py = 3; py <= 7; py++) {
        drawPixel(px, py, defaultColors.skin);
      }
    }

    // HAIR
    for (let px = 5; px <= 10; px++) {
      drawPixel(px, 2, defaultColors.hair);
      drawPixel(px, 3, defaultColors.hair);
    }
    drawPixel(5, 4, defaultColors.hair);
    drawPixel(10, 4, defaultColors.hair);

    // FACE
    if (dir === "down" || dir === "left" || dir === "right") {
      drawPixel(dir === "right" ? 9 : 6, 5, "#000000"); // Eyes
      if (dir === "down") drawPixel(9, 5, "#000000");
      drawPixel(7, 6, "#ff9999"); // Mouth
      drawPixel(8, 6, "#ff9999");
    }

    // Name label - positioned ABOVE the avatar
    const displayName = avatar.profiles?.display_name || "User";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    const textWidth = ctx.measureText(displayName).width;
    const padding = 6;

    // Position the label well above the avatar's head
    const labelY = y - 10 * PIXEL_SIZE;
    
    ctx.fillStyle = isMe ? "rgba(59, 130, 246, 0.9)" : "rgba(16, 185, 129, 0.9)";
    ctx.fillRect(x - textWidth / 2 - padding, labelY - 16, textWidth + padding * 2, 18);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName, x, labelY - 4);

    // Speaking indicator
    if (isMe) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, AVATAR_SIZE / 2 + 6, 0, Math.PI * 2);
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
