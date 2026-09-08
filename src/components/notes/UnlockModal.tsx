'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { LockKeyhole, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<boolean>;
  noteTitle?: string;
}

const emptySubscribe = () => () => {};

export function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  noteTitle,
}: UnlockModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMessage('Please enter the password');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const success = await onUnlock(trimmed);
      if (success) {
        setPassword('');
        setErrorMessage('');
        onClose();
      } else {
        setErrorMessage('Incorrect password. Please try again.');
        toast.error('Incorrect password');
      }
    } catch {
      setErrorMessage('Failed to unlock note. Try again.');
      toast.error('Failed to unlock note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#011C40]/65 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      style={{ minHeight: '100dvh' }}
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-sm rounded-3xl bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-[#011C40] dark:text-white select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Locked Note</h3>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70 mt-0.5 truncate max-w-[190px]">
                {noteTitle || 'Enter password to unlock'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
              Enter Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Password..."
                autoFocus
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54ACBF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 animate-in fade-in duration-100">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#26658C]/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <LockKeyhole className="w-3.5 h-3.5" />
                  <span>Unlock & View</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
