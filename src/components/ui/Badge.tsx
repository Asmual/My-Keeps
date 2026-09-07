import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'active';
  onRemove?: () => void;
}

export function Badge({
  className,
  variant = 'default',
  children,
  onRemove,
  ...props
}: BadgeProps) {
  const variants = {
    // Luna specification: Soft Ice Blue (#A7EBF2) with dark (#011C40) text
    default:
      'bg-[#A7EBF2] text-[#011C40] border border-[#54ACBF]/50 font-semibold shadow-xs',
    outline:
      'border border-[#54ACBF] text-[#023859] dark:text-[#A7EBF2] bg-transparent',
    active:
      'bg-[#54ACBF] text-white border border-[#26658C] font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-[#011C40]/20 text-[#011C40]/80 hover:text-[#011C40] cursor-pointer"
          aria-label="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
