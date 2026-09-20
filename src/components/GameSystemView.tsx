import React, { useState, useRef } from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  RotateCw, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  Award,
  ChevronRight,
  Upload,
  FileText,
  Image as ImageIcon,
  Zap,
  Layers,
  ListOrdered,
  Search,
  Check,
  X,
  Play,
  ArrowRight,
  RefreshCw,
  Eye,
  Wrench,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Badge, DailyChallenge, EducationLevel, GeneratedAiGame, GameArchetype } from '../types';

interface GameSystemViewProps {
  educationLevel: EducationLevel;
  totalXp: number;
  stardust: number;
  onAwardReward: (xp: number, stardust: number, badgeId?: string) => void;
  unlockedBadgeIds: Set<string>;
  dailyChallenges: DailyChallenge[];
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_light', name: 'First Light Scholar', description: 'Illuminated your first concept with TechTut', icon: '✨', rarity: 'common' },
  { id: 'mindful_streak_3', name: '3-Day Flow Streak', description: 'Maintained a 3-day mindful study cadence', icon: '🔥', rarity: 'common' },
  { id: 'game_creator', name: 'Game Alchemist', description: 'Created an AI game from custom study notes or image', icon: '🎮', rarity: 'rare' },
  { id: 'blitz_master', name: 'Blitz Lightning', description: 'Scored 100% in a Speed Blitz game arena', icon: '⚡', rarity: 'rare' },
  { id: 'derivation_sage', name: 'Derivation Sage', description: 'Sequenced a complex academic process flawlessly', icon: '🪜', rarity: 'celestial' },
  { id: 'zenith_master', name: 'Grand Scholar Zenith', description: 'Mastered 20 curriculum concepts in TechTut', icon: '👑', rarity: 'legendary' },
];

const PRESET_TOPICS = [
  {
    title: 'Calculus: Derivatives & Rates of Change',
    text: 'A derivative represents the instantaneous rate of change of a function f(x) at x. By definition, f\'(x) = lim[h->0] (f(x+h) - f(x)) / h. Key rules include the Power Rule d/dx[x^n] = n*x^(n-1), Product Rule (uv)\' = u\'v + uv\', and Chain Rule d/dx[f(g(x))] = f\'(g(x)) * g\'(x).',
    archetype: 'blitz' as GameArchetype
  },
  {
    title: 'Cellular Respiration & Bioenergetics',
    text: 'Cellular respiration converts glucose into ATP. Glycolysis in cytoplasm produces 2 Pyruvate + 2 ATP + 2 NADH. Pyruvate oxidation creates Acetyl-CoA. The Krebs Cycle in mitochondrial matrix yields NADH, FADH2, and 2 ATP. Oxidative phosphorylation on the cristae drives ATP synthase via a proton gradient, generating ~28-32 ATP.',
    archetype: 'sequence' as GameArchetype
  },
  {
    title: 'Newtonian Classical Mechanics',
    text: 'Newton\'s First Law: Law of Inertia (objects remain at rest or in uniform velocity unless acted on by net external force). Second Law: F_net = m*a (acceleration is proportional to net force and inversely proportional to mass). Third Law: Action-Reaction (every action has an equal and opposite reaction force). Angular momentum L = I*omega is conserved when net torque is zero.',
    archetype: 'matching' as GameArchetype
  }
];

