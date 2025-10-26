import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Pause, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LessonAudioPlayerProps {
  lessonContent: string;
  lessonTitle: string;
}

interface LanguageSegment {
  text: string;
  language: 'pt-BR' | 'en-US';
}

export function LessonAudioPlayer({ lessonContent, lessonTitle }: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [segments, setSegments] = useState<LanguageSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stripHtml = (html: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const findVoiceForLanguage = (language: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    if (language.includes('pt')) {
      const premiumNames = ['Maria', 'Francisca', 'Luciana'];
      const premium = voices.find(v => 
        v.lang.includes('pt') && 
        premiumNames.some(name => v.name.includes(name))
      );
      if (premium) return premium;
      
      const female = voices.find(v => 
        v.lang.includes('pt') && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('feminino'))
      );
      if (female) return female;
      
      const google = voices.find(v => v.lang.includes('pt') && v.name.includes('Google'));
      if (google) return google;
      
      return voices.find(v => v.lang.includes('pt')) || voices[0];
    } else {
      const premiumNames = ['Samantha', 'Jenny', 'Zira', 'Ava'];
      const premium = voices.find(v => 
        v.lang.startsWith('en') && 
        premiumNames.some(name => v.name.includes(name))
      );
      if (premium) return premium;
      
      const female = voices.find(v => 
        v.lang.startsWith('en') && 
        v.name.toLowerCase().includes('female')
      );
      if (female) return female;
      
      const google = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (google) return google;
      
      return voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  };

  const speakSegment = (index: number) => {
    if (index >= segments.length) {
      setIsPlaying(false);
      setCurrentSegmentIndex(0);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakSegment(index);
      };
      return;
    }

    const segment = segments[index];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const voice = findVoiceForLanguage(segment.language);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = segment.language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (index < segments.length - 1) {
        setCurrentSegmentIndex(index + 1);
        speakSegment(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentSegmentIndex(0);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      toast.error('Error playing audio');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (segments.length > 0) {
      setIsPlaying(true);
      speakSegment(currentSegmentIndex);
      return;
    }

    // Detect language segments
    setIsLoading(true);
    try {
      const cleanContent = stripHtml(lessonContent);
      const textToSpeak = `${lessonTitle}. ${cleanContent.substring(0, 4000)}`;
      
      toast.info('Detecting languages...', {
        description: 'Preparing audio'
      });

      const { data, error } = await supabase.functions.invoke('intelligent-text-to-speech', {
        body: { 
          text: textToSpeak,
        }
      });

      if (error) {
        throw error;
      }

      if (!data.segments || data.segments.length === 0) {
        throw new Error('No language segments detected');
      }

      setSegments(data.segments);
      setCurrentSegmentIndex(0);
      setIsPlaying(true);

      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
        });
      }

      speakSegment(0);
      
      toast.success('Playing audio!', {
        description: `${data.segments.length} language segment(s) detected`
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