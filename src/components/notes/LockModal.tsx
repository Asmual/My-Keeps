'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLock: (password: string) => Promise<void>;
  noteTitle?: string;
}

const emptySubscribe = () => () => {};

export function LockModal({
  isOpen,
  onClose,
  onLock,
  noteTitle,
}: LockModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      toast.error('Please enter a password');
      return;
    }
    if (trimmed.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLock(trimmed);
      toast.success('Note locked with password');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch {
      toast.error('Failed to lock note');
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
        className="my-auto w-full max-w-sm sm:max-w-md rounded-3xl bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-[#011C40] dark:text-white select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#54ACBF]/20 text-[#54ACBF] dark:text-[#A7EBF2] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Lock Note</h3>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70 mt-0.5 truncate max-w-[200px] sm:max-w-[260px]">
                {noteTitle ? `"${noteTitle}"` : 'Protect this note with a password'}
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

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-[#A7EBF2]/10 dark:bg-[#26658C]/20 p-3 rounded-2xl border border-[#54ACBF]/20">
          Once locked, the contents of this note will be hidden. You must enter this password (min 4 characters) to view or edit the note.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                New Password / PIN
              </label>
              <span className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                Min 4 characters
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 4 characters)..."
                minLength={4}
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password..."
              minLength={4}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54ACBF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#26658C]/60">
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
                  <span>Locking...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Note</span>
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
