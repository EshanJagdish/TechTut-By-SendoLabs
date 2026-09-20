import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Clock, 
  UploadCloud, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  LogIn, 
  GraduationCap,
  Play,
  Maximize2
} from 'lucide-react';
import { UserProfile, QuizSession, QuizQuestion, QuizSettings, QuizSourceType } from '../types';
import { 
  createHostSession, 
  joinStudentSession, 
  isValid10DigitCode, 
  formatQuizCode, 
  generate10DigitQuizCode,
  getAllStoredSessions 
} from '../lib/quizSync';
import { SAMPLE_KAHOOT_QUESTIONS, SAMPLE_BLOOKET_QUESTIONS, SAMPLE_QUIZLET_QUESTIONS } from '../lib/quizParsers';
import { QuizHostView } from './QuizHostView';
import { QuizStudentView } from './QuizStudentView';
import { QuizImporterModal } from './QuizImporterModal';

interface QuizArenaViewProps {
  userProfile: UserProfile;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({ userProfile }) => {
  const [activeView, setActiveView] = useState<'hub' | 'host' | 'student'>('hub');
  
  // Host Configuration State
  const [hostTitle, setHostTitle] = useState('Computer Science & AI Honors Benchmark');
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [enforceFullScreen, setEnforceFullScreen] = useState<boolean>(true);
  const [switchTabsMode, setSwitchTabsMode] = useState<boolean>(false);
  const [hostQuestions, setHostQuestions] = useState<QuizQuestion[]>(SAMPLE_KAHOOT_QUESTIONS);
  const [activeHostSession, setActiveHostSession] = useState<QuizSession | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Student Join State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState(userProfile.name || '');
  const [activeStudentSession, setActiveStudentSession] = useState<QuizSession | null>(null);
  const [studentId] = useState(() => `student_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Quick launch for host
  const handleCreateHostTest = (customPresetQuestions?: QuizQuestion[], customTitle?: string) => {
    const questionsToUse = customPresetQuestions || hostQuestions;
    const titleToUse = customTitle || hostTitle;

    const settings: QuizSettings = {
      title: titleToUse,
      subject: 'Exam',
      timerMode: 'per_question',
      timePerQuestionSeconds: timerSeconds,
      totalTestMinutes: 10,
      enforceFullScreen: enforceFullScreen,
      switchTabsMode: switchTabsMode,
      shuffleQuestions: false,
      passPercentage: 70,
    };

    const session = createHostSession(
      userProfile.id || 'teacher_host',
      userProfile.name || 'Teacher Proctor',
      titleToUse,
      questionsToUse,
      settings
    );

    setActiveHostSession(session);
    setActiveView('host');
  };

  // Join a test with 10-digit numeric code
  const handleJoinTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setJoinError(null);

    const cleanCode = joinCodeInput.replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 10) {
      setJoinError('Please enter an exact 10-digit numeric code (e.g. 4829103847).');
      return;
    }

    if (!studentNameInput.trim()) {
      setJoinError('Please enter your candidate name.');
      return;
    }

    const result = joinStudentSession(cleanCode, studentId, studentNameInput.trim());
    if (result.success && result.session) {
      setActiveStudentSession(result.session);
      setActiveView('student');
    } else {
      setJoinError(result.error || 'Failed to join test. Verify the 10-digit code with your teacher.');
    }
  };

  const handleImportSuccess = (questions: QuizQuestion[], source: QuizSourceType, title?: string) => {
    setHostQuestions(questions);
    if (title) setHostTitle(title);
  };

  // If in Host Screen
  if (activeView === 'host' && activeHostSession) {
    return (
      <QuizHostView
        session={activeHostSession}
        onUpdateSession={(updated) => setActiveHostSession(updated)}
        onBackToHub={() => setActiveView('hub')}
      />
    );
  }

  // If in Student Screen
  if (activeView === 'student' && activeStudentSession) {
    return (
      <QuizStudentView
        session={activeStudentSession}
        studentId={studentId}
        studentName={studentNameInput || userProfile.name || 'Candidate Student'}
        onExit={() => setActiveView('hub')}
      />
    );
  }

  // Main Hub View (Two Options: Host or Join)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
          <span>Proctored Anti-Cheat Fullscreen Exam Arena</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Live Quiz &amp; Test Arena
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          Import tests from Kahoot, Blooket, or Quizlet. Teachers host with a secure 10-digit code;
          students join in strict full-screen mode with real-time exit monitoring.
        </p>
      </div>

      {/* TWO PRIMARY OPTIONS: HOST OR JOIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OPTION 1: HOST A TEST (TEACHER) */}
        <div className="rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-white/15 p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 hover:border-orange-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300 font-semibold border border-orange-500/20">
                Option 1 • For Instructors
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Host a Test
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Configure your exam, set question timers, import from Kahoot, Blooket, or Quizlet, and generate a 10-digit code to live-proctor students.
              </p>
            </div>

            {/* Config Fields */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Exam Title:
                </label>
                <input
                  type="text"
                  value={hostTitle}
                  onChange={(e) => setHostTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="e.g. AP Biology Unit 4 Examination"
                />
              </div>

              {/* Timer Settings */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Question Timer Limit:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimerSeconds(sec)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        timerSeconds === sec
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white/5 text-stone-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {sec}s / Q
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Full Screen Enforcement Setting */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Make Student in Full Screen</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnforceFullScreen(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enforceFullScreen ? 'bg-orange-500' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enforceFullScreen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {enforceFullScreen 
                    ? 'Active: Forces students into full screen. If exited, student is locked out until teacher presses Forgive on the host.' 
                    : 'Disabled: Full screen is optional.'}
                </p>
              </div>

              {/* Switch Tabs Mode Setting (No / Yes) */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch Tabs Mode</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    switchTabsMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {switchTabsMode ? 'Mode: Yes (Allowed)' : 'Mode: No (Locked)'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Allow students to switch tabs or minimize window during test?
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSwitchTabsMode(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !switchTabsMode
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-400'
                        : 'bg-white/5 text-stone-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>No</span>
                    <span className="text-[10px] font-normal opacity-85">(Lockout on Tab Switch)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwitchTabsMode(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      switchTabsMode
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400'
                        : 'bg-white/5 text-stone-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>Yes</span>
                    <span className="text-[10px] font-normal opacity-85">(Allow Switching)</span>
                  </button>
                </div>
              </div>

              {/* Import from Kahoot / Blooket / Quizlet button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsImporterOpen(true)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-purple-400" />
                    <span>Import Questions (Kahoot / Blooket / Quizlet)</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/30 px-2 py-0.5 rounded-md font-mono">
                    {hostQuestions.length} Qs loaded
                  </span>
                </button>
              </div>

              {/* Anti-cheat feature list */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-stone-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Integrated Anti-Cheat Features:</span>
                </div>
                <ul className="list-disc list-inside text-stone-400 space-y-1">
                  <li>Enforces mandatory browser full-screen on student devices</li>
                  <li>Instant Host alerts if a student exits fullscreen or switches tabs</li>
                  <li>Live roster with scores, progress, and exit violation timestamps</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleCreateHostTest()}
            className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Generate 10-Digit Code &amp; Launch Host Screen</span>
          </button>
        </div>

        {/* OPTION 2: JOIN A TEST (STUDENT) */}
        <div className="rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-white/15 p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 hover:border-blue-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <LogIn className="w-6 h-6" />
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                Option 2 • For Students
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Join a Test
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Enter the exact 10-digit code given by your instructor, provide your candidate name, and begin in secure full-screen exam mode.
              </p>
            </div>

            <form onSubmit={handleJoinTest} className="space-y-3.5 pt-2">
              
              {/* 10-DIGIT CODE INPUT (NUMBERS ONLY) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  10-Digit Exam Code (Numbers Only):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={14} // formatted with spacing e.g. 4829 - 1038 - 47
                    value={joinCodeInput}
                    onChange={(e) => {
                      const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setJoinCodeInput(formatQuizCode(numbersOnly));
                      setJoinError(null);
                    }}
                    placeholder="e.g. 4829 - 1038 - 47"
                    className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-blue-500/30 text-white font-mono text-base tracking-wider focus:outline-hidden focus:border-blue-400 text-center font-bold placeholder:text-stone-600"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 text-center">
                  Exactly 10 numeric digits • Strips letters automatically
                </p>
              </div>

              {/* STUDENT NAME */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Student / Candidate Name:
                </label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="e.g. Liam Chen"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-hidden focus:border-blue-400"
                />
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {joinError}
                </div>
              )}

              {/* Proctored Exam Rules Card */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-stone-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Secure Student Candidate Mode:</span>
                </div>
                <p className="text-stone-400">
                  Clicking join will prepare your test and require entering full screen. If you exit fullscreen, your name will immediately show on the host screen.
                </p>
              </div>

            </form>
          </div>

          <button
            onClick={() => handleJoinTest()}
            disabled={joinCodeInput.replace(/\D/g, '').length !== 10 || !studentNameInput.trim()}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Join Test &amp; Enter Full Screen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* QUICK PRESET BENCHMARKS (Kahoot, Blooket, Quizlet) */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Instant Test Presets (Ready to Host or Join)</span>
            </h3>
            <p className="text-xs text-stone-400">
              Click any benchmark to immediately generate a 10-digit code and launch as Host:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Preset 1: Kahoot */}
          <button
            onClick={() => handleCreateHostTest(SAMPLE_KAHOOT_QUESTIONS, 'Computer Science & AI Benchmark (Kahoot Set)')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-2 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Kahoot Format
              </span>
              <span className="text-xs text-stone-400 font-mono">5 Questions</span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              Computer Science &amp; AI Honors
            </h4>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              QuickSort algorithms, Attention transformers, FIFO data structures, and ACID database rules.
            </p>
          </button>

          {/* Preset 2: Blooket */}
          <button
            onClick={() => handleCreateHostTest(SAMPLE_BLOOKET_QUESTIONS, 'Scientific Discoveries & History (Blooket Set)')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-2 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                Blooket Format
              </span>
              <span className="text-xs text-stone-400 font-mono">5 Questions</span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
              Scientific Discoveries &amp; History
            </h4>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              Kepler&apos;s planetary motion, conductivity of silver, the Rosetta Stone, and ATP cellular bioenergetics.
            </p>
          </button>

          {/* Preset 3: Quizlet */}
          <button
            onClick={() => handleCreateHostTest(SAMPLE_QUIZLET_QUESTIONS, 'Cellular Biology Active Recall (Quizlet Set)')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-2 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Quizlet Format
              </span>
              <span className="text-xs text-stone-400 font-mono">5 Questions</span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              Cellular Biology Flashcard Deck
            </h4>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              Mitochondria, Ribosomes, Endoplasmic Reticulum, and Golgi apparatus with auto-generated distractors.
            </p>
          </button>

        </div>
      </div>

      {/* QUESTION IMPORTER MODAL */}
      <QuizImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onQuestionsImported={handleImportSuccess}
      />

    </div>
  );
};
