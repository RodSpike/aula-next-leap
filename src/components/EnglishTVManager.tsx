import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
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

      setSelectedVideoId("");
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

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

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
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Vídeos Cadastrados ({videos.length})
          </label>
          <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um vídeo para visualizar" />
            </SelectTrigger>
            <SelectContent>
              {videos.map((video) => (
                <SelectItem key={video.id} value={video.id}>
                  {video.title || `Vídeo ${video.video_id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Video Actions */}
        {selectedVideo && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">ID do Vídeo:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedVideo.video_id}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">URL Completa:</p>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedVideo.youtube_url}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(selectedVideo.youtube_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Assistir no YouTube
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteVideo(selectedVideo.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {videos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum vídeo cadastrado ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
};
