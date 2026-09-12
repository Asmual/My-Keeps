'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Heading1,
  Heading2,
  Quote,
  Palette,
  RemoveFormatting,
  ChevronDown,
  X,
  Mic,
  MicOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  isFullscreen?: boolean;
  minHeightClass?: string;
  showDictation?: boolean;
}

// Curated Vibrant Text Colors
const TEXT_COLORS = [
  { name: 'Default', hex: 'inherit' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Slate', hex: '#64748B' },
  { name: 'Dark', hex: '#0F172A' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FEF08A' },
  { name: 'Green', hex: '#BBF7D0' },
  { name: 'Cyan', hex: '#A7F3D0' },
  { name: 'Pink', hex: '#FBCFE8' },
  { name: 'Orange', hex: '#FED7AA' },
  { name: 'Purple', hex: '#E9D5FF' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Note details...',
  isFullscreen = false,
  minHeightClass,
  showDictation = true,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Floating Bubble Toolbar Position
  const [floatingBar, setFloatingBar] = useState<{
    visible: boolean;
    top: number;
    left: number;
  }>({ visible: false, top: 0, left: 0 });

  // Speech Dictation Hook
  const {
    isListening: isDictating,
    language: dictationLang,
    setLanguage: setDictationLang,
    startListening: startDictation,
    stopListening: stopDictation,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition({
    language: 'bn-BD',
    continuous: true,
    onResult: (spokenText) => {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertText', false, ' ' + spokenText);
        if (editorRef.current) {
          const html = editorRef.current.innerHTML;
          onChange(html);
        }
      }
    },
  });

  // Popover menus
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#EF4444');

  // Sync incoming value to contentEditable div without losing cursor
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Handle Input in contentEditable
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If only empty <br> or whitespace left, normalize to empty
      if (html === '<br>' || html === '<div><br></div>' || html.trim() === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  }, [onChange]);

  // Track selection and calculate floating bar coordinates
  const updateFloatingBar = useCallback(() => {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();
    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount === 0 ||
      !editorRef.current ||
      !containerRef.current
    ) {
      setFloatingBar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      setIsColorMenuOpen(false);
      setIsHighlightMenuOpen(false);
      return;
    }

    // Ensure selection is inside this editor
    if (!editorRef.current.contains(selection.anchorNode)) {
      setFloatingBar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setFloatingBar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Position centered directly above the selection
      const top = Math.max(10, rect.top - containerRect.top - 48);
      const left = Math.max(
        100,
        Math.min(
          containerRect.width - 120,
          rect.left - containerRect.left + rect.width / 2
        )
      );

      setFloatingBar({
        visible: true,
        top,
        left,
      });
    } catch {
      // Ignore positioning errors on detached ranges
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Slight debounce for smooth selection
      requestAnimationFrame(updateFloatingBar);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateFloatingBar]);

  // Formatting Command Executor
  const applyFormat = (command: string, arg: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
    updateFloatingBar();
  };

  // Toggle Headings
  const applyHeading = (level: 'h1' | 'h2') => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const parentNode = selection.anchorNode?.parentElement;
    const currentTag = parentNode?.tagName.toLowerCase();

    if (currentTag === level) {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${level}>`);
    }
    handleInput();
    updateFloatingBar();
  };

  // Toggle Blockquote
  const applyQuote = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const parentNode = selection.anchorNode?.parentElement;
    if (parentNode?.tagName.toLowerCase() === 'blockquote') {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, '<blockquote>');
    }
    handleInput();
    updateFloatingBar();
  };

  // Text Color
  const applyTextColor = (hex: string) => {
    editorRef.current?.focus();
    if (hex === 'inherit') {
      document.execCommand('removeFormat', false);
    } else {
      document.execCommand('foreColor', false, hex);
    }
    setIsColorMenuOpen(false);
    handleInput();
  };

  // Highlight Marker
  const applyHighlight = (hex: string) => {
    editorRef.current?.focus();
    document.execCommand('hiliteColor', false, hex);
    setIsHighlightMenuOpen(false);
    handleInput();
  };

  const defaultMinHeight = isFullscreen
    ? 'min-h-[460px] sm:min-h-[520px]'
    : 'min-h-[220px] sm:min-h-[280px]';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ========================================================================= */}
      {/* 1. TOP QUICK FORMAT TOOLBAR (Always accessible for fast formatting)       */}
      {/* ========================================================================= */}
      <div
        className="flex items-center flex-wrap gap-1 pb-2 mb-2 border-b border-black/5 dark:border-white/10 text-xs text-[#011C40] dark:text-[#A7EBF2]"
        onMouseDown={(e) => e.preventDefault()} // Keep focus inside editor
      >
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-black/10 dark:bg-white/15 mx-1" />

        <button
          type="button"
          onClick={() => applyHeading('h1')}
          className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 font-bold transition-colors cursor-pointer"
          title="Large Heading (H1)"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => applyHeading('h2')}
          className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 font-semibold transition-colors cursor-pointer"
          title="Medium Heading (H2)"
        >
          H2
        </button>

        <button
          type="button"
          onClick={applyQuote}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Quote Block"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-black/10 dark:bg-white/15 mx-1" />

        {/* Top Bar Text Color Palette Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsColorMenuOpen((prev) => !prev);
              setIsHighlightMenuOpen(false);
            }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer',
              isColorMenuOpen
                ? 'bg-[#54ACBF]/20 text-[#023859] dark:text-[#A7EBF2]'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            )}
            title="Text Color Palette"
          >
            <Palette className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[11px] font-medium hidden sm:inline">Color</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isColorMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 p-2.5 rounded-2xl bg-white dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl w-48 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5 dark:border-white/10">
                <span className="text-[11px] font-semibold text-[#011C40] dark:text-white">
                  Text Color
                </span>
                <button
                  type="button"
                  onClick={() => setIsColorMenuOpen(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pb-2">
                {TEXT_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => applyTextColor(col.hex)}
                    className="w-8 h-8 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: col.hex === 'inherit' ? '#e2e8f0' : col.hex,
                    }}
                    title={col.name}
                  >
                    {col.hex === 'inherit' && (
                      <span className="text-[9px] font-bold text-slate-600">R</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/10">
                <span className="text-[10px] text-slate-500 dark:text-[#A7EBF2]/70">Custom:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => applyTextColor(customColor)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-[#023859] hover:bg-[#26658C] text-white rounded-md cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Bar Highlighter Marker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsHighlightMenuOpen((prev) => !prev);
              setIsColorMenuOpen(false);
            }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer',
              isHighlightMenuOpen
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            )}
            title="Highlight Marker"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-medium hidden sm:inline">Highlight</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isHighlightMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 p-2.5 rounded-2xl bg-white dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl w-44 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5 dark:border-white/10">
                <span className="text-[11px] font-semibold text-[#011C40] dark:text-white">
                  Highlight Marker
                </span>
                <button
                  type="button"
                  onClick={() => setIsHighlightMenuOpen(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => applyHighlight(h.hex)}
                    className="h-7 rounded-lg border border-black/10 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-xs text-[10px] font-medium text-slate-800"
                    style={{ backgroundColor: h.hex }}
                    title={h.name}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voice Dictation (ভয়েস দিয়ে লিখুন) */}
        {showDictation && isSpeechSupported && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => {
                if (isDictating) {
                  stopDictation();
                } else {
                  startDictation();
                }
              }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium',
                isDictating
                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                  : 'hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] text-slate-600 dark:text-[#A7EBF2]'
              )}
              title={isDictating ? 'Stop Voice Dictation' : 'Start Voice Dictation (ভয়েস দিয়ে লিখুন)'}
            >
              {isDictating ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline font-bold">Dictating...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#54ACBF]" />
                  <span className="text-[10px] hidden sm:inline">ভয়েস টাইপিং</span>
                </>
              )}
            </button>

            {isDictating && (
              <button
                type="button"
                onClick={() =>
                  setDictationLang(dictationLang === 'bn-BD' ? 'en-US' : 'bn-BD')
                }
                className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono hover:bg-black/20 text-[#011C40] dark:text-white"
                title="Toggle language (বাংলা / English)"
              >
                {dictationLang === 'bn-BD' ? '🇧🇩 BN' : '🇺🇸 EN'}
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => applyFormat('removeFormat')}
          className={cn(
            'p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer',
            (!showDictation || !isSpeechSupported) && 'ml-auto'
          )}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. MINI FLOATING SELECTION BUBBLE TOOLBAR (Appears above selected text)   */}
      {/* ========================================================================= */}
      {floatingBar.visible && (
        <div
          style={{
            top: `${floatingBar.top}px`,
            left: `${floatingBar.left}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.preventDefault()} // Keeps text selected on click
          className="absolute z-50 flex items-center gap-1 bg-white/95 dark:bg-[#011C40]/95 backdrop-blur-md border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl rounded-2xl px-2 py-1 text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-1.5 rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-1.5 rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className="p-1.5 rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => applyHighlight('#FEF08A')}
            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-500 transition-colors cursor-pointer"
            title="Highlight Marker"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-black/10 dark:bg-white/15" />

          <button
            type="button"
            onClick={() => applyHeading('h1')}
            className="px-1.5 py-1 text-[11px] font-bold rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Heading 1"
          >
            H1
          </button>

          <button
            type="button"
            onClick={() => applyHeading('h2')}
            className="px-1.5 py-1 text-[11px] font-semibold rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Heading 2"
          >
            H2
          </button>

          <button
            type="button"
            onClick={applyQuote}
            className="p-1.5 rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] transition-colors cursor-pointer"
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-black/10 dark:bg-white/15" />

          {/* Color palette toggle on floating bar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColorMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-[#A7EBF2]/30 dark:hover:bg-[#023859] text-rose-500 transition-colors cursor-pointer"
              title="Text Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTENTEDITABLE WYSIWYG EDITOR CANVAS                                   */}
      {/* ========================================================================= */}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyUp={updateFloatingBar}
        onMouseUp={updateFloatingBar}
        className={cn(
          'w-full min-w-0 bg-transparent focus:outline-none leading-relaxed transition-all break-words text-[#011C40] dark:text-slate-100',
          minHeightClass || defaultMinHeight,
          isFullscreen ? 'text-base' : 'text-sm sm:text-base',
          // Rich text element styles
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#011C40] dark:[&_h1]:text-white [&_h1]:my-2',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#011C40] dark:[&_h2]:text-white [&_h2]:my-1.5',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-[#54ACBF] [&_blockquote]:pl-3.5 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-[#A7EBF2]',
          '[&_mark]:bg-amber-200/90 dark:[&_mark]:bg-amber-300 [&_mark]:text-slate-900 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded',
          // Placeholder pseudo element
          'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-[#A7EBF2]/50 empty:before:pointer-events-none'
        )}
      />
    </div>
  );
}
