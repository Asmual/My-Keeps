'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type {
  SpeechRecognitionInstance,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  IWindowWithSpeech,
} from '@/types/speech';

export type SpeechLanguage = 'bn-BD' | 'en-US';

interface UseSpeechRecognitionOptions {
  language?: SpeechLanguage;
  continuous?: boolean;
  onResult?: (newChunk: string, fullTranscript: string) => void;
}

export function useSpeechRecognition({
  language = 'bn-BD',
  continuous = true,
  onResult,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentLang, setCurrentLang] = useState<SpeechLanguage>(language);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isIntentionallyListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindowWithSpeech;
      const SpeechRecognitionClass =
        win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setIsSupported(false);
      }
    }
  }, []);

  // Initialize SpeechRecognition instance
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognitionClass =
      win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = currentLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const resultItem = event.results[i];
        if (resultItem.isFinal) {
          finalChunk += resultItem[0].transcript + ' ';
        } else {
          interim += resultItem[0].transcript;
        }
      }

      if (finalChunk.trim()) {
        const trimmedChunk = finalChunk.trim();
        setTranscript((prev) => {
          const updated = (prev ? prev + ' ' : '') + trimmedChunk;
          if (onResultRef.current) {
            onResultRef.current(trimmedChunk, updated);
          }
          return updated;
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        isIntentionallyListeningRef.current = false;
        toast.error('Microphone permission was denied. Please allow mic access.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Chromium stops on silence/pauses - isIntentionallyListeningRef will auto-restart it
      } else if (event.error !== 'aborted') {
        console.warn('Speech recognition event warning:', event.error);
      }
    };

    recognition.onend = () => {
      // If user still wants to listen, auto-restart so silence/pauses don't terminate listening
      if (isIntentionallyListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          setTimeout(() => {
            if (isIntentionallyListeningRef.current) {
              try {
                recognition.start();
              } catch {
                // Ignore transient restart errors
              }
            }
          }, 300);
          return;
        }
      }
      setIsListening(false);
      setInterimTranscript('');
    };

    return recognition;
  }, [continuous, currentLang]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error(
        'Voice-to-text is not supported in this browser. Please try Google Chrome or Microsoft Edge.'
      );
      return;
    }

    try {
      isIntentionallyListeningRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const instance = initRecognition();
      if (instance) {
        recognitionRef.current = instance;
        instance.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      isIntentionallyListeningRef.current = false;
      setIsListening(false);
    }
  }, [initRecognition, isSupported]);

  const stopListening = useCallback(() => {
    isIntentionallyListeningRef.current = false;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch {
      // Ignore stop errors if already stopped
    } finally {
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const changeLanguage = useCallback(
    (newLang: SpeechLanguage) => {
      setCurrentLang(newLang);
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          startListening();
        }, 150);
      }
    },
    [isListening, startListening]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    language: currentLang,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage: changeLanguage,
    setTranscript,
  };
}
