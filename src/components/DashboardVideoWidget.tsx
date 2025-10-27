import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Video, Expand, ThumbsUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnglishTVFullFeed } from './EnglishTVFullFeed';

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
  const { toast } = useToast();

  // Most popular English videos for Brazilian learners
  const englishVideos: VideoData[] = [
    {
      id: '0gT9gIjZ1Bc',
      title: 'INGLÊS PARA BRASILEIROS - Conversação Diária',
      views: '28M',
      likes: '580K',
      channel: 'English For Brazilians',
      duration: '0:58',
      category: 'Conversação',
      thumbnail: 'https://img.youtube.com/vi/0gT9gIjZ1Bc/maxresdefault.jpg'
    },
    {
      id: 'hEks1Q4J-0M',
      title: 'INGLÊS EM 1 MINUTO - Pronúncia que Brasileiros Erram',
      views: '15M',
      likes: '320K',
      channel: 'Small Advantages',
      duration: '1:02',
      category: 'Pronúncia',
      thumbnail: 'https://img.youtube.com/vi/hEks1Q4J-0M/maxresdefault.jpg'
    },
    {
      id: 'VfVmK8ppNig',
      title: 'FRASES ESSENCIAIS EM INGLÊS para Brasileiros',
      views: '12M',
      likes: '290K',
      channel: 'Teacher Paulo',
      duration: '0:59',
      category: 'Frases',
      thumbnail: 'https://img.youtube.com/vi/VfVmK8ppNig/maxresdefault.jpg'
    },
    {
      id: 'D9e-9djRwYA',
      title: 'INGLÊS BÁSICO - Aprenda em 60 Segundos',
      views: '18M',
      likes: '410K',
      channel: 'English in Brazil',
      duration: '1:00',
      category: 'Básico',
      thumbnail: 'https://img.youtube.com/vi/D9e-9djRwYA/maxresdefault.jpg'
    },
    {
      id: 'z4fGzE4endQ',
      title: 'GÍRIAS EM INGLÊS que Brasileiros PRECISAM Saber',
      views: '9M',
      likes: '215K',
      channel: 'American English BR',
      duration: '0:55',
      category: 'Gírias',
      thumbnail: 'https://img.youtube.com/vi/z4fGzE4endQ/maxresdefault.jpg'
    },
    {
      id: 'J2LYx2GubsU',
      title: 'LISTENING PRACTICE - Inglês para Brasileiros',
      views: '11M',
      likes: '265K',
      channel: 'English Skills BR',
      duration: '1:03',
      category: 'Listening',
      thumbnail: 'https://img.youtube.com/vi/J2LYx2GubsU/maxresdefault.jpg'
    },
    {
      id: 'bFHOlKY0uIQ',
      title: 'VOCABULÁRIO EM INGLÊS - 50 Palavras Essenciais',
      views: '14M',
      likes: '340K',
      channel: 'Vocab Master BR',
      duration: '0:57',
      category: 'Vocabulário',
      thumbnail: 'https://img.youtube.com/vi/bFHOlKY0uIQ/maxresdefault.jpg'
    },
    {
      id: 'zr9IZ8ufGzI',
      title: 'INGLÊS DO ZERO - Primeiros Passos para Brasileiros',
      views: '22M',
      likes: '520K',
      channel: 'Zero to Hero English',
      duration: '1:01',
      category: 'Iniciante',
      thumbnail: 'https://img.youtube.com/vi/zr9IZ8ufGzI/maxresdefault.jpg'
    }
  ];

  // Get video of the day (rotate daily)
  const getVideoOfTheDay = (): VideoData => {
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
      description: "Use ⬆️⬇️ para navegar entre os vídeos",
    });
  };

  // If user wants full feed, show the full component
  if (showFullFeed) {
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
