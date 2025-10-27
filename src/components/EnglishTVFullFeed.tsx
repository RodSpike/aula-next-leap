import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, ThumbsUp, Eye, Play, Pause } from "lucide-react";

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
  startVideoId: string;
  onClose: () => void;
  watchedVideos: string[];
  onVideoWatched: (videoId: string) => void;
}

export const EnglishTVFullFeed: React.FC<EnglishTVFullFeedProps> = ({
  videos,
  startVideoId,
  onClose,
  watchedVideos,
  onVideoWatched
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Initialize starting index from startVideoId
  useEffect(() => {
    const startIndex = videos.findIndex((v) => v.id === startVideoId);
    if (startIndex !== -1) {
      setCurrentVideoIndex(startIndex);
    }
  }, [startVideoId, videos]);

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex((prev) => {
      const nextIndex = (prev + 1) % videos.length;
      // mark current as watched
      const current = videos[prev];
      if (current && !watchedVideos.includes(current.id)) {
        onVideoWatched(current.id);
      }
      return nextIndex;
    });
    setIsPlaying(true);
    setHasError(false);
  }, [videos, watchedVideos, onVideoWatched]);

  const previousVideo = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(true);
    setHasError(false);
  }, [videos.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextVideo();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        previousVideo();
      }
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'm') setIsMuted((p) => !p);
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

  const currentVideo = videos[currentVideoIndex];

  // Simple YouTube embed URL to avoid postMessage security issues
  const getYouTubeUrl = (videoId: string) => {
    const baseParams = `autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;
    return `https://www.youtube.com/embed/${videoId}?${baseParams}`;
  };

  const handleVideoError = () => {
    setHasError(true);
    setTimeout(() => {
      nextVideo();
    }, 2000);
  };

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Carregando vídeos...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <Button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-0"
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
        {/* Current Video */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-full h-full relative">
            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="text-lg mb-4">❌ Erro ao carregar vídeo</div>
                <div className="text-sm text-gray-400">Próximo vídeo em 2 segundos...</div>
              </div>
            ) : (
              <iframe
                key={currentVideo.id}
                src={getYouTubeUrl(currentVideo.id)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentVideo.title}
                onError={handleVideoError}
                loading="eager"
              />
            )}

            {/* Custom Play/Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  onClick={() => setIsPlaying(true)}
                  className="bg-white/90 hover:bg-white text-black rounded-full w-16 h-16"
                >
                  <Play className="w-6 h-6 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Video Overlay Info */}
        <div className="absolute bottom-20 left-4 right-4 text-white">
          <h2 className="text-xl font-bold mb-2 drop-shadow-lg">{currentVideo.title}</h2>
          <p className="text-gray-200 text-sm mb-3">{currentVideo.channel}</p>
          <div className="flex gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1 bg-red-600/80 px-2 py-1 rounded">
              <Eye className="w-4 h-4" />
              {currentVideo.views}
            </div>
            <div className="flex items-center gap-1 bg-blue-600/80 px-2 py-1 rounded">
              <ThumbsUp className="w-4 h-4" />
              {currentVideo.likes}
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">
              {currentVideo.category}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-3">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full border-0"
            size="icon"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black/50 backdrop-blur-sm w-12 h-12 rounded-full border-0"
            size="icon"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>Vídeo {currentVideoIndex + 1} de {videos.length}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              watchedVideos.includes(currentVideo.id) ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {watchedVideos.includes(currentVideo.id) ? '✅ Assistido' : '🆕 Novo'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentVideoIndex + 1) / videos.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Navigation Hints */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
          ⬆️ Arraste para navegar ⬇️
        </div>

        {/* Next Video Preview */}
        {videos.length > 1 && (
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="text-white text-center">
              <div className="text-xs mb-2">Próximo</div>
              <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={videos[(currentVideoIndex + 1) % videos.length].thumbnail}
                  alt="Próximo vídeo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.ytimg.com/vi/mY5Fda2WFCc/mqdefault.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
