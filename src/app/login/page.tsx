'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password: password.trim(),
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid email or password.');
      } else {
        toast.success('Welcome back to Luna!');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Luna ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#54ACBF]/15 dark:bg-[#54ACBF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#023859]/20 dark:bg-[#26658C]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Notes link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#011C40] dark:text-[#A7EBF2]/70 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#54ACBF]" />
          <span>Back to Notes</span>
        </Link>
      </div>

      {/* Main Login Card (Luna Elevated Surface) */}
      <div className="w-full max-w-md bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/images/MKlogo.png"
              alt="My Keeps Logo"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-contain shadow-md shadow-slate-900/20 hover:scale-105 transition-transform"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#011C40] dark:text-white">
            Welcome to My Keeps
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#A7EBF2]/70 mt-1">
            Sign in to access and sync your notes
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#011C40] dark:text-[#A7EBF2] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54ACBF] pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] focus:border-[#54ACBF] text-[#011C40] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#011C40] dark:text-[#A7EBF2]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54ACBF] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] focus:border-[#54ACBF] text-[#011C40] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#011C40] dark:hover:text-[#A7EBF2] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Luna Signature Dark Blue primary button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full h-11 mt-2 font-semibold bg-[#023859] hover:bg-[#26658C] text-white shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#26658C]/60 text-center text-xs text-slate-500 dark:text-[#A7EBF2]/70 space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-[#54ACBF] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p>
            <Link
              href="/"
              className="text-slate-400 hover:text-[#011C40] dark:hover:text-white hover:underline"
            >
              Continue exploring as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
