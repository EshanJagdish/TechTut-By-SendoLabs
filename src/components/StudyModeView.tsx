import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Lightbulb, 
  Layers, 
  RotateCw, 
  Flame, 
  Clock, 
  Compass, 
  Music, 
  Bookmark, 
  Check, 
  ChevronRight,
  Coffee,
  Brain,
  Star,
  GraduationCap,
  FolderSearch,
  StickyNote,
  Volume2
} from 'lucide-react';
import { EducationLevel, FlashcardItem, PracticeQuestion, StudySolution } from '../types';
import { dreamyAudio } from '../lib/audioSynthesizer';

interface StudyModeViewProps {
  educationLevel: EducationLevel;
  initialQuery?: string;
  initialSubject?: string;
  onActivateAddOn: (solution: StudySolution) => void;
  onSaveFlashcard: (card: FlashcardItem) => void;
  onSaveSolution: (solution: StudySolution) => void;
  onAwardXpAndStardust: (xp: number, stardust: number) => void;
  onOpenWorkspace?: (tab?: 'classroom' | 'keep' | 'drive') => void;
  savedFlashcardIds: Set<string>;
  savedSolutionIds: Set<string>;
}

const PRESET_TOPICS = [
  { label: 'Derivative of x²·sin(x)', subject: 'Calculus', prompt: 'Solve step-by-step the derivative of f(x) = x² * sin(x) with product rule explanation.' },
  { label: 'Photosynthesis Light Reactions', subject: 'Biology', prompt: 'Explain the light-dependent reactions of photosynthesis, photosystem II, and ATP synthase.' },
  { label: 'Schrödinger Wave Equation', subject: 'Physics', prompt: 'Explain what the wave function ψ and its probability density |ψ|² represent physically.' },
  { label: 'Dijkstra Algorithm Intuition', subject: 'Computer Science', prompt: 'How does Dijkstra algorithm work with priority queues and greedy relaxation?' },
  { label: 'French Revolution Causes', subject: 'History', prompt: 'What were the core socioeconomic and intellectual causes of the French Revolution in 1789?' },
  { label: 'Sn1 vs Sn2 Organic Reactions', subject: 'Chemistry', prompt: 'Explain the difference between SN1 and SN2 nucleophilic substitution reactions with carbocation stability.' },
];

