import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  syncUserProfileToFirestore
} from '../lib/firebase';
import { EducationLevel, UserProfile } from '../types';

interface RegistrationPortalProps {
  onEnterApp: (profileUpdates?: Partial<UserProfile>) => void;
  defaultEmail?: string;
  defaultLevel?: EducationLevel;
}

const LEVEL_OPTIONS: { id: EducationLevel; label: string; sub: string }[] = [
  { id: 'school', label: 'Middle School', sub: 'Foundations & Curiosities' },
  { id: 'high_school', label: 'High School', sub: 'AP, IB & Board Exams' },
  { id: 'college', label: 'College / Prep', sub: 'STEM, Calculus & Core' },
  { id: 'university', label: 'University / Grad', sub: 'Theorems & Research' },
  { id: 'adult', label: 'Lifelong Scholar', sub: 'Self-Directed Mastery' },
];

export const RegistrationPortal: React.FC<RegistrationPortalProps> = ({
  onEnterApp,
  defaultEmail = '',
  defaultLevel = 'college'
}) => {
  const [authMode, setAuthMode] = useState<'register' | 'signin'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [level, setLevel] = useState<EducationLevel>(defaultLevel);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters for security.' });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser) {
        await sendEmailVerification(firebaseUser).catch(console.warn);
      }

      setStatusMessage({ 
        type: 'success', 
        text: `Account created successfully! Welcome to TechTut!` 
      });

      setTimeout(() => {
        onEnterApp({
          id: firebaseUser.uid,
          name: name.trim() || 'Scholar',
          email: firebaseUser.email || cleanEmail,
          level,
          emailVerified: firebaseUser.emailVerified ?? false
        });
      }, 700);

    } catch (fbErr: any) {
      console.error("Registration security rejection:", fbErr);
      let errorMsg = "Unable to create account. Please try again.";
      if (fbErr.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists. Switch to "Sign In" and enter your password.';
      } else if (fbErr.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters with letters/numbers.';
      } else if (fbErr.code === 'auth/invalid-email') {
        errorMsg = 'The email address is invalid.';
      } else if (fbErr.message) {
        errorMsg = fbErr.message;
      }
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!password) {
      setStatusMessage({ type: 'error', text: 'Please enter your account password.' });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const authenticatedUser = userCredential.user;

      setStatusMessage({ type: 'success', text: 'Identity verified. Entering TechTut sanctuary...' });
      setTimeout(() => {
        onEnterApp({
          id: authenticatedUser.uid,
          email: authenticatedUser.email || cleanEmail,
          name: authenticatedUser.displayName || name || 'Scholar',
          emailVerified: authenticatedUser.emailVerified
        });
      }, 600);
    } catch (err: any) {
      console.error("Authentication failed:", err);
      let errorMsg = "Access denied: Invalid credentials.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = "Incorrect password. Access denied to protect this account.";
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = "No account found with this email. Switch to 'Create Account' to register.";
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = "Please enter a valid email address.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = "Too many failed attempts. Access temporarily restricted. Please reset your password.";
      }
      // CRITICAL: NEVER ALLOW ENTRY ON FAILED PASSWORD!
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        setStatusMessage({ type: 'success', text: `Authenticated securely as ${result.user.email}!` });
        setTimeout(() => {
          onEnterApp({
            id: result.user.uid,
            name: result.user.displayName || 'Scholar',
            email: result.user.email || '',
            emailVerified: result.user.emailVerified,
            avatar: '🦉'
          });
        }, 600);
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setStatusMessage({ 
          type: 'error', 
          text: err.message || 'Google authentication was not completed. Please try again or use email.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please type your account email in the box above first.' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setStatusMessage({ 
        type: 'success', 
        text: `Password reset email dispatched to ${cleanEmail}. Please check your inbox and spam folder.` 
      });
    } catch (err: any) {
      console.error("Reset email error:", err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Could not send reset email. Verify that the email is registered.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-orange-500/20 selection:text-orange-950">
      
      {/* Subtle Warm Minimalist Radial Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-orange-50/70 rounded-full blur-3xl" />
      </div>

      {/* Main Registration Box */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>SendoLabs Academic Companion</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 flex items-center justify-center gap-2">
            <span>TechTut</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          </h1>
          <p className="mt-2 text-sm text-stone-600 font-normal max-w-sm mx-auto">
            Whitish-orangish minimal study sanctuary. Step-by-step derivations, AI educational games, and ambient focus.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
          
          {/* Dual Mode Switcher */}
          <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setStatusMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'register'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setStatusMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div className={`mb-5 p-3 rounded-xl text-xs flex items-start gap-2.5 border animate-in fade-in duration-200 ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-orange-50 border-orange-200 text-orange-800'
            }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={authMode === 'register' ? handleRegister : handleSignIn} className="space-y-4">
            
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Scholar Full Name / Pseudonym
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aria Vance"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Scholar Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-orange-600 hover:text-orange-700 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Academic Rigor Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.slice(0, 4).map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setLevel(lvl.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        level === lvl.id
                          ? 'border-orange-400 bg-orange-50/70 text-orange-950 font-medium ring-1 ring-orange-400/40'
                          : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                      }`}
                    >
                      <p className="text-xs font-semibold leading-none">{lvl.label}</p>
                      <p className="text-[10px] text-stone-500 mt-1 truncate">{lvl.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'register' ? 'Register & Enter TechTut' : 'Sign In to TechTut'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Auth Dividers */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <span className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-stone-400 font-medium">
              Or continue with
            </span>
          </div>

          {/* Google Sign In */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>

        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-center text-xs text-stone-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Firestore & Firebase Auth
          </span>
          <span>•</span>
          <span>Whitish Orangish Minimal</span>
          <span>•</span>
          <span>SendoLabs</span>
        </div>

      </div>
    </div>
  );
};
