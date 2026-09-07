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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  initialAudioUrl?: string | null;
  onSaveAudio: (audioUrl: string | null) => void;
  onClose?: () => void;
}

export function VoiceRecorder({
  initialAudioUrl,
  onSaveAudio,
  onClose,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveAudio(audioUrl);
    if (onClose) onClose();
  };

  const handleRemove = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] space-y-3 animate-in fade-in select-none">
      <div className="flex items-center justify-between text-xs font-semibold text-[#011C40] dark:text-[#A7EBF2]">
        <span className="flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-[#54ACBF]" />
          Voice Memo
        </span>
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

      {/* Recording State */}
      {isRecording ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              {formatTime(recordingTime)}
            </span>
            <span className="text-xs text-rose-600/80 dark:text-rose-300">
              Recording audio...
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
      ) : audioUrl ? (
        /* Playback State */
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
                Voice Recording
              </p>
              <p className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                {isPlaying ? 'Playing...' : 'Click to listen'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRemove}
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
      ) : (
        /* Standby / Start Recording */
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={startRecording}
            className="flex-1 text-xs py-2 bg-[#023859] hover:bg-[#26658C] text-white flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4 text-[#A7EBF2]" />
            <span>Record Voice Note</span>
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
      )}
    </div>
  );
}