export const StudyModeView: React.FC<StudyModeViewProps> = ({
  educationLevel,
  initialQuery,
  initialSubject,
  onActivateAddOn,
  onSaveFlashcard,
  onSaveSolution,
  onAwardXpAndStardust,
  onOpenWorkspace,
  savedFlashcardIds,
  savedSolutionIds,
}) => {
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'General');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<StudySolution | null>(null);
  const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [activeStudyTrack, setActiveStudyTrack] = useState<string>('dreamy_starlight');

  useEffect(() => {
    if (initialQuery) {
      setInputQuery(initialQuery);
      if (initialSubject) setSelectedSubject(initialSubject);
      handleSolve(initialQuery);
    }
  }, [initialQuery, initialSubject]);

  const STUDY_SOUNDSCAPES = [
    { id: 'celestial_lofi', label: 'Soft Lo-Fi', mood: 'Relaxed & Rhythmic', icon: '🎧' },
    { id: 'calm_focus', label: 'Alpha Waves', mood: 'Logic & Problem Solving', icon: '🌊' },
    { id: 'dreamy_starlight', label: 'Starlight Dream', mood: 'Calm & Flow', icon: '✨' },
    { id: 'midnight_river', label: 'Midnight River', mood: 'History & Essay Reading', icon: '🌙' },
    { id: 'deep_nebula', label: 'Theta Zen', mood: 'Deep Memory & Mnemonics', icon: '🌌' },
  ];

  const getSuggestedTrackForSubject = (subj: string) => {
    if (['Calculus', 'Physics', 'Chemistry', 'Computer Science'].includes(subj)) {
      return STUDY_SOUNDSCAPES[1]; // Alpha Waves
    }
    if (['History', 'Philosophy', 'Literature'].includes(subj)) {
      return STUDY_SOUNDSCAPES[3]; // Midnight River
    }
    if (['Biology', 'Medicine', 'Psychology'].includes(subj)) {
      return STUDY_SOUNDSCAPES[0]; // Soft Lo-Fi
    }
    return STUDY_SOUNDSCAPES[2]; // Starlight Dream
  };

  const handleSelectSoundscape = (trackId: string) => {
    setActiveStudyTrack(trackId);
    dreamyAudio.setTrack(trackId);
    if (!dreamyAudio.isPlaying) dreamyAudio.play();
  };

  const handleSolve = async (queryToUse?: string) => {
    const q = queryToUse || inputQuery;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/study/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          subject: selectedSubject,
          level: educationLevel,
        }),
      });

      if (!res.ok) throw new Error('Failed to resolve solution');
      const data: StudySolution = await res.json();
      setSolution(data);
      onAwardXpAndStardust(50, 20);
    } catch (err) {
      console.error('Error fetching solution:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardFlip = (id: string) => {
    setFlippedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectPracticeOption = (questionId: string, optionIndex: number, correctIndex: number) => {
    if (userAnswers[questionId] !== undefined) return; // Already answered
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    if (optionIndex === correctIndex) {
      onAwardXpAndStardust(25, 10);
    }
  };

  const handleTuneToTrack = (trackName: string) => {
    let trackId = 'dreamy_starlight';
    if (trackName.toLowerCase().includes('focus')) trackId = 'calm_focus';
    else if (trackName.toLowerCase().includes('river')) trackId = 'midnight_river';
    else if (trackName.toLowerCase().includes('lo-fi')) trackId = 'celestial_lofi';
    else if (trackName.toLowerCase().includes('nebula')) trackId = 'deep_nebula';

    dreamyAudio.setTrack(trackId);
    if (!dreamyAudio.isPlaying) dreamyAudio.play();
  };

  return (
    <div id="study-mode-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32">
      
      {/* Hero Welcome Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>TechTut Study Sanctuary • Academically Rigorous, Focused & Clean</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900">
          What concept shall we illuminate today?
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Enter any homework problem, theorem, or question. Receive serene step-by-step guidance, memory anchors, flashcards, and paced rhythm.
        </p>

        {/* Workspace Quick-Links */}
        {onOpenWorkspace && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onOpenWorkspace('classroom')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
              <span>Import from Google Classroom</span>
            </button>
            <button
              onClick={() => onOpenWorkspace('drive')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <FolderSearch className="w-3.5 h-3.5 text-emerald-600" />
              <span>Search Drive Study Material</span>
            </button>
            <button
              onClick={() => onOpenWorkspace('keep')}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              <span>Hold in Scholar Notes</span>
            </button>
          </div>
        )}
      </div>

      {/* Integrated Study Soundscape Bar (Music System & Study Mode Co-integration) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-stone-900">Study Soundscape Harmony</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-medium">
              Suggested for {selectedSubject}: {getSuggestedTrackForSubject(selectedSubject).mood}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 hidden sm:inline font-mono">Binaural & Ambient Synthesis</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STUDY_SOUNDSCAPES.map(sc => {
            const isActive = activeStudyTrack === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectSoundscape(sc.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap border flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-xs font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{sc.icon}</span>
                <span>{sc.label}</span>
                {isActive && <Volume2 className="w-3 h-3 text-orange-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Console */}
      <div className="relative rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-7 shadow-xs">
        
        <div className="space-y-4">
          <div className="relative">
            <textarea
              id="study-input-textarea"
              rows={3}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="e.g. Derive the quadratic formula using completing the square, or explain cellular respiration step-by-step..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSolve();
                }
              }}
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Quick Inquiries
              </span>
              <span className="text-[11px] text-stone-400 font-mono">Press Ctrl+Enter to solve</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputQuery(preset.prompt);
                    setSelectedSubject(preset.subject);
                    handleSolve(preset.prompt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-stone-900 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-600 text-[10px] font-bold">{preset.subject}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <Compass className="w-3.5 h-3.5 text-orange-500" />
              <span>Tailored for <strong className="text-stone-900 font-semibold">{educationLevel.replace('_', ' ').toUpperCase()}</strong> level</span>
            </div>

            <button
              id="study-solve-btn"
              onClick={() => handleSolve()}
              disabled={isLoading || !inputQuery.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Illuminating Concept...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-100" />
                  <span>Illuminate Solution</span>
                  <ChevronRight className="w-4 h-4 text-orange-100" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Loading Animation */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900">Consulting the TechTut Scholar Engine</h3>
            <p className="text-xs text-stone-500">Deconstructing problem milestones, weaving memory mnemonics, and calibrating study pacing...</p>
          </div>
        </div>
      )}

      {/* Main Solution Output */}
      {solution && !isLoading && (
        <div id="solution-board" className="space-y-8 animate-in fade-in duration-500">
          
          {/* Header & Save Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider font-mono">
                {solution.questionType ? `${solution.questionType.replace('_', ' ')} • ${solution.topic}` : solution.topic}
              </span>
              <h2 className="text-lg font-bold text-stone-900">{solution.question}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveSolution(solution)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  savedSolutionIds.has(solution.id)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-orange-300'
                }`}
              >
                {savedSolutionIds.has(solution.id) ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Saved to Grimoire
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                    Save Solution
                  </>
                )}
              </button>

              <button
                id="activate-addon-btn"
                onClick={() => onActivateAddOn(solution)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-white" />
                <span>Activate Add-On Mode →</span>
              </button>
            </div>
          </div>

          {/* Intuition / Summary Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Conceptual Intuition & Big Picture</span>
              </div>
              <span className="px-2.5 py-0.5 bg-orange-50 rounded-full text-[10px] text-orange-700 border border-orange-200 font-semibold uppercase tracking-wider">
                STUDY MODE
              </span>
            </div>
            <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-serif italic">
              "{solution.dreamySummary}"
            </p>
            {solution.conceptOrigin && (
              <div className="p-4 bg-orange-50/60 border-l-2 border-orange-400 rounded-r-xl italic text-xs sm:text-sm text-stone-700 flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span><strong>Origin Note:</strong> {solution.conceptOrigin}</span>
              </div>
            )}
          </div>

          {/* Step-by-Step Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                {solution.questionType === 'calculation' ? 'Step-by-Step Mathematical Derivation' :
                 solution.questionType === 'coding' ? 'Algorithmic Walkthrough & Logic' :
                 solution.questionType === 'humanities' ? 'Historical & Thematic Analysis' :
                 solution.questionType === 'test_prep' ? 'Exam Strategy & Distractor Elimination' :
                 'Step-by-Step Conceptual Mechanism'}
              </h3>
              <span className="text-xs text-stone-500">{solution.steps.length} Milestones</span>
            </div>

            <div className="space-y-3">
              {solution.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:border-orange-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 text-xs text-orange-700 font-bold">
                      {step.stepNumber}
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-stone-900">
                        {step.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        {step.explanation}
                      </p>

                      {step.derivation && (
                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-800 overflow-x-auto">
                          {step.derivation}
                        </div>
                      )}

                      {step.keyTakeaway && (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Key takeaway:</strong> {step.keyTakeaway}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flashcards Carousel */}
          {solution.flashcards && solution.flashcards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  Active Recall Flashcards
                </h3>
                <span className="text-xs text-stone-400">Click to flip card</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solution.flashcards.map((card) => {
                  const isFlipped = flippedCardIds.has(card.id);
                  const isSaved = savedFlashcardIds.has(card.id);

                  return (
                    <div 
                      key={card.id}
                      onClick={() => toggleCardFlip(card.id)}
                      className="cursor-pointer group relative min-h-[160px] rounded-2xl bg-white border border-stone-200/90 hover:border-orange-300 p-5 flex flex-col justify-between transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                        <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider font-mono">{card.topic}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveFlashcard(card);
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isSaved ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:text-stone-700'
                            }`}
                            title={isSaved ? 'Saved to collection' : 'Save to collection'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                            <RotateCw className="w-2.5 h-2.5" />
                            {isFlipped ? 'Answer' : 'Question'}
                          </span>
                        </div>
                      </div>

                      <div className="py-4 flex-1 flex items-center justify-center text-center">
                        <p className={`text-sm leading-relaxed ${isFlipped ? 'text-emerald-700 font-medium' : 'text-stone-900 font-semibold'}`}>
                          {isFlipped ? card.back : card.front}
                        </p>
                      </div>

                      {card.mnemonic && (
                        <div className="pt-2 border-t border-stone-100 text-[11px] text-orange-700 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-orange-500 flex-shrink-0" />
                          <span><strong>Mnemonic:</strong> {card.mnemonic}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scholar Memory Tricks & Extra Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Memory Tricks */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" />
                Scholar Memory Anchors
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
                {solution.memoryTricks.map((trick, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span className="leading-relaxed">{trick}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Extra Tips */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Scholar Advice & Pitfalls
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
                {solution.extraTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Interactive Practice Questions */}
          {solution.practiceQuestions && solution.practiceQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  Calm Practice Checkpoint
                </h3>
                <span className="text-xs text-orange-700 font-mono font-medium">+25 XP for each correct insight</span>
              </div>

              <div className="space-y-4">
                {solution.practiceQuestions.map((pq, qIdx) => {
                  const selected = userAnswers[pq.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === pq.correctIndex;

                  return (
                    <div 
                      key={pq.id || qIdx}
                      className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-stone-900">
                          {qIdx + 1}. {pq.question}
                        </p>
                        {pq.hint && (
                          <button
                            onClick={() => setShowHints(prev => ({ ...prev, [pq.id]: !prev[pq.id] }))}
                            className="text-[11px] text-orange-600 hover:text-orange-700 flex items-center gap-1 flex-shrink-0 cursor-pointer font-medium"
                          >
                            <Lightbulb className="w-3 h-3" />
                            {showHints[pq.id] ? 'Hide Hint' : 'Hint'}
                          </button>
                        )}
                      </div>

                      {showHints[pq.id] && (
                        <div className="p-3.5 bg-orange-50 border-l-2 border-orange-400 rounded-r-xl italic text-xs text-orange-900">
                          💡 <strong>Hint:</strong> {pq.hint}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pq.options.map((opt, optIdx) => {
                          let optStyle = 'bg-stone-50 border-stone-200 text-stone-800 hover:border-orange-400 hover:bg-orange-50/50';
                          if (isAnswered) {
                            if (optIdx === pq.correctIndex) {
                              optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold';
                            } else if (optIdx === selected && !isCorrect) {
                              optStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                            } else {
                              optStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-50';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectPracticeOption(pq.id, optIdx, pq.correctIndex)}
                              disabled={isAnswered}
                              className={`p-3.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${optStyle}`}
                            >
                              <span className="font-bold mr-2 text-orange-600">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                          isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-50 text-stone-700 border border-stone-200'
                        }`}>
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 ${isCorrect ? 'text-emerald-600' : 'text-stone-400'}`} />
                          <div>
                            <strong>{isCorrect ? 'Wonderful discernment!' : 'Gentle reflection:'}</strong> {pq.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Follow-Up Questions */}
          {solution.followUpQuestions && solution.followUpQuestions.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-orange-500" />
                Follow-up Explorations
              </h4>
              <div className="flex flex-wrap gap-2">
                {solution.followUpQuestions.map((fq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputQuery(fq);
                      handleSolve(fq);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-800 text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{fq}</span>
                    <ChevronRight className="w-3 h-3 text-orange-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Study Recommendations Card (Pacing, Breaks, Music) */}
          {solution.recommendations && (
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-stone-200/90 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Study Pacing Recommendations
                </h4>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold uppercase tracking-wider">
                  {solution.recommendations.recommendedMood}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-500" />
                    Pacing & Breaks
                  </span>
                  <p className="text-stone-900">{solution.recommendations.breakPacing}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-amber-500" />
                    Hydration & Focus
                  </span>
                  <p className="text-stone-900">{solution.recommendations.hydrationTip}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <Music className="w-3 h-3 text-orange-500" />
                    Soundscape Pairing
                  </span>
                  <div className="flex items-center justify-between">
                    <p className="text-stone-900 truncate">{solution.recommendations.ambientSoundtrack}</p>
                    <button
                      onClick={() => handleTuneToTrack(solution.recommendations.ambientSoundtrack)}
                      className="ml-1 text-[10px] px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors flex-shrink-0 cursor-pointer font-medium"
                    >
                      Play
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Handoff to Add-On Mode */}
          <div className="text-center p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-stone-900">Ready for Deep Mastery & Shortcuts?</h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              Activate Add-On Mode to unlock high-yield exam shortcuts, vivid sensory mental palace anchors, progressive application drills, and circadian study advice.
            </p>
            <button
              onClick={() => onActivateAddOn(solution)}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>Enter Add-On Mode Sanctuary</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
