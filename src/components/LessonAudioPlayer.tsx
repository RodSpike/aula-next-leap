import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LessonAudioPlayerProps {
  lessonContent: string;
  lessonTitle: string;
}

export function LessonAudioPlayer({ lessonContent, lessonTitle }: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stripHtml = (html: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handlePlayPause = async () => {
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio && !isPlaying) {
      audio.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);

    try {
      // Extract text from lesson content
      const textContent = stripHtml(lessonContent);
      const textToSpeak = `${lessonTitle}. ${textContent.substring(0, 4000)}`; // Limit to 4000 chars

      const { data, error } = await supabase.functions.invoke('text-to-speech-multilingual', {
        body: { text: textToSpeak }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const newAudio = new Audio(audioUrl);
        
        newAudio.onended = () => {
          setIsPlaying(false);
        };
        
        newAudio.onerror = () => {
          toast({
            title: "Audio Error",
            description: "Failed to play audio",
            variant: "destructive"
          });
          setIsPlaying(false);
        };

        setAudio(newAudio);
        newAudio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio for this lesson",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePlayPause}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </>
      ) : isPlaying ? (
        <>
          <VolumeX className="h-4 w-4" />
          Pausar Áudio
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Ouvir Lição
        </>
      )}
    </Button>
  );
}