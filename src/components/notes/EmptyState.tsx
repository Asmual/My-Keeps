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
      description: 'Capture your thoughts, ideas, tasks, and inspirations above.',
      colorClass: 'text-amber-500 bg-amber-500/10',
    },
    archive: {
      icon: Archive,
      title: 'Your archive is empty',
      description: 'Notes you archive will appear here for safe keeping without cluttering your main space.',
      colorClass: 'text-blue-500 bg-blue-500/10',
    },
    trash: {
      icon: Trash2,
      title: 'Trash is empty',
      description: 'Deleted notes will be placed here. You can restore them anytime or empty the trash.',
      colorClass: 'text-rose-500 bg-rose-500/10',
    },
    reminders: {
      icon: Bell,
      title: 'No upcoming reminders',
      description: 'Add reminders to your notes to get notified about critical deadlines and tasks.',
      colorClass: 'text-purple-500 bg-purple-500/10',
    },
    search: {
      icon: SearchX,
      title: 'No matching notes',
      description: customMessage || 'Try searching for different keywords or checking for spelling errors.',
      colorClass: 'text-neutral-500 bg-neutral-500/10',
    },
    label: {
      icon: Tag,
      title: 'No notes with this label',
      description: 'Tag your notes to organize them neatly by topics or projects.',
      colorClass: 'text-emerald-500 bg-emerald-500/10',
    },
  };

  const current = configs[type];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className={`p-4 rounded-3xl ${current.colorClass} mb-4 transition-transform hover:scale-105 shadow-inner`}>
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
        {current.title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {current.description}
      </p>
    </div>
  );
}
