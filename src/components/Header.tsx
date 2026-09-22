import React, { useState } from 'react';
import { 
  Sparkles, 
  Orbit, 
  Gamepad2, 
  Headphones, 
  User, 
  Code2, 
  Flame, 
  Moon, 
  GraduationCap, 
  Palette,
  ChevronDown,
  HelpCircle,
  Mic,
  Users
} from 'lucide-react';
import { AppMode, DreamyTheme, EducationLevel } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  educationLevel: EducationLevel;
  onChangeLevel?: (level: EducationLevel) => void;
  onSelectLevel?: (level: EducationLevel) => void;
  theme?: DreamyTheme;
  currentTheme?: DreamyTheme;
  onChangeTheme?: (theme: DreamyTheme) => void;
  onSelectTheme?: (theme: DreamyTheme) => void;
  stardust?: number;
  stardustCount?: number;
  streak?: number;
  streakDays?: number;
  userEmail?: string;
  isEmailVerified?: boolean;
  onOpenMusicPopup?: () => void;
}

const LEVEL_LABELS: Record<EducationLevel, string> = {
  school: 'School (K-8)',
  high_school: 'High School',
  college: 'College / Prep',
  university: 'University / Postgrad',
  adult: 'Adult Learner',
};

const THEMES: { id: DreamyTheme; label: string; dotColor: string }[] = [
  { id: 'starlight', label: 'Starlight Violet', dotColor: 'bg-violet-400' },
  { id: 'twilight', label: 'Twilight Indigo', dotColor: 'bg-indigo-400' },
  { id: 'aurora', label: 'Aurora Emerald', dotColor: 'bg-emerald-400' },
  { id: 'sunset', label: 'Celestial Sunset', dotColor: 'bg-amber-400' },
  { id: 'midnight', label: 'Midnight Cyan', dotColor: 'bg-cyan-400' },
];

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  educationLevel,
  onChangeLevel,
  onSelectLevel,
  theme,
  currentTheme,
  onChangeTheme,
  onSelectTheme,
  stardust,
  stardustCount,
  streak,
  streakDays,
  userEmail,
  isEmailVerified,
  onOpenMusicPopup,
}) => {
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const activeTheme = currentTheme || theme || 'starlight';
  const handleTheme = onSelectTheme || onChangeTheme || (() => {});
  const handleLevel = onSelectLevel || onChangeLevel || (() => {});
  const currentStardust = stardustCount ?? stardust ?? 160;
  const currentStreak = streakDays ?? streak ?? 5;

  return (
    <header id="techtut-header" className="sticky top-0 z-40 w-full px-3 sm:px-6 pt-3 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-start gap-2 sm:gap-3 h-14 px-3 sm:px-4 rounded-2xl bg-white/90 border border-stone-200/80 backdrop-blur-md shadow-xs overflow-x-auto scrollbar-none">
          
          {/* Brand Identity (Leftmost) */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none shrink-0" onClick={() => onSelectMode('study')}>
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500 text-white font-bold shadow-xs">
              <span className="text-sm font-black">T</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-stone-900">
                TechTut
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                Studio
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-stone-200 shrink-0 hidden md:block" />

          {/* Navigation Modes (Left Aligned) */}
          <nav id="techtut-nav" className="hidden md:flex items-center gap-0.5 bg-stone-100/80 p-1 rounded-full border border-stone-200/60 shrink-0">
            <button
              id="nav-study-mode"
              onClick={() => onSelectMode('study')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                currentMode === 'study'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
              title="TechTut Scholar Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Scholar Studio</span>
            </button>

            <button
              id="nav-live-mode"
              onClick={() => onSelectMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                currentMode === 'live'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
              title="TechTut Stage - Live Voice Engine"
            >
              <Mic className="w-3.5 h-3.5 text-stone-700" />
              <span>Stage</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              id="nav-games-mode"
              onClick={() => onSelectMode('games')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                currentMode === 'games'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
              title="TechTut Gamie - Games"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-stone-700" />
              <span>Gamie</span>
            </button>

            <button
              id="nav-quiz-mode"
              onClick={() => onSelectMode('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                currentMode === 'quiz'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-700" />
              <span>Quiz</span>
            </button>

            <button
              id="nav-workspace-mode"
              onClick={() => onSelectMode('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                currentMode === 'workspace'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-stone-700" />
              <span>Workspace</span>
            </button>

            <button
              id="nav-account-mode"
              onClick={() => onSelectMode('account')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all relative cursor-pointer ${
                currentMode === 'account'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 font-medium'
              }`}
            >
              <User className="w-3.5 h-3.5 text-stone-700" />
              <span>Account</span>
              {userEmail && (
                <span 
                  className={`w-1.5 h-1.5 rounded-full ${isEmailVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                  title={isEmailVerified ? `Verified: ${userEmail}` : `Pending: ${userEmail}`}
                />
              )}
            </button>
          </nav>

          <div className="h-5 w-px bg-stone-200 shrink-0 hidden sm:block" />

          {/* Educational Level Selector (Left Side) */}
          <div className="relative shrink-0">
            <button
              id="education-level-trigger"
              onClick={() => setIsLevelOpen(!isLevelOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/70 border border-stone-200/70 text-stone-700 text-xs font-medium transition-all cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">{LEVEL_LABELS[educationLevel]}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {isLevelOpen && (
              <div 
                id="education-level-dropdown"
                className="absolute left-0 mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-lg py-1.5 z-50 animate-in fade-in duration-150"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Academic Level
                </div>
                {Object.entries(LEVEL_LABELS).map(([lvl, label]) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      handleLevel(lvl as EducationLevel);
                      setIsLevelOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-orange-50 transition-colors cursor-pointer ${
                      educationLevel === lvl ? 'text-orange-600 font-semibold bg-orange-50/60' : 'text-stone-700'
                    }`}
                  >
                    <span>{label}</span>
                    {educationLevel === lvl && <Sparkles className="w-3 h-3 text-orange-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stardust points pill (Left Side) */}
          <div 
            id="stardust-stat"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-50/80 border border-orange-200/80 text-xs text-orange-700 font-semibold shrink-0"
            title={`${currentStardust} Stardust earned`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-mono">{currentStardust}</span>
          </div>

          {/* Streak pill (Left Side) */}
          <div 
            id="streak-stat"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 border border-stone-200/70 text-xs text-stone-700 font-semibold shrink-0"
            title={`${currentStreak} Day Study Streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{currentStreak}d</span>
          </div>

        </div>

        {/* Mobile bottom navigation bar */}
        <div className="flex md:hidden items-center justify-around py-1.5 px-1 mt-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-xs text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectMode('study')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl transition-colors cursor-pointer shrink-0 ${
              currentMode === 'study' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Scholar Studio</span>
          </button>
          <button
            onClick={() => onSelectMode('live')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl relative transition-colors cursor-pointer shrink-0 ${
              currentMode === 'live' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Stage</span>
            <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
          <button
            onClick={() => onSelectMode('games')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl transition-colors cursor-pointer shrink-0 ${
              currentMode === 'games' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Gamie</span>
          </button>
          <button
            onClick={() => onSelectMode('quiz')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl transition-colors cursor-pointer shrink-0 ${
              currentMode === 'quiz' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Quiz</span>
          </button>
          <button
            onClick={() => onSelectMode('workspace')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl transition-colors cursor-pointer shrink-0 ${
              currentMode === 'workspace' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Workspace</span>
          </button>
          <button
            onClick={() => onSelectMode('account')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] rounded-xl transition-colors cursor-pointer shrink-0 ${
              currentMode === 'account' ? 'text-orange-600 font-bold bg-orange-50/80' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Account</span>
          </button>
        </div>

      </div>
    </header>
  );
};
