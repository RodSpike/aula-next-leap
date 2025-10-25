import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
    const voices = speechSynthesis.getVoices();
    
    if (language === 'pt-BR') {
      return voices.find(v => 
        v.lang.includes('pt-BR') || v.lang.includes('pt_BR')
      ) || voices.find(v => v.lang.startsWith('pt')) || null;
    } else {
      return voices.find(v => 
        v.lang.includes('en-US') || v.lang.includes('en_US')
      ) || voices.find(v => v.lang.startsWith('en')) || null;
    }
  };

  const getCurrentSegment = () => {
    return segments.find(seg => 
      currentTime >= seg.start_time && currentTime < seg.end_time
    ) || segments[0];
  };

  const speakSegment = (segment: AudioSegment, startFromSegment: boolean = false) => {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const voice = findVoiceForLanguage(segment.language);
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = segment.language;
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : volume;

    utterance.onstart = () => {
      if (startFromSegment) {
        setCurrentTime(segment.start_time);
      }
    };

    utterance.onend = () => {
      const currentIndex = segments.indexOf(segment);
      if (currentIndex < segments.length - 1) {
        const nextSegment = segments[currentIndex + 1];
        setCurrentSegmentIndex(currentIndex + 1);
        setCurrentTime(nextSegment.start_time);
        speakSegment(nextSegment);
      } else {
        handleStop();
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      handleStop();
      toast.error('Error playing audio');
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);

    // Simulate time updates
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
    
    const segmentDuration = segment.end_time - segment.start_time;
    const updateFrequency = 100; // Update every 100ms
    const timeIncrement = (segmentDuration * 1000) / updateFrequency;
    
    timeUpdateInterval.current = window.setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (timeIncrement / 1000);
        if (next >= segment.end_time) {
          return segment.end_time;
        }
        return next;
      });
    }, updateFrequency);
  };

  const handlePlay = async () => {
    setIsLoading(true);
    try {
      // Load voices if not loaded
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = resolve;
        });
      }

      const segment = getCurrentSegment();
      setIsPlaying(true);
      speakSegment(segment, true);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSegmentIndex(0);
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePause();
      const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
      if (segment) {
        setTimeout(() => {
          setIsPlaying(true);
          speakSegment(segment, true);
        }, 100);
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
        setTimeout(() => {
          setIsPlaying(true);
          speakSegment(segment, true);
        }, 100);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePause();
      const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
      if (segment) {
        setTimeout(() => {
          setIsPlaying(true);
          speakSegment(segment, true);
        }, 100);
      }
    }
  };

  const handleMarkerClick = (segment: AudioSegment) => {
    setCurrentTime(segment.start_time);
    if (isPlaying) {
      handlePause();
      setTimeout(() => {
        setIsPlaying(true);
        speakSegment(segment, true);
      }, 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerPosition = (segment: AudioSegment) => {
    return (segment.start_time / duration) * 100;
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  const currentSegment = getCurrentSegment();
  const progress = (currentTime / duration) * 100;

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
            {currentSegment?.text || lessonTitle}
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
          <span>{formatTime(duration)}</span>
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
