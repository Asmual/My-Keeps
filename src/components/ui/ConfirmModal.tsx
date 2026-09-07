'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const emptySubscribe = () => () => {};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#011C40]/65 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      style={{ minHeight: '100dvh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl animate-in zoom-in-95 duration-150 select-none space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'p-2.5 rounded-2xl shrink-0',
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
            )}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base font-bold text-[#011C40] dark:text-white leading-snug">
                {title}
              </h3>
            )}
            <p className={cn("text-slate-600 dark:text-[#A7EBF2]/90 leading-relaxed font-medium", title ? "text-xs mt-1" : "text-sm")}>
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#26658C]/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs px-4"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className="text-xs px-5 font-semibold"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
