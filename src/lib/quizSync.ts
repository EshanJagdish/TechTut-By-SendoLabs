import { QuizSession, QuizQuestion, QuizSettings, CheatingViolation, QuizParticipant } from '../types';
import { SAMPLE_KAHOOT_QUESTIONS } from './quizParsers';

const BROADCAST_CHANNEL_NAME = 'techtut_quiz_arena';
const SESSIONS_STORAGE_KEY = 'techtut_quiz_sessions_v1';

// Generate guaranteed 10-digit numeric code
export function generate10DigitQuizCode(): string {
  // 10 digits: between 1000000000 and 9999999999
  const min = 1000000000;
  const max = 9999999999;
  const randomNum = Math.floor(min + Math.random() * (max - min + 1));
  return randomNum.toString();
}

// Validate 10-digit numeric code
export function isValid10DigitCode(code: string): boolean {
  const clean = code.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(clean);
}

// Format 10-digit code with spacing for readability: "8492 - 1038 - 47"
export function formatQuizCode(code: string): string {
  const clean = code.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)} - ${clean.slice(4)}`;
  return `${clean.slice(0, 4)} - ${clean.slice(4, 8)} - ${clean.slice(8)}`;
}

// Load all sessions from storage
export function getAllStoredSessions(): Record<string, QuizSession> {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return getInitialDemoSessions();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Failed to load quiz sessions from storage:', err);
    return getInitialDemoSessions();
  }
}

// Save all sessions to storage
function saveAllSessions(sessions: Record<string, QuizSession>): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save quiz sessions:', err);
  }
}

// Seed with an initial demo session so teachers and students can immediately join
function getInitialDemoSessions(): Record<string, QuizSession> {
  const demoCode = '4829103847';
  const demoSession: QuizSession = {
    code: demoCode,
    hostId: 'teacher_proctor_1',
    hostName: 'Prof. Alistair Vance',
    title: 'Computer Science & AI Honors Benchmark',
    createdAt: Date.now() - 60000,
    status: 'lobby',
    settings: {
      title: 'Computer Science & AI Honors Benchmark',
      subject: 'Computer Science',
      timerMode: 'per_question',
      timePerQuestionSeconds: 20,
      totalTestMinutes: 10,
      enforceFullScreen: true,
      switchTabsMode: false,
      shuffleQuestions: false,
      passPercentage: 70,
    },
    questions: SAMPLE_KAHOOT_QUESTIONS,
    participants: {
      'demo_student_elena': {
        id: 'demo_student_elena',
        name: 'Elena Rostova',
        joinedAt: Date.now() - 40000,
        status: 'waiting',
        currentQuestionIndex: 0,
        answers: {},
        score: 0,
        totalQuestions: SAMPLE_KAHOOT_QUESTIONS.length,
        violationsCount: 0,
        violations: [],
      },
      'demo_student_marcus': {
        id: 'demo_student_marcus',
        name: 'Marcus Brody',
        joinedAt: Date.now() - 30000,
        status: 'waiting',
        currentQuestionIndex: 0,
        answers: {},
        score: 0,
        totalQuestions: SAMPLE_KAHOOT_QUESTIONS.length,
        violationsCount: 1,
        violations: [
          {
            id: 'viol_initial_1',
            studentId: 'demo_student_marcus',
            studentName: 'Marcus Brody',
            timestamp: Date.now() - 25000,
            violationType: 'exit_fullscreen',
            details: 'Exited full screen window during test entry',
          }
        ],
      }
    },
    violationsLog: [
      {
        id: 'viol_initial_1',
        studentId: 'demo_student_marcus',
        studentName: 'Marcus Brody',
        timestamp: Date.now() - 25000,
        violationType: 'exit_fullscreen',
        details: 'Exited full screen window during test entry',
      }
    ]
  };

  const initial = { [demoCode]: demoSession };
  saveAllSessions(initial);
  return initial;
}

// Broadcast Channel wrapper
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this browser environment', e);
}

export interface QuizBroadcastEvent {
  type: 
    | 'SESSION_CREATED' 
    | 'PARTICIPANT_JOINED' 
    | 'SESSION_STARTED' 
    | 'QUESTION_ANSWERED' 
    | 'CHEATING_VIOLATION' 
    | 'STUDENT_LOCKED_OUT'
    | 'STUDENT_FORGIVEN'
    | 'STUDENT_SUBMITTED' 
    | 'SESSION_ENDED';
  code: string;
  payload: any;
  timestamp: number;
}

// Send event to all open tabs / windows
export function broadcastQuizEvent(event: QuizBroadcastEvent): void {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (err) {
      console.warn('Failed to broadcast quiz event:', err);
    }
  }
  // Also dispatch window custom event for same-window components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('techtut_quiz_message', { detail: event }));
  }
}

// Listen for broadcast events
export function subscribeToQuizEvents(listener: (event: QuizBroadcastEvent) => void): () => void {
  const handleBcMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.code) {
      listener(ev.data as QuizBroadcastEvent);
    }
  };

  const handleWindowMessage = (ev: CustomEvent) => {
    if (ev.detail && ev.detail.code) {
      listener(ev.detail as QuizBroadcastEvent);
    }
  };

  const handleStorageChange = (ev: StorageEvent) => {
    if (ev.key === SESSIONS_STORAGE_KEY && ev.newValue) {
      // General refresh event
      listener({
        type: 'SESSION_CREATED',
        code: '',
        payload: null,
        timestamp: Date.now(),
      });
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  window.addEventListener('techtut_quiz_message' as any, handleWindowMessage);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('techtut_quiz_message' as any, handleWindowMessage);
    window.removeEventListener('storage', handleStorageChange);
  };
}

// Host creates a session with 10-digit code
export function createHostSession(
  hostId: string,
  hostName: string,
  title: string,
  questions: QuizQuestion[],
  settings: QuizSettings,
  customCode?: string
): QuizSession {
  const sessions = getAllStoredSessions();
  const code = (customCode && isValid10DigitCode(customCode)) ? customCode.replace(/\D/g, '') : generate10DigitQuizCode();

  const newSession: QuizSession = {
    code,
    hostId,
    hostName,
    title,
    createdAt: Date.now(),
    status: 'lobby',
    settings,
    questions,
    participants: {},
    violationsLog: [],
  };

  sessions[code] = newSession;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'SESSION_CREATED',
    code,
    payload: newSession,
    timestamp: Date.now(),
  });

  return newSession;
}

// Student joins with 10-digit code and name
export function joinStudentSession(
  code: string,
  studentId: string,
  studentName: string
): { success: boolean; session?: QuizSession; error?: string } {
  const cleanCode = code.replace(/\D/g, '');
  if (!isValid10DigitCode(cleanCode)) {
    return { success: false, error: 'Please enter a valid 10-digit numeric code.' };
  }

  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];

  if (!session) {
    return { success: false, error: `No active exam found for code: ${cleanCode}. Check the number with your instructor.` };
  }

  const participant: QuizParticipant = {
    id: studentId,
    name: studentName,
    joinedAt: Date.now(),
    status: session.status === 'active' ? 'in_progress' : 'waiting',
    currentQuestionIndex: 0,
    answers: {},
    score: 0,
    totalQuestions: session.questions.length,
    violationsCount: 0,
    violations: [],
  };

  session.participants[studentId] = participant;
  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'PARTICIPANT_JOINED',
    code: cleanCode,
    payload: { participant, session },
    timestamp: Date.now(),
  });

  return { success: true, session };
}

// Host starts the session
export function startSessionExam(code: string): QuizSession | null {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session) return null;

  session.status = 'active';
  Object.values(session.participants).forEach(p => {
    if (p.status === 'waiting') p.status = 'in_progress';
  });

  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'SESSION_STARTED',
    code: cleanCode,
    payload: session,
    timestamp: Date.now(),
  });

  return session;
}

// Record Cheating Violation (Exited Fullscreen, Switched Tab, Window Blur)
export function logCheatingViolation(
  code: string,
  studentId: string,
  studentName: string,
  violationType: 'exit_fullscreen' | 'switch_tab' | 'window_blur',
  details: string
): CheatingViolation | null {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session) return null;

  const violation: CheatingViolation = {
    id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    studentId,
    studentName,
    timestamp: Date.now(),
    violationType,
    details,
  };

  // Add to session log
  session.violationsLog.unshift(violation);

  // Update participant's record
  if (session.participants[studentId]) {
    const p = session.participants[studentId];
    p.violationsCount = (p.violationsCount || 0) + 1;
    p.violations.unshift(violation);

    // Enforce lockout: if full screen is exited or if switchTabsMode is false and student switched tabs
    const enforceFs = session.settings.enforceFullScreen !== false;
    const disallowTabs = !session.settings.switchTabsMode;

    if (violationType === 'exit_fullscreen' && enforceFs) {
      p.isLockedOut = true;
      p.lockoutReason = 'Exited full screen mode';
      p.status = 'locked_out';
    } else if ((violationType === 'switch_tab' || violationType === 'window_blur') && disallowTabs) {
      p.isLockedOut = true;
      p.lockoutReason = 'Switched browser tabs or minimized window (Tab switching is disabled)';
      p.status = 'locked_out';
    } else if (p.violationsCount >= 3) {
      p.status = 'flagged';
    }
  }

  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  // Broadcast instantly to Host and other monitors
  broadcastQuizEvent({
    type: 'CHEATING_VIOLATION',
    code: cleanCode,
    payload: { violation, participant: session.participants[studentId] },
    timestamp: Date.now(),
  });

  return violation;
}

// Host Proctor forgives student and unlocks them to resume the quiz
export function forgiveStudentViolation(
  code: string,
  studentId: string
): { success: boolean; session?: QuizSession; participant?: QuizParticipant } {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session || !session.participants[studentId]) {
    return { success: false };
  }

  const p = session.participants[studentId];
  p.isLockedOut = false;
  p.lockoutReason = undefined;
  p.status = p.completedAt ? 'submitted' : 'in_progress';
  p.forgivenCount = (p.forgivenCount || 0) + 1;

  // Mark violations as forgiven
  p.violations.forEach(v => {
    v.forgiven = true;
    v.forgivenAt = Date.now();
  });
  session.violationsLog.forEach(v => {
    if (v.studentId === studentId) {
      v.forgiven = true;
      v.forgivenAt = Date.now();
    }
  });

  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'STUDENT_FORGIVEN',
    code: cleanCode,
    payload: { studentId, participant: p },
    timestamp: Date.now(),
  });

  return { success: true, session, participant: p };
}

// Record Student Answer
export function recordStudentAnswer(
  code: string,
  studentId: string,
  questionId: string,
  answerIndex: number,
  isCorrect: boolean,
  currentIdx: number
): void {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session || !session.participants[studentId]) return;

  const p = session.participants[studentId];
  p.answers[questionId] = answerIndex;
  p.currentQuestionIndex = currentIdx;
  if (isCorrect) {
    p.score = (p.score || 0) + 1;
  }

  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'QUESTION_ANSWERED',
    code: cleanCode,
    payload: { studentId, questionId, score: p.score, currentIdx },
    timestamp: Date.now(),
  });
}

// Student completes and submits the exam
export function completeStudentExam(code: string, studentId: string): void {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session || !session.participants[studentId]) return;

  const p = session.participants[studentId];
  p.status = 'submitted';
  p.completedAt = Date.now();

  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'STUDENT_SUBMITTED',
    code: cleanCode,
    payload: { studentId, participant: p },
    timestamp: Date.now(),
  });
}

// Host ends session
export function endHostSession(code: string): void {
  const cleanCode = code.replace(/\D/g, '');
  const sessions = getAllStoredSessions();
  const session = sessions[cleanCode];
  if (!session) return;

  session.status = 'ended';
  sessions[cleanCode] = session;
  saveAllSessions(sessions);

  broadcastQuizEvent({
    type: 'SESSION_ENDED',
    code: cleanCode,
    payload: session,
    timestamp: Date.now(),
  });
}
