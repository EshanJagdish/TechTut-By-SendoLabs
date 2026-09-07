import React, { useState, useEffect } from 'react';
import { 
  Orbit, 
  Sparkles, 
  Zap, 
  Eye, 
  Clock, 
  Moon, 
  HelpCircle, 
  Coffee, 
  Lightbulb, 
  CheckCircle2, 
  Bookmark, 
  Music,
  ChevronRight,
  RotateCw,
  Wind
} from 'lucide-react';
import { AddOnInsight, EducationLevel, StudySolution } from '../types';
import { dreamyAudio } from '../lib/audioSynthesizer';

interface AddOnModeViewProps {
  activeStudySolution?: StudySolution | null;
  educationLevel: EducationLevel;
  onSaveAddOn: (addon: AddOnInsight) => void;
  onAwardXpAndStardust: (xp: number, stardust: number) => void;
  savedAddOnIds: Set<string>;
}

export const AddOnModeView: React.FC<AddOnModeViewProps> = ({
  activeStudySolution,
  educationLevel,
  onSaveAddOn,
  onAwardXpAndStardust,
  savedAddOnIds,
}) => {
  const [topicInput, setTopicInput] = useState(activeStudySolution?.question || 'Calculus Invariance Principles');
  const [addonData, setAddonData] = useState<AddOnInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const handleGenerateAddOn = async (overrideTopic?: string) => {
    const q = overrideTopic || topicInput;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/study/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          solutionSummary: activeStudySolution?.dreamySummary,
          level: educationLevel,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate Add-On insight');
      const data: AddOnInsight = await res.json();
      setAddonData(data);
      onAwardXpAndStardust(40, 15);
    } catch (err) {
      console.error('Error fetching add-on:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeStudySolution) {
      setTopicInput(activeStudySolution.question);
      handleGenerateAddOn(activeStudySolution.question);
    } else {
      handleGenerateAddOn(topicInput);
    }
  }, [activeStudySolution]);

  const handleSelectPracticeOption = (questionId: string, optionIndex: number, correctIndex: number) => {
    if (userAnswers[questionId] !== undefined) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    if (optionIndex === correctIndex) {
      onAwardXpAndStardust(30, 15);
    }
  };

  return (
    <div id="addon-mode-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider">
          <Orbit className="w-3.5 h-3.5 text-orange-500" />
          <span>TechTut Add-On Sanctuary • Cognitive Secrets & Study Environment</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900">
          Deep Scholar Insights & Exam Shortcuts
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Elevate beyond textbook mechanics. Discover mental models, speed heuristics, memory palace anchors, and serene study atmospheres.
        </p>
      </div>

      {/* Active Subject Bar / Input Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-800 min-w-0">
          <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="font-bold text-stone-900">Active Topic:</span>
          <span className="text-orange-700 font-semibold truncate max-w-xs sm:max-w-md">{topicInput}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateAddOn()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-orange-100" />}
            <span>Regenerate Insights</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
            <Orbit className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Synthesizing Add-On Mastery Matrix...</h3>
          <p className="text-xs text-stone-500">Discovering high-yield exam shortcuts, vivid sensory anchors, and circadian rhythms...</p>
        </div>
      )}

      {/* Add-On Content Display */}
      {addonData && !isLoading && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-50 rounded-full text-[10px] text-orange-700 border border-orange-200 font-semibold uppercase tracking-wider">
                ADD-ON MODE
              </span>
              <span className="text-xs text-stone-500">Level: <strong className="text-stone-900 font-semibold">{educationLevel.toUpperCase()}</strong></span>
            </div>
            <button
              onClick={() => onSaveAddOn(addonData)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                savedAddOnIds.has(addonData.id)
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-white text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-orange-300'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedAddOnIds.has(addonData.id) ? 'fill-emerald-500 text-emerald-500' : 'text-stone-400'}`} />
              <span>{savedAddOnIds.has(addonData.id) ? 'Saved to Grimoire' : 'Save Add-On Deck'}</span>
            </button>
          </div>

          {/* 1. Deep Conceptual Insights */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-500" />
              Deep Insights & Hidden Connections
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {addonData.deepInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-2 hover:border-orange-300 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Secret #{idx + 1}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-serif italic">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. High-Yield Exam Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              High-Yield Exam Shortcuts & Elimination Tricks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addonData.examShortcuts.map((sc, idx) => (
                <div 
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 space-y-2.5 shadow-xs hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 text-sm">{sc.shortcut}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold uppercase tracking-wider">
                      Fast-Track Heuristic
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    <strong className="text-orange-700">When to deploy:</strong> {sc.whenToUse}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Visual Memory Palace Anchors */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Moon className="w-4 h-4 text-orange-500" />
              Sensory Memory Palace Anchors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addonData.memoryPalaceAnchors.map((anchor, idx) => (
                <div 
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 space-y-3 shadow-xs hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-700 font-mono tracking-wider font-bold">
                      0{idx + 1} / CHAMBER {idx + 1}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 font-serif italic bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed">
                    "{anchor.visualAnchor}"
                  </p>
                  <p className="text-xs text-stone-600">
                    <strong className="text-orange-700">Concept Link:</strong> {anchor.conceptLink}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Progressive Application Practice */}
          {addonData.progressivePractice && addonData.progressivePractice.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-500" />
                Progressive Application Challenge
              </h3>

              <div className="space-y-4">
                {addonData.progressivePractice.map((pq, qIdx) => {
                  const selected = userAnswers[pq.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === pq.correctIndex;

                  return (
                    <div 
                      key={pq.id || qIdx}
                      className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs"
                    >
                      <p className="text-sm font-bold text-stone-900">
                        {pq.question}
                      </p>

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
                            <strong>{isCorrect ? 'Brilliant analysis!' : 'Insightful note:'}</strong> {pq.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Scholar Study Advice (Sensory Sanctuary, Lighting, Tea, Circadian) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Wind className="w-4 h-4 text-orange-500" />
                Study Sanctuary Setup
              </h3>
              <span className="text-xs text-orange-700 font-semibold font-mono">Biorhythm Alignment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-stone-700 font-bold flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  Sensory Environment
                </span>
                <p className="text-stone-600 leading-relaxed">{addonData.dreamyAdvice.environmentSetup}</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-stone-700 font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Lighting & Aroma
                </span>
                <p className="text-stone-600 leading-relaxed">{addonData.dreamyAdvice.lightingAndScent}</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-stone-700 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Circadian Timing
                </span>
                <p className="text-stone-600 leading-relaxed">{addonData.dreamyAdvice.circadianTiming}</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-stone-700 font-bold flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-orange-500" />
                  Ambient Pairing
                </span>
                <p className="text-stone-600 leading-relaxed">{addonData.dreamyAdvice.soundscapeSuggestion}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
