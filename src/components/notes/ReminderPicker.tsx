'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Calendar, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReminderPickerProps {
  currentReminder?: string | null;
  onSelectReminder: (reminderIso: string | null) => void;
  buttonClassName?: string;
  iconClassName?: string;
  align?: 'left' | 'right';
}

export function ReminderPicker({
  currentReminder,
  onSelectReminder,
  buttonClassName,
  iconClassName = 'w-3.5 h-3.5',
  align = 'right',
}: ReminderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  // Request browser notification permission if not asked yet
  const requestNotificationPermission = () => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }
  };

  const handleSetReminder = (date: Date) => {
    requestNotificationPermission();
    onSelectReminder(date.toISOString());
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleClearReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectReminder(null);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateTime) {
      toast.error('Please select a date and time');
      return;
    }
    const selected = new Date(customDateTime);
    if (isNaN(selected.getTime())) {
      toast.error('Invalid date format');
      return;
    }
    if (selected.getTime() <= Date.now()) {
      toast.error('Please pick a future time');
      return;
    }
    handleSetReminder(selected);
  };

  // Pre-calculated preset options
  const getLaterToday = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0); // 8:00 PM
    if (d.getTime() <= Date.now()) {
      // If past 8 PM, set to 2 hours from now
      d.setTime(Date.now() + 2 * 60 * 60 * 1000);
    }
    return d;
  };

  const getTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0); // Tomorrow 8:00 AM
    return d;
  };

  const getNextWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // Next Monday
    d.setHours(8, 0, 0, 0);
    return d;
  };

  const hasReminder = Boolean(currentReminder);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
          setIsCustomMode(false);
        }}
        className={cn(
          'p-1.5 rounded-full transition-colors cursor-pointer relative',
          hasReminder
            ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200'
            : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50',
          buttonClassName
        )}
        title={hasReminder ? 'Edit or clear reminder' : 'Add reminder'}
        aria-label="Set reminder"
      >
        <Bell className={cn(iconClassName, hasReminder && 'fill-current')} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute z-50 bottom-full sm:bottom-auto sm:top-full mt-1 mb-1 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl p-2.5 text-xs text-[#011C40] dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#A7EBF2]/40 dark:border-[#26658C]">
            <span className="font-semibold text-xs text-[#011C40] dark:text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#54ACBF]" />
              Remind me
            </span>
            {hasReminder && (
              <button
                type="button"
                onClick={handleClearReminder}
                className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                title="Remove reminder"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {!isCustomMode ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSetReminder(getLaterToday())}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859] transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#54ACBF]" />
                  Later today
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                  8:00 PM
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReminder(getTomorrowMorning())}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859] transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#54ACBF]" />
                  Tomorrow
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                  8:00 AM
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReminder(getNextWeek())}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859] transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#54ACBF]" />
                  Next week
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#A7EBF2]/60">
                  Mon, 8:00 AM
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859] transition-colors text-left cursor-pointer border-t border-[#A7EBF2]/30 dark:border-[#26658C]/50 mt-1 pt-1.5 font-medium text-[#023859] dark:text-[#A7EBF2]"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Pick date & time
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#A7EBF2]/70 mb-1">
                  Select Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] text-[#011C40] dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-2.5 py-1 rounded-lg text-slate-500 dark:text-[#A7EBF2]/70 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[11px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#023859] hover:bg-[#26658C] text-white font-medium cursor-pointer transition-colors shadow-xs text-[11px] flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
