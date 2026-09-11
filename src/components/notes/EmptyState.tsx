import React from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Archive,
  Trash2,
  CheckSquare,
  SearchX,
  Tag,
  Star,
  Image as ImageIcon,
  Mic,
  LucideIcon,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/Button';

type EmptyStateType =
  | 'notes'
  | 'archive'
  | 'trash'
  | 'checklists'
  | 'search'
  | 'label'
  | 'important'
  | 'imageNotes'
  | 'voiceNotes';

interface EmptyStateProps {
  type: EmptyStateType;
  customMessage?: string;
}

interface StateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass: string;
}

export function EmptyState({ type, customMessage }: EmptyStateProps) {
  const { isAuthenticated, openAuthModal } = useNotes();

  const configs: Record<EmptyStateType, StateConfig> = {
    notes: {
      icon: Lightbulb,
      title: 'No notes yet',
      description: 'Capture thoughts, tasks, and ideas above in Luna workspace.',
      colorClass: 'text-[#54ACBF] bg-[#54ACBF]/15 dark:bg-[#023859] border border-[#54ACBF]/40',
    },
    archive: {
      icon: Archive,
      title: 'Your archive is empty',
      description: 'Notes you archive will appear here safely preserved.',
      colorClass: 'text-[#54ACBF] bg-[#A7EBF2]/20 dark:bg-[#023859] border border-[#26658C]',
    },
    trash: {
      icon: Trash2,
      title: 'Trash is empty',
      description: 'Deleted notes will be placed here. You can restore them anytime.',
      colorClass: 'text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900',
    },
    checklists: {
      icon: CheckSquare,
      title: 'No checklists yet',
      description: 'Create to-do lists and shopping checklists to track your items with easy checkboxes.',
      colorClass: 'text-[#54ACBF] bg-[#A7EBF2]/20 dark:bg-[#023859] border border-[#26658C]',
    },
    important: {
      icon: Star,
      title: 'No important notes yet',
      description: 'Click the star icon on any note to keep your most vital notes here.',
      colorClass: 'text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900',
    },
    imageNotes: {
      icon: ImageIcon,
      title: 'No image notes yet',
      description: 'Create notes with photos, screenshots, or diagram attachments.',
      colorClass: 'text-[#54ACBF] bg-[#54ACBF]/15 dark:bg-[#023859] border border-[#54ACBF]/40',
    },
    voiceNotes: {
      icon: Mic,
      title: 'No voice memos yet',
      description: 'Record quick audio thoughts with the microphone button.',
      colorClass: 'text-[#54ACBF] bg-[#A7EBF2]/20 dark:bg-[#023859] border border-[#26658C]',
    },
    search: {
      icon: SearchX,
      title: 'No matching notes',
      description: customMessage || 'Try searching for different keywords or checking for spelling errors.',
      colorClass: 'text-[#54ACBF] bg-slate-100 dark:bg-[#023859] border border-[#26658C]',
    },
    label: {
      icon: Tag,
      title: 'No notes with this label',
      description: 'Tag your notes to organize them neatly by topics.',
      colorClass: 'text-[#54ACBF] bg-[#A7EBF2]/20 dark:bg-[#023859] border border-[#54ACBF]',
    },
  };

  // Dedicated guest welcome state when user is not logged in
  if (!isAuthenticated && type === 'notes') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 rounded-3xl text-[#54ACBF] bg-[#54ACBF]/15 dark:bg-[#023859] border border-[#54ACBF]/40 mb-4 shadow-inner">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-[#011C40] dark:text-white mb-1.5">
          Welcome to My Keeps
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7EBF2]/80 leading-relaxed mb-6 max-w-sm">
          All your thoughts, checklists, and voice memos securely saved under your personal account. Sign in to start taking notes.
        </p>

        <div className="w-full max-w-xs space-y-2.5">
          <GoogleAuthButton text="Continue with Google" />
          <Button
            variant="outline"
            onClick={() => openAuthModal('view and create notes')}
            className="w-full h-10 rounded-xl text-xs font-semibold border-[#A7EBF2] dark:border-[#26658C]"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            <span>More Sign In Options</span>
          </Button>
        </div>
      </div>
    );
  }

  const current = configs[type];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className={`p-4 rounded-3xl ${current.colorClass} mb-4 transition-transform hover:scale-105 shadow-inner`}>
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold text-[#011C40] dark:text-white mb-1">
        {current.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-[#A7EBF2]/70 leading-relaxed">
        {current.description}
      </p>
      {!isAuthenticated && (
        <button
          type="button"
          onClick={() => openAuthModal('access this section')}
          className="mt-4 text-xs font-semibold text-[#54ACBF] hover:underline cursor-pointer"
        >
          Sign in to view your items &rarr;
        </button>
      )}
    </div>
  );
}
