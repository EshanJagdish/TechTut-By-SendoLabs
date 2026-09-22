import React, { useState } from 'react';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Orbit, 
  Compass, 
  Eye, 
  Check, 
  CloudCheck, 
  RefreshCw, 
  Palette, 
  Sliders, 
  ShieldCheck 
} from 'lucide-react';
import { 
  UserProfile, 
  CosmicCustomizerSettings, 
  StarPattern, 
  AmbientGlowColor 
} from '../types';
import { syncUserProfileToFirestore } from '../lib/firebase';

interface CosmicCustomizerProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const STAR_PATTERNS: Array<{
  id: StarPattern;
  name: string;
  description: string;
  badge: string;
  icon: string;
}> = [
  {
    id: 'constellation',
    name: 'Neural Constellations',
    description: 'Dynamic connective lines link neighboring stars, symbolizing linked concepts.',
    badge: 'Intellectual',
    icon: '✨'
  },
  {
    id: 'spiral_galaxy',
    name: 'Spiral Galaxy',
    description: 'Stars follow a logarithmic golden-ratio orbital spiral around your workspace.',
    badge: 'Galactic',
    icon: '🌀'
  },
  {
    id: 'nebula_drift',
    name: 'Nebula Stardust Drift',
    description: 'Gentle floating particles drift softly across your field of view.',
    badge: 'Serene',
    icon: '🌌'
  },
  {
    id: 'zenith_cluster',
    name: 'Zenith Apex Array',
    description: 'Stars cluster predominantly near the top center, keeping the lower stage clean.',
    badge: 'Focused',
    icon: '⭐'
  },
  {
    id: 'minimalist_void',
    name: 'Minimalist Void',
    description: 'Ultra-sparse star density with generous negative space for distraction-free study.',
    badge: 'Clean',
    icon: '🌑'
  }
];

const GLOW_COLORS: Array<{
  id: AmbientGlowColor;
  name: string;
  accentHex: string;
  gradientClass: string;
  previewBg: string;
}> = [
  {
    id: 'warm_amber',
    name: 'Warm Amber',
    accentHex: '#f97316',
    gradientClass: 'from-orange-500/20 via-amber-500/10 to-transparent',
    previewBg: 'bg-orange-500'
  },
  {
    id: 'celestial_indigo',
    name: 'Celestial Indigo',
    accentHex: '#6366f1',
    gradientClass: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    previewBg: 'bg-indigo-500'
  },
  {
    id: 'aurora_emerald',
    name: 'Aurora Emerald',
    accentHex: '#10b981',
    gradientClass: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    previewBg: 'bg-emerald-500'
  },
  {
    id: 'solar_citrus',
    name: 'Solar Citrus',
    accentHex: '#ea580c',
    gradientClass: 'from-orange-600/20 via-yellow-500/10 to-transparent',
    previewBg: 'bg-amber-500'
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    accentHex: '#f43f5e',
    gradientClass: 'from-rose-500/20 via-fuchsia-500/10 to-transparent',
    previewBg: 'bg-rose-500'
  },
  {
    id: 'obsidian_mono',
    name: 'Obsidian Monochrome',
    accentHex: '#78716c',
    gradientClass: 'from-stone-500/15 via-stone-400/10 to-transparent',
    previewBg: 'bg-stone-600'
  }
];

export const CosmicCustomizer: React.FC<CosmicCustomizerProps> = ({
  userProfile,
  onUpdateProfile
}) => {
  const currentSettings: CosmicCustomizerSettings = userProfile.cosmicSettings || {
    starPattern: 'constellation',
    ambientGlowColor: 'warm_amber',
    starsEnabled: true,
    glowIntensity: 'subtle',
    particleSpeed: 'gentle'
  };

  const [settings, setSettings] = useState<CosmicCustomizerSettings>(currentSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const updateAndPersist = async (newSettings: CosmicCustomizerSettings) => {
    setSettings(newSettings);
    setSaveStatus('saving');

    const updatedProfile: UserProfile = {
      ...userProfile,
      cosmicSettings: newSettings
    };

    onUpdateProfile({ cosmicSettings: newSettings });

    try {
      await syncUserProfileToFirestore(updatedProfile);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    } catch (err) {
      console.error('Error syncing cosmic settings to Firestore:', err);
      setSaveStatus('saved');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Sanctuary Environment Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Cosmic Customizer
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              Calibrate your canvas star formations, ambient glow color auras, and particle velocity. All selections are continuously preserved to your cloud profile in Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />
                <span>Syncing Firestore...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved to Firestore</span>
              </div>
            )}
            {saveStatus === 'idle' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-500 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                <span>Cloud Synced</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Star Pattern Architecture */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Orbit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Background Star Pattern</h3>
              <p className="text-xs text-stone-500">Select how stellar particles orbit and align behind your notes and quizzes</p>
            </div>
          </div>

          {/* Master Star Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium">Stars Visible:</span>
            <button
              type="button"
              onClick={() => updateAndPersist({ ...settings, starsEnabled: !settings.starsEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settings.starsEnabled ? 'bg-orange-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.starsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {STAR_PATTERNS.map((pattern) => {
            const isSelected = settings.starPattern === pattern.id;
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => updateAndPersist({ ...settings, starPattern: pattern.id })}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-400'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70 text-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{pattern.icon}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {pattern.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1">
                    {pattern.name}
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {pattern.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-200/60 text-[10px]">
                  <span className={isSelected ? 'font-bold text-orange-600' : 'text-stone-400'}>
                    {isSelected ? 'Active Star Field' : 'Click to Apply'}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ambient Glow Color Aura */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Ambient Glow Color Aura</h3>
            <p className="text-xs text-stone-500">Soft radial lighting cast across the viewport to enhance visual focus</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {GLOW_COLORS.map((glow) => {
            const isSelected = settings.ambientGlowColor === glow.id;
            return (
              <button
                key={glow.id}
                type="button"
                onClick={() => updateAndPersist({ ...settings, ambientGlowColor: glow.id })}
                className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-400'
                    : 'border-stone-200 bg-stone-50/40 hover:bg-stone-100/60'
                }`}
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${glow.previewBg} shadow-xs flex items-center justify-center text-white`}>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div className={`absolute -inset-1 rounded-full blur-xs opacity-50 ${glow.previewBg}`} />
                </div>
                <span className="text-xs font-bold text-stone-900 leading-tight">
                  {glow.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Glow Intensity & Particle Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Glow Intensity */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold text-stone-900">Glow Intensity</h4>
          </div>
          <p className="text-[11px] text-stone-500">Adjust the luminance gradient of the ambient background backlight.</p>
          
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(['subtle', 'moderate', 'radiant'] as const).map((intensity) => (
              <button
                key={intensity}
                type="button"
                onClick={() => updateAndPersist({ ...settings, glowIntensity: intensity })}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all capitalize cursor-pointer ${
                  settings.glowIntensity === intensity
                    ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>

        {/* Particle Velocity */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold text-stone-900">Particle Drift Speed</h4>
          </div>
          <p className="text-[11px] text-stone-500">Fine-tune the twirl and phase oscillation rate of the cosmic particles.</p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {(['still', 'gentle', 'cosmic'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => updateAndPersist({ ...settings, particleSpeed: speed })}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all capitalize cursor-pointer ${
                  settings.particleSpeed === speed
                    ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
