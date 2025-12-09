import { useState, useEffect } from "react";

export type CupheadFoxMood = "happy" | "excited" | "thinking" | "waving" | "celebrating" | "studying" | "sleeping";

interface CupheadFoxMascotProps {
  mood?: CupheadFoxMood;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  message?: string;
  className?: string;
}

export const CupheadFoxMascot = ({
  mood = "happy",
  size = "md",
  animate = true,
  message,
  className = "",
}: CupheadFoxMascotProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [squashStretch, setSquashStretch] = useState({ scaleX: 1, scaleY: 1 });
  const [rubberOffset, setRubberOffset] = useState(0);

  // Blink animation - vintage style quick blink
  useEffect(() => {
    if (!animate) return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 80);
    }, 2000 + Math.random() * 1500);
    return () => clearInterval(blinkInterval);
  }, [animate]);

  // Rubber hose squash and stretch animation
  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const rubberInterval = setInterval(() => {
      frame += 0.12;
      const stretch = Math.sin(frame) * 0.05;
      setSquashStretch({
        scaleX: 1 - stretch * 0.5,
        scaleY: 1 + stretch,
      });
      setRubberOffset(Math.sin(frame * 2) * 2);
    }, 50);
    return () => clearInterval(rubberInterval);
  }, [animate]);

  const sizeMap = {
    sm: 70,
    md: 110,
    lg: 165,
    xl: 220,
  };

  const dimensions = sizeMap[size];

  const getEyeState = () => {
    if (isBlinking || mood === "sleeping") return "closed";
    if (mood === "excited" || mood === "celebrating") return "wide";
    if (mood === "thinking") return "side";
    return "normal";
  };

  const eyeState = getEyeState();

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech bubble - vintage style */}
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#FFF8DC] border-4 border-[#1A1A1A] rounded-full px-4 py-2 text-sm font-bold text-[#1A1A1A] shadow-lg whitespace-nowrap z-10"
          style={{ fontFamily: "serif" }}>
          {message}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-transparent border-t-[#1A1A1A]" />
        </div>
      )}

      {/* Cuphead Style Fox SVG */}
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 100 100"
        style={{
          transform: `scaleX(${squashStretch.scaleX}) scaleY(${squashStretch.scaleY})`,
        }}
        className={animate ? "transition-transform duration-75" : ""}
      >
        <defs>
          {/* Vintage paper texture gradient */}
          <linearGradient id="cuphead-fur" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E87A24" />
            <stop offset="50%" stopColor="#D96A1A" />
            <stop offset="100%" stopColor="#C45A10" />
          </linearGradient>
          <linearGradient id="cuphead-cream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="100%" stopColor="#F5DEB3" />
          </linearGradient>
          {/* Film grain effect */}
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
        </defs>

        {/* Background circle - vintage style */}
        <circle cx="50" cy="50" r="48" fill="#FFF8DC" stroke="#1A1A1A" strokeWidth="3" />

        {/* Tail - rubber hose style */}
        <g style={{ transform: `translateY(${rubberOffset}px)` }}>
          <path 
            d="M75 55 Q90 50 88 40 Q86 30 78 35" 
            fill="url(#cuphead-fur)" 
            stroke="#1A1A1A" 
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse cx="78" cy="36" rx="6" ry="4" fill="#FFF8DC" stroke="#1A1A1A" strokeWidth="2" />
        </g>

        {/* Body - classic rubber hose round body */}
        <ellipse cx="50" cy="68" rx="20" ry="16" fill="url(#cuphead-fur)" stroke="#1A1A1A" strokeWidth="3" />
        
        {/* Belly patch */}
        <ellipse cx="50" cy="70" rx="12" ry="10" fill="url(#cuphead-cream)" stroke="#1A1A1A" strokeWidth="2" />

        {/* Legs - thin rubber hose style */}
        <path d="M38 80 Q36 88 38 92" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M62 80 Q64 88 62 92" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="round" />
        
        {/* Feet - vintage shoe style */}
        <ellipse cx="38" cy="94" rx="8" ry="4" fill="#1A1A1A" />
        <ellipse cx="62" cy="94" rx="8" ry="4" fill="#1A1A1A" />

        {/* Head - large and round */}
        <circle cx="50" cy="38" r="28" fill="url(#cuphead-fur)" stroke="#1A1A1A" strokeWidth="3" />

        {/* Ears - tall and pointy with thick outlines */}
        <path d="M25 28 L30 5 L40 25" fill="url(#cuphead-fur)" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M28 24 L32 10 L36 22" fill="#FFB6C1" stroke="#1A1A1A" strokeWidth="1.5" />
        <path d="M75 28 L70 5 L60 25" fill="url(#cuphead-fur)" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M72 24 L68 10 L64 22" fill="#FFB6C1" stroke="#1A1A1A" strokeWidth="1.5" />

        {/* Face cream area */}
        <ellipse cx="50" cy="42" rx="18" ry="16" fill="url(#cuphead-cream)" stroke="#1A1A1A" strokeWidth="2" />

        {/* Eyes - PIE CUT STYLE (signature Cuphead look) */}
        {eyeState === "normal" && (
          <>
            {/* Left eye */}
            <ellipse cx="40" cy="38" rx="8" ry="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="41" cy="39" rx="4" ry="5" fill="#1A1A1A" />
            {/* Pie cut - the signature 1930s look */}
            <path d="M36 34 L41 39 L36 44" fill="#FFFFFF" />
            
            {/* Right eye */}
            <ellipse cx="60" cy="38" rx="8" ry="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="59" cy="39" rx="4" ry="5" fill="#1A1A1A" />
            {/* Pie cut */}
            <path d="M64 34 L59 39 L64 44" fill="#FFFFFF" />
          </>
        )}

        {eyeState === "wide" && (
          <>
            {/* Excited eyes - bigger and rounder */}
            <ellipse cx="40" cy="36" rx="9" ry="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="41" cy="37" rx="5" ry="6" fill="#1A1A1A" />
            <path d="M35 31 L41 37 L35 43" fill="#FFFFFF" />
            
            <ellipse cx="60" cy="36" rx="9" ry="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="59" cy="37" rx="5" ry="6" fill="#1A1A1A" />
            <path d="M65 31 L59 37 L65 43" fill="#FFFFFF" />
            
            {/* Excitement lines */}
            <line x1="28" y1="30" x2="24" y2="26" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="30" x2="76" y2="26" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {eyeState === "closed" && (
          <>
            {/* Closed eyes - curved lines */}
            <path d="M32 38 Q40 42 48 38" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M52 38 Q60 42 68 38" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {eyeState === "side" && (
          <>
            {/* Looking to side */}
            <ellipse cx="40" cy="38" rx="8" ry="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="44" cy="39" rx="4" ry="5" fill="#1A1A1A" />
            <path d="M36 34 L41 39 L36 44" fill="#FFFFFF" />
            
            <ellipse cx="60" cy="38" rx="8" ry="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            <ellipse cx="64" cy="39" rx="4" ry="5" fill="#1A1A1A" />
            <path d="M56 34 L61 39 L56 44" fill="#FFFFFF" />
          </>
        )}

        {/* Eyebrows - expressive thick lines */}
        {(mood === "excited" || mood === "celebrating") && (
          <>
            <path d="M32 26 Q40 22 48 26" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M52 26 Q60 22 68 26" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {mood === "thinking" && (
          <>
            <path d="M32 28 L48 24" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M52 24 L68 28" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Nose - round and black */}
        <ellipse cx="50" cy="48" rx="5" ry="4" fill="#1A1A1A" />
        <ellipse cx="51" cy="47" rx="2" ry="1.5" fill="#444444" />

        {/* Mouth - rubber hose style */}
        {(mood === "happy" || mood === "waving") && (
          <path d="M42 54 Q50 62 58 54" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {(mood === "excited" || mood === "celebrating") && (
          <>
            <ellipse cx="50" cy="56" rx="8" ry="7" fill="#1A1A1A" />
            <ellipse cx="50" cy="58" rx="5" ry="4" fill="#C41E3A" />
            {/* Teeth */}
            <rect x="46" y="52" width="8" height="4" fill="#FFFFFF" rx="1" />
          </>
        )}
        {mood === "thinking" && (
          <ellipse cx="54" cy="55" rx="3" ry="2.5" fill="#1A1A1A" />
        )}
        {mood === "sleeping" && (
          <path d="M45 54 Q50 52 55 54" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {mood === "studying" && (
          <path d="M44 54 L56 54" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Cheek blush - vintage style circles */}
        <circle cx="28" cy="44" r="5" fill="#FFB6C1" opacity="0.6" />
        <circle cx="72" cy="44" r="5" fill="#FFB6C1" opacity="0.6" />

        {/* White gloves - signature rubber hose style */}
        {mood === "waving" && (
          <g className={animate ? "animate-[wave_0.4s_ease-in-out_infinite]" : ""} style={{ transformOrigin: "20px 55px" }}>
            <ellipse cx="18" cy="50" rx="10" ry="8" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
            {/* Glove lines */}
            <path d="M14 48 L14 52" stroke="#1A1A1A" strokeWidth="1" />
            <path d="M17 47 L17 53" stroke="#1A1A1A" strokeWidth="1" />
            <path d="M20 48 L20 52" stroke="#1A1A1A" strokeWidth="1" />
          </g>
        )}

        {/* Book for studying */}
        {mood === "studying" && (
          <>
            <rect x="62" y="60" width="16" height="12" rx="1" fill="#8B0000" stroke="#1A1A1A" strokeWidth="2" />
            <rect x="64" y="62" width="12" height="8" fill="#FFF8DC" />
            <line x1="70" y1="62" x2="70" y2="70" stroke="#1A1A1A" strokeWidth="1" />
          </>
        )}

        {/* Celebration effects - vintage stars */}
        {mood === "celebrating" && (
          <>
            <polygon points="20,15 22,20 27,20 23,24 25,29 20,26 15,29 17,24 13,20 18,20" fill="#FFD700" stroke="#1A1A1A" strokeWidth="1" />
            <polygon points="80,12 81,15 84,15 82,17 83,20 80,18 77,20 78,17 76,15 79,15" fill="#FFD700" stroke="#1A1A1A" strokeWidth="1" />
            <circle cx="50" cy="8" r="4" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
          </>
        )}

        {/* Thinking bubble - vintage style */}
        {mood === "thinking" && (
          <>
            <circle cx="78" cy="22" r="5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="84" cy="14" r="3.5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
            <circle cx="88" cy="8" r="2.5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1" />
          </>
        )}

        {/* Zzz for sleeping - vintage style */}
        {mood === "sleeping" && (
          <>
            <text x="68" y="22" fontSize="14" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">Z</text>
            <text x="76" y="16" fontSize="11" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">Z</text>
            <text x="82" y="11" fontSize="8" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">Z</text>
          </>
        )}

        {/* Motion lines for animation feel */}
        {animate && mood !== "sleeping" && mood !== "studying" && (
          <>
            <path d="M8 70 Q6 75 8 80" stroke="#1A1A1A" strokeWidth="1.5" fill="none" opacity="0.3" />
            <path d="M92 70 Q94 75 92 80" stroke="#1A1A1A" strokeWidth="1.5" fill="none" opacity="0.3" />
          </>
        )}
      </svg>

      {/* Shadow - vintage style */}
      <div
        className="rounded-full bg-[#1A1A1A]/20 -mt-1"
        style={{
          width: dimensions * 0.5,
          height: dimensions * 0.06,
          transform: `scaleX(${squashStretch.scaleX * 1.1})`,
        }}
      />

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(25deg); }
        }
      `}</style>
    </div>
  );
};
