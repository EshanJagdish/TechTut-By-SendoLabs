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
  Boxes,
  FileCode2
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
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  System Specs &amp; Architecture Blueprint
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono font-semibold border border-stone-200">
                  TechTut v2.5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Technical specifications, component interconnects, proctor schemas, and data contracts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200 text-stone-800">
            <Cpu className="w-4 h-4 text-orange-600" />
            <span>AI Copilot: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'branding', 'architecture', 'prompts', 'interconnect'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-orange-500 text-white shadow-xs' 
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50'
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
            className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5 hover:border-orange-300 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">{spec.title}</h3>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {spec.category}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
              {spec.summary}
            </div>

            {/* Directives List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
                Engineering Specifications:
              </h4>
              <ul className="space-y-2 text-xs text-stone-700">
                {spec.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <span className="leading-normal">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code / Prompt Specification Block */}
            {spec.codeBlock && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span className="font-mono text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-orange-600" />
                    <span>Schema / System Directive</span>
                  </span>
                  <button
                    onClick={() => handleCopyCode(spec.id, spec.codeBlock)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedId === spec.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Spec</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 font-mono text-xs leading-relaxed text-stone-200 overflow-x-auto shadow-inner">
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
