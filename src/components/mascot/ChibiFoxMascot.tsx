import { useState, useEffect } from "react";

export type ChibiFoxMood = "happy" | "excited" | "thinking" | "waving" | "celebrating" | "studying" | "sleeping";

interface ChibiFoxMascotProps {
  mood?: ChibiFoxMood;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  message?: string;
  className?: string;
}

export const ChibiFoxMascot = ({
  mood = "happy",
  size = "md",
  animate = true,
  message,
  className = "",
}: ChibiFoxMascotProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bounceOffset, setBounceOffset] = useState(0);

  // Blink animation
  useEffect(() => {
    if (!animate) return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [animate]);

  // Bounce animation
  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const bounceInterval = setInterval(() => {
      frame += 0.15;
      setBounceOffset(Math.abs(Math.sin(frame)) * 4);
    }, 50);
    return () => clearInterval(bounceInterval);
  }, [animate]);

  const sizeMap = {
    sm: 64,
    md: 100,
    lg: 150,
    xl: 200,
  };

  const dimensions = sizeMap[size];

  const getEyeState = () => {
    if (isBlinking || mood === "sleeping") return "closed";
    if (mood === "excited" || mood === "celebrating") return "sparkle";
    if (mood === "thinking") return "side";
    return "open";
  };

  const eyeState = getEyeState();

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-card border-2 border-primary/30 rounded-2xl px-4 py-2 text-sm font-medium text-foreground shadow-lg whitespace-nowrap z-10">
          {message}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r-2 border-b-2 border-primary/30 rotate-45" />
        </div>
      )}

      {/* Chibi Fox SVG */}
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 100 100"
        style={{
          transform: `translateY(-${bounceOffset}px)`,
        }}
        className={animate ? "transition-transform duration-75" : ""}
      >
        <defs>
          {/* Gradients for depth */}
          <linearGradient id="chibi-fur-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          <linearGradient id="chibi-belly-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFF5E6" />
          </linearGradient>
          <radialGradient id="chibi-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB3B3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFB3B3" stopOpacity="0" />
          </radialGradient>
          <filter id="chibi-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Tail */}
        <g className={animate && mood !== "sleeping" ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""} 
           style={{ transformOrigin: "75px 55px" }}>
          <ellipse cx="82" cy="50" rx="15" ry="10" fill="url(#chibi-fur-gradient)" />
          <ellipse cx="90" cy="50" rx="8" ry="6" fill="#FFFFFF" />
        </g>

        {/* Body - Small and cute */}
        <ellipse cx="50" cy="72" rx="22" ry="18" fill="url(#chibi-fur-gradient)" filter="url(#chibi-shadow)" />
        
        {/* Belly */}
        <ellipse cx="50" cy="74" rx="14" ry="12" fill="url(#chibi-belly-gradient)" />

        {/* Tiny Feet */}
        <ellipse cx="38" cy="88" rx="8" ry="5" fill="#E67300" />
        <ellipse cx="62" cy="88" rx="8" ry="5" fill="#E67300" />

        {/* Head - Big and round (chibi style) */}
        <circle cx="50" cy="40" r="32" fill="url(#chibi-fur-gradient)" filter="url(#chibi-shadow)" />

        {/* Ears */}
        <polygon points="22,25 30,5 42,28" fill="url(#chibi-fur-gradient)" />
        <polygon points="26,22 32,10 38,24" fill="#FFB3B3" />
        <polygon points="78,25 70,5 58,28" fill="url(#chibi-fur-gradient)" />
        <polygon points="74,22 68,10 62,24" fill="#FFB3B3" />

        {/* Face white area */}
        <ellipse cx="50" cy="48" rx="20" ry="18" fill="url(#chibi-belly-gradient)" />

        {/* Blush marks */}
        <ellipse cx="28" cy="45" rx="6" ry="4" fill="url(#chibi-blush)" />
        <ellipse cx="72" cy="45" rx="6" ry="4" fill="url(#chibi-blush)" />

        {/* Eyes */}
        {eyeState === "open" && (
          <>
            {/* Left eye */}
            <ellipse cx="38" cy="40" rx="8" ry="9" fill="#1A1A1A" />
            <ellipse cx="40" cy="38" rx="3" ry="3.5" fill="#FFFFFF" />
            <circle cx="36" cy="42" r="1.5" fill="#FFFFFF" opacity="0.5" />
            
            {/* Right eye */}
            <ellipse cx="62" cy="40" rx="8" ry="9" fill="#1A1A1A" />
            <ellipse cx="64" cy="38" rx="3" ry="3.5" fill="#FFFFFF" />
            <circle cx="60" cy="42" r="1.5" fill="#FFFFFF" opacity="0.5" />
          </>
        )}
        
        {eyeState === "closed" && (
          <>
            <path d="M30 40 Q38 44 46 40" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M54 40 Q62 44 70 40" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {eyeState === "sparkle" && (
          <>
            {/* Star eyes for excited/celebrating */}
            <polygon points="38,40 40,36 42,40 46,40 43,43 44,47 40,45 36,47 37,43 34,40" fill="#FFD700" />
            <polygon points="62,40 64,36 66,40 70,40 67,43 68,47 64,45 60,47 61,43 58,40" fill="#FFD700" />
          </>
        )}

        {eyeState === "side" && (
          <>
            {/* Looking to the side (thinking) */}
            <ellipse cx="40" cy="40" rx="8" ry="9" fill="#1A1A1A" />
            <ellipse cx="43" cy="38" rx="3" ry="3.5" fill="#FFFFFF" />
            <ellipse cx="64" cy="40" rx="8" ry="9" fill="#1A1A1A" />
            <ellipse cx="67" cy="38" rx="3" ry="3.5" fill="#FFFFFF" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="50" cy="52" rx="4" ry="3" fill="#1A1A1A" />
        <ellipse cx="51" cy="51" rx="1.5" ry="1" fill="#666666" />

        {/* Mouth */}
        {(mood === "happy" || mood === "waving") && (
          <path d="M44 56 Q50 62 56 56" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {(mood === "excited" || mood === "celebrating") && (
          <>
            <ellipse cx="50" cy="58" rx="6" ry="5" fill="#1A1A1A" />
            <ellipse cx="50" cy="60" rx="4" ry="3" fill="#FF6B6B" />
          </>
        )}
        {mood === "thinking" && (
          <circle cx="54" cy="57" r="2" fill="#1A1A1A" />
        )}
        {mood === "sleeping" && (
          <path d="M46 56 Q50 54 54 56" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {mood === "studying" && (
          <path d="M45 56 L55 56" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Waving paw */}
        {mood === "waving" && (
          <g className={animate ? "animate-[wave_0.5s_ease-in-out_infinite]" : ""} style={{ transformOrigin: "20px 60px" }}>
            <ellipse cx="18" cy="55" rx="8" ry="6" fill="url(#chibi-fur-gradient)" />
            <ellipse cx="16" cy="52" rx="3" ry="2" fill="#FFB3B3" />
          </g>
        )}

        {/* Book for studying */}
        {mood === "studying" && (
          <>
            <rect x="60" y="65" width="18" height="14" rx="1" fill="#8B4513" />
            <rect x="62" y="67" width="14" height="10" rx="1" fill="#FFFEF0" />
            <line x1="69" y1="67" x2="69" y2="77" stroke="#8B4513" strokeWidth="0.5" />
          </>
        )}

        {/* Celebration effects */}
        {mood === "celebrating" && (
          <>
            <circle cx="25" cy="20" r="3" fill="#FFD700" className={animate ? "animate-ping" : ""} />
            <circle cx="75" cy="18" r="2.5" fill="#FF69B4" className={animate ? "animate-ping" : ""} style={{ animationDelay: "0.2s" }} />
            <circle cx="50" cy="8" r="2" fill="#00CED1" className={animate ? "animate-ping" : ""} style={{ animationDelay: "0.4s" }} />
            <text x="15" y="15" fontSize="10">✨</text>
            <text x="78" y="12" fontSize="8">⭐</text>
          </>
        )}

        {/* Thinking bubble */}
        {mood === "thinking" && (
          <>
            <circle cx="80" cy="25" r="4" fill="#E0E0E0" />
            <circle cx="86" cy="18" r="3" fill="#D0D0D0" />
            <circle cx="90" cy="12" r="2" fill="#C0C0C0" />
          </>
        )}

        {/* Zzz for sleeping */}
        {mood === "sleeping" && (
          <>
            <text x="70" y="25" fontSize="12" fill="#6B7280" fontWeight="bold">Z</text>
            <text x="78" y="18" fontSize="10" fill="#9CA3AF" fontWeight="bold">z</text>
            <text x="84" y="13" fontSize="8" fill="#D1D5DB" fontWeight="bold">z</text>
          </>
        )}
      </svg>

      {/* Shadow */}
      <div
        className="rounded-full bg-foreground/10 -mt-2"
        style={{
          width: dimensions * 0.5,
          height: dimensions * 0.08,
          transform: `scale(${1 - bounceOffset * 0.02})`,
        }}
      />

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(20deg); }
        }
      `}</style>
    </div>
  );
};
