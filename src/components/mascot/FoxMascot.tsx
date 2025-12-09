import { useState, useEffect } from "react";

export type FoxMood = "happy" | "excited" | "thinking" | "waving" | "celebrating" | "studying" | "sleeping";
export type FoxStyle = "classic" | "cute" | "modern";

interface FoxMascotProps {
  mood?: FoxMood;
  style?: FoxStyle;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  message?: string;
  className?: string;
}

export const FoxMascot = ({ 
  mood = "happy", 
  style = "cute",
  size = "md", 
  animate = true,
  message,
  className = ""
}: FoxMascotProps) => {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isBlinking, setIsBlinking] = useState(false);
  
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Blink animation - smooth transition without flash
  useEffect(() => {
    if (!animate) return;
    
    let blinkTimeout: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    
    const triggerBlink = () => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 150);
      // Schedule next blink
      const nextBlinkDelay = 3000 + Math.random() * 2000;
      intervalId = setTimeout(triggerBlink, nextBlinkDelay);
    };
    
    // Start first blink after initial delay
    intervalId = setTimeout(triggerBlink, 2000 + Math.random() * 1000);
    
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(intervalId);
    };
  }, [animate]);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32", 
    lg: "w-48 h-48",
    xl: "w-64 h-64"
  };

  const getMoodAnimation = () => {
    if (!animate) return "";
    switch (currentMood) {
      case "excited": return "animate-bounce";
      case "waving": return "animate-pulse";
      case "celebrating": return "animate-bounce";
      case "studying": return "";
      case "sleeping": return "";
      default: return "hover:scale-105 transition-transform";
    }
  };

  // Eye expressions based on mood
  const getEyeExpression = () => {
    if (isBlinking) return "closed";
    switch (currentMood) {
      case "excited": return "sparkle";
      case "thinking": return "side";
      case "sleeping": return "closed";
      case "studying": return "focused";
      default: return "normal";
    }
  };

  const eyeExpression = getEyeExpression();

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech Bubble */}
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border-2 border-primary/20 rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap z-10 animate-fade-in">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
        </div>
      )}
      
      {/* Fox SVG */}
      <div 
        className={`
          ${sizeClasses[size]} 
          ${getMoodAnimation()}
          relative cursor-pointer
          will-change-transform
        `}
        style={{ transition: 'transform 0.3s ease-out' }}
        onMouseEnter={() => animate && setCurrentMood("excited")}
        onMouseLeave={() => animate && setCurrentMood(mood)}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          {/* Main body/head */}
          <ellipse cx="100" cy="120" rx="55" ry="50" fill="#FF6B35" />
          
          {/* White chest/face patch */}
          <ellipse cx="100" cy="135" rx="40" ry="38" fill="#FFF5E6" />
          
          {/* Left ear */}
          <path d="M45 70 L60 30 L85 75 Z" fill="#FF6B35" />
          <path d="M55 65 L63 40 L78 68 Z" fill="#FFB088" />
          
          {/* Right ear */}
          <path d="M155 70 L140 30 L115 75 Z" fill="#FF6B35" />
          <path d="M145 65 L137 40 L122 68 Z" fill="#FFB088" />
          
          {/* Face details */}
          {/* Eyes */}
          {eyeExpression === "closed" ? (
            <>
              <path d="M70 105 Q80 100 90 105" stroke="#2D1B0E" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M110 105 Q120 100 130 105" stroke="#2D1B0E" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : eyeExpression === "sparkle" ? (
            <>
              {/* Left eye with sparkle */}
              <ellipse cx="78" cy="100" rx="12" ry="14" fill="#2D1B0E" />
              <ellipse cx="82" cy="96" rx="4" ry="5" fill="white" />
              <circle cx="74" cy="104" r="2" fill="white" />
              <text x="65" y="90" fontSize="12">✨</text>
              
              {/* Right eye with sparkle */}
              <ellipse cx="122" cy="100" rx="12" ry="14" fill="#2D1B0E" />
              <ellipse cx="126" cy="96" rx="4" ry="5" fill="white" />
              <circle cx="118" cy="104" r="2" fill="white" />
              <text x="130" y="90" fontSize="12">✨</text>
            </>
          ) : eyeExpression === "focused" ? (
            <>
              {/* Focused studying eyes */}
              <ellipse cx="78" cy="100" rx="10" ry="12" fill="#2D1B0E" />
              <ellipse cx="81" cy="97" rx="3" ry="4" fill="white" />
              <ellipse cx="122" cy="100" rx="10" ry="12" fill="#2D1B0E" />
              <ellipse cx="125" cy="97" rx="3" ry="4" fill="white" />
              {/* Glasses for studying */}
              <circle cx="78" cy="100" r="18" stroke="#4A3728" strokeWidth="2" fill="none" />
              <circle cx="122" cy="100" r="18" stroke="#4A3728" strokeWidth="2" fill="none" />
              <path d="M96 100 L104 100" stroke="#4A3728" strokeWidth="2" />
              <path d="M60 100 L50 95" stroke="#4A3728" strokeWidth="2" />
              <path d="M140 100 L150 95" stroke="#4A3728" strokeWidth="2" />
            </>
          ) : eyeExpression === "side" ? (
            <>
              {/* Thinking - eyes looking to side */}
              <ellipse cx="78" cy="100" rx="11" ry="13" fill="#2D1B0E" />
              <ellipse cx="84" cy="98" rx="4" ry="5" fill="white" />
              <ellipse cx="122" cy="100" rx="11" ry="13" fill="#2D1B0E" />
              <ellipse cx="128" cy="98" rx="4" ry="5" fill="white" />
            </>
          ) : (
            <>
              {/* Normal happy eyes */}
              <ellipse cx="78" cy="100" rx="11" ry="13" fill="#2D1B0E" />
              <ellipse cx="82" cy="96" rx="4" ry="5" fill="white" />
              <ellipse cx="122" cy="100" rx="11" ry="13" fill="#2D1B0E" />
              <ellipse cx="126" cy="96" rx="4" ry="5" fill="white" />
            </>
          )}
          
          {/* Nose */}
          <ellipse cx="100" cy="125" rx="8" ry="6" fill="#2D1B0E" />
          <ellipse cx="102" cy="123" rx="2" ry="1.5" fill="#4A3728" />
          
          {/* Mouth based on mood */}
          {currentMood === "happy" || currentMood === "waving" ? (
            <path d="M88 138 Q100 150 112 138" stroke="#2D1B0E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : currentMood === "excited" || currentMood === "celebrating" ? (
            <>
              <path d="M85 138 Q100 155 115 138" stroke="#2D1B0E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="100" cy="145" rx="8" ry="5" fill="#FF8FAB" />
            </>
          ) : currentMood === "thinking" ? (
            <ellipse cx="108" cy="140" rx="5" ry="4" fill="#2D1B0E" />
          ) : currentMood === "sleeping" ? (
            <>
              <path d="M90 140 Q100 145 110 140" stroke="#2D1B0E" strokeWidth="2" fill="none" strokeLinecap="round" />
              <text x="140" y="85" fontSize="14" fill="#6B7280">z</text>
              <text x="150" y="70" fontSize="12" fill="#9CA3AF">z</text>
              <text x="158" y="58" fontSize="10" fill="#D1D5DB">z</text>
            </>
          ) : (
            <path d="M90 138 Q100 148 110 138" stroke="#2D1B0E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          
          {/* Blush */}
          <ellipse cx="58" cy="115" rx="10" ry="6" fill="#FFB088" opacity="0.6" />
          <ellipse cx="142" cy="115" rx="10" ry="6" fill="#FFB088" opacity="0.6" />
          
          {/* Tail */}
          <path 
            d="M145 155 Q175 140 180 110 Q185 80 165 70" 
            stroke="#FF6B35" 
            strokeWidth="20" 
            fill="none" 
            strokeLinecap="round"
            className={currentMood === "excited" || currentMood === "celebrating" ? "animate-[wag_0.3s_ease-in-out_infinite]" : ""}
          />
          <path 
            d="M165 70 Q155 65 160 55" 
            stroke="#FFF5E6" 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />

          {/* Waving paw */}
          {currentMood === "waving" && (
            <g className="animate-[wave_0.5s_ease-in-out_infinite] origin-bottom-left">
              <ellipse cx="45" cy="140" rx="15" ry="12" fill="#FF6B35" />
              <ellipse cx="45" cy="145" rx="10" ry="6" fill="#FFF5E6" />
            </g>
          )}

          {/* Book for studying */}
          {currentMood === "studying" && (
            <g>
              <rect x="60" y="155" width="80" height="12" rx="2" fill="#4F46E5" />
              <rect x="62" y="157" width="76" height="8" rx="1" fill="#818CF8" />
              <line x1="100" y1="155" x2="100" y2="167" stroke="#312E81" strokeWidth="1" />
            </g>
          )}

          {/* Celebration effects */}
          {currentMood === "celebrating" && (
            <>
              <text x="30" y="50" fontSize="20" className="animate-bounce">🎉</text>
              <text x="150" y="45" fontSize="18" className="animate-bounce delay-100">⭐</text>
              <text x="25" y="90" fontSize="16" className="animate-ping">✨</text>
              <text x="165" y="85" fontSize="16" className="animate-ping delay-200">✨</text>
            </>
          )}

          {/* Thinking bubble */}
          {currentMood === "thinking" && (
            <>
              <circle cx="155" cy="55" r="4" fill="#E5E7EB" />
              <circle cx="165" cy="45" r="6" fill="#E5E7EB" />
              <circle cx="178" cy="32" r="12" fill="#E5E7EB" />
              <text x="173" y="37" fontSize="12">?</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
