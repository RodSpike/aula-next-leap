import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, ThumbsUp, Eye, Share2, ChevronUp, ChevronDown } from "lucide-react";

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
}

export const EnglishTVFullFeed: React.FC<EnglishTVFullFeedProps> = ({ 
  videos, 
  onClose, 
  watchedVideos, 
  onVideoWatched 
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState(0);

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex(prev => {
      const nextIndex = (prev + 1) % videos.length;
      // Mark current video as watched when moving to next
      onVideoWatched(videos[prev].id);
      return nextIndex;
    });
  }, [videos, onVideoWatched]);

  const previousVideo = useCallback(() => {
    setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

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
    const currentVideo = videos[currentVideoIndex];
    const shareUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
    if (navigator.share) {
      navigator.share({
        title: currentVideo.title,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copiado para a área de transferência!');
    }
  };

  const currentVideo = videos[currentVideoIndex];
  const isWatched = watchedVideos.includes(currentVideo.id);

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
        {/* Current Video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-black">
            <iframe
              key={currentVideo.id}
              src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&mute=${isMuted ? 1 : 0}`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>

        {/* Video Overlay Info */}
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
            <span>Vídeo {currentVideoIndex + 1} de {videos.length}</span>
            <span>
              {isWatched ? '✅ Assistido' : '🆕 Novo'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${((currentVideoIndex + 1) / videos.length) * 100}%` }}
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
