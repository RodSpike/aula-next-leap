import { useState, useEffect } from "react";

export type PixelFoxMood = "happy" | "excited" | "thinking" | "waving" | "celebrating" | "studying" | "sleeping";

interface PixelFoxMascotProps {
  mood?: PixelFoxMood;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  message?: string;
  className?: string;
}

export const PixelFoxMascot = ({
  mood = "happy",
  size = "md",
  animate = true,
  message,
  className = "",
}: PixelFoxMascotProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bobOffset, setBobOffset] = useState(0);

  // Blink animation
  useEffect(() => {
    if (!animate) return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [animate]);

  // Idle bob animation
  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const bobInterval = setInterval(() => {
      frame += 0.1;
      setBobOffset(Math.sin(frame) * 2);
    }, 50);
    return () => clearInterval(bobInterval);
  }, [animate]);

  const sizeMap = {
    sm: { width: 48, height: 48, pixel: 3 },
    md: { width: 80, height: 80, pixel: 5 },
    lg: { width: 120, height: 120, pixel: 7.5 },
    xl: { width: 160, height: 160, pixel: 10 },
  };

  const { width, height, pixel } = sizeMap[size];

  // The Touryst style colors - vibrant and chunky
  const colors = {
    fur: "#FF8533",        // Vibrant orange
    furLight: "#FFB366",   // Light orange highlight
    furDark: "#CC6600",    // Dark orange shadow
    belly: "#FFE4CC",      // Cream belly
    nose: "#1A1A1A",       // Black nose
    eye: "#1A1A1A",        // Black eye
    eyeHighlight: "#FFFFFF", // Eye shine
    earInner: "#FFB3B3",   // Pink inner ear
    tail: "#FF8533",       // Tail same as fur
    tailTip: "#FFFFFF",    // White tail tip
  };

  const getEyeStyle = () => {
    if (isBlinking || mood === "sleeping") return "closed";
    if (mood === "excited" || mood === "celebrating") return "sparkle";
    if (mood === "thinking") return "looking-up";
    return "normal";
  };

  const renderPixelGrid = () => {
    // 16x16 pixel grid for The Touryst style chunky pixels
    const grid: (string | null)[][] = [];
    
    // Initialize empty grid
    for (let y = 0; y < 16; y++) {
      grid[y] = [];
      for (let x = 0; x < 16; x++) {
        grid[y][x] = null;
      }
    }

    // Draw fox shape - The Touryst style (blocky, cute)
    // Ears (row 0-3)
    grid[0][3] = colors.fur;
    grid[0][4] = colors.fur;
    grid[0][11] = colors.fur;
    grid[0][12] = colors.fur;
    
    grid[1][2] = colors.fur;
    grid[1][3] = colors.furLight;
    grid[1][4] = colors.fur;
    grid[1][5] = colors.fur;
    grid[1][10] = colors.fur;
    grid[1][11] = colors.furLight;
    grid[1][12] = colors.fur;
    grid[1][13] = colors.fur;
    
    grid[2][2] = colors.fur;
    grid[2][3] = colors.earInner;
    grid[2][4] = colors.fur;
    grid[2][5] = colors.fur;
    grid[2][10] = colors.fur;
    grid[2][11] = colors.earInner;
    grid[2][12] = colors.fur;
    grid[2][13] = colors.fur;
    
    grid[3][3] = colors.fur;
    grid[3][4] = colors.fur;
    grid[3][5] = colors.fur;
    grid[3][10] = colors.fur;
    grid[3][11] = colors.fur;
    grid[3][12] = colors.fur;

    // Head (row 4-9)
    for (let x = 4; x <= 11; x++) {
      grid[4][x] = colors.fur;
    }
    
    for (let x = 3; x <= 12; x++) {
      grid[5][x] = x === 3 || x === 12 ? colors.fur : colors.furLight;
    }
    
    // Eyes row
    for (let x = 3; x <= 12; x++) {
      if (x === 5 || x === 10) {
        grid[6][x] = getEyeStyle() === "closed" ? colors.fur : colors.eye;
      } else if (x === 3 || x === 12) {
        grid[6][x] = colors.fur;
      } else {
        grid[6][x] = colors.furLight;
      }
    }
    
    // Eye highlights
    if (getEyeStyle() !== "closed") {
      grid[6][5] = colors.eye;
      grid[6][10] = colors.eye;
    }
    
    for (let x = 3; x <= 12; x++) {
      grid[7][x] = x === 3 || x === 12 ? colors.fur : colors.furLight;
    }
    
    // Nose/snout
    for (let x = 4; x <= 11; x++) {
      if (x >= 6 && x <= 9) {
        grid[8][x] = colors.belly;
      } else {
        grid[8][x] = colors.fur;
      }
    }
    grid[8][7] = colors.nose;
    grid[8][8] = colors.nose;
    
    // Mouth area
    for (let x = 5; x <= 10; x++) {
      grid[9][x] = colors.belly;
    }
    // Smile
    if (mood === "happy" || mood === "excited" || mood === "celebrating") {
      grid[9][6] = colors.furDark;
      grid[9][9] = colors.furDark;
    }

    // Body (row 10-13)
    for (let x = 4; x <= 11; x++) {
      grid[10][x] = x >= 6 && x <= 9 ? colors.belly : colors.fur;
    }
    
    for (let x = 3; x <= 12; x++) {
      if (x >= 6 && x <= 9) {
        grid[11][x] = colors.belly;
      } else if (x === 3 || x === 12) {
        grid[11][x] = colors.furDark;
      } else {
        grid[11][x] = colors.fur;
      }
    }
    
    for (let x = 4; x <= 11; x++) {
      grid[12][x] = x >= 6 && x <= 9 ? colors.belly : colors.fur;
    }
    
    for (let x = 5; x <= 10; x++) {
      grid[13][x] = colors.fur;
    }

    // Feet (row 14-15)
    grid[14][5] = colors.furDark;
    grid[14][6] = colors.furDark;
    grid[14][9] = colors.furDark;
    grid[14][10] = colors.furDark;
    
    grid[15][5] = colors.furDark;
    grid[15][6] = colors.furDark;
    grid[15][9] = colors.furDark;
    grid[15][10] = colors.furDark;

    // Tail (on the side)
    grid[11][13] = colors.fur;
    grid[11][14] = colors.fur;
    grid[10][14] = colors.fur;
    grid[10][15] = colors.tailTip;
    grid[9][15] = colors.tailTip;

    // Waving paw for waving mood
    if (mood === "waving") {
      grid[8][1] = colors.fur;
      grid[7][0] = colors.fur;
      grid[7][1] = colors.fur;
      grid[6][0] = colors.furLight;
    }

    // Book for studying mood
    if (mood === "studying") {
      grid[12][1] = "#8B4513";
      grid[12][2] = "#8B4513";
      grid[13][1] = "#D2691E";
      grid[13][2] = "#FFFFFF";
      grid[14][1] = "#D2691E";
      grid[14][2] = "#FFFFFF";
    }

    // Stars for celebrating
    if (mood === "celebrating") {
      grid[1][7] = "#FFD700";
      grid[1][8] = "#FFD700";
      grid[2][14] = "#FFD700";
      grid[0][1] = "#FFD700";
    }

    // Thinking bubbles
    if (mood === "thinking") {
      grid[2][14] = "#CCCCCC";
      grid[1][15] = "#AAAAAA";
      grid[0][15] = "#888888";
    }

    // Z's for sleeping
    if (mood === "sleeping") {
      grid[2][13] = "#6666FF";
      grid[1][14] = "#8888FF";
      grid[0][15] = "#AAAAFF";
    }

    return grid;
  };

  const grid = renderPixelGrid();

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border-2 border-primary rounded-lg px-3 py-2 text-sm font-medium text-foreground shadow-lg whitespace-nowrap z-10"
          style={{ fontFamily: "'Press Start 2P', monospace" }}>
          <span className="text-xs">{message}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary" />
        </div>
      )}

      {/* Pixel art fox */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 16 16"
        style={{
          transform: `translateY(${bobOffset}px)`,
          imageRendering: "pixelated",
        }}
        className={animate ? "transition-transform duration-100" : ""}
      >
        {grid.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            ) : null
          )
        )}
      </svg>

      {/* Shadow */}
      <div
        className="rounded-full bg-foreground/20 mt-1"
        style={{
          width: width * 0.6,
          height: width * 0.1,
          transform: `scaleX(${1 + bobOffset * 0.02})`,
        }}
      />
    </div>
  );
};
