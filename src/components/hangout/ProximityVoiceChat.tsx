import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

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
  roomId: string;
  proximityRadius?: number;
}

interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

const ProximityVoiceChat = ({ 
  myAvatar, 
  otherAvatars,
  roomId,
  proximityRadius = 150 
}: ProximityVoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Auto-enable
  const [nearbyUsers, setNearbyUsers] = useState<Avatar[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const signalingChannelRef = useRef<RealtimeChannel | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Auto-request microphone on mount
  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  // Setup signaling channel
  useEffect(() => {
    if (!permissionGranted || !roomId) return;

    const channel = supabase.channel(`voice-chat:${roomId}`);
    
    channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: SignalMessage }) => {
      if (payload.to !== myAvatar.user_id) return;

      const fromUserId = payload.from;

      if (payload.type === 'offer') {
        await handleOffer(fromUserId, payload.data);
      } else if (payload.type === 'answer') {
        await handleAnswer(fromUserId, payload.data);
      } else if (payload.type === 'ice-candidate') {
        await handleIceCandidate(fromUserId, payload.data);
      }
    });

    channel.subscribe();
    signalingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permissionGranted, roomId, myAvatar.user_id]);

  // Calculate nearby users and manage connections
  useEffect(() => {
    const nearby = otherAvatars.filter(avatar => {
      const distance = Math.sqrt(
        Math.pow(avatar.position_x - myAvatar.position_x, 2) +
        Math.pow(avatar.position_y - myAvatar.position_y, 2)
      );
      return distance <= proximityRadius;
    });

    setNearbyUsers(nearby);

    if (!permissionGranted || !localStreamRef.current) return;

    // Connect to nearby users
    nearby.forEach(avatar => {
      if (!peerConnectionsRef.current.has(avatar.user_id)) {
        createPeerConnection(avatar.user_id);
      }
    });

    // Disconnect from users who are no longer nearby
    const nearbyUserIds = new Set(nearby.map(a => a.user_id));
    peerConnectionsRef.current.forEach((pc, userId) => {
      if (!nearbyUserIds.has(userId)) {
        closePeerConnection(userId);
      }
    });
  }, [myAvatar.position_x, myAvatar.position_y, otherAvatars, proximityRadius, permissionGranted]);

  const createPeerConnection = async (userId: string) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current.set(userId, pc);

    // Add local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming audio
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      let audioElement = audioElementsRef.current.get(userId);
      
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        audioElementsRef.current.set(userId, audioElement);
      }
      
      audioElement.srcObject = remoteStream;
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice-candidate',
            from: myAvatar.user_id,
            to: userId,
            data: event.candidate
          }
        });
      }
    };

    // Create and send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'offer',
            from: myAvatar.user_id,
            to: userId,
            data: offer
          }
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    let pc = peerConnectionsRef.current.get(fromUserId);
    
    if (!pc) {
      pc = new RTCPeerConnection(iceServers);
      peerConnectionsRef.current.set(fromUserId, pc);

      // Add local audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc!.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming audio
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        let audioElement = audioElementsRef.current.get(fromUserId);
        
        if (!audioElement) {
          audioElement = new Audio();
          audioElement.autoplay = true;
          audioElementsRef.current.set(fromUserId, audioElement);
        }
        
        audioElement.srcObject = remoteStream;
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && signalingChannelRef.current) {
          signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'ice-candidate',
              from: myAvatar.user_id,
              to: fromUserId,
              data: event.candidate
            }
          });
        }
      };
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'answer',
            from: myAvatar.user_id,
            to: fromUserId,
            data: answer
          }
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const closePeerConnection = (userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }

    const audioElement = audioElementsRef.current.get(userId);
    if (audioElement) {
      audioElement.srcObject = null;
      audioElementsRef.current.delete(userId);
    }
  };

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
      
      toast.success("Voice chat ready! Get close to others to talk.");
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast.error("Microphone access denied. Please enable it in your browser settings.");
      setIsEnabled(false);
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
      setIsEnabled(true);
    } else {
      // Disable voice chat
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach((pc, userId) => {
        closePeerConnection(userId);
      });
      
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
      peerConnectionsRef.current.forEach((pc, userId) => {
        closePeerConnection(userId);
      });
      if (signalingChannelRef.current) {
        supabase.removeChannel(signalingChannelRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          {permissionGranted ? (
            <>
              <Volume2 className="w-4 h-4 text-green-500" />
              <span>{nearbyUsers.length} nearby</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <span>Requesting mic...</span>
            </>
          )}
        </div>
        
        <Button
          size="sm"
          variant={isEnabled && permissionGranted ? "default" : "outline"}
          onClick={toggleVoiceChat}
          title={isEnabled ? "Disable voice chat" : "Enable voice chat"}
        >
          {isEnabled && permissionGranted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>

        {isEnabled && permissionGranted && (
          <Button
            size="sm"
            variant={isMuted ? "destructive" : "outline"}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {nearbyUsers.length > 0 && permissionGranted && (
        <div className="mt-2 text-xs text-muted-foreground">
          🎙️ In range: {nearbyUsers.map(u => u.profiles?.display_name || "User").join(", ")}
        </div>
      )}
    </div>
  );
};

export default ProximityVoiceChat;
