import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface Avatar {
  user_id: string;
  position_x: number;
  position_y: number;
  profiles?: {
    display_name: string;
  };
}

interface ProximityVoiceChatProps {
  myAvatar: Avatar;
  otherAvatars: Avatar[];
  proximityRadius?: number;
}

const ProximityVoiceChat = ({ 
  myAvatar, 
  otherAvatars, 
  proximityRadius = 150 
}: ProximityVoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<Avatar[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Calculate nearby users
  useEffect(() => {
    const nearby = otherAvatars.filter(avatar => {
      const distance = Math.sqrt(
        Math.pow(avatar.position_x - myAvatar.position_x, 2) +
        Math.pow(avatar.position_y - myAvatar.position_y, 2)
      );
      return distance <= proximityRadius;
    });

    setNearbyUsers(nearby);

    // Auto-request permission if users are nearby
    if (nearby.length > 0 && !permissionGranted && !isEnabled) {
      requestMicrophonePermission();
    }
  }, [myAvatar.position_x, myAvatar.position_y, otherAvatars, proximityRadius, permissionGranted, isEnabled]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      setPermissionGranted(true);
      setIsEnabled(true);
      
      toast.success("Microphone access granted! Voice chat enabled.");
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast.error("Microphone access denied. Voice chat disabled.");
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      toast.info(isMuted ? "Microphone unmuted" : "Microphone muted");
    }
  };

  const toggleVoiceChat = async () => {
    if (!isEnabled) {
      await requestMicrophonePermission();
    } else {
      // Disable voice chat
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setIsEnabled(false);
      setPermissionGranted(false);
      toast.info("Voice chat disabled");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <Volume2 className="w-4 h-4" />
          <span>{nearbyUsers.length} nearby</span>
        </div>
        
        <Button
          size="sm"
          variant={isEnabled ? "default" : "outline"}
          onClick={toggleVoiceChat}
        >
          {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>

        {isEnabled && (
          <Button
            size="sm"
            variant={isMuted ? "destructive" : "outline"}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {nearbyUsers.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          In range: {nearbyUsers.map(u => u.profiles?.display_name || "User").join(", ")}
        </div>
      )}
    </div>
  );
};

export default ProximityVoiceChat;
