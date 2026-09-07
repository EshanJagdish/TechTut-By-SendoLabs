import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  UserProfile, 
  FlashcardItem, 
  StudySolution, 
  CelestialNote,
  ClassroomCourse,
  ClassroomCourseWork,
  DriveFile
} from '../types';

// 1. Initialize Firebase App & Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration: client is offline.");
    }
  }
}
testConnection();

// 3. Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const isOffline = errMessage.toLowerCase().includes('offline') || (error as any)?.code === 'unavailable';

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  if (isOffline) {
    console.warn('Firestore offline status notice: ', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

// 4. Google Auth Provider with Classroom, Keep Notes, & Drive scopes
export const googleProvider = new GoogleAuthProvider();
const provider = googleProvider;

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
};
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-Memory Token Caching (Strict: NEVER stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Email & Password Authentication Operations
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
};

export const resetPasswordWithEmail = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const verifyCurrentEmail = async (): Promise<void> => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  } else {
    throw new Error('No scholar account is currently signed in.');
  }
};

export const changeUserEmail = async (newEmail: string): Promise<void> => {
  if (auth.currentUser) {
    await updateEmail(auth.currentUser, newEmail.trim());
  } else {
    throw new Error('No scholar account is currently signed in.');
  }
};

// 5. Cloud Firestore Account Sync
export const syncUserProfileToFirestore = async (user: User, profile: UserProfile): Promise<void> => {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      name: profile.name || user.displayName || 'Luna Scholar',
      email: user.email || profile.email || '',
      emailVerified: user.emailVerified || !!profile.emailVerified,
      emailPreferences: profile.emailPreferences || {
        dailyStudyReminder: true,
        weeklyProgressDigest: true,
        streakFreezeAlert: true,
        reminderTime: '08:00'
      },
      avatar: profile.avatar || '🦉',
      title: profile.title || 'Luna Scholar of SendoLabs',
      level: profile.level || 'college',
      theme: profile.theme || 'aurora_violet',
      xp: profile.xp || 0,
      stardust: profile.stardust || 0,
      currentStreak: profile.currentStreak || 1,
      bestStreak: profile.bestStreak || 1,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('offline') || err?.code === 'unavailable') {
      console.warn('Firestore offline: user profile persisted in local scholar cache.');
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const loadUserProfileFromFirestore = async (userId: string): Promise<Partial<UserProfile> | null> => {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserProfile>;
    }
    return null;
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('offline') || err?.code === 'unavailable') {
      console.warn('Firestore offline: scholar profile running from local session.');
      return null;
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
};

// 6. Flashcard Firestore Operations
export const saveFlashcardToFirestore = async (userId: string, card: FlashcardItem): Promise<void> => {
  const path = `users/${userId}/flashcards/${card.id}`;
  try {
    const cardRef = doc(db, 'users', userId, 'flashcards', card.id);
    await setDoc(cardRef, {
      id: card.id,
      userId,
      front: card.front,
      back: card.back,
      topic: card.topic,
      mnemonic: card.mnemonic || '',
      mastered: !!card.mastered,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const loadFlashcardsFromFirestore = async (userId: string): Promise<FlashcardItem[]> => {
  const path = `users/${userId}/flashcards`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'flashcards'));
    return snap.docs.map(d => d.data() as FlashcardItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
};

// 7. Celestial Notes (Keep Hold Notes Integration) Firestore Operations
export const saveNoteToFirestore = async (userId: string, note: CelestialNote): Promise<void> => {
  const path = `users/${userId}/notes/${note.id}`;
  try {
    const noteRef = doc(db, 'users', userId, 'notes', note.id);
    await setDoc(noteRef, {
      id: note.id,
      userId,
      title: note.title,
      content: note.content,
      topic: note.topic || 'General',
      color: note.color || 'violet',
      isPinned: !!note.isPinned,
      createdAt: new Date(note.createdAt).toISOString(),
      updatedAt: new Date(note.updatedAt).toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const loadNotesFromFirestore = async (userId: string): Promise<CelestialNote[]> => {
  const path = `users/${userId}/notes`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'notes'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: data.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        topic: data.topic,
        color: data.color,
        isPinned: data.isPinned,
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now()
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
};

export const deleteNoteFromFirestore = async (userId: string, noteId: string): Promise<void> => {
  const path = `users/${userId}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// 8. Google Classroom API Integration
export const fetchClassroomCourses = async (token: string): Promise<ClassroomCourse[]> => {
  const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Classroom API error (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data.courses || [];
};

export const fetchClassroomCourseWork = async (token: string, courseId: string): Promise<ClassroomCourseWork[]> => {
  const response = await fetch(`https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Classroom CourseWork error (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data.courseWork || [];
};

// 9. Google Drive API Search Integration
export const searchDriveFiles = async (token: string, queryText: string = ''): Promise<DriveFile[]> => {
  let q = "trashed = false";
  if (queryText.trim()) {
    const escaped = queryText.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=20&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&orderBy=modifiedTime desc`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data.files || [];
};
