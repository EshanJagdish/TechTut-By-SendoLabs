import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Calendar, 
  Sparkles, 
  Clock, 
  Target, 
  Award, 
  Check, 
  Plus, 
  Zap, 
  BookOpen, 
  ShieldCheck, 
  Info,
  ChevronRight,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

export interface FocusDayData {
  dateKey: string;     // e.g. "2026-09-21"
  dayName: string;    // "Mon", "Tue", etc.
  dayNumber: number;  // 21
  monthName: string;  // "Sep"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  completed: boolean;
  minutes: number;
  subject: string;
  intensity: 'unlit' | 'spark' | 'flame' | 'blaze' | 'supernova';
  notes?: string;
}

interface FocusCalendarWidgetProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onShowToast?: (title: string, subtitle: string, icon?: string) => void;
}

const STORAGE_KEY_PREFIX = 'techtut_focus_calendar_';

const FOCUS_SUBJECTS = [
  'Mathematics & Calculus',
  'Physics & Quantum',
  'Chemistry & Biology',
  'Computer Science',
  'Literature & Writing',
  'Exam Preparation',
  'Deep Work & Review',
];

export const FocusCalendarWidget: React.FC<FocusCalendarWidgetProps> = ({
  userProfile,
  onUpdateProfile,
  onShowToast,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [editMinutes, setEditMinutes] = useState(30);
  const [editSubject, setEditSubject] = useState(FOCUS_SUBJECTS[0]);
  const [editNotes, setEditNotes] = useState('');
  const [justIgnitedKey, setJustIgnitedKey] = useState<string | null>(null);
  const [streakFreezeActive, setStreakFreezeActive] = useState(true);

  // Generate the 7 days of the current week (Monday through Sunday)
  const getWeekDays = (): FocusDayData[] => {
    const now = new Date();
    // Monday as start of week
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: FocusDayData[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday = dateKey === todayStr;
      const isPast = d < now && !isToday;
      const isFuture = d > now && !isToday;

      days.push({
        dateKey,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isToday,
        isPast,
        isFuture,
        completed: false,
        minutes: 0,
        subject: 'General Study',
        intensity: 'unlit',
      });
    }

    return days;
  };

  // State holding the current week's 7-day data
  const [days, setDays] = useState<FocusDayData[]>(() => {
    const initialDays = getWeekDays();
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${userProfile.email || 'scholar'}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed: Record<string, Partial<FocusDayData>> = JSON.parse(cached);
        return initialDays.map((d) => {
          if (parsed[d.dateKey]) {
            return { ...d, ...parsed[d.dateKey] };
          }
          return d;
        });
      }
    } catch (e) {
      console.warn('Could not read cached focus calendar:', e);
    }

    // Default seed based on userProfile.currentStreak
    const streak = Math.max(1, Math.min(7, userProfile.currentStreak || 3));
    return initialDays.map((d, index) => {
      if (index < streak) {
        const mins = [30, 45, 60, 40, 50, 60, 35][index % 7];
        const subjects = [
          'Mathematics & Calculus',
          'Physics & Quantum',
          'Computer Science',
          'Chemistry & Biology',
          'Literature & Writing',
          'Exam Preparation',
          'Deep Work & Review',
        ];
        return {
          ...d,
          completed: true,
          minutes: mins,
          subject: subjects[index % subjects.length],
          intensity: mins >= 60 ? 'blaze' : 'flame',
        };
      }
      return d;
    });
  });

  // Save changes to localStorage
  const persistDays = (updatedDays: FocusDayData[]) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${userProfile.email || 'scholar'}`;
      const record: Record<string, Partial<FocusDayData>> = {};
      updatedDays.forEach((d) => {
        record[d.dateKey] = {
          completed: d.completed,
          minutes: d.minutes,
          subject: d.subject,
          intensity: d.intensity,
          notes: d.notes,
        };
      });
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to save focus calendar to storage:', e);
    }
  };

  // Recalculate streak and notify profile
  const recalculateStreak = (updatedDays: FocusDayData[]) => {
    const completedCount = updatedDays.filter((d) => d.completed).length;
    const newStreak = Math.max(1, completedCount);
    const newBestStreak = Math.max(newStreak, userProfile.bestStreak || 0);

    onUpdateProfile({
      currentStreak: newStreak,
      bestStreak: newBestStreak,
    });
  };

  // Interactive click on a Day's Fire Icon
  const handleFireClick = (day: FocusDayData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If future and not today, user can still pre-schedule or log
    const updated = days.map((d) => {
      if (d.dateKey === day.dateKey) {
        const nextCompleted = !d.completed;
        const nextMinutes = nextCompleted ? (d.minutes > 0 ? d.minutes : 35) : 0;
        const nextIntensity: FocusDayData['intensity'] = nextCompleted 
          ? (nextMinutes >= 60 ? 'blaze' : nextMinutes >= 45 ? 'flame' : 'spark')
          : 'unlit';

        return {
          ...d,
          completed: nextCompleted,
          minutes: nextMinutes,
          intensity: nextIntensity,
          subject: d.subject || 'Deep Focus',
        };
      }
      return d;
    });

    setDays(updated);
    persistDays(updated);
    recalculateStreak(updated);

    const targetDay = updated.find((d) => d.dateKey === day.dateKey);

    if (targetDay?.completed) {
      setJustIgnitedKey(day.dateKey);
      setTimeout(() => setJustIgnitedKey(null), 1800);

      const bonusXp = 25;
      onUpdateProfile({
        xp: (userProfile.xp || 0) + bonusXp,
        stardust: (userProfile.stardust || 0) + 5,
      });

      if (onShowToast) {
        onShowToast(
          '🔥 Focus Flame Ignited!',
          `${day.dayName} study session recorded (+${bonusXp} XP • +5 Stardust). Keep the streak alive!`,
          '🔥'
        );
      }
    } else {
      if (onShowToast) {
        onShowToast('Flame Extinguished', `${day.dayName} marked as rest day.`, '⚪');
      }
    }
  };

  // Open details for a specific day
  const handleSelectDay = (day: FocusDayData) => {
    setSelectedDayKey(day.dateKey);
    setEditMinutes(day.minutes || 30);
    setEditSubject(day.subject || FOCUS_SUBJECTS[0]);
    setEditNotes(day.notes || '');
    setIsEditingDay(true);
  };

  // Save detail edits
  const handleSaveDayDetails = () => {
    if (!selectedDayKey) return;

    const updated = days.map((d) => {
      if (d.dateKey === selectedDayKey) {
        const hasTime = editMinutes > 0;
        const intensity: FocusDayData['intensity'] = !hasTime
          ? 'unlit'
          : editMinutes >= 75
          ? 'supernova'
          : editMinutes >= 50
          ? 'blaze'
          : editMinutes >= 25
          ? 'flame'
          : 'spark';

        return {
          ...d,
          completed: hasTime,
          minutes: editMinutes,
          subject: editSubject,
          notes: editNotes.trim(),
          intensity,
        };
      }
      return d;
    });

    setDays(updated);
    persistDays(updated);
    recalculateStreak(updated);
    setIsEditingDay(false);

    if (onShowToast) {
      onShowToast('Focus Log Updated', `${editSubject} (${editMinutes}m) saved for this day.`, '📝');
    }
  };

  // Quick 1-Click check-in for Today
  const handleLogTodayQuick = () => {
    const today = days.find((d) => d.isToday) || days[0];
    handleFireClick(today);
  };

  // Derived metrics
  const completedDaysCount = days.filter((d) => d.completed).length;
  const totalMinutesThisWeek = days.reduce((sum, d) => sum + (d.minutes || 0), 0);
  const weeklyCompletionRate = Math.round((completedDaysCount / 7) * 100);
  const activeStreak = userProfile.currentStreak || completedDaysCount;
  const selectedDay = days.find((d) => d.dateKey === selectedDayKey);

  return (
    <div 
      id="focus-calendar-widget" 
      className="rounded-2xl bg-white border border-stone-200/90 shadow-xs overflow-hidden transition-all"
    >
      {/* Widget Header */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-transparent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  Focus Calendar
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 font-mono font-bold border border-orange-500/20">
                  7-Day Streak Grid
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Click any fire icon to ignite your study streak or log deep work minutes
              </p>
            </div>
          </div>
        </div>

        {/* Quick Streak Stats Pill */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-orange-200/80 shadow-2xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">Current Streak</span>
              <span className="text-xs font-bold text-stone-900 font-mono">
                {activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
            <Clock className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">Week Total</span>
              <span className="text-xs font-bold text-stone-900 font-mono">
                {Math.floor(totalMinutesThisWeek / 60)}h {totalMinutesThisWeek % 60}m
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
            <Target className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">Weekly Goal</span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {completedDaysCount}/7 ({weeklyCompletionRate}%)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogTodayQuick}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Toggle today's focus session completion"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Check In Today</span>
          </button>
        </div>
      </div>

      {/* 7-Day Interactive Grid */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>This Week’s Daily Focus Progress</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Interactive: Click fire to toggle • Click card to edit details
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3">
          {days.map((day) => {
            const isLit = day.completed;
            const isSelected = selectedDayKey === day.dateKey && isEditingDay;
            const isIgnitedPulse = justIgnitedKey === day.dateKey;

            return (
              <div
                key={day.dateKey}
                onClick={() => handleSelectDay(day)}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-between text-center cursor-pointer min-h-[145px] ${
                  isSelected
                    ? 'ring-2 ring-orange-500 border-orange-400 bg-orange-50/50 shadow-sm'
                    : day.isToday
                    ? isLit 
                      ? 'border-orange-300 bg-gradient-to-b from-orange-50/90 to-amber-50/40 shadow-xs' 
                      : 'border-orange-400/80 bg-orange-50/20 ring-1 ring-orange-400/50'
                    : isLit
                    ? 'border-orange-200 bg-orange-50/40 hover:bg-orange-50/70 hover:border-orange-300 shadow-2xs'
                    : 'border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300 text-stone-400'
                }`}
              >
                {/* Day Header & Today Badge */}
                <div className="w-full flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[11px] uppercase font-bold font-mono ${
                    day.isToday ? 'text-orange-600' : isLit ? 'text-stone-800' : 'text-stone-400'
                  }`}>
                    {day.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {day.monthName} {day.dayNumber}
                  </span>
                </div>

                {/* Today Pill */}
                {day.isToday && (
                  <span className="text-[9px] px-2 py-0.2 rounded-full bg-orange-500 text-white font-bold tracking-tight uppercase shadow-2xs mb-1">
                    Today
                  </span>
                )}

                {/* Interactive Fire Button */}
                <div className="my-1.5 relative">
                  <button
                    type="button"
                    onClick={(e) => handleFireClick(day, e)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative group/fire ${
                      isLit
                        ? day.intensity === 'supernova'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30 scale-105'
                          : day.intensity === 'blaze'
                          ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 scale-105'
                          : 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                        : 'bg-stone-100 hover:bg-orange-100 text-stone-300 hover:text-orange-500'
                    } ${isIgnitedPulse ? 'animate-bounce ring-4 ring-orange-300' : 'active:scale-95'}`}
                    title={isLit ? "Click to extinguish or mark rest" : "Click to ignite flame for today!"}
                  >
                    <Flame 
                      className={`w-6 h-6 transition-transform group-hover/fire:scale-110 ${
                        isLit ? 'fill-current animate-pulse' : 'stroke-current'
                      }`} 
                    />

                    {/* Sparkle badge for lit flames */}
                    {isLit && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-300 text-amber-950 flex items-center justify-center text-[9px] font-bold shadow-2xs">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Flame Particle flare effect when just ignited */}
                  {isIgnitedPulse && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span className="text-base animate-ping">✨</span>
                    </div>
                  )}
                </div>

                {/* Day Details: Minutes & Subject */}
                <div className="w-full mt-auto pt-1 text-center">
                  {isLit ? (
                    <>
                      <span className="text-[11px] font-bold text-orange-700 font-mono block">
                        {day.minutes} mins
                      </span>
                      <span className="text-[9px] text-stone-500 truncate block max-w-full" title={day.subject}>
                        {day.subject.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-stone-400 font-medium block">
                        {day.isToday ? 'Tap to Ignite' : 'Rest Day'}
                      </span>
                      <span className="text-[9px] text-stone-300 block font-mono">
                        0 mins
                      </span>
                    </>
                  )}
                </div>

                {/* Subtle hover prompt */}
                <div className="absolute inset-x-0 bottom-0 py-0.5 bg-stone-900/90 text-white text-[8px] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Edit Details
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone & Streak Protection Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-stone-100">
          <div className="flex items-center gap-2 text-stone-600">
            <div className={`p-1 rounded-lg ${streakFreezeActive ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>
              <strong>Streak Protection:</strong>{' '}
              <span className={streakFreezeActive ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                {streakFreezeActive ? 'Active (1 Freeze Available)' : 'Inactive'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Next Milestone: <strong>7-Day Inferno (+150 XP)</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setStreakFreezeActive(!streakFreezeActive)}
              className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
            >
              {streakFreezeActive ? 'Manage Protection' : 'Enable Freeze'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Selected Day Editor Drawer / Modal */}
      {isEditingDay && selectedDay && (
        <div className="p-5 sm:p-6 bg-stone-50 border-t border-stone-200/90 animate-in slide-in-from-top-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Log Focus for {selectedDay.dayName}, {selectedDay.monthName} {selectedDay.dayNumber}</span>
                  {selectedDay.isToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold font-mono">
                      TODAY
                    </span>
                  )}
                </h4>
                <p className="text-xs text-stone-500">
                  Record study duration and topic to keep your academic flame glowing brightly
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingDay(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Focus Duration Presets & Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Study Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="480"
                  step="5"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
                />
                <span className="text-xs text-stone-500 font-mono">minutes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[15, 25, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEditMinutes(mins)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      editMinutes === mins
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Subject / Academic Area
              </label>
              <select
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {FOCUS_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400">
                Categorizes your focus hours towards subject mastery badges
              </p>
            </div>

            {/* Study Reflection / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Session Reflection / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Solved 4 Taylor series problem sets"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setEditMinutes(0);
                setTimeout(() => handleSaveDayDetails(), 50);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              Clear / Mark as Rest Day
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingDay(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDayDetails}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Focus Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
