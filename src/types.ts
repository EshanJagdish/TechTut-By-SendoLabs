export type EducationLevel = 
  | 'school' 
  | 'high_school' 
  | 'college' 
  | 'university' 
  | 'adult';

export type AppMode = 
  | 'study' 
  | 'addon' 
  | 'games' 
  | 'music' 
  | 'quiz'
  | 'account' 
  | 'workspace'
  | 'dev_blueprint';

export type DreamyTheme = 
  | 'aurora_violet'
  | 'starlight_blue'
  | 'cosmic_midnight'
  | 'celestial_rose'
  | 'starlight' 
  | 'twilight' 
  | 'aurora' 
  | 'sunset' 
  | 'midnight';

export interface CelestialNote {
  id: string;
  userId?: string;
  title: string;
  content: string;
  topic?: string;
  color?: string; // e.g., 'violet' | 'sky' | 'amber' | 'emerald' | 'rose'
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  alternateLink?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  materials?: Array<{
    driveFile?: { driveFile: { id: string; title: string; alternateLink: string } };
    youtubeVideo?: { id: string; title: string; alternateLink: string };
    link?: { url: string; title: string };
    form?: { formUrl: string; title: string };
  }>;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface StepItem {
  stepNumber: number;
  title: string;
  explanation: string;
  derivation?: string;
  keyTakeaway?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  mnemonic?: string;
  topic: string;
  mastered?: boolean;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface StudyRecommendations {
  breakPacing: string;
  studyRhythm: string;
  recommendedMood: string;
  ambientSoundtrack: string;
  hydrationTip: string;
}

export interface StudySolution {
  id: string;
  question: string;
  topic: string;
  level: EducationLevel;
  timestamp: number;
  questionType?: 'calculation' | 'conceptual' | 'humanities' | 'coding' | 'test_prep';
  dreamySummary: string;
  conceptOrigin: string;
  steps: StepItem[];
  followUpQuestions: string[];
  flashcards: FlashcardItem[];
  extraTips: string[];
  memoryTricks: string[];
  practiceQuestions: PracticeQuestion[];
  recommendations: StudyRecommendations;
}

export interface AddOnInsight {
  id: string;
  originStudyId?: string;
  topic: string;
  level: EducationLevel;
  timestamp: number;
  deepInsights: string[];
  examShortcuts: { shortcut: string; whenToUse: string }[];
  memoryPalaceAnchors: { visualAnchor: string; conceptLink: string }[];
  progressivePractice: PracticeQuestion[];
  dreamyAdvice: {
    environmentSetup: string;
    lightingAndScent: string;
    circadianTiming: string;
    mindsetPacing: string;
    soundscapeSuggestion: string;
  };
}

export type GameArchetype = 'blitz' | 'matching' | 'sequence' | 'diagram_detective';

export interface GeneratedAiGame {
  id: string;
  title: string;
  archetype: GameArchetype;
  topic: string;
  sourceType: 'text' | 'image' | 'hybrid';
  imageUrl?: string;
  description: string;
  rules: string;
  targetLevel: EducationLevel;
  blitzQuestions?: {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    points: number;
  }[];
  matchingPairs?: {
    id: string;
    term: string;
    match: string;
    category?: string;
  }[];
  sequenceSteps?: {
    id: string;
    text: string;
    order: number;
    hint: string;
  }[];
  diagramChallenges?: {
    id: string;
    clue: string;
    targetLabel: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  xpReward: number;
  stardustReward: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'celestial' | 'legendary';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardXp: number;
  rewardStardust: number;
  completed: boolean;
}

export interface EmailPreferences {
  dailyStudyReminder: boolean;
  weeklyProgressDigest: boolean;
  streakFreezeAlert: boolean;
  reminderTime: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
  emailPreferences?: EmailPreferences;
  title: string;
  avatar: string;
  level: EducationLevel;
  theme: DreamyTheme;
  xp: number;
  stardust: number;
  currentStreak: number;
  bestStreak: number;
  studyHoursTotal?: number;
  favoriteTopics?: string[];
  badges: Badge[];
  savedFlashcards: FlashcardItem[];
  savedAnswers: StudySolution[];
  savedAddOns?: AddOnInsight[];
  unlockedBadges?: string[];
  dailyChallenges?: DailyChallenge[];
  history?: any[];
}

export interface MusicTrack {
  id: string;
  title: string;
  subtitle: string;
  category: 'dreamy' | 'calm' | 'focus' | 'night' | 'soft_lofi';
  moodTags: string[];
  color: string;
  bpm: number;
  key: string;
  description: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: EducationLevel;
  majorOrFocus: string;
  status: 'studying' | 'online' | 'focus_sprint' | 'offline';
  currentTopic?: string;
  studyStreak: number;
  xp: number;
  stardust: number;
  sharedFlashcardCount: number;
  bio?: string;
  badges: string[];
  joinedDate: string;
  isAiPeer?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string; // 'class_lounge' or specific friend ID
  text: string;
  timestamp: number;
  type?: 'text' | 'flashcard_share' | 'study_prompt' | 'pomodoro_invite' | 'solution_share';
  sharedItem?: {
    title: string;
    topic?: string;
    front?: string;
    back?: string;
    mnemonic?: string;
  };
  studyTag?: string; // e.g., '#Calculus', '#OrganicChem', '#Sprint'
}

export type QuizSourceType = 'kahoot' | 'blooket' | 'quizlet' | 'custom';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 4 multiple choice options
  correctAnswerIndex: number; // 0, 1, 2, 3
  explanation?: string;
  timeLimitSeconds?: number; // e.g. 20s, 30s
  points?: number;
  source?: QuizSourceType;
}

export interface QuizSettings {
  title: string;
  subject: string;
  timerMode: 'per_question' | 'total_test' | 'untimed';
  timePerQuestionSeconds: number; // 15, 20, 30, 60
  totalTestMinutes: number; // 5, 10, 15, 30
  enforceFullScreen: boolean; // Anti-cheat fullscreen enforcement
  switchTabsMode: boolean; // Switch tabs mode option: true = allowed ("Yes"), false = prohibited ("No")
  shuffleQuestions: boolean;
  passPercentage: number;
}

export interface CheatingViolation {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: number;
  violationType: 'exit_fullscreen' | 'switch_tab' | 'window_blur';
  details: string;
  forgiven?: boolean;
  forgivenAt?: number;
}

export interface QuizParticipant {
  id: string;
  name: string;
  joinedAt: number;
  status: 'waiting' | 'in_progress' | 'submitted' | 'flagged' | 'locked_out';
  isLockedOut?: boolean;
  lockoutReason?: string;
  forgivenCount?: number;
  currentQuestionIndex: number;
  answers: Record<string, number>; // questionId -> selectedIndex
  score: number;
  totalQuestions: number;
  violationsCount: number;
  violations: CheatingViolation[];
  completedAt?: number;
}

export interface QuizSession {
  code: string; // 10-digit numeric string only
  hostId: string;
  hostName: string;
  title: string;
  createdAt: number;
  status: 'lobby' | 'active' | 'ended';
  settings: QuizSettings;
  questions: QuizQuestion[];
  participants: Record<string, QuizParticipant>;
  violationsLog: CheatingViolation[];
}

