import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cleanTextForTTS } from "@/utils/cleanTextForTTS";

interface Segment {
  text: string;
  language: string;
  startTime: number;
  duration: number;
}

interface LanguageAwareTTSProps {
  content: string;
  lessonId?: string;
}

export const LanguageAwareTTS = ({ content, lessonId }: LanguageAwareTTSProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const { toast } = useToast();

  // Detect language segments in the content
  const detectLanguageSegments = (text: string): Segment[] => {
    const paragraphs = text.split('\n').filter(p => p.trim());
    const segments: Segment[] = [];
    
    paragraphs.forEach(paragraph => {
      const englishWords = ['the', 'and', 'is', 'are', 'to', 'of', 'in', 'that', 'it', 'with'];
      const portugueseWords = ['o', 'a', 'os', 'as', 'é', 'são', 'para', 'de', 'em', 'que', 'com'];
      
      let englishCount = 0;
      let portugueseCount = 0;
      
      const words = paragraph.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (englishWords.includes(word)) englishCount++;
        if (portugueseWords.includes(word)) portugueseCount++;
      });
      
      const detectedLanguage = englishCount > portugueseCount ? 'en-US' : 'pt-BR';
      const wordCount = paragraph.split(/\s+/).length;
      const duration = (wordCount / 150) * 60 * 1000; // 150 WPM average
      
      segments.push({
        text: paragraph,
        language: detectedLanguage,
        startTime: 0,
        duration
      });
    });
    
    return segments;
  };

  // Get appropriate premium female voice for language
  const getVoiceForLanguage = (language: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    // Filter voices by language
    const languageVoices = language === 'pt-BR'
      ? voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'))
      : voices.filter(v => v.lang.includes('en-US') || v.lang.includes('en_US') || v.lang.startsWith('en'));

    if (languageVoices.length === 0) return null;

    // Priority 1: Premium female voices (Google/Microsoft natural voices)
    const premiumFemale = languageVoices.find(v => 
      (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
      (v.name.toLowerCase().includes('google') && (
        v.name.includes('Luciana') || // Portuguese
        v.name.includes('Flo') ||     // Portuguese alternative
        v.name.includes('Samantha') || // English
        v.name.includes('Ava')         // English alternative
      )) ||
      v.name.includes('Microsoft Maria') ||      // Portuguese
      v.name.includes('Microsoft Francisca') ||  // Portuguese
      v.name.includes('Microsoft Zira') ||       // English
      v.name.includes('Microsoft Jenny')         // English
    );
    
    if (premiumFemale) return premiumFemale;

    // Priority 2: Any female voice
    const femaleVoice = languageVoices.find(v => 
      !v.name.toLowerCase().includes('male') &&
      !v.name.includes('Daniel') &&
      !v.name.includes('David') &&
      !v.name.includes('Alex') &&
      !v.name.includes('Fred') &&
      (v.name.toLowerCase().includes('female') ||
       v.name.includes('Luciana') ||
       v.name.includes('Samantha') ||
       v.name.includes('Maria') ||
       v.name.includes('Francisca') ||
       v.name.includes('Zira') ||
       v.name.includes('Jenny') ||
       v.name.includes('Ava'))
    );

    if (femaleVoice) return femaleVoice;

    // Priority 3: Google voices (usually better quality)
    const googleVoice = languageVoices.find(v => v.name.includes('Google'));
    if (googleVoice) return googleVoice;

    // Priority 4: Default to first available voice
    return languageVoices[0];
  };

  const speakSegment = (segmentIndex: number) => {
    if (segmentIndex >= segments.length) {
      setIsPlaying(false);
      return;
    }

    const segment = segments[segmentIndex];
    const cleanedText = cleanTextForTTS(segment.text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    utterance.lang = segment.language;
    const voice = getVoiceForLanguage(segment.language);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentSegmentIndex(segmentIndex);
    };

    utterance.onend = () => {
      speakSegment(segmentIndex + 1);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      toast({
        title: "TTS Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const startTTS = async () => {
    if (!content) {
      toast({
        title: "No content",
        description: "No text content available for TTS",
        variant: "destructive",
      });
      return;
    }

    // Ensure voices are loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise(resolve => {
        window.speechSynthesis.onvoiceschanged = resolve;
      });
    }

    window.speechSynthesis.cancel();
    const detectedSegments = detectLanguageSegments(content);
    setSegments(detectedSegments);
    setCurrentSegmentIndex(0);
    speakSegment(0);
  };

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
  };

  const pauseTTS = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
  };

  const resumeTTS = () => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
  };

  const jumpToSegment = (segmentIndex: number) => {
    window.speechSynthesis.cancel();
    setCurrentSegmentIndex(segmentIndex);
    speakSegment(segmentIndex);
  };

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-3">Audio Lesson</h3>
      
      <div className="flex gap-2 mb-4">
        {!isPlaying ? (
          <Button onClick={startTTS} size="sm">
            ▶️ Play Lesson
          </Button>
        ) : (
          <>
            <Button onClick={pauseTTS} size="sm" variant="outline">
              ⏸️ Pause
            </Button>
            <Button onClick={resumeTTS} size="sm" variant="outline">
              ▶️ Resume
            </Button>
          </>
        )}
        <Button onClick={stopTTS} size="sm" variant="destructive">
          ⏹️ Stop
        </Button>
      </div>

      {segments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Lesson Sections:</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer text-sm border ${
                  index === currentSegmentIndex 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-muted border-border hover:bg-muted/80'
                }`}
                onClick={() => jumpToSegment(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Part {index + 1} 
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-muted">
                      {segment.language === 'pt-BR' ? '🇧🇷 Portuguese' : '🇺🇸 English'}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.ceil(segment.text.length / 50)}s
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {segment.text.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPlaying && segments[currentSegmentIndex] && (
        <div className="mt-3 p-2 bg-primary/10 border border-primary rounded">
          <p className="text-sm font-medium">
            Now playing: Part {currentSegmentIndex + 1} ({segments[currentSegmentIndex].language === 'pt-BR' ? 'Portuguese' : 'English'})
          </p>
        </div>
      )}
    </div>
  );
};
