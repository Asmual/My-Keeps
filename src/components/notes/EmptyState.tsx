import React from 'react';
import {
  Lightbulb,
  Archive,
  Trash2,
  Bell,
  SearchX,
  Tag,
  LucideIcon,
} from 'lucide-react';

type EmptyStateType = 'notes' | 'archive' | 'trash' | 'reminders' | 'search' | 'label';

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
    reminders: {
      icon: Bell,
      title: 'No upcoming reminders',
      description: 'Add reminders to stay on top of critical deadlines.',
      colorClass: 'text-[#A7EBF2] bg-[#26658C]/30 dark:bg-[#023859] border border-[#26658C]',
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
    </div>
  );
}
