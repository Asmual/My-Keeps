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
          'p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer',
          buttonClassName
        )}
      >
        <Palette className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 p-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-6 gap-1.5 w-[220px] animate-in fade-in zoom-in-95 duration-150"
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
                  'w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-black/10 dark:border-white/15 relative cursor-pointer',
                  isSelected && 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-neutral-900'
                )}
                style={{ backgroundColor: colorConfig.dotColor }}
              >
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-neutral-800 drop-shadow-sm stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
