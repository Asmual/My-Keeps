import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54ACBF]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      // Primary Action: Deep Aqua Blue (#023859 hover to #26658C with white text #FFFFFF in both light & dark modes)
      primary:
        'bg-[#023859] hover:bg-[#26658C] text-white shadow-sm hover:shadow active:scale-[0.98] border border-[#26658C]/50',
      secondary:
        'bg-slate-100 hover:bg-slate-200/80 text-[#011C40] dark:bg-[#023859]/80 dark:hover:bg-[#26658C]/80 dark:text-[#A7EBF2] border border-transparent dark:border-[#26658C]/60',
      ghost:
        'hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]/70 text-[#011C40] dark:text-[#A7EBF2]/90 hover:text-[#023859] dark:hover:text-white',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
      outline:
        'border border-[#26658C]/40 dark:border-[#26658C] hover:bg-slate-100 dark:hover:bg-[#023859] text-[#011C40] dark:text-[#A7EBF2]',
      icon:
        'p-2 text-slate-500 hover:text-[#011C40] dark:text-[#A7EBF2]/80 dark:hover:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/40 rounded-full transition-colors',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
