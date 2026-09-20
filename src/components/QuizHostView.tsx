import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Play, 
  Square, 
  ShieldAlert, 
  Clock, 
  Copy, 
  Check, 
  UploadCloud, 
  Trophy, 
  AlertTriangle, 
  ArrowLeft,
  Settings2,
  ListOrdered,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { QuizSession, QuizQuestion, QuizSourceType, QuizParticipant } from '../types';
import { 
  formatQuizCode, 
  startSessionExam, 
  endHostSession, 
  subscribeToQuizEvents, 
  getAllStoredSessions,
  forgiveStudentViolation
} from '../lib/quizSync';
import { playViolationAlarmSound } from '../lib/audioAlert';
import { QuizImporterModal } from './QuizImporterModal';

interface QuizHostViewProps {
  session: QuizSession;
  onUpdateSession: (updated: QuizSession) => void;
  onBackToHub: () => void;
}

export const QuizHostView: React.FC<QuizHostViewProps> = ({
  session,
  onUpdateSession,
  onBackToHub,
}) => {
  const [currentSession, setCurrentSession] = useState<QuizSession>(session);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [showConfirmStopModal, setShowConfirmStopModal] = useState(false);
  const [recentViolationAlert, setRecentViolationAlert] = useState<{
    studentName: string;
    type: string;
    time: string;
  } | null>(null);
  const [forgiveNotification, setForgiveNotification] = useState<string | null>(null);

  const handleForgiveStudent = (studentId: string, studentName: string) => {
    const result = forgiveStudentViolation(currentSession.code, studentId);
    if (result.success && result.session) {
      setCurrentSession(result.session);
      onUpdateSession(result.session);
      setForgiveNotification(`Forgave ${studentName}. Student has been unlocked to resume test.`);
      setTimeout(() => setForgiveNotification(null), 4000);
    }
  };

  // Sync state with local storage updates and broadcast events
  useEffect(() => {
    const unsubscribe = subscribeToQuizEvents((event) => {
      if (event.code === currentSession.code || !event.code) {
        const all = getAllStoredSessions();
        const updated = all[currentSession.code];
        if (updated) {
          setCurrentSession(updated);
          onUpdateSession(updated);

          // If cheating violation occurred, trigger top alert and 2-second sound alarm
          if (event.type === 'CHEATING_VIOLATION' && event.payload?.violation) {
            playViolationAlarmSound(2.0);
            const v = event.payload.violation;
            setRecentViolationAlert({
              studentName: v.studentName,
              type: v.violationType === 'exit_fullscreen' ? 'Exited Full Screen' : 'Switched Tab / Focus Lost',
              time: new Date(v.timestamp).toLocaleTimeString(),
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentSession.code, onUpdateSession]);

  const handleConfirmStopAndExit = () => {
    if (currentSession.status === 'active') {
      handleEndExam();
    }
    setShowConfirmStopModal(false);
    onBackToHub();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSession.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleStartExam = () => {
    const started = startSessionExam(currentSession.code);
    if (started) {
      setCurrentSession(started);
      onUpdateSession(started);
    }
  };

  const handleEndExam = () => {
    endHostSession(currentSession.code);
    const all = getAllStoredSessions();
    const ended = all[currentSession.code];
    if (ended) {
      setCurrentSession(ended);
      onUpdateSession(ended);
    }
  };

  const handleQuestionsImported = (questions: QuizQuestion[], source: QuizSourceType, title?: string) => {
    const all = getAllStoredSessions();
    const updated: QuizSession = {
      ...currentSession,
      title: title || currentSession.title,
      questions,
    };
    all[currentSession.code] = updated;
    try {
      localStorage.setItem('techtut_quiz_sessions_v1', JSON.stringify(all));
    } catch {}
    setCurrentSession(updated);
    onUpdateSession(updated);
  };

  const participantsList: QuizParticipant[] = Object.values(currentSession.participants || {});
  const completedCount = participantsList.filter(p => p.status === 'submitted').length;
  const inProgressCount = participantsList.filter(p => p.status === 'in_progress').length;
  const waitingCount = participantsList.filter(p => p.status === 'waiting').length;
  const totalViolations = currentSession.violationsLog?.length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (currentSession.status === 'active') {
                setShowConfirmStopModal(true);
              } else {
                onBackToHub();
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 border border-white/10 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Host View</span>
          </button>

          {currentSession.status === 'active' && (
            <button
              id="host-stop-quiz-btn"
              onClick={() => setShowConfirmStopModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
              title="Stop and end the active quiz for all students"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Quiz</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400">Host Status:</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            currentSession.status === 'active' 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
              : currentSession.status === 'ended'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {currentSession.status === 'active' ? '● Test In Progress' : currentSession.status === 'ended' ? 'Test Concluded' : 'Lobby Open (Waiting for Students)'}
          </span>
        </div>
      </div>

      {/* TEACHER FORGIVE NOTIFICATION BANNER */}
      {forgiveNotification && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Student Violation Forgiven!
              </h4>
              <p className="text-xs text-emerald-200">
                {forgiveNotification}
              </p>
            </div>
          </div>
          <button
            onClick={() => setForgiveNotification(null)}
            className="text-xs text-stone-400 hover:text-white px-2.5 py-1 rounded-lg bg-black/30 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* RECENT CHEATING VIOLATION BANNER ALERT */}
      {recentViolationAlert && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Anti-Cheat Security Triggered!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 font-mono">
                  {recentViolationAlert.time}
                </span>
              </h4>
              <p className="text-xs text-red-200">
                Student <strong className="text-white underline">{recentViolationAlert.studentName}</strong> {recentViolationAlert.type.toLowerCase()} during secure exam mode!
              </p>
            </div>
          </div>

          <button
            onClick={() => setRecentViolationAlert(null)}
            className="text-xs text-stone-400 hover:text-white px-2.5 py-1 rounded-lg bg-black/30 cursor-pointer"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* MAIN HOST HEADER & 10-DIGIT CODE CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 border border-white/15 p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left: Test Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30">
                Teacher Proctor Monitor
              </span>
              <span className="text-xs text-stone-400">Hosted by {currentSession.hostName}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {currentSession.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {currentSession.settings.timerMode === 'per_question' 
                  ? `${currentSession.settings.timePerQuestionSeconds}s timer / question` 
                  : `${currentSession.settings.totalTestMinutes}m total test timer`}
              </span>
              <span className="flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                {currentSession.questions.length} Questions
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                {currentSession.settings.enforceFullScreen !== false ? 'Teacher Enforced Full Screen' : 'Full Screen Optional'}
              </span>
              <span className={`flex items-center gap-1.5 font-semibold ${
                currentSession.settings.switchTabsMode ? 'text-blue-400' : 'text-amber-400'
              }`}>
                <span>Switch Tabs Mode:</span>
                <strong className="underline">{currentSession.settings.switchTabsMode ? 'Yes (Allowed)' : 'No (Strict Lock)'}</strong>
              </span>
            </div>
          </div>

          {/* Right: THE 10-DIGIT CODE CARD */}
          <div className="p-4 rounded-2xl bg-black/60 border border-orange-500/40 shadow-inner flex flex-col items-center justify-center text-center sm:min-w-[280px]">
            <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-widest">
              Student Join Code (10-Digit)
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider my-1">
              {formatQuizCode(currentSession.code)}
            </div>
            <p className="text-[10px] text-stone-400 mb-2">Numbers only • Give this code to students</p>
            
            <button
              onClick={handleCopyCode}
              className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>10-Digit Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy 10-Digit Code</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Action Controls (Start / End / Import) */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImporterOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-purple-400" />
              <span>Import from Kahoot / Blooket / Quizlet</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentSession.status === 'lobby' && (
              <button
                onClick={handleStartExam}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Secure Exam ({participantsList.length} Students Joined)</span>
              </button>
            )}

            {currentSession.status === 'active' && (
              <button
                onClick={handleEndExam}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>End Test & Collect Scores</span>
              </button>
            )}

            {currentSession.status === 'ended' && (
              <span className="text-xs font-semibold text-purple-300">
                Exam completed. Review final student leaderboard below.
              </span>
            )}
          </div>

        </div>

      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Enrolled Students</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {participantsList.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>In Progress</span>
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {inProgressCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Submitted Tests</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {completedCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Cheating Flags</span>
          </div>
          <div className={`text-2xl font-bold ${totalViolations > 0 ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
            {totalViolations}
          </div>
        </div>
      </div>

      {/* SPLIT VIEW: LIVE STUDENT ROSTER & ANTI-CHEAT SECURITY LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Connected Students Table */}
        <div className="lg:col-span-2 rounded-3xl bg-stone-900/80 border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Student Roster & Progress ({participantsList.length})</span>
            </h3>
            <span className="text-xs text-stone-400">Real-time status updates</span>
          </div>

          {participantsList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/20 border border-dashed border-white/10 space-y-2">
              <Users className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">No students connected yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Direct students to click &quot;Join a Test&quot; and enter the 10-digit code{' '}
                <strong className="text-orange-400 font-mono">{formatQuizCode(currentSession.code)}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {participantsList.map((p) => {
                const totalQ = currentSession.questions.length || 1;
                const answeredCount = Object.keys(p.answers || {}).length;
                const percentDone = Math.round((answeredCount / totalQ) * 100);

                const isLocked = p.isLockedOut || p.status === 'locked_out';

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLocked
                        ? 'bg-red-950/40 border-red-500/70 shadow-lg shadow-red-500/10'
                        : p.violationsCount > 0
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm ${
                        isLocked 
                          ? 'bg-red-500/20 border-red-500/40 text-red-300' 
                          : 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                      }`}>
                        {isLocked ? <Lock className="w-4 h-4 text-red-400" /> : p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-semibold text-white">
                            {p.name}
                          </h4>
                          {isLocked && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold flex items-center gap-1 shadow-xs animate-pulse">
                              <Lock className="w-3 h-3" />
                              <span>LOCKED OUT: {p.lockoutReason || 'Exited Full Screen'}</span>
                            </span>
                          )}
                          {!isLocked && p.violationsCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>{p.violationsCount} Violation{p.violationsCount > 1 ? 's' : ''}</span>
                            </span>
                          )}
                          {p.forgivenCount && p.forgivenCount > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Forgiven ({p.forgivenCount}x)</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-stone-400">
                          Joined at {new Date(p.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap justify-end">
                      {/* TEACHER FORGIVE ACTION BUTTON */}
                      {isLocked && (
                        <button
                          onClick={() => handleForgiveStudent(p.id, p.name)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          title="Click to forgive violation and unlock student's exam"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Forgive Student</span>
                        </button>
                      )}

                      {/* Progress */}
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {p.status === 'submitted' ? (
                            <span className="text-emerald-400 font-bold">
                              Score: {p.score} / {totalQ} ({Math.round((p.score / totalQ) * 100)}%)
                            </span>
                          ) : (
                            <span>Q {answeredCount} of {totalQ}</span>
                          )}
                        </div>
                        <span className={`text-[10px] capitalize font-medium ${
                          isLocked 
                            ? 'text-red-400 font-bold' 
                            : p.status === 'submitted' 
                            ? 'text-emerald-400' 
                            : p.status === 'in_progress' 
                            ? 'text-amber-400' 
                            : 'text-stone-400'
                        }`}>
                          {isLocked ? 'Locked (Waiting Forgiveness)' : p.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Mini progress pill */}
                      <div className="w-16 bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isLocked ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: ANTI-CHEAT SECURITY AUDIT LOG */}
        <div className="rounded-3xl bg-stone-900/80 border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">Anti-Cheat Audit Log</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
              Live Monitor
            </span>
          </div>

          <p className="text-xs text-stone-400">
            When any student exits fullscreen, switches tabs, or unfocuses the test window, their name and timestamp appear below immediately:
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {!currentSession.violationsLog || currentSession.violationsLog.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-black/20 border border-white/5 space-y-1 text-stone-500 text-xs">
                <Check className="w-6 h-6 text-emerald-500/50 mx-auto mb-1" />
                <p className="font-semibold text-stone-400">No violations recorded</p>
                <p>All active participants are conforming to full screen exam integrity.</p>
              </div>
            ) : (
              currentSession.violationsLog.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white underline">
                      {v.studentName}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-300 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>
                      {v.violationType === 'exit_fullscreen' ? 'Exited Full Screen' : 'Switched Tab / Clicked Outside'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <p className="text-[10px] text-stone-400 italic">
                      {v.details}
                    </p>
                    {v.forgiven ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                        Forgiven
                      </span>
                    ) : (
                      <button
                        onClick={() => handleForgiveStudent(v.studentId, v.studentName)}
                        className="text-[10px] px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Forgive</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL: CONFIRM STOP OR EXIT QUIZ (HOST) */}
      {showConfirmStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-md">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Stop Quiz for All Students?</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Ending this quiz session will immediately stop all ongoing student tests, collect current responses, and compile the final scoreboard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmStopModal(false)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Quiz Running
              </button>
              <button
                id="confirm-host-stop-quiz-btn"
                onClick={handleConfirmStopAndExit}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Stop &amp; Conclude
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORTER MODAL */}
      <QuizImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onQuestionsImported={handleQuestionsImported}
      />

    </div>
  );
};
