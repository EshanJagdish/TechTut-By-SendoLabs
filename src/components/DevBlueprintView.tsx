import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Layers, 
  Sparkles, 
  Workflow, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  BookOpen, 
  Cpu,
  Boxes
} from 'lucide-react';
import { SENDOLABS_DEV_BLUEPRINTS, SystemSpecSection } from '../data/devBlueprintData';

export const DevBlueprintView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSpecs = selectedCategory === 'all' 
    ? SENDOLABS_DEV_BLUEPRINTS 
    : SENDOLABS_DEV_BLUEPRINTS.filter(s => s.category === selectedCategory);

  const handleCopyCode = (id: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="dev-blueprint-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32">
      
      {/* Dev Header */}
      <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-light italic font-serif text-white">SendoLabs Developer System Blueprint</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                  TechTut v2.4 Architecture
                </span>
              </div>
              <p className="text-xs text-white/50">Developer specifications, page hierarchies, system prompts, and interconnect data flows.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-indigo-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>Copilot Abstraction: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {['all', 'branding', 'architecture', 'prompts', 'interconnect'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/40' 
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            {cat === 'all' ? 'All System Specs' : cat}
          </button>
        ))}
      </div>

      {/* Blueprint Cards */}
      <div className="space-y-6">
        {filteredSpecs.map((spec) => (
          <div 
            key={spec.id}
            id={`spec-${spec.id}`}
            className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-4 shadow-2xl hover:border-indigo-500/30 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">{spec.title}</h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {spec.category}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/80 italic bg-black/30 p-3.5 rounded-2xl border border-white/10 leading-relaxed font-serif">
              {spec.summary}
            </p>

            {/* Bullet Points */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider font-mono">Engineering Directives:</h4>
              <ul className="space-y-1.5 text-xs text-white/70">
                {spec.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code / Prompt Specification Block */}
            {spec.codeBlock && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-mono text-[11px] text-indigo-300">Code / System Prompt Blueprint</span>
                  <button
                    onClick={() => handleCopyCode(spec.id, spec.codeBlock)}
                    className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white cursor-pointer"
                  >
                    {copiedId === spec.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Spec</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-[11px] leading-relaxed text-indigo-200/90 overflow-x-auto">
                  {spec.codeBlock}
                </pre>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
