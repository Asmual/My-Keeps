'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLock: (password: string) => Promise<void>;
  noteTitle?: string;
}

export function LockModal({
  isOpen,
  onClose,
  onLock,
  noteTitle,
}: LockModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      toast.error('Please enter a password');
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#011C40] border border-[#54ACBF]/30 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-[#011C40] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#54ACBF]/15 text-[#54ACBF] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Lock Note</h3>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70 mt-0.5">
                {noteTitle ? `"${noteTitle}"` : 'Protect this note with a password'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-[#A7EBF2]/10 dark:bg-[#26658C]/20 p-3 rounded-xl border border-[#54ACBF]/20">
          Once locked, the contents of this note will be hidden. You must enter this password to view or edit the note.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
              New Password / PIN
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                className="w-full px-3.5 py-2 pr-10 text-sm rounded-xl bg-slate-50 dark:bg-[#022859] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54ACBF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
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
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#022859] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54ACBF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
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
              className="flex items-center gap-1.5 px-4"
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
    </div>
  );
}
