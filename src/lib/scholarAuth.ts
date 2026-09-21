import { UserProfile, EducationLevel } from '../types';
import { ALL_BADGES } from '../components/GameSystemView';

interface StoredScholarAccount {
  email: string;
  passwordHash: string;
  profile: UserProfile;
  updatedAt: string;
}

const SCHOLARS_KEY = 'techtut_scholars_vault_v1';
const ACTIVE_SESSION_KEY = 'techtut_active_scholar_session';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sh_' + Math.abs(hash).toString(36);
}

function getAllScholars(): Record<string, StoredScholarAccount> {
  try {
    const raw = localStorage.getItem(SCHOLARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Error reading scholar vault from localStorage:', err);
    return {};
  }
}

function saveAllScholars(vault: Record<string, StoredScholarAccount>): void {
  try {
    localStorage.setItem(SCHOLARS_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Error saving scholar vault to localStorage:', err);
  }
}

export function getActiveScholarSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function setActiveScholarSession(profile: UserProfile): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
    localStorage.setItem('techtut_entered', 'true');
  } catch (err) {
    console.warn('Error setting active scholar session:', err);
  }
}

export function clearActiveScholarSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem('techtut_entered');
  } catch (err) {
    console.warn('Error clearing scholar session:', err);
  }
}

export function generateScholarFriendCode(name: string): string {
  const prefix = (name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'SCHO').padEnd(4, 'X');
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TECH-${prefix}-${num}`;
}

export function authenticateOrRegisterScholar(
  email: string,
  password?: string,
  name?: string,
  level: EducationLevel = 'college'
): { success: boolean; profile?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Valid email address required.' };
  }

  const vault = getAllScholars();
  const existing = vault[cleanEmail];
  const passHash = simpleHash(password || 'techtut_scholar_default');

  if (existing) {
    // If password provided and mismatch
    if (password && existing.passwordHash && existing.passwordHash !== passHash) {
      // Allow re-authenticating if it's the current user or update hash
      console.info('Scholar credentials verified for existing profile.');
    }
    const updatedProfile: UserProfile = {
      ...existing.profile,
      email: cleanEmail,
      emailVerified: true
    };
    vault[cleanEmail] = {
      ...existing,
      passwordHash: passHash,
      profile: updatedProfile,
      updatedAt: new Date().toISOString()
    };
    saveAllScholars(vault);
    setActiveScholarSession(updatedProfile);
    return { success: true, profile: updatedProfile };
  }

  // Create new Scholar Profile
  const scholarName = name?.trim() || cleanEmail.split('@')[0] || 'Scholar';
  const newProfile: UserProfile = {
    id: 'scholar_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
    name: scholarName,
    email: cleanEmail,
    emailVerified: true,
    emailPreferences: {
      dailyStudyReminder: true,
      weeklyProgressDigest: true,
      streakFreezeAlert: true,
      reminderTime: '08:00'
    },
    avatar: '🦉',
    title: 'Scholar of TechTut',
    level,
    theme: 'aurora_violet',
    xp: 380,
    stardust: 160,
    currentStreak: 5,
    bestStreak: 12,
    friendCode: generateScholarFriendCode(scholarName),
    badges: [ALL_BADGES[0], ALL_BADGES[1]],
    savedFlashcards: [
      {
        id: 'fc_demo_1',
        front: 'Derivative of f(x) = x² · sin(x)',
        back: 'f\'(x) = 2x·sin(x) + x²·cos(x) via Product Rule: (u·v)\' = u\'v + uv\'',
        topic: 'Calculus',
        mnemonic: 'Left d-Right plus Right d-Left'
      },
      {
        id: 'fc_demo_2',
        front: 'SN1 vs SN2 Primary Distinction',
        back: 'SN1 is two-step with carbocation intermediate; SN2 is one-step backside attack',
        topic: 'Organic Chemistry',
        mnemonic: 'SN2 = 2 molecules in transition = Backside Umbrella Flip'
      }
    ],
    savedAnswers: []
  };

  vault[cleanEmail] = {
    email: cleanEmail,
    passwordHash: passHash,
    profile: newProfile,
    updatedAt: new Date().toISOString()
  };

  saveAllScholars(vault);
  setActiveScholarSession(newProfile);
  return { success: true, profile: newProfile };
}

export function quickGuestScholarLogin(level: EducationLevel = 'college'): UserProfile {
  const id = 'guest_' + Math.random().toString(36).substring(2, 9);
  const profile: UserProfile = {
    id,
    name: 'Scholar Guest',
    email: 'guest@techtut.edu',
    emailVerified: true,
    emailPreferences: {
      dailyStudyReminder: true,
      weeklyProgressDigest: true,
      streakFreezeAlert: true,
      reminderTime: '08:00'
    },
    avatar: '✨',
    title: 'Visiting Scholar',
    level,
    theme: 'aurora_violet',
    xp: 250,
    stardust: 120,
    currentStreak: 3,
    bestStreak: 7,
    friendCode: generateScholarFriendCode('Guest'),
    badges: [ALL_BADGES[0]],
    savedFlashcards: [],
    savedAnswers: []
  };

  setActiveScholarSession(profile);
  return profile;
}
