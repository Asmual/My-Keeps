'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check } from 'lucide-react';
import { NOTE_COLORS } from '@/lib/constants';
import { NoteColorId } from '@/types/note';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  currentColor: NoteColorId;
  onSelectColor: (color: NoteColorId) => void;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
}

export function ColorPicker({
  currentColor,
  onSelectColor,
  className,
  buttonClassName,
  align = 'left',
  placement = 'bottom',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    const popoverWidth = 240;
    const popoverHeight = 150;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let showBelow = true;
    if (placement === 'top') {
      showBelow = spaceAbove < popoverHeight + 10 && spaceBelow >= spaceAbove;
    } else {
      showBelow = spaceBelow >= popoverHeight + 10 || spaceBelow >= spaceAbove;
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

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
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

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={buttonRef}
        type="button"
        title="Background options"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer shrink-0',
          buttonClassName
        )}
      >
        <Palette className="w-4 h-4" />
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
            className="z-[9999] p-2.5 bg-white dark:bg-[#023859] rounded-2xl shadow-2xl border border-[#A7EBF2] dark:border-[#26658C] grid grid-cols-6 gap-2 w-[240px] max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 duration-150"
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
                    isSelected &&
                      'ring-2 ring-[#54ACBF] ring-offset-1 dark:ring-offset-[#011C40]'
                  )}
                  style={{ backgroundColor: colorConfig.dotColor }}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-sm stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
