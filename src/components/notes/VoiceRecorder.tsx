'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Check,
  X,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  initialAudioUrl?: string | null;
  initialTranscript?: string;
  onSaveAudio: (audioUrl: string | null, transcript?: string) => void;
  onClose?: () => void;
}

export function VoiceRecorder({
  initialAudioUrl,
  initialTranscript = '',
  onSaveAudio,
  onClose,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscriptBox, setShowTranscriptBox] = useState(Boolean(initialTranscript));
  const [hasCopied, setHasCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Speech Recognition for Voice-to-Text Transcription
  const {
    transcript,
    interimTranscript,
    language,
    setLanguage,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition({
    language: 'bn-BD',
    continuous: true,
  });

  // Populate initial transcript if provided
  useEffect(() => {
    if (initialTranscript && !transcript) {
      setTranscript(initialTranscript);
      setShowTranscriptBox(true);
    }
  }, [initialTranscript, setTranscript, transcript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopListening();
    };
  }, [stopListening]);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setAudioUrl(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowTranscriptBox(false);

      // Start capturing speech in background
      if (isSpeechSupported) {
        startListening();
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone. Please allow mic permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    stopListening();
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioElementRef.current = audio;
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Audio file must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAudioUrl(reader.result);
        setShowTranscriptBox(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert Recorded Audio to Text
  const handleConvertToText = async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);

    try {
      // 1. If speech was already recognized live, use it
      if (transcript && transcript.trim().length > 0) {
        setShowTranscriptBox(true);
        toast.success('অডিও সফলভাবে টেক্সটে রূপান্তরিত হয়েছে!');
        setIsTranscribing(false);
        return;
      }

      // 2. Otherwise call backend transcription API
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioUrl,
          language,
        }),
      });

      const data = await res.json();

      if (res.ok && data.text) {
        setTranscript(data.text);
        setShowTranscriptBox(true);
        toast.success('অডিও সফলভাবে টেক্সটে রূপান্তরিত হয়েছে!');
      } else {
        toast.error(data.error || 'অডিও রূপান্তর করা সম্ভব হয়নি');
      }
    } catch (err) {
      console.error('Error during audio transcription:', err);
      toast.error('অডিও রূপান্তর ব্যর্থ হয়েছে');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setHasCopied(true);
    toast.success('টেক্সট কপি করা হয়েছে');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleInsertToNote = () => {
    onSaveAudio(audioUrl, transcript.trim());
    toast.success('অডিও ও টেক্সট নোটে সেভ করা হয়েছে!');
    if (onClose) onClose();
  };

  const handleSave = () => {
    onSaveAudio(audioUrl, transcript.trim());
    if (onClose) onClose();
  };

  const handleRemove = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
    resetTranscript();
    setShowTranscriptBox(false);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] space-y-3 animate-in fade-in select-none">
      {/* Header with Title & Language Switcher */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#011C40] dark:text-[#A7EBF2]">
        <span className="flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-[#54ACBF]" />
          <span>ভয়েস মেমো (Voice Memo)</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Language Toggle for Speech Recognition */}
          <div className="flex items-center gap-1 bg-white/70 dark:bg-[#023859] p-0.5 rounded-lg border border-black/5 dark:border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setLanguage('bn-BD')}
              className={cn(
                'px-1.5 py-0.5 rounded-md transition-colors font-medium cursor-pointer',
                language === 'bn-BD'
                  ? 'bg-[#54ACBF] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#011C40]'
              )}
              title="Speak in Bengali"
            >
              🇧🇩 বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en-US')}
              className={cn(
                'px-1.5 py-0.5 rounded-md transition-colors font-medium cursor-pointer',
                language === 'en-US'
                  ? 'bg-[#54ACBF] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#011C40]'
              )}
              title="Speak in English"
            >
              🇺🇸 English
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recording State */}
      {isRecording ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                {formatTime(recordingTime)}
              </span>
              <span className="text-xs text-rose-600/80 dark:text-rose-300 flex items-center gap-1.5">
                <span>রেকর্ডিং চলছে...</span>
                <span className="text-[11px] opacity-70">
                  ({language === 'bn-BD' ? 'বাংলা' : 'English'})
                </span>
              </span>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={stopRecording}
              className="text-xs px-3 py-1 flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </Button>
          </div>

          {/* Real-time hint while recording */}
          <div className="px-2 py-1 text-[11px] text-slate-500 dark:text-[#A7EBF2]/70 flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-[#54ACBF] animate-pulse" />
            <span>
              কথা বলা শেষ হলে Stop বাটনে ক্লিক করে টেক্সটে কনভার্ট করতে পারবেন।
            </span>
          </div>
        </div>
      ) : audioUrl ? (
        /* Playback & Conversion Section */
        <div className="space-y-2.5">
          {/* Audio Player Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#023859] border border-slate-200 dark:border-[#26658C]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlayAudio}
                className="p-2 rounded-full bg-[#54ACBF] text-white hover:bg-[#26658C] transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
              <div className="text-xs">
                <p className="font-semibold text-[#011C40] dark:text-white">
                  Voice Memo
                </p>
                <p className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                  {isPlaying ? 'Playing...' : 'Click to listen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                title="Remove voice memo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSave}
                className="text-xs px-3 py-1 font-semibold"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Done
              </Button>
            </div>
          </div>

          {/* On-Demand Audio to Text Conversion Button */}
          {!showTranscriptBox ? (
            <button
              type="button"
              onClick={handleConvertToText}
              disabled={isTranscribing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-linear-to-r from-[#023859] to-[#26658C] hover:from-[#26658C] hover:to-[#54ACBF] text-white text-xs font-semibold shadow-md transition-all cursor-pointer hover:scale-[1.01]"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#A7EBF2]" />
                  <span>অডিও থেকে টেক্সট রূপান্তর হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#A7EBF2]" />
                  <span>অডিও কনভার্ট করে টেক্সট তৈরি করুন (Convert to Text)</span>
                </>
              )}
            </button>
          ) : (
            /* Converted Text Box */
            <div className="p-3 rounded-xl bg-white dark:bg-[#023859]/50 border border-[#A7EBF2]/40 dark:border-[#26658C] text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#011C40] dark:text-[#A7EBF2] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#54ACBF]" />
                  রূপান্তরিত টেক্সট (Converted Text):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="text-[10px] text-slate-500 hover:text-[#023859] dark:hover:text-white flex items-center gap-1"
                  >
                    {hasCopied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{hasCopied ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertToText}
                    disabled={isTranscribing}
                    className="text-[10px] text-[#54ACBF] hover:underline"
                  >
                    পুনরায় কনভার্ট
                  </button>
                </div>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#54ACBF] resize-y"
                placeholder="Transcribed text will appear here..."
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-slate-400 dark:text-[#A7EBF2]/60">
                  💡 এই লেখাটি দিয়ে সার্চ করলেও নোটটি খুঁজে পাওয়া যাবে।
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleInsertToNote}
                  className="text-xs px-2.5 py-1 bg-[#023859] hover:bg-[#26658C] text-white flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>নোটে যোগ করুন</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standby / Start Recording */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={startRecording}
              className="flex-1 text-xs py-2 bg-[#023859] hover:bg-[#26658C] text-white flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 text-[#A7EBF2]" />
              <span>Record Voice Memo</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs py-2 px-3 border border-slate-200 dark:border-[#26658C]"
              title="Upload audio file"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-[#54ACBF]" />
              Upload
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleRemove}
        title="Delete voice memo?"
        description="Are you sure you want to delete this recorded voice memo?"
        confirmText="Delete Voice Memo"
        variant="danger"
      />
    </div>
  );
}
