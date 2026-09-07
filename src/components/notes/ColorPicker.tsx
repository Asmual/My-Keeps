'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { NOTE_COLORS } from '@/lib/constants';
import { NoteColorId } from '@/types/note';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  currentColor: NoteColorId;
  onSelectColor: (color: NoteColorId) => void;
  className?: string;
  buttonClassName?: string;
}

export function ColorPicker({
  currentColor,
  onSelectColor,
  className,
  buttonClassName,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={cn('relative inline-block', className)} ref={popoverRef}>
      <button
        type="button"
        title="Background options"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer',
          buttonClassName
        )}
      >
        <Palette className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 p-2.5 bg-white dark:bg-[#023859] rounded-2xl shadow-xl border border-[#A7EBF2] dark:border-[#26658C] grid grid-cols-6 gap-2 w-[230px] animate-in fade-in zoom-in-95 duration-150"
        >
          {Object.values(NOTE_COLORS).map((colorConfig) => {
            const isSelected = currentColor === colorConfig.id;
            return (
              <button
                key={colorConfig.id}
                type="button"
                title={colorConfig.name}
                onClick={() => {
                  onSelectColor(colorConfig.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-black/15 dark:border-white/20 relative cursor-pointer',
                  isSelected && 'ring-2 ring-[#54ACBF] ring-offset-1 dark:ring-offset-[#011C40]'
                )}
                style={{ backgroundColor: colorConfig.dotColor }}
              >
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-sm stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
