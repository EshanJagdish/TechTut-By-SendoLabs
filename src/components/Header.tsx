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
  HelpCircle
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
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 rounded-2xl bg-white/95 border border-stone-200/90 backdrop-blur-md shadow-xs">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectMode('study')}>
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 text-white font-bold shadow-xs">
              <span className="text-base font-black">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-stone-900 flex items-center gap-1">
                  TechTut
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-orange-50 rounded-full text-[10px] text-orange-700 border border-orange-200 font-semibold">
                  SendoLabs
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Whitish • Orangish • Minimal Clean
              </p>
            </div>
          </div>

          {/* Navigation Modes */}
          <nav id="techtut-nav" className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/70">
            <button
              id="nav-study-mode"
              onClick={() => onSelectMode('study')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'study'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Study</span>
            </button>

            <button
              id="nav-addon-mode"
              onClick={() => onSelectMode('addon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'addon'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>Add-On</span>
            </button>

            <button
              id="nav-games-mode"
              onClick={() => onSelectMode('games')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'games'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Games</span>
            </button>

            <button
              id="nav-quiz-mode"
              onClick={() => onSelectMode('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'quiz'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz Arena</span>
            </button>

            <button
              id="nav-account-mode"
              onClick={() => onSelectMode('account')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                currentMode === 'account'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Account</span>
              {userEmail && (
                <span 
                  className={`w-1.5 h-1.5 rounded-full ${isEmailVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                  title={isEmailVerified ? `Verified: ${userEmail}` : `Pending: ${userEmail}`}
                />
              )}
            </button>

            <button
              id="nav-workspace-mode"
              onClick={() => onSelectMode('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'workspace'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>

            <button
              id="nav-dev-blueprint"
              onClick={() => onSelectMode('dev_blueprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentMode === 'dev_blueprint'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
              title="System Specs & Architecture"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Specs</span>
            </button>
          </nav>

          {/* Right Action Cluster: Education Level, Stardust, Streaks */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Educational Level Selector */}
            <div className="relative">
              <button
                id="education-level-trigger"
                onClick={() => setIsLevelOpen(!isLevelOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 hover:border-orange-300 text-xs font-medium transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">{LEVEL_LABELS[educationLevel]}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {isLevelOpen && (
                <div 
                  id="education-level-dropdown"
                  className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-lg py-1.5 z-50 animate-in fade-in duration-150"
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-orange-50 transition-colors ${
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

            {/* Stardust points pill */}
            <div 
              id="stardust-stat"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700 font-semibold"
              title={`${currentStardust} Stardust earned`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono">{currentStardust}</span>
            </div>

            {/* Streak pill */}
            <div 
              id="streak-stat"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold"
              title={`${currentStreak} Day Study Streak`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono">{currentStreak}d</span>
            </div>

            {/* Music Sanctuary Track Switcher Popup Trigger */}
            <button
              id="header-music-btn"
              onClick={onOpenMusicPopup}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open Music Sanctuary & Change Tracks"
            >
              <Headphones className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
              <span className="hidden sm:inline">Music</span>
            </button>

          </div>
        </div>

        {/* Mobile bottom navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 mt-2 rounded-2xl bg-white border border-stone-200 shadow-xs text-xs">
          <button
            onClick={() => onSelectMode('study')}
            className={`flex flex-col items-center py-1 ${currentMode === 'study' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Study</span>
          </button>
          <button
            onClick={() => onSelectMode('addon')}
            className={`flex flex-col items-center py-1 ${currentMode === 'addon' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <Orbit className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Add-On</span>
          </button>
          <button
            onClick={() => onSelectMode('games')}
            className={`flex flex-col items-center py-1 ${currentMode === 'games' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Games</span>
          </button>
          <button
            onClick={onOpenMusicPopup}
            className="flex flex-col items-center py-1 text-stone-500 hover:text-orange-600"
            title="Music Tracks & Sound Sanctuary"
          >
            <Headphones className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Music</span>
          </button>
          <button
            onClick={() => onSelectMode('quiz')}
            className={`flex flex-col items-center py-1 ${currentMode === 'quiz' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Quiz</span>
          </button>
          <button
            onClick={() => onSelectMode('account')}
            className={`flex flex-col items-center py-1 ${currentMode === 'account' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Account</span>
          </button>
          <button
            onClick={() => onSelectMode('workspace')}
            className={`flex flex-col items-center py-1 ${currentMode === 'workspace' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Workspace</span>
          </button>
          <button
            onClick={() => onSelectMode('dev_blueprint')}
            className={`flex flex-col items-center py-1 ${currentMode === 'dev_blueprint' ? 'text-orange-600 font-semibold' : 'text-stone-500'}`}
          >
            <Code2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Specs</span>
          </button>
        </div>

      </div>
    </header>
  );
};
