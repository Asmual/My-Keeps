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
  onResult?: (text: string) => void;
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
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const resultItem = event.results[i];
        if (resultItem.isFinal) {
          final += resultItem[0].transcript + ' ';
        } else {
          interim += resultItem[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => {
          const updated = (prev + ' ' + final).trim();
          if (onResultRef.current) {
            onResultRef.current(updated);
          }
          return updated;
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore 'no-speech' or 'aborted' as routine events
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission was denied. Please allow mic access.');
        setIsListening(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition event warning:', event.error);
      }
    };

    recognition.onend = () => {
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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const instance = initRecognition();
      if (instance) {
        recognitionRef.current = instance;
        instance.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, [initRecognition, isSupported]);

  const stopListening = useCallback(() => {
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
