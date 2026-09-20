import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BackgroundStars } from './components/BackgroundStars';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { StudyModeView } from './components/StudyModeView';
import { AddOnModeView } from './components/AddOnModeView';
import { GameSystemView, ALL_BADGES } from './components/GameSystemView';
import { MusicSystemView } from './components/MusicSystemView';
import { MusicPopupModal } from './components/MusicPopupModal';
import { AccountSystemView } from './components/AccountSystemView';
import { DevBlueprintView } from './components/DevBlueprintView';
import { WorkspaceHubView } from './components/WorkspaceHubView';
import { QuizArenaView } from './components/QuizArenaView';
import { RegistrationPortal } from './components/RegistrationPortal';
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
import { Sparkles, Award } from 'lucide-react';

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

  // Sync with Firebase Firestore on boot & login
  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser) => {
        setHasEnteredTechTut(true);
        localStorage.setItem('techtut_entered', 'true');
        loadUserProfileFromFirestore(firebaseUser.uid).then(cloudProfile => {
          if (cloudProfile) {
            setUserProfile(prev => ({
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
            }));
          } else {
            syncUserProfileToFirestore(firebaseUser, userProfile).catch(console.warn);
          }
        }).catch(console.warn);
      },
      () => {
        // No authenticated session: require sign-in / registration (no guest bypass)
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
            setUserProfile(prev => ({
              ...prev,
              ...updates
            }));
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
      <BackgroundStars />

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
          <div className="px-4 py-3 rounded-2xl bg-white border border-stone-200/90 shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-base text-orange-600">
              {toastMessage.icon || "✨"}
            </div>
            <div>
              <h5 className="text-xs font-bold text-stone-900">{toastMessage.title}</h5>
              <p className="text-[11px] text-orange-700">{toastMessage.subtitle}</p>
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

      {/* Persistent Floating Ambient Music Dock */}
      <MusicPlayerBar
        onOpenMusicSanctuary={() => setIsMusicPopupOpen(true)}
        recommendedTrackId={activeStudySolution?.recommendations?.ambientSoundtrack ? 'calm_focus' : undefined}
        recommendedReason={activeStudySolution?.recommendations?.recommendedMood}
      />

      {/* Global Music Track Changer Popup Modal */}
      <MusicPopupModal
        isOpen={isMusicPopupOpen}
        onClose={() => setIsMusicPopupOpen(false)}
      />

    </div>
  );
}

