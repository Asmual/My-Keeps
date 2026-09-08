'use client';

import React, { useState } from 'react';
import { LockKeyhole, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<boolean>;
  noteTitle?: string;
}

export function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  noteTitle,
}: UnlockModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#011C40] border border-[#54ACBF]/40 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-[#011C40] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500 shrink-0">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Locked Note</h3>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70 mt-0.5 truncate max-w-[180px]">
                {noteTitle || 'Enter password to unlock'}
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
            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 animate-in fade-in duration-100">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
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
    </div>
  );
}
