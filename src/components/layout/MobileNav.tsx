'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  StickyNote,
  CheckSquare,
  Image as ImageIcon,
  Mic,
  Menu,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { setSelectedLabel, toggleSidebar, sidebarOpen } = useNotes();

  const links = [
    { label: 'Notes', href: '/', icon: StickyNote },
    { label: 'Checklists', href: '/checklists', icon: CheckSquare },
    { label: 'Images', href: '/image-notes', icon: ImageIcon },
    { label: 'Voice', href: '/voice-notes', icon: Mic },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#011C40]/95 backdrop-blur-lg border-t border-[#A7EBF2]/40 dark:border-[#26658C] flex items-center justify-around py-1.5 px-2 shadow-lg">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setSelectedLabel(null)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-colors',
              isActive
                ? 'text-[#023859] dark:text-[#A7EBF2] font-bold'
                : 'text-slate-500 dark:text-[#A7EBF2]/60'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer',
          sidebarOpen
            ? 'text-[#023859] dark:text-[#A7EBF2] font-bold'
            : 'text-slate-500 dark:text-[#A7EBF2]/60'
        )}
        aria-label="Open full menu"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
