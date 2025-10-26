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
  const playbackStartTimeRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);

  const findVoiceForLanguage = (language: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();

    // Prefer a bilingual Brazilian Portuguese female voice for ALL segments if available
    const ptBrBilingual = voices.find(v =>
      v.lang === 'pt-BR' && (
        /Luciana|Francisca|Maria/i.test(v.name) ||
        /natural|neural/i.test(v.name) ||
        (v.name.includes('Google') && !/male/i.test(v.name))
      )
    );
    if (ptBrBilingual) return ptBrBilingual;

    if (language === 'pt-BR') {
      // Priority 1: Google Luciana (female Brazilian Portuguese)
      const googleLuciana = voices.find(v =>
        v.lang === 'pt-BR' &&
        v.name.includes('Google') &&
        (v.name.includes('Luciana') || v.name.toLowerCase().includes('female'))
      );
      if (googleLuciana) return googleLuciana;

      // Priority 2: Any Google pt-BR female voice
      const googlePtBRFemale = voices.find(v =>
        v.lang === 'pt-BR' &&
        v.name.includes('Google') &&
        !v.name.toLowerCase().includes('male')
      );
      if (googlePtBRFemale) return googlePtBRFemale;

      // Priority 3: Any Google Portuguese (Brasil)
      const googlePtBR = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google'));
      if (googlePtBR) return googlePtBR;

      // Priority 4: Microsoft Francisca (female)
      const francisca = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Francisca'));
      if (francisca) return francisca;

      // Fallback: Any Brazilian Portuguese
      return voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.includes('pt')) || voices[0];
    } else {
      // For English segments, use a natural voice
      const googleEnFemale = voices.find(v =>
        v.lang === 'en-US' &&
        v.name.includes('Google') &&
        (v.name.toLowerCase().includes('female') || v.name.includes('US'))
      );
      if (googleEnFemale) return googleEnFemale;

      const googleEn = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
      if (googleEn) return googleEn;

      const microsoftNatural = voices.find(v => v.lang === 'en-US' && (v.name.includes('Aria') || v.name.includes('Jenny')));
      if (microsoftNatural) return microsoftNatural;

      return voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  };


  const getCurrentSegment = (): AudioSegment | null => {
    return segments.find(seg => {
      const start = Number(seg.start_time) || 0;
      const end = Number(seg.end_time) || 0;
      return currentTime >= start && currentTime < end && end > start;
    }) || null;
  };

  const speakSegment = (segment: AudioSegment, startAt?: number) => {
    if (!segment) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakSegment(segment, startAt);
      };
      return;
    }

    // Stop any current speech and timers
    window.speechSynthesis.cancel();
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }

    // Calculate effective start time within the segment
    const segStart = Number(segment.start_time) || 0;
    const segEnd = Number(segment.end_time) || 0;
    const segDur = Math.max(0, segEnd - segStart);
    const effectiveStart = Math.min(segEnd, Math.max(segStart, startAt ?? currentTime));

    // Slice text approximately to the offset so we don't always restart from segment start
    const fullText = cleanTextForTTS(segment.text);
    let textToSpeak = fullText;
    if (segDur > 0 && effectiveStart > segStart && fullText.length > 10) {
      const ratio = (effectiveStart - segStart) / segDur;
      let idx = Math.floor(ratio * fullText.length);
      // advance to next word boundary to avoid mid-word start
      const nextSpace = fullText.indexOf(' ', idx);
      if (nextSpace > -1 && nextSpace < fullText.length - 1) idx = nextSpace + 1;
      textToSpeak = fullText.slice(idx).trim();
    }

    if (!textToSpeak) {
      // Nothing meaningful left in this segment, jump to next
      const currentIndex = segments.findIndex(s => s === segment);
      if (currentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentIndex + 1);
        speakSegment(segments[currentIndex + 1], segments[currentIndex + 1].start_time);
      } else {
        setIsPlaying(false);
        setCurrentTime(segEnd);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = findVoiceForLanguage(segment.language);
    if (voice) utterance.voice = voice;

    utterance.lang = voice?.lang || segment.language;
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setCurrentTime(effectiveStart);
      playbackStartTimeRef.current = effectiveStart;
      startedAtRef.current = performance.now();

      timeUpdateInterval.current = window.setInterval(() => {
        const elapsed = (performance.now() - startedAtRef.current) / 1000; // seconds
        const next = Math.min(segEnd, playbackStartTimeRef.current + elapsed * playbackRate);
        setCurrentTime(next);
      }, 100);
    };

    utterance.onend = () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }

      const currentIndex = segments.findIndex(s => s === segment);
      if (currentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentIndex + 1);
        speakSegment(segments[currentIndex + 1], segments[currentIndex + 1].start_time);
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
          window.speechSynthesis.onvoiceschanged = resolve as () => void;
        });
      }

      // Play from the exact current time within the current segment
      const segment = getCurrentSegment() || segments[currentSegmentIndex] || segments[0];
      if (segment) {
        speakSegment(segment, currentTime);
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
    const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
    if (segment) {
      const segmentIndex = segments.findIndex(seg => seg === segment);
      setCurrentSegmentIndex(segmentIndex);
      if (isPlaying) {
        handlePause();
        setTimeout(() => speakSegment(segment, newTime), 100);
      }
    }
  };


  const handleSkipBack = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    const segment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
    if (segment) {
      const segmentIndex = segments.findIndex(seg => seg === segment);
      setCurrentSegmentIndex(segmentIndex);
      if (isPlaying) {
        handlePause();
        setTimeout(() => speakSegment(segment, newTime), 100);
      }
    }
  };


  const handleSeek = (value: number[]) => {
    const newTime = safeDuration > 0 ? (value[0] / 100) * safeDuration : 0;
    setCurrentTime(newTime);

    const targetSegment = segments.find(seg => newTime >= seg.start_time && newTime < seg.end_time);
    if (targetSegment) {
      const segmentIndex = segments.findIndex(seg => seg === targetSegment);
      setCurrentSegmentIndex(segmentIndex);
      if (isPlaying) {
        handlePause();
        setTimeout(() => speakSegment(targetSegment, newTime), 100);
      }
    }
  };


  const handleMarkerClick = (segment: AudioSegment) => {
    handlePause();
    setCurrentTime(segment.start_time);
    setTimeout(() => speakSegment(segment, segment.start_time), 100);
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
        setTimeout(() => speakSegment(segment, currentTime), 100);
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

      {/* Interactive Timeline with markers */}
      <div className="relative pt-6 pb-2">
        {/* Clickable markers above timeline */}
        <div className="relative mb-3 h-6">
          {segments.map((segment, index) => (
            <div 
              key={index}
              className="absolute -translate-x-1/2 group"
              style={{ left: `${getMarkerPosition(segment)}%` }}
            >
              <button
                className={cn(
                  "w-3 h-3 rounded-full border-2 border-background transition-all hover:scale-150 cursor-pointer",
                  segment.language === 'pt-BR' ? 'bg-primary' : 'bg-secondary',
                  currentSegment === segment && 'scale-150 ring-2 ring-primary/50'
                )}
                onClick={() => handleMarkerClick(segment)}
                title={`${formatTime(segment.start_time)} - ${segment.marker_label}`}
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                <span className="text-xs bg-popover text-popover-foreground px-2 py-1 rounded border shadow-md">
                  {formatTime(segment.start_time)} - {segment.marker_label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive seekable slider */}
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />

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