export const GameSystemView: React.FC<GameSystemViewProps> = ({
  educationLevel,
  totalXp,
  stardust,
  onAwardReward,
  unlockedBadgeIds,
  dailyChallenges,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'play' | 'challenges' | 'badges'>('create');
  
  // Game Creation Form State
  const [studyInputText, setStudyInputText] = useState('');
  const [gameTopic, setGameTopic] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<GameArchetype>('blitz');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Game Play State
  const [currentGame, setCurrentGame] = useState<GeneratedAiGame | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // Blitz state
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [selectedBlitzOpt, setSelectedBlitzOpt] = useState<number | null>(null);
  const [blitzAnswered, setBlitzAnswered] = useState(false);

  // Matching state
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());

  // Sequencer state
  const [userSequence, setUserSequence] = useState<{ id: string; text: string; currentOrder: number }[]>([]);
  const [sequenceSubmitted, setSequenceSubmitted] = useState(false);
  const [sequenceSuccess, setSequenceSuccess] = useState(false);

  // Diagram Detective state
  const [diagramIndex, setDiagramIndex] = useState(0);
  const [selectedDiagramOpt, setSelectedDiagramOpt] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Generate AI Game from Text / Image
  const handleGenerateGame = async () => {
    if (!studyInputText.trim() && !imagePreview) {
      setGenerationError('Please provide either study notes/text or upload a study diagram/image.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/games/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: studyInputText.trim(),
          imageData: imagePreview,
          mimeType: imageMime,
          archetype: selectedArchetype,
          educationLevel,
          topic: gameTopic.trim() || 'Custom Curriculum'
        })
      });

      const data = await res.json();
      if (data.game) {
        initGame(data.game);
        onAwardReward(40, 20, 'game_creator');
        setActiveTab('play');
      } else {
        throw new Error(data.error || 'Unable to construct game format.');
      }
    } catch (err: any) {
      console.error('Game generation failure:', err);
      setGenerationError(err.message || 'Game generation encountered an issue. Using fallback.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize Game Play Environment
  const initGame = (game: GeneratedAiGame) => {
    setCurrentGame(game);
    setGameCompleted(false);
    setGameScore(0);

    if (game.archetype === 'blitz') {
      setBlitzIndex(0);
      setSelectedBlitzOpt(null);
      setBlitzAnswered(false);
    } else if (game.archetype === 'matching') {
      setSelectedTerm(null);
      setSelectedMatch(null);
      setMatchedPairIds(new Set());
    } else if (game.archetype === 'sequence' && game.sequenceSteps) {
      // Shuffle sequence steps
      const shuffled = [...game.sequenceSteps]
        .sort(() => Math.random() - 0.5)
        .map((step, idx) => ({ id: step.id, text: step.text, currentOrder: idx + 1 }));
      setUserSequence(shuffled);
      setSequenceSubmitted(false);
      setSequenceSuccess(false);
    } else if (game.archetype === 'diagram_detective') {
      setDiagramIndex(0);
      setSelectedDiagramOpt(null);
    }
  };

  // Handle Blitz Option Click
  const handleBlitzChoice = (idx: number) => {
    if (blitzAnswered || !currentGame?.blitzQuestions) return;
    setSelectedBlitzOpt(idx);
    setBlitzAnswered(true);

    const currentQ = currentGame.blitzQuestions[blitzIndex];
    if (idx === currentQ.correctIndex) {
      setGameScore(prev => prev + (currentQ.points || 100));
      onAwardReward(25, 10);
    }
  };

  const handleNextBlitz = () => {
    if (!currentGame?.blitzQuestions) return;
    if (blitzIndex + 1 < currentGame.blitzQuestions.length) {
      setBlitzIndex(prev => prev + 1);
      setSelectedBlitzOpt(null);
      setBlitzAnswered(false);
    } else {
      setGameCompleted(true);
      onAwardReward(currentGame.xpReward || 100, currentGame.stardustReward || 50, 'blitz_master');
    }
  };

  // Handle Matching Concept Selection
  const handleConceptClick = (pairId: string) => {
    if (matchedPairIds.has(pairId)) return;
    setSelectedTerm(pairId);
    if (selectedMatch) {
      checkMatch(pairId, selectedMatch);
    }
  };

  const handleDefinitionClick = (pairId: string) => {
    if (matchedPairIds.has(pairId)) return;
    setSelectedMatch(pairId);
    if (selectedTerm) {
      checkMatch(selectedTerm, pairId);
    }
  };

  const checkMatch = (termId: string, matchId: string) => {
    if (termId === matchId) {
      const nextMatched = new Set(matchedPairIds);
      nextMatched.add(termId);
      setMatchedPairIds(nextMatched);
      setSelectedTerm(null);
      setSelectedMatch(null);
      setGameScore(prev => prev + 50);
      onAwardReward(20, 10);

      if (currentGame?.matchingPairs && nextMatched.size === currentGame.matchingPairs.length) {
        setGameCompleted(true);
        onAwardReward(currentGame.xpReward || 120, currentGame.stardustReward || 60);
      }
    } else {
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedMatch(null);
      }, 700);
    }
  };

  // Handle Sequence Move
  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    if (sequenceSubmitted) return;
    const nextSeq = [...userSequence];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextSeq.length) return;

    const temp = nextSeq[index];
    nextSeq[index] = nextSeq[targetIdx];
    nextSeq[targetIdx] = temp;
    setUserSequence(nextSeq);
  };

  const checkSequence = () => {
    if (!currentGame?.sequenceSteps) return;
    setSequenceSubmitted(true);
    
    // Check if the current order matches the original step orders
    const correctMap = new Map(currentGame.sequenceSteps.map(s => [s.id, s.order]));
    let isCorrect = true;
    for (let i = 0; i < userSequence.length - 1; i++) {
      const currentOrder = correctMap.get(userSequence[i].id) || 0;
      const nextOrder = correctMap.get(userSequence[i + 1].id) || 0;
      if (currentOrder > nextOrder) {
        isCorrect = false;
        break;
      }
    }

    setSequenceSuccess(isCorrect);
    if (isCorrect) {
      setGameScore(200);
      setGameCompleted(true);
      onAwardReward(currentGame.xpReward || 150, currentGame.stardustReward || 75, 'derivation_sage');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* BIG MAINTENANCE BANNER MAKING GAMES TAB INACCESSIBLE */}
      <div 
        id="games-maintenance-banner"
        className="w-full p-6 sm:p-8 rounded-3xl bg-amber-50 border-2 border-amber-400 shadow-md flex flex-col md:flex-row items-center gap-6 animate-in fade-in"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shrink-0">
          <Wrench className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Games Arena Offline</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-amber-950 tracking-tight">
            Maintenance
          </h1>
          <p className="text-sm sm:text-base text-amber-900/90 font-medium max-w-3xl leading-relaxed">
            The Games tab is currently under scheduled maintenance and system optimization. Game creation, rapid speed blitz duels, concept matching, and interactive games are temporarily inaccessible.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs text-amber-800 font-semibold">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Inaccessible During Maintenance Window
            </span>
            <span>•</span>
            <span>Please continue your learning in Study Mode or Quiz Arena</span>
          </div>
        </div>
      </div>

      {/* Inaccessible Games Sandbox (Locked Out with Pointer Events Disabled) */}
      <div className="relative">
        {/* Semi-transparent lock barrier overlay */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-stone-100/50 backdrop-blur-[2px] rounded-3xl border-2 border-dashed border-amber-300 pointer-events-auto">
          <div className="p-6 rounded-2xl bg-white/95 border border-amber-300 shadow-xl text-center max-w-md space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              Games Temporarily Inaccessible
            </h3>
            <p className="text-xs text-stone-600">
              Maintenance is actively underway. Interactive games and creation controls have been disabled.
            </p>
          </div>
        </div>

        {/* Disabled background games UI */}
        <div className="opacity-25 pointer-events-none select-none filter blur-[1px] space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Gamepad2 className="w-3.5 h-3.5 text-orange-500" />
            <span>AI Study Game Arena</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Learn Through Interactive Play
          </h2>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl font-normal">
            Generate custom flash games directly from lecture text, homework problems, and textbook diagram images.
          </p>
        </div>

        {/* Global Game Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-center">
            <div className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Total XP</div>
            <div className="text-lg font-bold text-orange-950 font-mono">{totalXp}</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Stardust</div>
            <div className="text-lg font-bold text-amber-950 font-mono">{stardust}</div>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Create AI Game</span>
        </button>

        <button
          onClick={() => setActiveTab('play')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'play'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Play Active Game {currentGame && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />}</span>
        </button>

        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'challenges'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Daily Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Achievements ({unlockedBadgeIds.size}/{ALL_BADGES.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATE AI GAME */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-5">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>AI Game Constructor</span>
                </h3>
                <span className="text-xs text-stone-500">Gemini 3.8 Flash Engine</span>
              </div>

              {/* Topic Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Academic Subject or Game Topic
                </label>
                <input
                  type="text"
                  value={gameTopic}
                  onChange={(e) => setGameTopic(e.target.value)}
                  placeholder="e.g. Organic Chemistry Stereoisomers, Calculus Integration, or Macroeconomics"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              {/* Game Archetype Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Choose Game Archetype
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  <button
                    type="button"
                    onClick={() => setSelectedArchetype('blitz')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedArchetype === 'blitz'
                        ? 'border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/40'
                        : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Zap className="w-3.5 h-3.5 text-orange-500" />
                      <span>Speed Blitz</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Rapid concept questions with point multipliers and instant reasoning.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedArchetype('matching')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedArchetype === 'matching'
                        ? 'border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/40'
                        : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>Concept Match</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Pair technical terms with laws, equations, and experimental setups.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedArchetype('sequence')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedArchetype === 'sequence'
                        ? 'border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/40'
                        : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ListOrdered className="w-3.5 h-3.5 text-orange-500" />
                      <span>Step Sequencer</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Arrange derivations, proofs, or cycles into strict chronological order.
                    </p>
                  </button>

                </div>
              </div>

              {/* Study Notes Text Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Input Study Text / Notes / Equation Reference</span>
                  <span className="text-[11px] text-stone-400">Copy-paste lecture slides or text</span>
                </label>
                <textarea
                  rows={4}
                  value={studyInputText}
                  onChange={(e) => setStudyInputText(e.target.value)}
                  placeholder="Paste textbook paragraph, lecture definitions, mathematical derivation, or biological steps here..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all font-mono leading-relaxed"
                />
              </div>

              {/* Diagram / Image Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Upload Study Diagram or Handwritten Notes Image (Optional)</span>
                  <span className="text-[11px] text-orange-600 font-medium">Multimodal AI Vision</span>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 hover:border-orange-400 rounded-2xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-orange-50/20 transition-all"
                  >
                    <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-stone-700">
                      Click to upload study image or diagram
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      PNG, JPG, or WebP (diagrams, math formulas, biology charts, circuit schematics)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-100 p-2">
                    <img
                      src={imagePreview}
                      alt="Study reference"
                      className="max-h-48 rounded-xl object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white text-xs cursor-pointer shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Error Notice */}
              {generationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {generationError}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateGame}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is crafting your game mechanics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Game From Study Material</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Sidebar Presets & Guide (1 col) */}
          <div className="space-y-4">
            
            {/* 1-Click Curated Study Games */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                <span>Instant 1-Click Study Packs</span>
              </h4>
              <p className="text-xs text-stone-500">
                Click any topic to auto-fill study notes and test the game generator immediately:
              </p>

              <div className="space-y-2 pt-1">
                {PRESET_TOPICS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setGameTopic(preset.title);
                      setStudyInputText(preset.text);
                      setSelectedArchetype(preset.archetype);
                    }}
                    className="w-full p-3 rounded-xl text-left border border-stone-200 bg-stone-50 hover:bg-orange-50/60 hover:border-orange-300 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-semibold text-stone-800 group-hover:text-orange-900">
                      {preset.title}
                    </p>
                    <p className="text-[10px] text-stone-400 capitalize mt-0.5">
                      Archetype: {preset.archetype}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* How AI Game Works */}
            <div className="bg-orange-50/50 rounded-2xl border border-orange-200/80 p-5 space-y-2.5">
              <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Pedagogical Engine</span>
              </h4>
              <p className="text-xs text-orange-900/80 leading-relaxed">
                TechTut translates any unstructured study note or handwritten diagram into active recall games. Correct moves award XP and Stardust to reinforce long-term memory.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PLAY ACTIVE GAME */}
      {activeTab === 'play' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 sm:p-8 min-h-[420px]">
          
          {!currentGame ? (
            <div className="text-center py-16 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-500 flex items-center justify-center mx-auto">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">No Active Game Loaded</h3>
              <p className="text-xs text-stone-500">
                You can create a game using the AI Game Constructor or choose an instant study preset.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGameTopic(PRESET_TOPICS[0].title);
                  setStudyInputText(PRESET_TOPICS[0].text);
                  setSelectedArchetype('blitz');
                  handleGenerateGame();
                }}
                className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Calculus Blitz Demo</span>
              </button>
            </div>
          ) : gameCompleted ? (
            /* Game Completion Screen */
            <div className="text-center py-12 space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Trophy className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-stone-900">Curriculum Mastery Achieved!</h3>
                <p className="text-sm text-stone-600 mt-1">
                  You completed <span className="font-semibold text-orange-600">{currentGame.title}</span>
                </p>
              </div>

              {/* Rewards Banner */}
              <div className="flex items-center justify-center gap-4 py-3 px-6 rounded-2xl bg-orange-50 border border-orange-200 max-w-xs mx-auto">
                <div>
                  <div className="text-[10px] uppercase font-bold text-orange-600">Earned XP</div>
                  <div className="text-xl font-bold text-orange-950 font-mono">+{currentGame.xpReward || 100}</div>
                </div>
                <div className="w-px h-8 bg-orange-200" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-600">Stardust</div>
                  <div className="text-xl font-bold text-amber-950 font-mono">+{currentGame.stardustReward || 50}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => initGame(currentGame)}
                  className="py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create New AI Game</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Game Play Archetypes */
            <div className="space-y-6">
              
              {/* Game Metadata Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {currentGame.archetype.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs text-stone-500 font-medium">{currentGame.topic}</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mt-1">{currentGame.title}</h3>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-stone-400">Current Score</div>
                  <div className="text-lg font-bold text-orange-600 font-mono">{gameScore} pts</div>
                </div>
              </div>

              {/* ARCHETYPE 1: SPEED BLITZ */}
              {currentGame.archetype === 'blitz' && currentGame.blitzQuestions && (
                <div className="space-y-5 max-w-2xl mx-auto">
                  {(() => {
                    const q = currentGame.blitzQuestions[blitzIndex];
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                          <span>Question {blitzIndex + 1} of {currentGame.blitzQuestions.length}</span>
                          <span>Value: {q.points} XP</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 text-sm font-semibold text-stone-900 leading-relaxed">
                          {q.prompt}
                        </div>

                        <div className="space-y-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = selectedBlitzOpt === oIdx;
                            const isCorrect = oIdx === q.correctIndex;
                            let style = 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800';

                            if (blitzAnswered) {
                              if (isCorrect) {
                                style = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                              } else if (isChosen) {
                                style = 'border-rose-400 bg-rose-50 text-rose-950';
                              } else {
                                style = 'border-stone-200 opacity-50 bg-stone-50';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleBlitzChoice(oIdx)}
                                className={`w-full p-4 rounded-xl text-left border text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${style}`}
                              >
                                <span>{opt}</span>
                                {blitzAnswered && isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation on answer */}
                        {blitzAnswered && (
                          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 space-y-3 animate-in fade-in duration-200">
                            <div>
                              <span className="font-bold">Pedagogical Derivation: </span>
                              <span>{q.explanation}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleNextBlitz}
                              className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <span>Next Concept</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ARCHETYPE 2: CONCEPT MATCHING */}
              {currentGame.archetype === 'matching' && currentGame.matchingPairs && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs text-orange-900 flex items-center justify-between">
                    <span>Click a concept on the left, then click its corresponding definition or equation on the right.</span>
                    <span className="font-semibold">{matchedPairIds.size} / {currentGame.matchingPairs.length} Matched</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Left Column: Terms */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Concept / Term</h4>
                      {currentGame.matchingPairs.map((pair) => {
                        const isMatched = matchedPairIds.has(pair.id);
                        const isSelected = selectedTerm === pair.id;

                        let style = 'border-stone-200 bg-white hover:border-orange-300 text-stone-800';
                        if (isMatched) {
                          style = 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60 line-through';
                        } else if (isSelected) {
                          style = 'border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-2 ring-orange-400/40';
                        }

                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isMatched}
                            onClick={() => handleConceptClick(pair.id)}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${style}`}
                          >
                            {pair.term}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column: Definitions (shuffled display order) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Match / Meaning</h4>
                      {currentGame.matchingPairs.map((pair) => {
                        const isMatched = matchedPairIds.has(pair.id);
                        const isSelected = selectedMatch === pair.id;

                        let style = 'border-stone-200 bg-white hover:border-orange-300 text-stone-800';
                        if (isMatched) {
                          style = 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60';
                        } else if (isSelected) {
                          style = 'border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-2 ring-orange-400/40';
                        }

                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isMatched}
                            onClick={() => handleDefinitionClick(pair.id)}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
                          >
                            {pair.match}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHETYPE 3: STEP SEQUENCER */}
              {currentGame.archetype === 'sequence' && (
                <div className="space-y-5 max-w-2xl mx-auto">
                  <p className="text-xs text-stone-600">
                    Re-order the steps by clicking the arrows until the mathematical proof or process flows in correct logical sequence:
                  </p>

                  <div className="space-y-2.5">
                    {userSequence.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 text-xs text-stone-900"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-medium leading-relaxed">{step.text}</span>
                        </div>

                        {!sequenceSubmitted && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSequenceItem(idx, 'up')}
                              disabled={idx === 0}
                              className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer text-xs"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSequenceItem(idx, 'down')}
                              disabled={idx === userSequence.length - 1}
                              className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer text-xs"
                            >
                              ↓
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!sequenceSubmitted ? (
                    <button
                      type="button"
                      onClick={checkSequence}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Validate Logical Sequence</span>
                    </button>
                  ) : (
                    <div className={`p-4 rounded-xl border text-xs ${
                      sequenceSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {sequenceSuccess ? (
                        <p className="font-semibold">Derivation sequence verified! Flawless logical rigor.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-semibold">Order discrepancy detected.</p>
                          <button
                            type="button"
                            onClick={() => setSequenceSubmitted(false)}
                            className="py-1.5 px-3 bg-white border border-stone-200 text-stone-800 rounded-lg text-xs font-semibold"
                          >
                            Retry Sequence
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* TAB 3: DAILY CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <span>Scholar Daily Challenges</span>
            </h3>
            <span className="text-xs text-stone-500">Resets every 24 hours</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyChallenges.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-stone-900">{ch.title}</span>
                    {ch.completed && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{ch.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                    <span>Progress</span>
                    <span className="font-mono">{ch.current} / {ch.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (ch.current / ch.target) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-stone-500">
                    <span className="text-orange-600 font-mono">+{ch.rewardXp} XP</span>
                    <span className="text-amber-600 font-mono">+{ch.rewardStardust} Stardust</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS & BADGES */}
      {activeTab === 'badges' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span>Grimoire Achievements</span>
            </h3>
            <span className="text-xs text-stone-500">{unlockedBadgeIds.size} of {ALL_BADGES.length} Unlocked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = unlockedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isUnlocked
                      ? 'bg-orange-50/50 border-orange-200'
                      : 'bg-stone-50/40 border-stone-200 opacity-55'
                  }`}
                >
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">{badge.name}</span>
                      {isUnlocked && (
                        <span className="text-[9px] font-bold text-orange-700 uppercase bg-orange-100 px-1.5 py-0.5 rounded">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        </div>
      </div>

    </div>
  );
};
