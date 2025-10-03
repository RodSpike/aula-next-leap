import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecognitionProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

export const useVoiceRecognition = ({
  onTranscript,
  onError,
  language = 'pt-BR',
  continuous = false
}: VoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const onErrorRef = useRef(onError);
  const unsupportedNotifiedRef = useRef(false);
  const toastNotifiedRef = useRef(false);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    // Check for browser support with fallbacks
    const SpeechRecognition = 
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Enhanced configuration for better compatibility
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;
      
      // Add browser-specific configurations
      if ('webkitSpeechRecognition' in window) {
        (recognition as any).webkit = true;
      }

      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your microphone.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }
        
        onErrorRef.current?.(errorMessage);
        if (!toastNotifiedRef.current) {
          toastNotifiedRef.current = true;
          toast({
            title: 'Voice Recognition Error',
            description: errorMessage,
            variant: 'destructive',
          });
          // Reset after a short delay to allow future errors
          setTimeout(() => { toastNotifiedRef.current = false; }, 1500);
        }
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      if (!unsupportedNotifiedRef.current) {
        unsupportedNotifiedRef.current = true;
        onErrorRef.current?.('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, onTranscript]);

  const startListening = () => {
    if (!isSupported) {
      // Silently no-op when unsupported to avoid toast spam in unsupported browsers
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        if (!toastNotifiedRef.current) {
          toastNotifiedRef.current = true;
          toast({
            title: 'Error',
            description: 'Failed to start voice recognition. Please try again.',
            variant: 'destructive',
          });
          setTimeout(() => { toastNotifiedRef.current = false; }, 1500);
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const abortListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
  };

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    abortListening
  };
};