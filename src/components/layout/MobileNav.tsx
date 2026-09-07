'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StickyNote, Bell, Archive, Trash2 } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { setSelectedLabel } = useNotes();

  const links = [
    { label: 'Notes', href: '/', icon: StickyNote },
    { label: 'Reminders', href: '/reminders', icon: Bell },
    { label: 'Archive', href: '/archive', icon: Archive },
    { label: 'Trash', href: '/trash', icon: Trash2 },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-around py-2 px-3 shadow-lg">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setSelectedLabel(null)}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-medium transition-colors',
              isActive
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
