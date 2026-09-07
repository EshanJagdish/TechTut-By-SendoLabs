import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Bell, 
  Activity, 
  Music, 
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { dreamyAudio, AudioLayerState } from '../lib/audioSynthesizer';
import { MusicTrack } from '../types';

export const TRACK_CATALOG: MusicTrack[] = [
  {
    id: 'dreamy_starlight',
    title: 'Dreamy Starlight',
    subtitle: '432Hz ambient chord swells & celestial chimes',
    category: 'dreamy',
    moodTags: ['Curiosity', 'Relaxed Encoding', 'Gentle Wonder'],
    color: 'from-violet-500 to-indigo-600',
    bpm: 56,
    key: 'F# Minor',
    description: 'Ethereal synth pads with slow frequency sweeps and gentle pentatonic star bells.'
  },
  {
    id: 'calm_focus',
    title: 'Calm Focus',
    subtitle: 'Soft electric piano progression & clear thinking',
    category: 'focus',
    moodTags: ['Math', 'Coding', 'Analytical Depth'],
    color: 'from-blue-500 to-cyan-600',
    bpm: 62,
    key: 'D Major',
    description: 'Tender Rhodes chords balanced for deep logic, problem solving, and analytical clarity.'
  },
  {
    id: 'midnight_river',
    title: 'Midnight River',
    subtitle: 'Subtle water ripples & warm meditative pads',
    category: 'night',
    moodTags: ['Literature', 'Philosophy', 'Quiet Reading'],
    color: 'from-indigo-600 to-slate-800',
    bpm: 50,
    key: 'B Minor',
    description: 'Serene nocturnal soundscape engineered to calm the internal monologue during long readings.'
  },
  {
    id: 'celestial_lofi',
    title: 'Celestial Lo-Fi',
    subtitle: 'Warm jazz-hop chords & organic warmth',
    category: 'soft_lofi',
    moodTags: ['Creative Writing', 'History', 'Essay Drafting'],
    color: 'from-fuchsia-600 to-rose-700',
    bpm: 68,
    key: 'C Minor 9',
    description: 'Downtempo harmonic rhythm with vintage tape flutter and gentle relaxing resonance.'
  },
  {
    id: 'deep_nebula',
    title: 'Deep Nebula',
    subtitle: 'Infinite resonant drone & tension release',
    category: 'calm',
    moodTags: ['Night Study', 'Stress Dissolution', 'Deep Sleep Prep'],
    color: 'from-purple-800 to-slate-950',
    bpm: 45,
    key: 'A Drone',
    description: 'Sub-bass grounding drone dissolving exam tension and mental clutter.'
  }
];

interface MusicPlayerBarProps {
  recommendedTrackId?: string;
  recommendedReason?: string;
  onOpenMusicSanctuary?: () => void;
}

