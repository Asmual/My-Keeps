'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CalendarDays,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { cn, formatReminderDate } from '@/lib/utils';

interface ReminderPickerProps {
  currentReminder?: string | null;
  onSelectReminder: (date: string | null) => void;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
}

export function ReminderPicker({
  currentReminder,
  onSelectReminder,
  className,
  buttonClassName,
  align = 'left',
}: ReminderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom picker state (default to tomorrow 08:00)
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('08:00');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Today's date in YYYY-MM-DD for min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Presets
  const getPresets = () => {
    const now = new Date();

    // Later today: 8:00 PM (or +3 hours if past 17:00)
    const laterToday = new Date(now);
    if (now.getHours() >= 18) {
      laterToday.setHours(now.getHours() + 3, 0, 0, 0);
    } else {
      laterToday.setHours(20, 0, 0, 0);
    }

    // Tomorrow: 8:00 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    // Next week: Next Monday at 8:00 AM
    const nextWeek = new Date(now);
    const day = nextWeek.getDay(); // 0 is Sunday, 1 is Monday...
    const daysUntilNextMonday = ((7 - day + 1) % 7) || 7;
    nextWeek.setDate(nextWeek.getDate() + daysUntilNextMonday);
    nextWeek.setHours(8, 0, 0, 0);

    return [
      {
        id: 'today',
        label: 'Later today',
        timeLabel: laterToday.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        date: laterToday.toISOString(),
        icon: Clock,
      },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        timeLabel: '8:00 AM',
        date: tomorrow.toISOString(),
        icon: Calendar,
      },
      {
        id: 'next-week',
        label: 'Next week',
        timeLabel: `Mon, 8:00 AM`,
        date: nextWeek.toISOString(),
        icon: CalendarDays,
      },
    ];
  };

  const handleApplyPreset = (isoString: string) => {
    onSelectReminder(isoString);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleSaveCustom = () => {
    if (!customDate || !customTime) return;
    const [hours, minutes] = customTime.split(':').map(Number);
    const target = new Date(customDate);
    target.setHours(hours, minutes, 0, 0);
    onSelectReminder(target.toISOString());
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleRemoveReminder = () => {
    onSelectReminder(null);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const hasReminder = Boolean(currentReminder);

  return (
    <div className={cn('relative inline-block', className)} ref={popoverRef}>
      {/* Trigger button */}
      <button
        type="button"
        title={hasReminder ? `Reminder set: ${formatReminderDate(currentReminder)}` : 'Remind me'}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1.5 rounded-full transition-colors cursor-pointer relative',
          hasReminder
            ? 'text-[#011C40] dark:text-[#A7EBF2] bg-[#A7EBF2]/80 dark:bg-[#54ACBF]/30 ring-1 ring-[#54ACBF]/50'
            : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50',
          buttonClassName
        )}
      >
        <Bell className={cn('w-3.5 h-3.5', hasReminder && 'fill-current text-[#023859] dark:text-[#A7EBF2]')} />
        {hasReminder && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#54ACBF] ring-1 ring-white" />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute z-50 bottom-full mb-2 p-3 bg-white dark:bg-[#023859] rounded-2xl shadow-2xl border border-[#A7EBF2] dark:border-[#26658C] w-[270px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#26658C]/60 text-xs font-semibold text-[#011C40] dark:text-white">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#54ACBF]" />
              Remind me
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Active Reminder Display */}
          {hasReminder && (
            <div className="mb-2.5 p-2 rounded-xl bg-[#54ACBF]/15 dark:bg-[#011C40]/80 border border-[#54ACBF]/30 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Check className="w-3.5 h-3.5 text-[#54ACBF] shrink-0" />
                <span className="truncate text-[#011C40] dark:text-[#A7EBF2] font-medium text-[11px]">
                  {formatReminderDate(currentReminder)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveReminder}
                title="Remove reminder"
                className="shrink-0 p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isCustomMode ? (
            /* Smart Presets List */
            <div className="space-y-1">
              {getPresets().map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.date)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#A7EBF2]/25 dark:hover:bg-[#011C40] transition-colors cursor-pointer text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#54ACBF] group-hover:scale-110 transition-transform" />
                      <span>{preset.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                      {preset.timeLabel}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-[#023859] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/30 dark:hover:bg-[#011C40] transition-colors cursor-pointer text-left border-t border-slate-100 dark:border-[#26658C]/60 pt-2 mt-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-[#54ACBF]" />
                <span>Pick date & time...</span>
              </button>
            </div>
          ) : (
            /* Custom Date & Time Form */
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#26658C]/60">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-xs text-slate-500 dark:text-[#A7EBF2]/70 hover:underline cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-3.5 py-1 bg-[#023859] hover:bg-[#26658C] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
