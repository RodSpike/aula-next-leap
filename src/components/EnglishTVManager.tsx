import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Plus, Video } from "lucide-react";

interface EnglishTVVideo {
  id: string;
  youtube_url: string;
  video_id: string;
  title: string | null;
  created_at: string;
}

export const EnglishTVManager = () => {
  const [videos, setVideos] = useState<EnglishTVVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('english_tv_videos')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL do YouTube",
        variant: "destructive"
      });
      return;
    }

    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) {
      toast({
        title: "Erro",
        description: "URL inválida. Use um link do YouTube válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('english_tv_videos')
        .insert({
          youtube_url: newVideoUrl,
          video_id: videoId,
          order_index: videos.length
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Vídeo adicionado com sucesso"
      });

      setNewVideoUrl("");
      fetchVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o vídeo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('english_tv_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Vídeo removido com sucesso"
      });

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o vídeo",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          <CardTitle>Gerenciar English TV</CardTitle>
        </div>
        <CardDescription>
          Adicione ou remova vídeos do YouTube que serão exibidos na English TV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Video */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Adicionar Novo Vídeo</label>
          <div className="flex gap-2">
            <Input
              placeholder="Cole a URL do YouTube aqui..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddVideo}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ
          </p>
        </div>

        {/* Video List */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Vídeos Cadastrados ({videos.length})
          </label>
          
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vídeo cadastrado ainda
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <a 
                      href={video.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-shrink-0 relative group"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                        alt={video.title || 'Video thumbnail'}
                        className="w-32 h-20 object-cover rounded-md border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </a>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {video.title || `Vídeo ${video.video_id}`}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                        ID: {video.video_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {video.youtube_url}
                      </p>
                    </div>
                    
                    {/* Delete Button */}
                    <div className="flex-shrink-0 flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
