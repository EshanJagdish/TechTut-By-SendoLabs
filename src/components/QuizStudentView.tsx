import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Award, 
  LogOut,
  Sparkles,
  Lock,
  Unlock,
  HeartHandshake
} from 'lucide-react';
import { QuizSession } from '../types';
import { 
  logCheatingViolation, 
  recordStudentAnswer, 
  completeStudentExam, 
  subscribeToQuizEvents, 
  getAllStoredSessions 
} from '../lib/quizSync';
import { playViolationAlarmSound } from '../lib/audioAlert';

interface QuizStudentViewProps {
  session: QuizSession;
  studentId: string;
  studentName: string;
  onExit: () => void;
}

export const QuizStudentView: React.FC<QuizStudentViewProps> = ({
  session,
  studentId,
  studentName,
  onExit,
}) => {
  const [currentSession, setCurrentSession] = useState<QuizSession>(session);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [hasStartedExam, setHasStartedExam] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);
  
  // Anti-Cheat Fullscreen & Warning State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);
  const [localViolationsCount, setLocalViolationsCount] = useState(0);
  const [wasJustForgiven, setWasJustForgiven] = useState(false);

  const participantData = currentSession.participants[studentId];
  const isLockedOut = Boolean(participantData?.isLockedOut || participantData?.status === 'locked_out');

  // Timer State
  const timeLimit = currentSession.questions[currentQuestionIndex]?.timeLimitSeconds || 20;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(timeLimit);
  const timerIntervalRef = useRef<any>(null);

  // Helper to enter full screen
  const requestFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowExitWarningModal(false);
    } catch (err) {
      console.warn('Fullscreen request blocked or not allowed in iframe:', err);
      setIsFullscreen(true); // graceful fallback
      setShowExitWarningModal(false);
    }
  };

  // Handler to safely exit or stop quiz
  const handleConfirmExitExam = () => {
    if (hasStartedExam && !isExamSubmitted) {
      completeStudentExam(currentSession.code, studentId);
    }
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    setShowConfirmExitModal(false);
    onExit();
  };

  // Report cheating incident to Host and play 2-second alert alarm
  const reportViolation = useCallback((type: 'exit_fullscreen' | 'switch_tab' | 'window_blur', details: string) => {
    if (!hasStartedExam || isExamSubmitted) return;
    setLocalViolationsCount(prev => prev + 1);
    setShowExitWarningModal(true);
    // Play urgent siren for 2 seconds on candidate screen
    playViolationAlarmSound(2.0);
    logCheatingViolation(currentSession.code, studentId, studentName, type, details);
  }, [hasStartedExam, isExamSubmitted, currentSession.code, studentId, studentName]);

  // Anti-Cheat Event Listeners (Fullscreen, Visibility, Blur)
  useEffect(() => {
    if (!hasStartedExam || isExamSubmitted) return;

    const handleFullscreenChange = () => {
      const inFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(inFs);
      if (!inFs) {
        reportViolation('exit_fullscreen', 'Exited full screen display mode during active test');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('switch_tab', 'Switched browser tab or minimized application window');
      }
    };

    const handleWindowBlur = () => {
      reportViolation('window_blur', 'Window focus lost (clicked outside test window or opened another app)');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [hasStartedExam, isExamSubmitted, reportViolation]);

  // Real-time synchronization with Host
  useEffect(() => {
    const unsubscribe = subscribeToQuizEvents((event) => {
      if (event.code === currentSession.code || !event.code) {
        const all = getAllStoredSessions();
        const updated = all[currentSession.code];
        if (updated) {
          setCurrentSession(updated);
          if (updated.status === 'ended') {
            setIsExamSubmitted(true);
          }
        }

        if (event.type === 'STUDENT_FORGIVEN' && event.payload?.studentId === studentId) {
          setWasJustForgiven(true);
          setShowExitWarningModal(false);
        }
      }
    });

    return () => unsubscribe();
  }, [currentSession.code, studentId]);

  // Next question handler
  const handleAdvanceNext = useCallback(() => {
    const currentQ = currentSession.questions[currentQuestionIndex];
    if (currentQ && selectedOption !== null) {
      const isCorrect = selectedOption === currentQ.correctAnswerIndex;
      recordStudentAnswer(
        currentSession.code,
        studentId,
        currentQ.id,
        selectedOption,
        isCorrect,
        currentQuestionIndex + 1
      );
    }

    if (currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      const nextQ = currentSession.questions[currentQuestionIndex + 1];
      setSecondsRemaining(nextQ?.timeLimitSeconds || 20);
    } else {
      // Completed all questions
      completeStudentExam(currentSession.code, studentId);
      setIsExamSubmitted(true);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [currentSession, currentQuestionIndex, selectedOption, studentId]);

  // Per-Question Countdown Timer (Pauses if student is locked out or waiting after forgiveness)
  useEffect(() => {
    if (!hasStartedExam || isExamSubmitted || isLockedOut || wasJustForgiven) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAdvanceNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [hasStartedExam, isExamSubmitted, isLockedOut, wasJustForgiven, currentQuestionIndex, handleAdvanceNext]);

  // Resume test in fullscreen after teacher forgiveness
  const handleResumeAfterForgive = async () => {
    await requestFullScreen();
    setWasJustForgiven(false);
    setShowExitWarningModal(false);
  };

  // Start Exam after reviewing anti-cheat policy
  const handleStartExamNow = async () => {
    await requestFullScreen();
    setHasStartedExam(true);
    const firstQ = currentSession.questions[0];
    setSecondsRemaining(firstQ?.timeLimitSeconds || 20);
  };

  const currentQ = currentSession.questions[currentQuestionIndex];
  const finalScore = participantData?.score || 0;
  const totalQuestions = currentSession.questions.length || 1;
  const percentage = Math.round((finalScore / totalQuestions) * 100);

  // OPTION COLOR SCHEMES (Kahoot / Blooket Inspired Aesthetics)
  const optionThemes = [
    { bg: 'bg-red-500/15 border-red-500/30 hover:bg-red-500/25 text-red-100', active: 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/30', badge: 'bg-red-500 text-white' },
    { bg: 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25 text-blue-100', active: 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30', badge: 'bg-blue-500 text-white' },
    { bg: 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25 text-amber-100', active: 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/30', badge: 'bg-amber-500 text-white' },
    { bg: 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-100', active: 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30', badge: 'bg-emerald-500 text-white' },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-4xl mx-auto px-4 py-6">
      
      {/* 1. SECURE FULLSCREEN ENTRY SCREEN */}
      {!hasStartedExam && (
        <div className="rounded-3xl bg-stone-900 border border-white/15 p-6 sm:p-10 shadow-2xl space-y-6 text-center max-w-2xl mx-auto animate-in fade-in">
          
          <div className="w-16 h-16 rounded-3xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">
              Exam Code: {session.code}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {currentSession.title}
            </h2>
            <p className="text-sm text-stone-400">
              Student Candidate: <strong className="text-white">{studentName}</strong>
            </p>
          </div>

          {/* Anti-Cheating & Full Screen Rules Notice */}
          <div className="p-5 rounded-2xl bg-black/40 border border-red-500/30 text-left space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Teacher Exam Integrity Policy</span>
            </div>
            <ul className="text-xs text-stone-300 space-y-2 list-disc list-inside">
              <li>
                <strong>Teacher-Enforced Full Screen:</strong> This test requires full screen mode.
              </li>
              <li className="text-amber-300 font-semibold">
                <strong>Exit Lockout Rule:</strong> If you exit full screen, your test will be immediately locked and you will not be able to play until your teacher clicks &ldquo;Forgive&rdquo; on the host screen!
              </li>
              <li>
                <strong>Switch Tabs Mode:</strong>{' '}
                <strong className={currentSession.settings.switchTabsMode ? 'text-blue-300' : 'text-red-300'}>
                  {currentSession.settings.switchTabsMode ? 'YES (Allowed)' : 'NO (Disabled - Switching tabs triggers lockout)'}
                </strong>
              </li>
              <li>Questions are timed with an automatic countdown.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onExit()}
              className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit to Arena</span>
            </button>
            <button
              onClick={handleStartExamNow}
              className="flex-1 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-base shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Maximize2 className="w-5 h-5" />
              <span>Enter Secure Full Screen &amp; Begin Test</span>
            </button>
          </div>

        </div>
      )}

      {/* 2. ACTIVE SECURE EXAM SCREEN */}
      {hasStartedExam && !isExamSubmitted && currentQ && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Top Test Status Bar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/90 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white">
                Question {currentQuestionIndex + 1} of {currentSession.questions.length}
              </span>
              {currentQ.source && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-stone-300 uppercase font-mono tracking-wider">
                  {currentQ.source}
                </span>
              )}
            </div>

            {/* Countdown Timer */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
              secondsRemaining <= 5 
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                : 'bg-white/10 text-orange-300 border-white/10'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{secondsRemaining}s</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Anti-cheat status pill */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Proctored Fullscreen</span>
              </div>

              {/* Exit or Stop Quiz button */}
              <button
                id="student-exit-quiz-btn"
                onClick={() => setShowConfirmExitModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-200 text-xs font-semibold transition-all cursor-pointer"
                title="Stop or Exit Quiz"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Quiz</span>
              </button>
            </div>
          </div>

          {/* Visual Countdown Progress Bar */}
          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-1000 ${
                secondsRemaining <= 5 ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${(secondsRemaining / (currentQ.timeLimitSeconds || 20)) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-white/15 shadow-2xl space-y-6">
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* 4 Multiple Choice Options (Kahoot / Blooket Style Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const theme = optionThemes[idx % optionThemes.length];

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-4 rounded-2xl border text-left font-medium text-sm transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-98 ${
                      isSelected ? theme.active : theme.bg
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${theme.badge}`}>
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <span className="truncate">{option}</span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-400">
                Candidate: <strong className="text-white">{studentName}</strong>
              </span>

              <button
                onClick={handleAdvanceNext}
                disabled={selectedOption === null}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{currentQuestionIndex === currentSession.questions.length - 1 ? 'Submit Final Exam' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 3. EXAM SUBMITTED / COMPLETED SUMMARY SCREEN */}
      {isExamSubmitted && (
        <div className="rounded-3xl bg-stone-900 border border-white/15 p-8 sm:p-12 shadow-2xl space-y-6 text-center max-w-xl mx-auto animate-in zoom-in-95">
          
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Exam Submitted Successfully!
            </h2>
            <p className="text-sm text-stone-400">
              Great work, <strong className="text-white">{studentName}</strong>. Your answers have been registered by the proctor.
            </p>
          </div>

          {/* Score Card */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Final Candidate Score
            </span>
            <div className="text-4xl font-extrabold text-white">
              {finalScore} <span className="text-xl text-stone-500">/ {totalQuestions}</span>
            </div>
            <div className="text-sm font-semibold text-emerald-400">
              {percentage}% Accuracy
            </div>
          </div>

          {/* Violations Summary */}
          {localViolationsCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Note: {localViolationsCount} window exit violation{localViolationsCount > 1 ? 's were' : ' was'} recorded and reported to your instructor.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Perfect Integrity: Zero fullscreen exits or tab changes detected.</span>
            </div>
          )}

          <button
            onClick={onExit}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Quiz Hub</span>
          </button>

        </div>
      )}

      {/* 4. MODAL: TEACHER LOCKOUT SCREEN (FULLSCREEN EXITED - REQUIRES FORGIVE) */}
      {isLockedOut && !isExamSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="bg-stone-950 border-2 border-red-500 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl text-center space-y-6">
            
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-3xl bg-red-500/30 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-inner">
                <Lock className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-600 text-white shadow-md">
                Exam Locked Out
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">
                Teacher Forgiveness Required
              </h2>
              <p className="text-xs sm:text-sm text-red-200 leading-relaxed max-w-md mx-auto">
                You exited full screen mode during this test. The teacher requires full screen. You cannot play or answer questions until your teacher presses <strong>&ldquo;Forgive&rdquo;</strong> on the host monitor.
              </p>
            </div>

            {/* Violation & Student Details */}
            <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Candidate:</span>
                <strong className="text-white">{studentName}</strong>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Lockout Reason:</span>
                <span className="text-red-300 font-semibold">{participantData?.lockoutReason || 'Exited Full Screen Mode'}</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Status:</span>
                <span className="text-amber-400 font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Locked • Awaiting Teacher to Forgive...
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-[11px] text-stone-300 space-y-1">
              <p className="font-semibold text-red-300 flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>What should I do?</span>
              </p>
              <p className="text-stone-400">
                Please raise your hand or tell your teacher. Once your teacher clicks &ldquo;Forgive Student&rdquo; on their host screen, your test will unlock automatically.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL: TEACHER FORGIVEN SCREEN (RE-ENTER FULL SCREEN TO PLAY) */}
      {wasJustForgiven && !isLockedOut && !isExamSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="bg-stone-950 border-2 border-emerald-500 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
              <Unlock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                Violation Forgiven!
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">
                Your Teacher Forgave You!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed max-w-md mx-auto">
                Your instructor has forgiven your violation and unlocked your exam. Re-enter full screen to continue playing your questions.
              </p>
            </div>

            <button
              onClick={handleResumeAfterForgive}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
              <span>Re-Enter Full Screen &amp; Resume Playing</span>
            </button>

          </div>
        </div>
      )}

      {/* 6. MODAL: ANTI-CHEAT FULLSCREEN EXIT ALERT (NON-LOCKOUT WARNING) */}
      {showExitWarningModal && !isLockedOut && !wasJustForgiven && !isExamSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-stone-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                SECURITY ALERT: Full Screen Exited!
              </h3>
              <p className="text-xs text-red-300 leading-relaxed">
                You exited full screen mode or navigated away from the exam window.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-[11px] text-stone-300 text-left space-y-1">
              <p><strong>Candidate:</strong> {studentName}</p>
              <p><strong>Incident:</strong> Fullscreen Exit / Tab Switch</p>
              <p className="text-red-400 font-semibold">
                ⚠️ Your name and timestamp have been reported to the teacher&apos;s Host Screen.
              </p>
            </div>

            <button
              onClick={requestFullScreen}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Resume Full Screen Exam Now</span>
            </button>

          </div>
        </div>
      )}

      {/* 7. MODAL: CONFIRM EXIT / STOP QUIZ */}
      {showConfirmExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-md">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Stop &amp; Exit Quiz?</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Are you sure you want to stop and exit this exam? Your current progress and submitted answers will be finalized.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmExitModal(false)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Stay in Quiz
              </button>
              <button
                id="confirm-exit-quiz-btn"
                onClick={handleConfirmExitExam}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Exit Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
