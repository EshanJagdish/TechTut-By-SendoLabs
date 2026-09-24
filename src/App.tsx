import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BackgroundStars } from './components/BackgroundStars';
import { StudyModeView } from './components/StudyModeView';
import { AddOnModeView } from './components/AddOnModeView';
import { GameSystemView, ALL_BADGES } from './components/GameSystemView';
import { MusicSystemView } from './components/MusicSystemView';
import { MusicPopupModal } from './components/MusicPopupModal';
import { AccountSystemView } from './components/AccountSystemView';
import { DevBlueprintView } from './components/DevBlueprintView';
import { WorkspaceHubView } from './components/WorkspaceHubView';
import { QuizArenaView } from './components/QuizArenaView';
import { TechTutLiveView } from './components/TechTutLiveView';
import { FriendsView } from './components/FriendsView';
import { RegistrationPortal } from './components/RegistrationPortal';
import { 
  getActiveScholarSession, 
  setActiveScholarSession, 
  clearActiveScholarSession 
} from './lib/scholarAuth';
import { 
  auth,
  initAuth, 
  loadUserProfileFromFirestore, 
  syncUserProfileToFirestore, 
  saveFlashcardToFirestore,
  signOutUser
} from './lib/firebase';
import { 
  AppMode, 
  EducationLevel, 
  DreamyTheme, 
  UserProfile, 
  StudySolution, 
  FlashcardItem, 
  AddOnInsight, 
  DailyChallenge 
} from './types';
import { Sparkles, Award, Headphones, Volume2 } from 'lucide-react';
import { dreamyAudio } from './lib/audioSynthesizer';

const INITIAL_PROFILE: UserProfile = {
  id: 'scholar_init',
  name: 'Scholar',
  email: '',
  emailVerified: false,
  emailPreferences: {
    dailyStudyReminder: true,
    weeklyProgressDigest: true,
    streakFreezeAlert: true,
    reminderTime: '08:00'
  },
  cosmicSettings: {
    starPattern: 'constellation',
    ambientGlowColor: 'warm_amber',
    starsEnabled: true,
    glowIntensity: 'subtle',
    particleSpeed: 'gentle'
  },
  avatar: '🦉',
  title: 'Scholar of TechTut',
  level: 'college',
  theme: 'aurora_violet',
  xp: 380,
  stardust: 160,
  currentStreak: 5,
  bestStreak: 12,
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
      back: 'SN1 is two-step with carbocation intermediate (racemization); SN2 is one-step backside attack (Walden inversion)',
      topic: 'Organic Chemistry',
      mnemonic: 'SN2 = 2 molecules in transition = Backside Umbrella Flip'
    }
  ],
  savedAnswers: [],
  history: [
    {
      id: 'hist_1',
      date: 'Today, 2:30 PM',
      topic: 'Calculus Product Rule',
      mode: 'study',
      xpEarned: 50
    },
    {
      id: 'hist_2',
      date: 'Yesterday, 8:15 PM',
      topic: 'Astra Quiz Duel',
      mode: 'games',
      xpEarned: 80
    }
  ]
};

const INITIAL_CHALLENGES: DailyChallenge[] = [
  {
    id: 'ch_1',
    title: 'Illuminate 2 Concepts',
    description: 'Solve two problems or theorems in Study Mode today.',
    target: 2,
    current: 1,
    rewardXp: 60,
    rewardStardust: 25,
    completed: false
  },
  {
    id: 'ch_2',
    title: 'Align 4 Constellation Stars',
    description: 'Successfully match concepts in the Constellation game.',
    target: 4,
    current: 2,
    rewardXp: 40,
    rewardStardust: 20,
    completed: false
  },
  {
    id: 'ch_3',
    title: 'Soundscape Deep Focus',
    description: 'Study for 15 calm minutes with procedural ambient sound.',
    target: 15,
    current: 15,
    rewardXp: 50,
    rewardStardust: 20,
    completed: true
  }
];

