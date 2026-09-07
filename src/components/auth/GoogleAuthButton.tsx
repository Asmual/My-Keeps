'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
  text?: string;
  onError?: (error: string) => void;
  className?: string;
}

export function GoogleAuthButton({
  text = 'Continue with Google',
  onError,
  className = '',
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (res?.error) {
        const errorMsg = res.error.message || 'Failed to sign in with Google';
        toast.error(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      const msg = (err as Error)?.message || 'Failed to sign in with Google. Please try again.';
      toast.error(msg);
      if (onError) onError(msg);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={cn(
        'w-full h-11 px-4 rounded-xl flex items-center justify-center gap-3 bg-white dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] hover:border-[#54ACBF] dark:hover:border-[#54ACBF] hover:bg-slate-50 dark:hover:bg-[#023859]/60 text-slate-700 dark:text-slate-100 font-medium text-sm transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#54ACBF]" />
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
          />
        </svg>
      )}
      <span>{isLoading ? 'Connecting to Google...' : text}</span>
    </button>
  );
}
