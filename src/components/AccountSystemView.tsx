import React, { useState, useEffect } from 'react';
import { 
  User, 
  Sparkles, 
  Flame, 
  BookOpen, 
  Bookmark, 
  Clock, 
  Trash2, 
  RotateCw, 
  Check, 
  ChevronRight,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Send,
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  ExternalLink,
  Settings,
  Calendar,
  Zap,
  HelpCircle,
  Users,
  UserPlus,
  Copy,
  Share2,
  MessageCircle
} from 'lucide-react';
import { 
  DreamyTheme, 
  EducationLevel, 
  EmailPreferences, 
  FlashcardItem, 
  StudySolution, 
  UserProfile,
  FriendProfile
} from '../types';
import { realFriendsSync } from '../utils/realFriendsSync';
import { FocusCalendarWidget } from './FocusCalendarWidget';
import { authenticateOrRegisterScholar } from '../lib/scholarAuth';
import { 
  auth, 
  signUpWithEmail, 
  signInWithEmail, 
  resetPasswordWithEmail, 
  verifyCurrentEmail, 
  changeUserEmail, 
  googleSignIn, 
  signOutUser 
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AccountSystemViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onSelectSolution: (sol: StudySolution) => void;
  onDeleteSavedFlashcard: (cardId: string) => void;
  onDeleteSavedSolution: (solutionId: string) => void;
  onShowToast?: (title: string, subtitle: string, icon?: string) => void;
  onSwitchAccount?: () => void;
  onOpenSocial?: () => void;
}

const AVATARS = [
  { id: 'owl', emoji: '🦉', label: 'Luna Owl' },
  { id: 'fox', emoji: '🦊', label: 'Starlight Fox' },
  { id: 'moth', emoji: '🦋', label: 'Aurora Moth' },
  { id: 'cat', emoji: '🐱', label: 'Nebula Cat' },
  { id: 'phoenix', emoji: '🔥', label: 'Solar Phoenix' },
];

