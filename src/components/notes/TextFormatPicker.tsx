'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  RemoveFormatting,
  Highlighter,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextFormatPickerProps {
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
}

const TEXT_COLORS = [
  { name: 'Default', hex: 'inherit' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Slate', hex: '#64748B' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FEF08A' },
  { name: 'Green', hex: '#BBF7D0' },
  { name: 'Cyan', hex: '#A7F3D0' },
  { name: 'Pink', hex: '#FBCFE8' },
  { name: 'Orange', hex: '#FED7AA' },
];

export function TextFormatPicker({
  className,
  buttonClassName,
  align = 'left',
  placement = 'top',
}: TextFormatPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'style' | 'color'>('style');
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 270;
    const popoverHeight = 240;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let showBelow = false;
    if (placement === 'bottom') {
      showBelow = spaceBelow >= popoverHeight + 10 || spaceBelow >= spaceAbove;
    } else {
      showBelow = spaceAbove < popoverHeight + 10 && spaceBelow >= spaceAbove;
    }

    const top = showBelow
      ? Math.min(rect.bottom + 6, window.innerHeight - popoverHeight - 12)
      : Math.max(12, rect.top - popoverHeight - 6);

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - popoverWidth;
    }
    // Strict screen bounds clamping
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({ top, left });
  }, [align, placement]);

  // Close on outside click, window resize or scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const triggerInputEvent = () => {
    const el = document.querySelector('[contenteditable="true"]');
    if (el) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (editor) {
      editor.focus();
    }
    document.execCommand(command, false, value);
    triggerInputEvent();
  };

  const applyHeading = (tag: 'h1' | 'h2' | 'p') => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (editor) {
      editor.focus();
    }
    document.execCommand('formatBlock', false, `<${tag}>`);
    triggerInputEvent();
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Google Keep 'A' with underline button */}
      <button
        ref={buttonRef}
        type="button"
        title="Text formatting"
        aria-label="Text formatting options"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer flex items-center justify-center shrink-0',
          isOpen && 'bg-[#54ACBF] text-white dark:bg-[#54ACBF] dark:text-[#011C40] shadow-xs',
          buttonClassName
        )}
      >
        <span className="font-serif font-black text-sm leading-none border-b-2 border-current px-0.5 inline-block">
          A
        </span>
      </button>

      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
            className="z-[9999] p-2.5 bg-white dark:bg-[#023859] rounded-2xl shadow-2xl border border-[#A7EBF2] dark:border-[#26658C] w-[270px] max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 duration-150 select-none text-xs"
          >
          {/* Header tabs: Styles vs Colors */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#011C40] p-0.5 rounded-xl">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('style')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'style'
                    ? 'bg-white dark:bg-[#023859] text-[#011C40] dark:text-[#A7EBF2] shadow-xs'
                    : 'text-slate-500 dark:text-[#A7EBF2]/70 hover:text-[#011C40] dark:hover:text-white'
                )}
              >
                Style
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('color')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'color'
                    ? 'bg-white dark:bg-[#023859] text-[#011C40] dark:text-[#A7EBF2] shadow-xs'
                    : 'text-slate-500 dark:text-[#A7EBF2]/70 hover:text-[#011C40] dark:hover:text-white'
                )}
              >
                Color
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeTab === 'style' ? (
            <div className="space-y-2.5">
              {/* Headings */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-[#A7EBF2]/60 uppercase tracking-wider block mb-1">
                  Headings
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeading('h1')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#011C40] hover:bg-[#54ACBF]/20 text-[#011C40] dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Large Heading (H1)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                    <span>H1</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeading('h2')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#011C40] hover:bg-[#54ACBF]/20 text-[#011C40] dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Medium Heading (H2)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    <span>H2</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeading('p')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#011C40] hover:bg-[#54ACBF]/20 text-[#011C40] dark:text-white font-normal text-xs transition-colors flex items-center justify-center cursor-pointer"
                    title="Normal Body Text"
                  >
                    Normal
                  </button>
                </div>
              </div>

              {/* Inline Styles */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-[#A7EBF2]/60 uppercase tracking-wider block mb-1">
                  Format
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#011C40] p-1 rounded-xl">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('bold')}
                    className="flex-1 p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#023859] text-[#011C40] dark:text-white transition-colors flex items-center justify-center cursor-pointer"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('italic')}
                    className="flex-1 p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#023859] text-[#011C40] dark:text-white transition-colors flex items-center justify-center cursor-pointer"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('underline')}
                    className="flex-1 p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#023859] text-[#011C40] dark:text-white transition-colors flex items-center justify-center cursor-pointer"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('strikeThrough')}
                    className="flex-1 p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#023859] text-[#011C40] dark:text-white transition-colors flex items-center justify-center cursor-pointer"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('removeFormat')}
                    className="flex-1 p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#023859] text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                    title="Clear Formatting"
                  >
                    <RemoveFormatting className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Text Colors */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-[#A7EBF2]/60 uppercase tracking-wider block mb-1">
                  Text Color
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {TEXT_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat('foreColor', col.hex)}
                      className="w-full h-7 rounded-lg border border-black/10 dark:border-white/15 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: col.hex === 'inherit' ? '#e2e8f0' : col.hex,
                      }}
                      title={col.name}
                    >
                      {col.hex === 'inherit' && (
                        <span className="text-[9px] font-bold text-slate-700">Auto</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlighter Marker */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-[#A7EBF2]/60 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Highlighter className="w-3 h-3 text-amber-500" />
                  Highlight Marker
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat('hiliteColor', h.hex)}
                      className="w-full h-6 rounded-lg border border-black/10 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-xs"
                      style={{ backgroundColor: h.hex }}
                      title={h.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