export default function App() {
  const [hasEnteredTechTut, setHasEnteredTechTut] = useState<boolean>(() => {
    return localStorage.getItem('techtut_entered') === 'true';
  });
  const [currentMode, setCurrentMode] = useState<AppMode>('study');
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeStudySolution, setActiveStudySolution] = useState<StudySolution | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(INITIAL_CHALLENGES);
  
  // Workspace import bridge to Study Mode
  const [workspaceStudyQuery, setWorkspaceStudyQuery] = useState<string>('');
  const [workspaceStudySubject, setWorkspaceStudySubject] = useState<string>('General');

  // Set-based lookup for quick bookmarking & achievements
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Set<string>>(
    new Set(INITIAL_PROFILE.savedFlashcards.map(c => c.id))
  );
  const [savedSolutionIds, setSavedSolutionIds] = useState<Set<string>>(new Set());
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<Set<string>>(
    new Set(INITIAL_PROFILE.badges.map(b => b.id))
  );
  const [savedAddOnIds, setSavedAddOnIds] = useState<Set<string>>(new Set());

  // Reward Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; icon?: string } | null>(null);
  const [isMusicPopupOpen, setIsMusicPopupOpen] = useState<boolean>(false);
  const [floatingVolume, setFloatingVolume] = useState(dreamyAudio.volume);

  useEffect(() => {
    const unsub = dreamyAudio.subscribe((state: any) => {
      setFloatingVolume(state.volume);
    });
    return unsub;
  }, []);

  // Sync with Firebase Firestore on boot & login + Local Scholar session protection
  useEffect(() => {
    // 1. Check if user already has an active Scholar session
    const existingScholar = getActiveScholarSession();
    if (existingScholar) {
      setHasEnteredTechTut(true);
      localStorage.setItem('techtut_entered', 'true');
      setUserProfile(prev => ({
        ...prev,
        ...existingScholar
      }));
    }

    const unsubscribe = initAuth(
      (firebaseUser) => {
        setHasEnteredTechTut(true);
        localStorage.setItem('techtut_entered', 'true');
        loadUserProfileFromFirestore(firebaseUser.uid).then(cloudProfile => {
          if (cloudProfile) {
            setUserProfile(prev => {
              const updated = {
                ...prev,
                id: firebaseUser.uid,
                name: cloudProfile.name || firebaseUser.displayName || prev.name,
                email: firebaseUser.email || cloudProfile.email || prev.email,
                emailVerified: firebaseUser.emailVerified ?? cloudProfile.emailVerified ?? prev.emailVerified,
                emailPreferences: cloudProfile.emailPreferences || prev.emailPreferences,
                avatar: cloudProfile.avatar || prev.avatar,
                xp: cloudProfile.xp !== undefined ? cloudProfile.xp : prev.xp,
                stardust: cloudProfile.stardust !== undefined ? cloudProfile.stardust : prev.stardust,
                level: cloudProfile.level || prev.level,
                theme: cloudProfile.theme || prev.theme,
                currentStreak: cloudProfile.currentStreak || prev.currentStreak,
              };
              setActiveScholarSession(updated);
              return updated;
            });
          } else {
            syncUserProfileToFirestore(firebaseUser, userProfile).catch(console.warn);
          }
        }).catch(console.warn);
      },
      () => {
        // If an active local scholar session exists, keep the scholar in their sanctuary
        const localActive = getActiveScholarSession();
        if (localActive) {
          setHasEnteredTechTut(true);
          localStorage.setItem('techtut_entered', 'true');
          return;
        }
        setHasEnteredTechTut(false);
        localStorage.removeItem('techtut_entered');
        setUserProfile(INITIAL_PROFILE);
      }
    );
    return () => unsubscribe();
  }, []);

  const showRewardToast = (title: string, subtitle: string, icon?: string) => {
    setToastMessage({ title, subtitle, icon });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSwitchAccount = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    clearActiveScholarSession();
    localStorage.removeItem('techtut_entered');
    setUserProfile(INITIAL_PROFILE);
    setHasEnteredTechTut(false);
  };

  const handleImportToStudy = (query: string, subject?: string) => {
    setWorkspaceStudyQuery(query);
    setWorkspaceStudySubject(subject || 'General');
    setCurrentMode('study');
    showRewardToast("Imported to Study Sanctuary", "Ready to illuminate step-by-step concepts", "✨");
  };

  const handleAwardReward = (xpToAdd: number, stardustToAdd: number, badgeId?: string) => {
    setUserProfile(prev => {
      let newBadges = [...prev.badges];
      let toastSub = `+${xpToAdd} XP • +${stardustToAdd} Stardust`;

      if (badgeId && !unlockedBadgeIds.has(badgeId)) {
        const foundBadge = ALL_BADGES.find(b => b.id === badgeId);
        if (foundBadge) {
          newBadges.push(foundBadge);
          setUnlockedBadgeIds(ids => new Set(ids).add(badgeId));
          toastSub = `Unlocked "${foundBadge.name}"! +${xpToAdd} XP`;
        }
      }

      return {
        ...prev,
        xp: prev.xp + xpToAdd,
        stardust: prev.stardust + stardustToAdd,
        badges: newBadges
      };
    });

    showRewardToast("Celestial Reward", `+${xpToAdd} XP • +${stardustToAdd} Stardust`, "✨");
  };

  const handleLevelChange = (level: EducationLevel) => {
    setUserProfile(prev => ({ ...prev, level }));
  };

  const handleThemeChange = (theme: DreamyTheme) => {
    setUserProfile(prev => ({ ...prev, theme }));
  };

  const handleSaveFlashcard = (card: FlashcardItem) => {
    setUserProfile(prev => {
      const exists = prev.savedFlashcards.some(c => c.id === card.id);
      if (exists) {
        setSavedFlashcardIds(ids => {
          const next = new Set(ids);
          next.delete(card.id);
          return next;
        });
        return {
          ...prev,
          savedFlashcards: prev.savedFlashcards.filter(c => c.id !== card.id)
        };
      } else {
        setSavedFlashcardIds(ids => new Set(ids).add(card.id));
        showRewardToast("Grimoire Updated", `Saved "${card.front.slice(0, 24)}..." to flashcards`);
        return {
          ...prev,
          savedFlashcards: [card, ...prev.savedFlashcards]
        };
      }
    });
  };

  const handleSaveSolution = (sol: StudySolution) => {
    setUserProfile(prev => {
      const exists = prev.savedAnswers.some(s => s.id === sol.id);
      if (exists) {
        setSavedSolutionIds(ids => {
          const next = new Set(ids);
          next.delete(sol.id);
          return next;
        });
        return {
          ...prev,
          savedAnswers: prev.savedAnswers.filter(s => s.id !== sol.id)
        };
      } else {
        setSavedSolutionIds(ids => new Set(ids).add(sol.id));
        showRewardToast("Saved to Grimoire", `Archived solution: "${sol.topic}"`);
        return {
          ...prev,
          savedAnswers: [sol, ...prev.savedAnswers]
        };
      }
    });
  };

  const handleDeleteSavedFlashcard = (id: string) => {
    setUserProfile(prev => ({
      ...prev,
      savedFlashcards: prev.savedFlashcards.filter(c => c.id !== id)
    }));
    setSavedFlashcardIds(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteSavedSolution = (id: string) => {
    setUserProfile(prev => ({
      ...prev,
      savedAnswers: prev.savedAnswers.filter(s => s.id !== id)
    }));
    setSavedSolutionIds(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  };

  const handleSaveAddOn = (addon: AddOnInsight) => {
    setSavedAddOnIds(ids => new Set(ids).add(addon.id));
    showRewardToast("Add-On Insight Saved", "Cognitive secrets archived in personal memory palace");
  };

  const handleActivateAddOnFromStudy = (solution: StudySolution) => {
    setActiveStudySolution(solution);
    setCurrentMode('addon');
  };

  // Determine ambient background tint based on theme
  const getThemeBgGradient = () => {
    switch (userProfile.theme) {
      case 'starlight_blue':
        return 'from-slate-950 via-sky-950/20 to-slate-950';
      case 'cosmic_midnight':
        return 'from-slate-950 via-slate-900 to-slate-950';
      case 'celestial_rose':
        return 'from-slate-950 via-rose-950/20 to-slate-950';
      case 'aurora_violet':
      default:
        return 'from-slate-950 via-violet-950/20 to-slate-950';
    }
  };

  if (!hasEnteredTechTut) {
    return (
      <RegistrationPortal
        defaultEmail={userProfile.email}
        defaultLevel={userProfile.level}
        onEnterApp={(updates) => {
          if (updates) {
            setUserProfile(prev => {
              const updated = {
                ...prev,
                ...updates
              };
              setActiveScholarSession(updated);
              return updated;
            });
          }
          setHasEnteredTechTut(true);
          localStorage.setItem('techtut_entered', 'true');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans relative overflow-x-hidden selection:bg-orange-500/20 selection:text-orange-950">
      
      {/* Subtle Warm Minimalist Radial Ambient Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] bg-orange-100/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] bg-amber-100/50 rounded-full blur-[130px]" />
        <div className="absolute top-[35%] right-[15%] w-[350px] h-[350px] bg-orange-50/70 rounded-full blur-[150px]" />
      </div>

      {/* Background Interactive Starfield */}
      <BackgroundStars cosmicSettings={userProfile.cosmicSettings} />

      {/* Primary Navigation & Status Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        educationLevel={userProfile.level}
        onSelectLevel={handleLevelChange}
        stardustCount={userProfile.stardust}
        streakDays={userProfile.currentStreak}
        currentTheme={userProfile.theme}
        onSelectTheme={handleThemeChange}
        userEmail={userProfile.email}
        isEmailVerified={userProfile.emailVerified}
        onOpenMusicPopup={() => setIsMusicPopupOpen(true)}
      />

      {/* Floating Dynamic Reward Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="px-3.5 py-2.5 rounded-full bg-white/95 border border-stone-200/80 shadow-md backdrop-blur-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-sm text-orange-600">
              {toastMessage.icon || "✨"}
            </div>
            <div>
              <h5 className="text-xs font-semibold text-stone-900">{toastMessage.title}</h5>
              <p className="text-[11px] text-stone-600">{toastMessage.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="relative z-10 pt-4">
        
        {currentMode === 'study' && (
          <StudyModeView
            educationLevel={userProfile.level}
            initialQuery={workspaceStudyQuery}
            initialSubject={workspaceStudySubject}
            onActivateAddOn={handleActivateAddOnFromStudy}
            onSaveFlashcard={handleSaveFlashcard}
            onSaveSolution={handleSaveSolution}
            onAwardXpAndStardust={handleAwardReward}
            onOpenWorkspace={(tab) => setCurrentMode('workspace')}
            savedFlashcardIds={savedFlashcardIds}
            savedSolutionIds={savedSolutionIds}
          />
        )}

        {currentMode === 'workspace' && (
          <WorkspaceHubView
            onImportToStudy={handleImportToStudy}
            educationLevel={userProfile.level}
            onAwardReward={handleAwardReward}
          />
        )}

        {currentMode === 'addon' && (
          <AddOnModeView
            activeStudySolution={activeStudySolution}
            educationLevel={userProfile.level}
            onSaveAddOn={handleSaveAddOn}
            onAwardXpAndStardust={handleAwardReward}
            savedAddOnIds={savedAddOnIds}
          />
        )}

        {currentMode === 'games' && (
          <GameSystemView
            educationLevel={userProfile.level}
            totalXp={userProfile.xp}
            stardust={userProfile.stardust}
            onAwardReward={handleAwardReward}
            unlockedBadgeIds={unlockedBadgeIds}
            dailyChallenges={dailyChallenges}
          />
        )}

        {currentMode === 'music' && (
          <StudyModeView
            educationLevel={userProfile.level}
            initialQuery={workspaceStudyQuery}
            initialSubject={workspaceStudySubject}
            onActivateAddOn={handleActivateAddOnFromStudy}
            onSaveFlashcard={handleSaveFlashcard}
            onSaveSolution={handleSaveSolution}
            onAwardXpAndStardust={handleAwardReward}
            onOpenWorkspace={(tab) => setCurrentMode('workspace')}
            savedFlashcardIds={savedFlashcardIds}
            savedSolutionIds={savedSolutionIds}
          />
        )}

        {currentMode === 'live' && (
          <TechTutLiveView
            educationLevel={userProfile.level}
            activeStudySolution={activeStudySolution}
            onAwardReward={handleAwardReward}
            onOpenStudyMode={(query, subject) => {
              if (query) setWorkspaceStudyQuery(query);
              if (subject) setWorkspaceStudySubject(subject);
              setCurrentMode('study');
            }}
          />
        )}

        {currentMode === 'account' && (
          <AccountSystemView
            userProfile={userProfile}
            onUpdateProfile={(updates) => {
              setUserProfile(p => {
                const updated = { ...p, ...updates };
                if (auth.currentUser) {
                  syncUserProfileToFirestore(auth.currentUser, updated).catch(console.warn);
                }
                return updated;
              });
            }}
            onSelectSolution={(sol) => {
              setActiveStudySolution(sol);
              setCurrentMode('study');
            }}
            onDeleteSavedFlashcard={handleDeleteSavedFlashcard}
            onDeleteSavedSolution={handleDeleteSavedSolution}
            onShowToast={showRewardToast}
            onSwitchAccount={handleSwitchAccount}
            onOpenSocial={() => setCurrentMode('account')}
          />
        )}

        {currentMode === 'quiz' && (
          <QuizArenaView
            userProfile={userProfile}
          />
        )}

        {currentMode === 'dev_blueprint' && (
          <DevBlueprintView />
        )}

      </main>

      {/* Global Music Track Changer Popup Modal */}
      <MusicPopupModal
        isOpen={isMusicPopupOpen}
        onClose={() => setIsMusicPopupOpen(false)}
        onShowToast={showRewardToast}
      />

      {/* Right Middle Music Pop ("music pop in the right middle", mobile optimized) */}
      <div 
        id="right-middle-music-pop" 
        className="fixed right-2 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center"
      >
        <div className="flex flex-col items-center p-2 sm:p-2.5 rounded-2xl bg-white/95 hover:bg-white border border-stone-200/90 shadow-2xl backdrop-blur-md transition-all duration-200 space-y-2">
          <button
            onClick={() => setIsMusicPopupOpen(true)}
            className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 touch-manipulation"
            title="Open Music Sanctuary (Lyria 3 Clip)"
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-orange-500"></span>
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-800 group-hover:text-orange-600 transition-colors">
              Music
            </span>
          </button>

          {/* Small Vertical Slider for Ambient Volume Control */}
          <div className="flex flex-col items-center pt-1 pb-0.5 space-y-1 border-t border-stone-200/80 w-full">
            <span className="text-[8px] font-mono text-stone-400 uppercase">Vol</span>
            <div className="h-16 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={floatingVolume}
                onChange={(e) => dreamyAudio.setVolume(parseFloat(e.target.value))}
                className="w-16 accent-orange-500 cursor-pointer -rotate-90 transform"
                title={`Ambient Music Volume: ${Math.round(floatingVolume * 100)}%`}
              />
            </div>
            <span className="text-[8px] font-mono text-stone-500">{Math.round(floatingVolume * 100)}%</span>
          </div>
        </div>
      </div>

    </div>
  );
}

