import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, ThumbsUp, Eye, Share2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoData {
  id: string;
  title: string;
  views: string;
  likes: string;
  channel: string;
  duration: string;
  category: string;
  thumbnail: string;
}

interface EnglishTVFullFeedProps {
  videos: VideoData[];
  onClose: () => void;
  watchedVideos: string[];
  onVideoWatched: (videoId: string) => void;
  startVideoId?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
    _ytApiLoaded?: boolean;
  }
}

const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window._ytApiLoaded) return resolve();
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      if (window.YT && window.YT.Player) {
        window._ytApiLoaded = true;
        return resolve();
      }
      window.onYouTubeIframeAPIReady = () => {
        window._ytApiLoaded = true;
        resolve();
      };
      return;
    }
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => {
      window._ytApiLoaded = true;
      resolve();
    };
    document.body.appendChild(tag);
  });
};

export const EnglishTVFullFeed: React.FC<EnglishTVFullFeedProps> = ({ 
  videos, 
  onClose, 
  watchedVideos, 
  onVideoWatched,
  startVideoId
}) => {
  const { toast } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(() => {
    const idx = videos?.findIndex(v => v.id === startVideoId);
    return idx !== undefined && idx >= 0 ? idx : 0;
  });
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blockedIdsRef = useRef<Set<string>>(new Set());

// Add a guaranteed embeddable fallback playlist (safe, autoplayable)
const safeFallbacks: VideoData[] = [
  {
    id: 'M7lc1UVf-VE', // YouTube IFrame API Demo (embeddable)
    title: 'Prática Rápida de Inglês (Demo) — Legendas PT disponíveis',
    views: '10M',
    likes: '200K',
    channel: 'YouTube Developers',
    duration: '3:47',
    category: 'Listening',
    thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg'
  },
  {
    id: 'ysz5S6PUM-U', // Known embeddable sample video
    title: 'Exercício de Listening — Inglês em 1 minuto',
    views: '5M',
    likes: '120K',
    channel: 'YouTube Samples',
    duration: '1:00',
    category: 'Listening',
    thumbnail: 'https://img.youtube.com/vi/ysz5S6PUM-U/maxresdefault.jpg'
  },
  {
    id: 'aqz-KE-bpKQ', // Big Buck Bunny 4K sample (embeddable)
    title: 'Vocabulário em Contexto (vídeo demonstrativo)',
    views: '40M',
    likes: '500K',
    channel: 'Blender Foundation',
    duration: '9:56',
    category: 'Vocabulário',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg'
  }
];
const playlist = [...videos, ...safeFallbacks];

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const previousVideo = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const mountPlayer = useCallback(async (videoId: string) => {
    await loadYouTubeAPI();

    // Destroy previous player if any
    if (playerRef.current && playerRef.current.destroy) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    // Ensure container exists
    if (containerRef.current) {
      containerRef.current.innerHTML = '<div id="yt-player" class="w-full h-full"></div>';
    }

    playerRef.current = new window.YT.Player('yt-player', {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
        mute: isMuted ? 1 : 0,
        cc_load_policy: 1,
        cc_lang_pref: 'pt-BR',
        hl: 'pt-BR',
        iv_load_policy: 3,
      },
      events: {
        onReady: (e: any) => {
          if (isMuted) e.target.mute(); else e.target.unMute();
          e.target.playVideo();
        },
        onError: () => {
          // 101/150 => embedding disabled; 2/5 => invalid params
          blockedIdsRef.current.add(videoId);
          toast({
            title: 'Vídeo indisponível',
            description: 'Pulando para o próximo vídeo…',
          });
          nextVideo();
        },
        onStateChange: (event: any) => {
          // Auto-advance when video ends
          if (event.data === window.YT.PlayerState.ENDED) {
            onVideoWatched(videoId);
            nextVideo();
          }
        }
      }
    });
  }, [isMuted, nextVideo, onVideoWatched, toast]);

  // Create/refresh player when index changes
  useEffect(() => {
    const current = playlist[currentVideoIndex];
    if (!current) return;
    // If this id has been blocked already, skip forward
    if (blockedIdsRef.current.has(current.id)) {
      nextVideo();
      return;
    }
    mountPlayer(current.id);
  }, [currentVideoIndex, mountPlayer, nextVideo, playlist]);

  // React to mute toggle
  useEffect(() => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.mute(); else playerRef.current.unMute();
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, []);

  // Keyboard and swipe controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') nextVideo();
      if (e.key === 'ArrowUp') previousVideo();
      if (e.key === 'Escape') onClose();
      if (e.key === 'm' || e.key === 'M') setIsMuted(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextVideo, previousVideo, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextVideo() : previousVideo();
    }
  };

  const handleShare = () => {
    const currentVideo = playlist[currentVideoIndex];
    const shareUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
    if (navigator.share) {
      navigator.share({ title: currentVideo.title, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copiado!', description: 'URL do vídeo copiada.' });
    }
  };

  const currentVideo = playlist[currentVideoIndex];
  const isWatched = watchedVideos.includes(currentVideo?.id);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <Button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
        size="sm"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Video Feed */}
      <div 
        className="w-full h-full max-w-md relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current Video via YouTube IFrame API */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div ref={containerRef} className="w-full h-full bg-black" />
        </div>

        {/* Video Overlay Info */}
        {currentVideo && (
          <div className="absolute bottom-20 left-4 right-20 text-white pointer-events-none">
            <h2 className="text-xl font-bold mb-2 drop-shadow-lg">{currentVideo.title}</h2>
            <p className="text-gray-200 text-sm mb-3">{currentVideo.channel}</p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {currentVideo.views}
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {currentVideo.likes}
              </div>
              <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
                {currentVideo.category}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-3">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full"
            size="icon"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button
            onClick={handleShare}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full"
            size="icon"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Buttons (Desktop) */}
        <div className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 flex-col gap-2">
          <Button
            onClick={previousVideo}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full"
            size="icon"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          <Button
            onClick={nextVideo}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full"
            size="icon"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>Vídeo {currentVideoIndex + 1} de {playlist.length}</span>
            <span>
              {isWatched ? '✅ Assistido' : '🆕 Novo'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${((currentVideoIndex + 1) / playlist.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Navigation Hints */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
          ⬆️ Arraste para navegar ⬇️
        </div>
      </div>
    </div>
  );
};
