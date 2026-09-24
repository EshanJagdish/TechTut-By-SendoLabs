import { FriendProfile, ChatMessage } from '../types';

export const INITIAL_FRIENDS: FriendProfile[] = [];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const STUDY_PROMPT_SUGGESTIONS = [
  { label: 'Explain Intuition', prompt: 'Can you explain the intuitive concept behind ' },
  { label: 'Review Flashcard', prompt: 'Let\'s review our flashcards together on ' },
  { label: '25m Pomodoro Sprint', prompt: 'Starting a 25-minute Pomodoro focus sprint! Who is in?' },
  { label: 'Quiz Me', prompt: 'Could you quiz me with a quick question on ' },
  { label: 'Share Mnemonic', prompt: 'Here is an awesome memory trick / mnemonic I discovered: ' },
];

export const ACADEMIC_TOPIC_TAGS = [
  '#GeneralStudy',
  '#Calculus',
  '#Biochemistry',
  '#Physics',
  '#Algorithms',
  '#Chemistry',
  '#Neuroscience',
  '#ExamPrep',
  '#StudySprint',
];