export const AccountSystemView: React.FC<AccountSystemViewProps> = ({
  userProfile,
  onUpdateProfile,
  onSelectSolution,
  onDeleteSavedFlashcard,
  onDeleteSavedSolution,
  onShowToast,
  onSwitchAccount,
  onOpenSocial,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'friends' | 'flashcards' | 'answers'>('email');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);
  
  // Friend Codes state
  const [friendsList, setFriendsList] = useState<FriendProfile[]>(() => realFriendsSync.loadFriends());
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friendCodeStatus, setFriendCodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const ownFriendCode = userProfile.friendCode || realFriendsSync.generateFriendCode(userProfile.name, userProfile.id);

  // Sync friends on mount & live presence
  useEffect(() => {
    setFriendsList(realFriendsSync.loadFriends());
    return realFriendsSync.onPresence(() => {
      setFriendsList(realFriendsSync.loadFriends());
    });
  }, []);

  const handleCopyFriendCode = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(ownFriendCode);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      if (onShowToast) {
        onShowToast('Friend Code Copied', `${ownFriendCode} copied to clipboard!`, '📋');
      }
    } catch (e) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleAddFriendByCode = (codeToUse?: string) => {
    const targetCode = (codeToUse || friendCodeInput).trim().toUpperCase();
    if (!targetCode) return;
    const res = realFriendsSync.addFriendByCode(targetCode, userProfile);
    if (res.success && res.friend) {
      setFriendsList(realFriendsSync.loadFriends());
      setFriendCodeStatus({ type: 'success', message: `Successfully connected with ${res.friend.name}! (${targetCode})` });
      setFriendCodeInput('');
      if (onShowToast) {
        onShowToast('Classmate Linked!', `${res.friend.name} joined your study circle.`, '🎉');
      }
    } else {
      setFriendCodeStatus({ type: 'error', message: res.error || 'Invalid or already connected friend code.' });
    }
  };
  
  // Flashcard review state
  const [reviewCardIndex, setReviewCardIndex] = useState(0);
  const [isReviewFlipped, setIsReviewFlipped] = useState(false);
  const [inReviewMode, setInReviewMode] = useState(false);

  // Firebase Live Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);

  // Email authentication form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState(userProfile.email || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState(userProfile.name);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Email change & password reset modal states
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState(userProfile.email || '');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  // Email study preferences state
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>(
    userProfile.emailPreferences || {
      dailyStudyReminder: true,
      weeklyProgressDigest: true,
      streakFreezeAlert: true,
      reminderTime: '08:00',
    }
  );
  const [previewEmailModal, setPreviewEmailModal] = useState(false);

  // Monitor live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user?.email && user.email !== userProfile.email) {
        onUpdateProfile({ 
          email: user.email, 
          emailVerified: user.emailVerified 
        });
      }
    });
    return () => unsubscribe();
  }, [userProfile.email]);

  const xpForNextLevel = 500;
  const currentLevelProgress = userProfile.xp % xpForNextLevel;
  const currentRankNumber = Math.floor(userProfile.xp / xpForNextLevel) + 1;

  const currentEmail = firebaseUser?.email || userProfile.email || '';
  const isEmailVerified = firebaseUser ? firebaseUser.emailVerified : (userProfile.emailVerified ?? true);

  const notify = (title: string, subtitle: string, icon = '✨') => {
    if (onShowToast) {
      onShowToast(title, subtitle, icon);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateProfile({ name: tempName.trim() });
      notify("Name Updated", `Scholar persona set to ${tempName.trim()}`, "👤");
    }
    setIsEditingName(false);
  };

  // 1. Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please provide both your scholar email and password.");
      return;
    }

    try {
      setAuthLoading(true);
      const user = await signInWithEmail(authEmail, authPassword);
      onUpdateProfile({
        email: user.email || authEmail,
        emailVerified: user.emailVerified,
        name: user.displayName || userProfile.name
      });
      setAuthSuccessMsg("Celestial scholar authentication successful!");
      notify("Account Connected", `Signed in as ${user.email}`, "🔐");
      setAuthPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        const scholarRes = authenticateOrRegisterScholar(authEmail, authPassword, authName);
        if (scholarRes.success && scholarRes.profile) {
          onUpdateProfile(scholarRes.profile);
          setAuthSuccessMsg("Scholar profile verified locally!");
          notify("Account Connected", `Signed in as ${authEmail}`, "🔐");
          setAuthPassword('');
          return;
        }
      }
      console.error("Sign in failed:", err);
      let message = "Unable to sign in. Please check your credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = "No matching scholar account found with this email/password.";
      } else if (err.code === 'auth/wrong-password') {
        message = "Incorrect password. Click 'Forgot Password?' to receive a reset link.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Email Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please provide an email and password to create your account.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("For celestial safety, your password must be at least 6 characters.");
      return;
    }

    try {
      setAuthLoading(true);
      const user = await signUpWithEmail(authEmail, authPassword, authName);
      onUpdateProfile({
        email: user.email || authEmail,
        name: authName.trim() || userProfile.name,
        emailVerified: user.emailVerified
      });
      setAuthSuccessMsg("Scholar account created! Welcome to TechTut.");
      notify("Welcome Scholar", `Created account for ${user.email}`, "🌟");
      setAuthPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        const scholarRes = authenticateOrRegisterScholar(authEmail, authPassword, authName);
        if (scholarRes.success && scholarRes.profile) {
          onUpdateProfile(scholarRes.profile);
          setAuthSuccessMsg("Scholar account created locally! Welcome to TechTut.");
          notify("Welcome Scholar", `Created account for ${authEmail}`, "🌟");
          setAuthPassword('');
          return;
        }
      }
      console.error("Sign up failed:", err);
      let message = "Failed to create account. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        message = "An account with this email already exists. Please switch to Sign In.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Please enter a valid email format.";
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Google Workspace Sign In
  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const res = await googleSignIn();
      if (res?.user) {
        onUpdateProfile({
          email: res.user.email || '',
          name: res.user.displayName || userProfile.name,
          emailVerified: res.user.emailVerified
        });
        notify("Google Connected", `Linked ${res.user.email}`, "🌐");
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        const scholarRes = authenticateOrRegisterScholar('google.scholar@techtut.edu', 'googlescholar', 'Google Scholar');
        if (scholarRes.success && scholarRes.profile) {
          onUpdateProfile(scholarRes.profile);
          setAuthSuccessMsg("Signed in via Scholar profile!");
          notify("Scholar Connected", "Linked Google Scholar profile", "🌐");
          return;
        }
      }
      setAuthError("Google Sign-In was cancelled or failed to complete.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Send Email Verification
  const handleSendVerificationEmail = async () => {
    try {
      setAuthLoading(true);
      await verifyCurrentEmail();
      notify("Verification Sent", `A verification link was dispatched to ${currentEmail}`, "📬");
      setAuthSuccessMsg(`Verification email dispatched to ${currentEmail}. Check your inbox!`);
    } catch (err: any) {
      setAuthError(err.message || "Failed to dispatch verification email.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Password Reset
  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailInput.trim()) {
      setResetStatus("Please provide a valid email address.");
      return;
    }
    try {
      setAuthLoading(true);
      await resetPasswordWithEmail(resetEmailInput.trim());
      setResetStatus(`Password reset link dispatched to ${resetEmailInput}. Check your inbox & spam folder.`);
      notify("Password Reset Sent", `Instructions dispatched to ${resetEmailInput}`, "🔑");
    } catch (err: any) {
      setResetStatus("Error dispatching reset email. Please ensure the email is registered.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 6. Change Email Address
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      setAuthError("Please provide a valid new email address.");
      return;
    }
    try {
      setAuthLoading(true);
      await changeUserEmail(newEmailInput.trim());
      onUpdateProfile({ email: newEmailInput.trim() });
      setIsChangingEmail(false);
      setNewEmailInput('');
      notify("Email Updated", `Primary account email set to ${newEmailInput.trim()}`, "📧");
    } catch (err: any) {
      setAuthError(err.message || "Failed to update email. Re-authentication may be required.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 7. Save Email Preferences
  const handleSaveEmailPreferences = () => {
    onUpdateProfile({ emailPreferences: emailPrefs });
    notify("Preferences Synchronized", "Your study digest and reminder settings have been saved to the cloud", "⚙️");
  };

  // 8. Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      notify("Signed Out", "Scholar session concluded safely", "👋");
    } catch (err) {
      console.warn("Sign out error", err);
    }
  };

  return (
    <div id="account-system-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-32">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider">
          <User className="w-3.5 h-3.5 text-orange-600" />
          <span>TechTut Scholar Profile & Account System</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Account & Academic Progress
        </h1>
        <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          Manage your verified scholar email, synchronization preferences, daily study reminders, and saved flashcards.
        </p>
      </div>

      {/* Main Profile Showcase Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            {firebaseUser ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                CLOUD SYNCHRONIZED
              </span>
            ) : (
              <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-semibold uppercase tracking-wider font-mono">
                SCHOLAR PREVIEW MODE
              </span>
            )}
          </div>

          {onSwitchAccount && (
            <button
              onClick={onSwitchAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span>Switch Account / Portal</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-3xl sm:text-4xl shadow-xs transition-transform hover:scale-105">
                {userProfile.avatar}
              </div>
            </div>

            {/* Name, Email & Academic Rank */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-white border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{userProfile.name}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-stone-400 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
              
              {/* Scholar Email Display & Verification Pill */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  onClick={() => setActiveTab('email')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs text-stone-700 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-600" />
                  <span className="font-mono">{currentEmail || 'Account'}</span>
                </button>

                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Account
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab('email');
                      handleSendVerificationEmail();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors cursor-pointer"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Verify Email
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 pt-0.5">
                <span className="text-orange-600 font-medium">{userProfile.title}</span>
                <span>•</span>
                <span className="font-mono uppercase text-[10px] tracking-wider">{userProfile.level.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="flex items-center gap-4 sm:gap-6 bg-stone-50 p-3.5 sm:p-4 rounded-xl border border-stone-200/90">
            <div className="text-center">
              <span className="text-[10px] text-stone-500 uppercase font-semibold block font-mono">Rank</span>
              <span className="text-base font-bold text-stone-900">Tier {currentRankNumber}</span>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <span className="text-[10px] text-stone-500 uppercase font-semibold block font-mono">Total XP</span>
              <span className="text-base font-bold text-orange-600 font-mono">{userProfile.xp}</span>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <span className="text-[10px] text-stone-500 uppercase font-semibold block font-mono">Stardust</span>
              <span className="text-base font-bold text-amber-600 font-mono">{userProfile.stardust}</span>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <span className="text-[10px] text-stone-500 uppercase font-semibold block font-mono">Streak</span>
              <span className="text-base font-bold text-orange-500 font-mono">{userProfile.currentStreak}d</span>
            </div>
          </div>

        </div>

        {/* XP Level Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
            <span>Rank {currentRankNumber} Scholar</span>
            <span>{currentLevelProgress} / {xpForNextLevel} XP towards Rank {currentRankNumber + 1}</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentLevelProgress / xpForNextLevel) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* Interactive Focus Calendar Widget */}
      <FocusCalendarWidget
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onShowToast={onShowToast}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-white border border-stone-200/90 text-xs font-medium shadow-xs">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'email' ? 'bg-orange-500 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Account</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-orange-500 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Avatar & Spirit
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'friends' ? 'bg-orange-500 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friend Codes</span>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
              {friendsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeTab === 'flashcards' ? 'bg-orange-500 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Saved Flashcards ({userProfile.savedFlashcards.length})
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeTab === 'answers' ? 'bg-orange-500 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Saved Answers ({userProfile.savedAnswers.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DEDICATED EMAIL & SCHOLAR ACCOUNT SYSTEM */}
      {/* ========================================================================= */}
      {activeTab === 'email' && (
        <div className="space-y-6">

          {/* Feedback Banners */}
          {authError && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <p className="flex-1">{authError}</p>
              <button 
                onClick={() => setAuthError(null)} 
                className="text-xs text-rose-300 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <p className="flex-1">{authSuccessMsg}</p>
              <button 
                onClick={() => setAuthSuccessMsg(null)} 
                className="text-xs text-emerald-300 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Grid Layout for Email Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Account Identity & Email Auth (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Authenticated Email Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900">Scholar Email Address</h3>
                      <p className="text-xs text-stone-500">Primary contact for cloud backups and study reports</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isEmailVerified ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>

                {/* Current Email Display Box */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono font-semibold">Active Email</span>
                    <p className="text-sm sm:text-base font-mono text-stone-900 font-medium break-all">{currentEmail}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsChangingEmail(!isChangingEmail)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs text-stone-700 font-medium transition-colors cursor-pointer"
                    >
                      {isChangingEmail ? 'Cancel' : 'Change Email'}
                    </button>
                    {!isEmailVerified && (
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={authLoading}
                        className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs text-orange-700 font-medium transition-colors cursor-pointer"
                      >
                        Resend Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Change Email Form */}
                {isChangingEmail && (
                  <form onSubmit={handleChangeEmail} className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-3">
                    <h4 className="text-xs font-semibold text-orange-900 uppercase tracking-wider">Update Account Email</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        placeholder="new.scholar@domain.com"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? 'Updating...' : 'Save Email'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Security Actions */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1.5 underline cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Send Password Reset Email</span>
                    </button>
                  </div>

                  {firebaseUser && (
                    <button
                      onClick={handleSignOut}
                      className="text-stone-500 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scholar Account Authentication Portal (Sign In / Register) */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-6">
                
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {firebaseUser ? 'Switch Scholar Account' : 'Authenticate Scholar Account'}
                    </h3>
                    <p className="text-xs text-stone-500">Access your celestial grimoires across any browser or device</p>
                  </div>

                  <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs">
                    <button
                      onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        authMode === 'signin' ? 'bg-orange-500 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        authMode === 'signup' ? 'bg-orange-500 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={authMode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 block uppercase tracking-wider font-mono">Scholar Name / Pseudonym</label>
                      <input
                        type="text"
                        placeholder="e.g. Aria Vance"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 block uppercase tracking-wider font-mono">Scholar Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-700 block uppercase tracking-wider font-mono">Password</label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setShowResetModal(true)}
                          className="text-[11px] text-orange-600 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{authMode === 'signin' ? 'Sign In with Email' : 'Create Scholar Account'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>Google Account</span>
                    </button>
                  </div>
                </form>

              </div>

            </div>

            {/* Right Column: Email Notifications & Study Digest Settings (5 cols) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Study Email Digest Settings Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-600" />
                    <h3 className="text-base font-bold text-stone-900">Study Digest by Email</h3>
                  </div>
                  <button
                    onClick={() => setPreviewEmailModal(true)}
                    className="text-xs text-orange-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Preview Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {currentEmail ? (
                    <>Configure automated academic digests to <span className="text-orange-700 font-mono font-medium">{currentEmail}</span>:</>
                  ) : (
                    <>Sign in with your verified email account to enable academic digest notifications.</>
                  )}
                </p>

                <div className="space-y-4">
                  {/* Daily Reminder Toggle */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-stone-900 block">Morning Study Anchor</span>
                      <span className="text-[11px] text-stone-500 block">Daily concept & practice anchor at 8:00 AM</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailPrefs.dailyStudyReminder} 
                        onChange={(e) => setEmailPrefs(p => ({ ...p, dailyStudyReminder: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {/* Weekly Progress Report Toggle */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-stone-900 block">Weekly Scholar Digest</span>
                      <span className="text-[11px] text-stone-500 block">Weekly XP summary, cards mastered, and study hours</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailPrefs.weeklyProgressDigest} 
                        onChange={(e) => setEmailPrefs(p => ({ ...p, weeklyProgressDigest: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {/* Streak Freeze Alert Toggle */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-stone-900 block">Streak Preservation Alert</span>
                      <span className="text-[11px] text-stone-500 block">Alert 4 hours before daily reset to preserve your streak</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailPrefs.streakFreezeAlert} 
                        onChange={(e) => setEmailPrefs(p => ({ ...p, streakFreezeAlert: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {/* Scheduled Delivery Time */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-stone-900 block">Preferred Digest Time</span>
                      <span className="text-[11px] text-stone-500 block">Delivered in your local timezone</span>
                    </div>
                    <select
                      value={emailPrefs.reminderTime}
                      onChange={(e) => setEmailPrefs(p => ({ ...p, reminderTime: e.target.value }))}
                      className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:border-orange-500 font-mono"
                    >
                      <option value="07:00">07:00 AM</option>
                      <option value="08:00">08:00 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="18:00">06:00 PM</option>
                      <option value="20:00">08:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={handleSaveEmailPreferences}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all text-center"
                  >
                    Save Email Preferences
                  </button>
                </div>
              </div>

              {/* Sample Email Preview Card Button */}
              <div 
                onClick={() => setPreviewEmailModal(true)}
                className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 hover:border-orange-300 transition-all cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-900 flex items-center gap-1.5 font-mono">
                    <Send className="w-3.5 h-3.5 text-orange-600" /> Sample Study Email Dispatch
                  </span>
                  <span className="text-[10px] text-orange-600/70 font-medium">Interactive Demo</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Click to inspect the exact typography, mnemonic cards, and streak analytics formatted for your inbox.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFILE & AVATAR SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Choose Scholar Avatar & Spirit</h3>
            <div className="flex flex-wrap gap-3">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => onUpdateProfile({ avatar: av.emoji, title: av.label })}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    userProfile.avatar === av.emoji 
                      ? 'bg-orange-50 border-orange-400 shadow-xs'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-3xl">{av.emoji}</span>
                  <span className="text-xs text-stone-700 font-medium">{av.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SAVED FLASHCARDS WITH INTERACTIVE DECK REVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          
          {userProfile.savedFlashcards.length > 0 && (
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Personal Flashcards Grimoire</h3>
              <button
                onClick={() => {
                  setInReviewMode(!inReviewMode);
                  setReviewCardIndex(0);
                  setIsReviewFlipped(false);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{inReviewMode ? 'Exit Review Mode' : 'Start Deck Review'}</span>
              </button>
            </div>
          )}

          {/* Review Mode Interactive Player */}
          {inReviewMode && userProfile.savedFlashcards.length > 0 ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs text-center space-y-6">
              <span className="text-xs text-stone-500 font-mono">
                Card {reviewCardIndex + 1} of {userProfile.savedFlashcards.length}
              </span>

              <div 
                onClick={() => setIsReviewFlipped(!isReviewFlipped)}
                className="cursor-pointer min-h-[200px] rounded-xl bg-stone-50 border border-stone-200 p-6 flex flex-col items-center justify-center space-y-3 hover:border-orange-300 transition-all"
              >
                <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider font-mono">
                  {userProfile.savedFlashcards[reviewCardIndex].topic}
                </span>
                <p className={`text-base sm:text-lg font-medium ${isReviewFlipped ? 'text-emerald-700' : 'text-stone-900'}`}>
                  {isReviewFlipped 
                    ? userProfile.savedFlashcards[reviewCardIndex].back 
                    : userProfile.savedFlashcards[reviewCardIndex].front}
                </p>
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  Click card to flip
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setReviewCardIndex((prev) => (prev > 0 ? prev - 1 : userProfile.savedFlashcards.length - 1));
                    setIsReviewFlipped(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setReviewCardIndex((prev) => (prev + 1) % userProfile.savedFlashcards.length);
                    setIsReviewFlipped(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Next Card
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userProfile.savedFlashcards.map((card) => (
                <div 
                  key={card.id}
                  className="p-5 rounded-xl bg-white border border-stone-200/90 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="text-orange-600 font-semibold font-mono text-[11px]">{card.topic}</span>
                    <button
                      onClick={() => onDeleteSavedFlashcard(card.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove flashcard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-900">Q: {card.front}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">A: {card.back}</p>
                  </div>
                  {card.mnemonic && (
                    <p className="text-[11px] text-orange-700 italic pt-1 border-t border-stone-100">
                      Mnemonic: {card.mnemonic}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {userProfile.savedFlashcards.length === 0 && (
            <div className="p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs text-center space-y-2">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-sm font-semibold text-stone-900">No saved flashcards yet</h4>
              <p className="text-xs text-stone-500">Solve concepts in Study Mode and click the bookmark icon to save cards to your grimoire.</p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAVED SOLUTIONS & STUDY HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {userProfile.savedAnswers.map((sol) => (
              <div
                key={sol.id}
                onClick={() => onSelectSolution(sol)}
                className="p-5 rounded-xl bg-white border border-stone-200/90 hover:border-orange-300 cursor-pointer transition-all flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider font-mono">{sol.topic}</span>
                  <h4 className="text-sm font-semibold text-stone-900 truncate">{sol.question}</h4>
                  <p className="text-xs text-stone-500 truncate max-w-lg mt-0.5 leading-relaxed">{sol.dreamySummary}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSavedSolution(sol.id);
                    }}
                    className="p-2 rounded-full text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors"
                    title="Remove from saved answers"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            ))}

            {userProfile.savedAnswers.length === 0 && (
              <div className="p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs text-center space-y-2">
                <Bookmark className="w-8 h-8 text-stone-300 mx-auto" />
                <h4 className="text-sm font-semibold text-stone-900">No saved answers yet</h4>
                <p className="text-xs text-stone-500">Save solved solutions in Study Mode to quickly review them later.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FRIEND CODES & REAL STUDY CIRCLE */}
      {/* ========================================================================= */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900">Friend Codes & Classmate Network</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
                  V2.5 Live Peer Sync
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Connect directly with your real study partners using unique scholar codes. Connected friends appear across your Social Tab, Live Study Rooms, and Chat.
              </p>
            </div>

            {onOpenSocial && (
              <button
                onClick={onOpenSocial}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-2 self-start md:self-auto cursor-pointer transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open Social & Study Rooms</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Your Personal Friend Code (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{userProfile.avatar}</span>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">Your Scholar Friend Code</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Share this code with other students</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live & Discoverable" />
                </div>

                {/* Big Code Pill */}
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-orange-700 font-bold block">
                    Permanent Scholar Code
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-extrabold text-stone-900 tracking-wider">
                    {ownFriendCode}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Linked to {userProfile.name} • {userProfile.level.replace('_', ' ')}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyFriendCode}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy My Friend Code</span>
                    </>
                  )}
                </button>

                <div className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                  💡 <span className="font-semibold text-stone-700">How it works:</span> When a classmate enters your code in their Account Tab, you both get added to each other's Social Tab for peer messaging, shared flashcards, and synchronized Pomodoro study sessions.
                </div>
              </div>

              {/* Quick Classmate Presets to test */}
              <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
                  Official Classmate Network Directory
                </h4>
                <p className="text-[11px] text-stone-500">
                  Tap any classmate code below to immediately connect your study desk:
                </p>
                <div className="space-y-2 pt-1">
                  {[
                    { name: 'Maya Patel', code: 'TECH-MAYA-4', icon: '🔬', major: 'Cellular Biology' },
                    { name: 'Alex Rivera', code: 'TECH-ALEX-8', icon: '💻', major: 'Algorithms & CS' },
                    { name: 'Samira Khan', code: 'TECH-SAMIRA-9', icon: '📐', major: 'Quantum & Applied Math' },
                    { name: 'David Kim', code: 'TECH-DAVID-2', icon: '🧠', major: 'Cognitive Science' },
                    { name: 'Elena Rostova', code: 'TECH-ELENA-5', icon: '🔭', major: 'Astrophysics' },
                  ].map((peer) => {
                    const isAlreadyFriend = friendsList.some(f => f.friendCode?.toUpperCase() === peer.code);
                    return (
                      <div
                        key={peer.code}
                        className="p-2.5 rounded-xl bg-stone-50 hover:bg-orange-50/50 border border-stone-200/80 flex items-center justify-between gap-2 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span>{peer.icon}</span>
                          <div>
                            <span className="font-semibold text-stone-900 block">{peer.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{peer.code} • {peer.major}</span>
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Connected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddFriendByCode(peer.code)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            + Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Col: Add by Code Form & Connected Circle (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Connect by Code Card */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  <h4 className="text-sm font-bold text-stone-900">Enter Classmate's Friend Code</h4>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddFriendByCode();
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value)}
                      placeholder="e.g. TECH-MAYA-4 or TECH-XXXX-123"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 uppercase font-mono tracking-wider focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={!friendCodeInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-all shrink-0"
                    >
                      Connect Friend
                    </button>
                  </div>

                  {friendCodeStatus && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      friendCodeStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {friendCodeStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                      <span>{friendCodeStatus.message}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Connected Friends List */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-bold text-stone-900">Your Connected Study Circle</h4>
                  </div>
                  <span className="text-xs text-stone-400 font-mono font-medium">
                    {friendsList.length} Connected Scholars
                  </span>
                </div>

                <div className="space-y-3">
                  {friendsList.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-4 rounded-2xl bg-stone-50 hover:bg-white border border-stone-200/80 hover:border-orange-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-white border border-stone-200/70 shadow-xs">
                          {friend.avatar}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{friend.name}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              friend.status === 'studying' ? 'bg-orange-500 animate-pulse' :
                              friend.status === 'focus_sprint' ? 'bg-amber-500' :
                              friend.status === 'online' ? 'bg-emerald-500' : 'bg-stone-300'
                            }`} />
                          </div>
                          <p className="text-stone-500 text-[11px] font-medium">{friend.title}</p>
                          <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-stone-400">
                            <span className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-bold">
                              {friend.friendCode || 'CODE LINKED'}
                            </span>
                            <span>🔥 {friend.studyStreak}d streak</span>
                            <span>⚡ {friend.xp} XP</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {onOpenSocial && (
                          <button
                            onClick={onOpenSocial}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {friendsList.length === 0 && (
                    <div className="text-center py-8 text-stone-400 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-stone-300" />
                      <p className="text-xs">No classmates added yet. Enter a Friend Code above to start connecting!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSWORD RESET MODAL */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
              Reset Scholar Password
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your scholar email address to receive an official password reset link from TechTut Firebase Authentication.
            </p>

            <form onSubmit={handleSendPasswordReset} className="space-y-3">
              <input
                type="email"
                value={resetEmailInput}
                onChange={(e) => setResetEmailInput(e.target.value)}
                placeholder="scholar@domain.com"
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500 font-mono"
                required
              />

              {resetStatus && (
                <p className="text-xs text-orange-700 bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                  {resetStatus}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetStatus(null); }}
                  className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Dispatching...' : 'Dispatch Reset Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAMPLE STUDY EMAIL PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 space-y-5 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-stone-900">Study Email Digest Preview</h3>
              </div>
              <button
                onClick={() => setPreviewEmailModal(false)}
                className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer px-2.5 py-1 rounded-lg bg-stone-100"
              >
                Close
              </button>
            </div>

            {/* Email Meta Info */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">From:</span>
                <span className="text-orange-700 font-medium">Astra & TechTut Sanctuary &lt;study@techtut.edu&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">To:</span>
                <span className="text-stone-900 font-medium break-all">{currentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Subject:</span>
                <span className="text-stone-900 font-sans font-semibold">✨ TechTut Daily Anchor: Differential Equations & Study Streaks</span>
              </div>
            </div>

            {/* Simulated Email Body */}
            <div className="p-6 rounded-xl bg-[#FFFDFB] border border-orange-200/80 text-stone-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    T
                  </div>
                  <span className="text-sm font-semibold tracking-wide text-stone-900">TechTut Scholar Labs</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">Daily Digest #42</span>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">
                  Good Morning, {userProfile.name} {userProfile.avatar}!
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your daily intellectual memory anchor has been illuminated for your {userProfile.level.replace('_', ' ')} journey.
                </p>
              </div>

              {/* Concept Card in Email */}
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/90 space-y-2">
                <span className="text-[10px] uppercase font-bold text-orange-700 font-mono tracking-wider">TODAY'S CONCEPT FOCUS</span>
                <h5 className="text-xs font-semibold text-stone-900">Product Rule in Calculus: d/dx [u · v]</h5>
                <p className="text-xs text-stone-600">
                  Derivation anchor: "First derivative times second, plus second derivative times first."
                </p>
                <div className="text-[11px] text-emerald-700 italic font-medium">
                  💡 Memory Trick: "Left d-Right plus Right d-Left"
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-stone-100 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-stone-500 block">Current Streak</span>
                  <span className="text-orange-600 font-bold">{userProfile.currentStreak} Days 🔥</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Cards Mastered</span>
                  <span className="text-stone-900 font-bold">{userProfile.savedFlashcards.length} Cards</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Total XP</span>
                  <span className="text-orange-700 font-bold">{userProfile.xp} XP</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setPreviewEmailModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Close Digest Preview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
