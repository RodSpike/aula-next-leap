import { useState, useEffect } from "react";

type MascotMood = "happy" | "excited" | "thinking" | "waving" | "celebrating";

interface ClickMascotProps {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  message?: string;
  className?: string;
}

export const ClickMascot = ({ 
  mood = "happy", 
  size = "md", 
  animate = true,
  message,
  className = ""
}: ClickMascotProps) => {
  const [currentMood, setCurrentMood] = useState(mood);
  
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  const getMoodEmoji = () => {
    switch (currentMood) {
      case "excited": return "🤩";
      case "thinking": return "🤔";
      case "waving": return "👋";
      case "celebrating": return "🎉";
      default: return "😊";
    }
  };

  const getMoodAnimation = () => {
    if (!animate) return "";
    switch (currentMood) {
      case "excited": return "animate-bounce";
      case "waving": return "animate-pulse";
      case "celebrating": return "animate-bounce";
      case "thinking": return "";
      default: return "hover:scale-110 transition-transform";
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech Bubble */}
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap z-10 animate-fade-in">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
        </div>
      )}
      
      {/* Mascot Body */}
      <div 
        className={`
          ${sizeClasses[size]} 
          ${getMoodAnimation()}
          relative flex items-center justify-center
          bg-gradient-to-br from-primary to-secondary
          rounded-full shadow-lg cursor-pointer
          border-4 border-white
          transition-all duration-300
        `}
        onMouseEnter={() => animate && setCurrentMood("excited")}
        onMouseLeave={() => animate && setCurrentMood(mood)}
      >
        {/* Face */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-3 mb-1">
            <div className="w-3 h-3 bg-white rounded-full relative">
              <div className="w-1.5 h-1.5 bg-foreground rounded-full absolute top-0.5 left-0.5"></div>
            </div>
            <div className="w-3 h-3 bg-white rounded-full relative">
              <div className="w-1.5 h-1.5 bg-foreground rounded-full absolute top-0.5 left-0.5"></div>
            </div>
          </div>
          
          {/* Mouth/Expression */}
          <div className="text-2xl mt-1">
            {currentMood === "happy" && (
              <div className="w-6 h-3 border-b-4 border-white rounded-b-full"></div>
            )}
            {currentMood === "excited" && (
              <div className="text-xl">😄</div>
            )}
            {currentMood === "thinking" && (
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            )}
            {currentMood === "waving" && (
              <div className="w-6 h-3 border-b-4 border-white rounded-b-full"></div>
            )}
            {currentMood === "celebrating" && (
              <div className="text-xl">🎊</div>
            )}
          </div>
        </div>

        {/* Sparkles for celebrating */}
        {currentMood === "celebrating" && (
          <>
            <div className="absolute -top-2 -right-2 text-lg animate-ping">✨</div>
            <div className="absolute -top-2 -left-2 text-lg animate-ping delay-75">⭐</div>
            <div className="absolute -bottom-1 -right-1 text-sm animate-pulse">🎉</div>
          </>
        )}
        
        {/* Waving hand */}
        {currentMood === "waving" && (
          <div className="absolute -right-4 top-1/2 text-2xl animate-[wave_0.5s_ease-in-out_infinite]">
            👋
          </div>
        )}
      </div>
    </div>
  );
};
