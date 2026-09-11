'use client';

import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { X, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { Button } from '@/components/ui/Button';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
}

export function AuthPromptModal({
  isOpen,
  onClose,
  actionTitle = 'create notes',
}: AuthPromptModalProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isOpen || !isMounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#011C40] border border-[#A7EBF2]/80 dark:border-[#26658C] p-6 sm:p-8 shadow-2xl shadow-slate-900/30 dark:shadow-black/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#023859] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3.5 relative">
            <Image
              src="/images/MK-logo.png"
              alt="My Keeps Logo"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-contain shadow-md shadow-slate-900/10 hover:scale-105 transition-transform"
              priority
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-[#54ACBF] text-white rounded-full shadow-sm">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#011C40] dark:text-white">
            Sign In to My Keeps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7EBF2]/80 mt-1.5 max-w-xs mx-auto">
            Please sign in to {actionTitle} and keep your notes securely synced under your personal account.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="mb-6 space-y-2.5 bg-slate-50 dark:bg-[#023859]/60 p-3.5 rounded-2xl border border-slate-100 dark:border-[#26658C]/40 text-xs text-slate-600 dark:text-[#A7EBF2]/90">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#54ACBF] shrink-0" />
            <span>Private & isolated to your Gmail account</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#54ACBF] shrink-0" />
            <span>Encrypted note locking & password protection</span>
          </div>
        </div>

        {/* Google One-Click Sign In */}
        <div className="mb-4">
          <GoogleAuthButton text="Continue with Google" />
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200 dark:border-[#26658C]/60" />
          <span className="px-3 text-[11px] uppercase font-semibold text-slate-400 dark:text-[#A7EBF2]/60">
            or
          </span>
          <div className="flex-1 border-t border-slate-200 dark:border-[#26658C]/60" />
        </div>

        {/* Email Login & Register */}
        <div className="space-y-2.5">
          <Link href="/login" onClick={onClose} className="block w-full">
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl text-xs font-semibold border-slate-300 dark:border-[#26658C] hover:bg-slate-50 dark:hover:bg-[#023859]"
            >
              Sign In with Email & Password
            </Button>
          </Link>

          <div className="text-center pt-1">
            <span className="text-xs text-slate-500 dark:text-[#A7EBF2]/70">
              Don&apos;t have an account?{' '}
            </span>
            <Link
              href="/register"
              onClick={onClose}
              className="text-xs font-semibold text-[#54ACBF] hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
