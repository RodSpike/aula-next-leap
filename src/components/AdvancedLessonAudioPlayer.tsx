import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cleanTextForTTS } from "@/utils/cleanTextForTTS";
import {
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AudioSegment {
  text: string;
  language: 'pt-BR' | 'en-US';
  start_time: number;
  end_time: number;
  marker_label: string;
}

interface AdvancedLessonAudioPlayerProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  segments: AudioSegment[];
  duration: number;
}

export function AdvancedLessonAudioPlayer({ 
  lessonTitle, 
  lessonContent,
  segments, 
  duration 
}: AdvancedLessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeUpdateInterval = useRef<number | null>(null);

  const findVoiceForLanguage = (language: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    if (language === 'pt-BR') {
      const premiumNames = ['Maria', 'Francisca', 'Luciana', 'Microsoft Maria', 'Microsoft Francisca'];
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
      const premiumNames = ['Samantha', 'Jenny', 'Zira', 'Ava', 'Microsoft Jenny', 'Microsoft Aria'];
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

  const getCurrentSegment = (): AudioSegment | null => {
    return segments.find(seg => {
      const start = Number(seg.start_time) || 0;
      const end = Number(seg.end_time) || 0;
      return currentTime >= start && currentTime < end && end > start;
    }) || null;
  };

  const speakSegment = (segment: AudioSegment) => {
    if (!segment) return;
    
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakSegment(segment);
      };
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanTextForTTS(segment.text));
    const voice = findVoiceForLanguage(segment.language);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = segment.language;
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = playbackRate;
    // Slight pitch increase to bias towards more natural (often perceived as female) tone when browser lacks explicit female voices
    utterance.pitch = 1.05;
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setCurrentTime(segment.start_time);
      
      timeUpdateInterval.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (0.1 * playbackRate);
          return next < segment.end_time ? next : segment.end_time;
        });
      }, 100);
    };
    
    utterance.onend = () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      
      const currentIndex = segments.findIndex(s => s === segment);
      if (currentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentIndex + 1);
        speakSegment(segments[currentIndex + 1]);
      } else {
        setIsPlaying(false);
        setCurrentTime(safeDuration);
      }
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = async () => {
    setIsLoading(true);
    try {
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
        });
      }

      const segment = getCurrentSegment() || segments[0];
      if (segment) {
        speakSegment(segment);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSegmentIndex(0);
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, safeDuration);
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePause();
      const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
      if (segment) {
        setTimeout(() => speakSegment(segment), 100);
      }
    }
  };

  const handleSkipBack = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePause();
      const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
      if (segment) {
        setTimeout(() => speakSegment(segment), 100);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = safeDuration > 0 ? (value[0] / 100) * safeDuration : 0;
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePause();
      const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
      if (segment) {
        setTimeout(() => speakSegment(segment), 100);
      }
    }
  };

  const handleMarkerClick = (segment: AudioSegment) => {
    handlePause();
    setCurrentTime(segment.start_time);
    setTimeout(() => speakSegment(segment), 100);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerPosition = (segment: AudioSegment) => {
    return safeDuration > 0 ? (segment.start_time / safeDuration) * 100 : 0;
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      handlePause();
      const segment = getCurrentSegment() || segments[currentSegmentIndex];
      if (segment) {
        setTimeout(() => speakSegment(segment), 100);
      }
    }
  }, [playbackRate]);

  const currentSegment = getCurrentSegment();
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : (segments?.length ? Number(segments[segments.length - 1].end_time) || 0 : 0);
  const progress = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-lg border p-6 space-y-4">
      {/* Current segment info */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={currentSegment?.language === 'pt-BR' ? 'default' : 'secondary'}>
              {currentSegment?.language === 'pt-BR' ? '🇧🇷 Português' : '🇺🇸 English'}
            </Badge>
            <Badge variant="outline">{currentSegment?.marker_label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cleanTextForTTS(currentSegment?.text || lessonTitle)}
          </p>
        </div>
      </div>

      {/* Timeline with markers */}
      <div className="relative pt-6">
        <div className="relative h-2 bg-muted rounded-full">
          {/* Markers */}
          {segments.map((segment, index) => (
            <button
              key={index}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background transition-all hover:scale-150",
                segment.language === 'pt-BR' ? 'bg-primary' : 'bg-secondary',
                currentSegment === segment && 'scale-150 ring-2 ring-primary/50'
              )}
              style={{ left: `${getMarkerPosition(segment)}%` }}
              onClick={() => handleMarkerClick(segment)}
              title={`${segment.marker_label} - ${segment.language === 'pt-BR' ? 'Português' : 'English'}`}
            />
          ))}
          
          {/* Progress bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSkipBack}
          disabled={isLoading}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {!isPlaying ? (
          <Button
            onClick={handlePlay}
            disabled={isLoading}
            size="icon"
            className="h-12 w-12"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            size="icon"
            className="h-12 w-12"
          >
            <Pause className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={!isPlaying && currentTime === 0}
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSkipForward}
          disabled={isLoading}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Additional controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={(value) => {
              setVolume(value[0] / 100);
              setIsMuted(value[0] === 0);
            }}
            max={100}
            step={1}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <div className="flex gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => setPlaybackRate(rate)}
                className="h-7 px-2 text-xs"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
