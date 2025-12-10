import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Video, Expand, ThumbsUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnglishTVFullFeed } from './EnglishTVFullFeed';
import { supabase } from "@/integrations/supabase/client";

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

export const DashboardVideoWidget = () => {
  const [showFullFeed, setShowFullFeed] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [englishVideos, setEnglishVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch videos from database
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('english_tv_videos')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;

        // Transform database format to VideoData format
        const transformedVideos: VideoData[] = (data || []).map(video => ({
          id: video.video_id,
          title: video.title || `Video ${video.video_id}`,
          views: 'N/A',
          likes: 'N/A',
          channel: 'Aula Next Leap',
          duration: 'N/A',
          category: 'Inglês',
          thumbnail: `https://i.ytimg.com/vi/${video.video_id}/maxresdefault.jpg`
        }));

        setEnglishVideos(transformedVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: "Erro ao carregar vídeos",
          description: "Não foi possível carregar os vídeos. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [toast]);

  // Get video of the day (rotate daily)
  const getVideoOfTheDay = (): VideoData | null => {
    if (englishVideos.length === 0) return null;
    const today = new Date().getDate();
    return englishVideos[today % englishVideos.length];
  };

  const videoOfTheDay = getVideoOfTheDay();

  // Load user progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('englishTVProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setWatchedVideos(parsed);
      updateProgress(parsed);
    }
  }, []);

  const updateProgress = (watched: string[]) => {
    const progress = (watched.length / englishVideos.length) * 100;
    setCurrentProgress(Math.round(progress));
  };

  const markVideoAsWatched = (videoId: string) => {
    const updatedWatched = [...new Set([...watchedVideos, videoId])];
    setWatchedVideos(updatedWatched);
    localStorage.setItem('englishTVProgress', JSON.stringify(updatedWatched));
    updateProgress(updatedWatched);
  };

  const openFullFeed = () => {
    setShowFullFeed(true);
    toast({
      title: "🎬 English TV Aberta!",
      description: "Arraste ⬅️ para próximo ou ➡️ para voltar",
    });
  };

  // If user wants full feed, show the full component
  if (showFullFeed && videoOfTheDay) {
    return (
      <EnglishTVFullFeed 
        videos={englishVideos}
        startVideoId={videoOfTheDay.id}
        onClose={() => setShowFullFeed(false)}
        watchedVideos={watchedVideos}
        onVideoWatched={markVideoAsWatched}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando vídeos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no videos
  if (englishVideos.length === 0 || !videoOfTheDay) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg">TV de Inglês do Dia</CardTitle>
          </div>
          <CardDescription>
            Recurso diário de vídeos em inglês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum vídeo disponível no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg">TV de Inglês do Dia</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-24 bg-secondary rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <span>{currentProgress}% completo</span>
          </div>
        </div>
        <CardDescription>
          Recurso diário de vídeos em inglês mais populares para brasileiros
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video of the Day */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="relative">
            <img 
              src={videoOfTheDay.thumbnail} 
              alt={videoOfTheDay.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.ytimg.com/vi/mY5Fda2WFCc/maxresdefault.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Button 
                onClick={openFullFeed}
                className="bg-white/90 hover:bg-white text-black rounded-full w-12 h-12"
                size="icon"
              >
                <Play className="w-5 h-5 ml-1" />
              </Button>
            </div>
            <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
              {videoOfTheDay.duration}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-2">{videoOfTheDay.title}</h3>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{videoOfTheDay.channel}</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {videoOfTheDay.views}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {videoOfTheDay.likes}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats & Action */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <strong>{englishVideos.length}</strong> vídeos disponíveis • 
            <strong> {watchedVideos.length}</strong> assistidos
          </div>
          <Button onClick={openFullFeed} className="bg-blue-600 hover:bg-blue-700">
            <Expand className="w-4 h-4 mr-2" />
            Ver Todos
          </Button>
        </div>

        {/* Progress Rewards */}
        {watchedVideos.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">🎯 Seu Progresso:</span>
              <span>Você já assistiu {watchedVideos.length} vídeos esta semana!</span>
            </div>
            {watchedVideos.length >= 5 && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                🏆 Conquista: Assista 10 vídeos para ganhar 50 pontos de experiência!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
