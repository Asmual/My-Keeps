'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  ArrowUpToLine,
  ArrowDownToLine,
  RefreshCw,
  Zap,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle?: string;
  noteContent: string;
  onInsertSummary: (formattedSummaryHtml: string, mode: 'prepend' | 'append') => void;
}

export function AISummaryModal({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  onInsertSummary,
}: AISummaryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);
  const [model, setModel] = useState<string>('');
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!noteContent || noteContent.trim().length < 15) {
      setError('Note content is too short to summarize (at least 15 characters needed).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteContent,
          title: noteTitle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setBullets(data.bullets || []);
      setModel(data.model || 'AI');
      setIsFallback(Boolean(data.isFallback));
      setFallbackMessage(data.message || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating summary';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [noteContent, noteTitle]);

  // Auto-fetch summary when opened
  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    } else {
      setBullets([]);
      setError(null);
      setHasCopied(false);
    }
  }, [isOpen, fetchSummary]);

  if (!isOpen) return null;

  // Format bullets into rich HTML block for insertion
  const formatAsHtml = () => {
    const listItems = bullets.map((b) => `<li>${b}</li>`).join('');
    return `<blockquote><strong>✨ AI Summary:</strong><ul>${listItems}</ul></blockquote><p><br></p>`;
  };

  const handleCopy = () => {
    if (bullets.length === 0) return;
    const plainTextSummary = `✨ AI Summary:\n${bullets.map((b) => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(plainTextSummary);
    setHasCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleInsertTop = () => {
    onInsertSummary(formatAsHtml(), 'prepend');
    toast.success('Summary inserted at the top!');
    onClose();
  };

  const handleInsertBottom = () => {
    onInsertSummary(formatAsHtml(), 'append');
    toast.success('Summary appended at the bottom!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#011C40] border border-[#54ACBF]/40 dark:border-[#26658C] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-[#A7EBF2]/20 dark:bg-[#023859]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-linear-to-tr from-amber-400 to-rose-500 text-white shadow-sm">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#011C40] dark:text-white flex items-center gap-2">
                <span>AI Note Summary</span>
                {model && (
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#54ACBF]/20 text-[#023859] dark:text-[#A7EBF2] border border-[#54ACBF]/30">
                    {model === 'gemini-1.5-flash' ? 'Gemini 1.5' : 'Smart AI'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70">
                ৩-৪টি প্রধান বুলেট পয়েন্টে গুরুত্বপূর্ণ তথ্যের সারসংক্ষেপ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-3 border-[#54ACBF]/30 border-t-[#54ACBF] animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#011C40] dark:text-white">
                  স্মার্ট এআই সামারি তৈরি হচ্ছে...
                </p>
                <p className="text-xs text-slate-400 dark:text-[#A7EBF2]/60 mt-0.5">
                  নোটের মূল পয়েন্টগুলো বিশ্লেষণ করা হচ্ছে
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchSummary}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> আবার চেষ্টা করুন
              </Button>
            </div>
          ) : bullets.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#023859]/30 border border-slate-200/80 dark:border-[#26658C]/50 space-y-2.5">
                {bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-[#54ACBF] mt-2 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {fallbackMessage && isFallback && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>{fallbackMessage}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-slate-50 dark:bg-[#011C40] border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchSummary}
              disabled={isLoading}
              className="text-xs px-2.5 py-1.5 text-slate-600 dark:text-[#A7EBF2]"
              title="Regenerate summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              পুনরায় সামারি
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              disabled={isLoading || bullets.length === 0}
              className="text-xs px-2.5 py-1.5 text-slate-600 dark:text-[#A7EBF2]"
              title="Copy summary"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  কপি হয়েছে
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  কপি করুন
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleInsertBottom}
              disabled={isLoading || bullets.length === 0}
              className="text-xs px-3 py-1.5 flex items-center gap-1.5 border-[#54ACBF] text-[#023859] dark:text-[#A7EBF2]"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              নিচে যোগ করুন
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleInsertTop}
              disabled={isLoading || bullets.length === 0}
              className="text-xs px-3.5 py-1.5 flex items-center gap-1.5 bg-[#023859] hover:bg-[#26658C] text-white"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
              উপরে যোগ করুন
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