export const MusicPlayerBar: React.FC<MusicPlayerBarProps> = ({
  recommendedTrackId,
  recommendedReason,
  onOpenMusicSanctuary,
}) => {
  const [isPlaying, setIsPlaying] = useState(dreamyAudio.isPlaying);
  const [volume, setVolume] = useState(dreamyAudio.volume);
  const [layers, setLayers] = useState<AudioLayerState>(dreamyAudio.layers);
  const [currentTrackId, setCurrentTrackId] = useState(dreamyAudio.currentTrackId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentTrack = TRACK_CATALOG.find(t => t.id === currentTrackId) || TRACK_CATALOG[0];

  useEffect(() => {
    const unsub = dreamyAudio.subscribe((state: any) => {
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
      setLayers(state.layers);
      setCurrentTrackId(state.currentTrackId);
    });
    return unsub;
  }, []);

  // Pop up suggestion if new recommendation arrives
  useEffect(() => {
    if (recommendedTrackId && recommendedTrackId !== currentTrackId) {
      setShowAiSuggestion(true);
    }
  }, [recommendedTrackId, currentTrackId]);

  // Visualizer render loop using AnalyserNode
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      const analyser = dreamyAudio.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = 3;
        let x = 0;
        const barCount = 12;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.6));
          const val = dataArray[index] || 0;
          const barHeight = Math.max(3, (val / 255) * canvas.height * 0.9);

          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#818cf8');
          grad.addColorStop(1, '#c084fc');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2);
          ctx.fill();

          x += barWidth + 2;
        }
      } else {
        // Idle gentle waveform
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(i * 5, canvas.height - 4, 3, 4, 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleNextTrack = () => {
    const currentIndex = TRACK_CATALOG.findIndex(t => t.id === currentTrackId);
    const nextIndex = (currentIndex + 1) % TRACK_CATALOG.length;
    dreamyAudio.setTrack(TRACK_CATALOG[nextIndex].id);
  };

  const handleApplySuggestion = () => {
    if (recommendedTrackId) {
      dreamyAudio.setTrack(recommendedTrackId);
      if (!isPlaying) dreamyAudio.play();
      setShowAiSuggestion(false);
    }
  };

  return (
    <div id="techtut-music-dock" className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4 pb-3 sm:pb-5 pointer-events-auto">
        
        {/* AI Soundtrack Suggestion Toast */}
        {showAiSuggestion && recommendedTrackId && (
          <div className="mb-2.5 p-3 sm:p-4 rounded-2xl bg-black/80 border border-indigo-400/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-float-slow">
            <div className="flex items-center gap-2 text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-300 animate-twinkle flex-shrink-0" />
              <span>
                <strong className="text-white">AI Soundscape Match:</strong> {recommendedReason || "This topic pairs harmoniously with a calming focus soundscape."}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleApplySuggestion}
                className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-all shadow-sm cursor-pointer"
              >
                Tune In
              </button>
              <button
                onClick={() => setShowAiSuggestion(false)}
                className="text-white/50 hover:text-white text-xs px-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Glass Player Dock */}
        <div className="relative rounded-2xl sm:rounded-full bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/80 p-2.5 sm:px-4 sm:py-2.5 transition-all duration-300">
          
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Track info & Visualizer */}
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={onOpenMusicSanctuary}
                className="relative flex-shrink-0 w-10 h-10 rounded-xl sm:rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group shadow-md hover:bg-indigo-500/30 transition-all cursor-pointer"
                title="Open Music Sanctuary"
              >
                <Music className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 uppercase tracking-wider font-mono">
                    {currentTrack.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 truncate max-w-[180px] sm:max-w-xs">
                  {currentTrack.subtitle}
                </p>
              </div>

              {/* Waveform Canvas */}
              <div className="hidden sm:block ml-1">
                <canvas ref={canvasRef} width={60} height={22} className="rounded" />
              </div>
            </div>

            {/* Middle: Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                id="music-play-pause-btn"
                onClick={() => dreamyAudio.togglePlay()}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 cursor-pointer"
                title={isPlaying ? "Pause Ambient Sound" : "Play Ambient Sound"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                id="music-next-btn"
                onClick={handleNextTrack}
                className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Next Dreamy Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Ambient Layer Toggles & Volume */}
            <div className="hidden md:flex items-center gap-3">
              
              {/* Layer Toggles */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10 text-xs">
                <button
                  onClick={() => dreamyAudio.toggleLayer('chimes')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                    layers.chimes ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-medium' : 'text-white/40 hover:text-white/70'
                  }`}
                  title="Celestial Pentatonic Chimes"
                >
                  <Bell className="w-3 h-3" />
                  <span>Chimes</span>
                </button>

                <button
                  onClick={() => dreamyAudio.toggleLayer('rain')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                    layers.rain ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-medium' : 'text-white/40 hover:text-white/70'
                  }`}
                  title="Soft Procedural Rain Noise"
                >
                  <CloudRain className="w-3 h-3" />
                  <span>Rain</span>
                </button>

                <button
                  onClick={() => dreamyAudio.toggleLayer('binaural')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                    layers.binaural ? 'bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 font-medium' : 'text-white/40 hover:text-white/70'
                  }`}
                  title="40Hz Gamma Focus Frequency"
                >
                  <Activity className="w-3 h-3" />
                  <span>40Hz</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 w-24">
                <button
                  onClick={() => dreamyAudio.setVolume(volume > 0 ? 0 : 0.5)}
                  className="text-white/50 hover:text-white cursor-pointer"
                >
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-white/30" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => dreamyAudio.setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-black/40 border border-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

            </div>

            {/* Expand / Collapse toggle for mobile */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden p-1.5 text-white/50 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

          </div>

          {/* Mobile Expanded Layer Controls */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-white/10 md:hidden flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => dreamyAudio.toggleLayer('chimes')}
                  className={`px-2.5 py-1 rounded-full text-[11px] ${layers.chimes ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-white/50'}`}
                >
                  Bell Chimes
                </button>
                <button
                  onClick={() => dreamyAudio.toggleLayer('rain')}
                  className={`px-2.5 py-1 rounded-full text-[11px] ${layers.rain ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/50'}`}
                >
                  Rain
                </button>
                <button
                  onClick={() => dreamyAudio.toggleLayer('binaural')}
                  className={`px-2.5 py-1 rounded-full text-[11px] ${layers.binaural ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' : 'text-white/50'}`}
                >
                  40Hz Tone
                </button>
              </div>

              <div className="flex items-center gap-2 w-32">
                <Volume2 className="w-3.5 h-3.5 text-white/50" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => dreamyAudio.setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-black/40 border border-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
