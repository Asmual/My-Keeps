'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div className={cn('relative inline-block', isOpen && 'z-50', className)} ref={popoverRef}>
      {/* Google Keep 'A' with underline button */}
      <button
        type="button"
        title="Text formatting"
        aria-label="Text formatting options"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer flex items-center justify-center',
          isOpen && 'bg-[#54ACBF] text-white dark:bg-[#54ACBF] dark:text-[#011C40] shadow-xs',
          buttonClassName
        )}
      >
        <span className="font-serif font-black text-sm leading-none border-b-2 border-current px-0.5 inline-block">
          A
        </span>
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute z-[70] p-2.5 bg-white dark:bg-[#023859] rounded-2xl shadow-2xl border border-[#A7EBF2] dark:border-[#26658C] w-[270px] max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-in-95 duration-150 select-none text-xs',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'left' ? 'left-0' : 'right-0'
          )}
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
        </div>
      )}
    </div>
  );
}
