import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LessonAudioPlayerProps {
  lessonContent: string;
  lessonTitle: string;
}

export function LessonAudioPlayer({ lessonContent, lessonTitle }: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const stripHtml = (html: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handlePlayPause = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio) {
      audio.play();
      setIsPlaying(true);
      return;
    }

    // Generate audio with intelligent TTS
    setIsLoading(true);
    try {
      const cleanContent = stripHtml(lessonContent);
      const textToSpeak = `${lessonTitle}. ${cleanContent.substring(0, 4000)}`;
      
      toast.info('Detecting languages...', {
        description: 'Preparing multi-language audio'
      });

      const { data, error } = await supabase.functions.invoke('intelligent-text-to-speech', {
        body: { 
          text: textToSpeak,
          options: { speed: 1.0 }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.audioContent) {
        throw new Error('No audio data received');
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: data.contentType || 'audio/mpeg' }
      );

      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onerror = () => {
        toast.error('Error playing audio');
        setIsPlaying(false);
      };

      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
      
      const segmentInfo = data.segments?.length 
        ? `Detected ${data.segments.length} language segment(s)` 
        : 'Audio ready';
      
      toast.success('Audio ready!', {
        description: segmentInfo
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio', {
        description: 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePlayPause}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : isPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            Pausar Áudio
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            Ouvir Lição
          </>
        )}
      </Button>
    </div>
  );
}