import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  VolumeX, 
  CloudRain, 
  Bell, 
  Activity, 
  Music, 
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Headphones,
  Maximize2
} from 'lucide-react';
import { dreamyAudio, AudioLayerState } from '../lib/audioSynthesizer';
import { MusicTrack } from '../types';

export const TRACK_CATALOG: MusicTrack[] = [
  {
    id: 'dreamy_starlight',
    title: 'TechTut Main Theme',
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
  const [isCustomAudio, setIsCustomAudio] = useState(dreamyAudio.isCustomAudio);
  const [activeCustomTrack, setActiveCustomTrack] = useState(dreamyAudio.activeCustomTrack);
  const [isVenueOpen, setIsVenueOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('techtut_music_venue_open');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentTrack = TRACK_CATALOG.find(t => t.id === currentTrackId) || TRACK_CATALOG[0];

  useEffect(() => {
    try {
      localStorage.setItem('techtut_music_venue_open', isVenueOpen ? 'true' : 'false');
    } catch (e) {
      console.warn(e);
    }
  }, [isVenueOpen]);

  useEffect(() => {
    const unsub = dreamyAudio.subscribe((state: any) => {
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
      setLayers(state.layers);
      setCurrentTrackId(state.currentTrackId);
      setIsCustomAudio(Boolean(state.isCustomAudio));
      setActiveCustomTrack(state.activeCustomTrack);
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

  const handlePrevTrack = () => {
    const currentIndex = TRACK_CATALOG.findIndex(t => t.id === currentTrackId);
    const prevIndex = (currentIndex - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    dreamyAudio.setTrack(TRACK_CATALOG[prevIndex].id);
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-auto">
        
        {/* AI Soundtrack Suggestion Toast */}
        {showAiSuggestion && recommendedTrackId && (
          <div className="mb-2.5 p-3 sm:p-4 rounded-2xl bg-black/90 border border-orange-400/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-float-slow">
            <div className="flex items-center gap-2 text-orange-200">
              <Sparkles className="w-4 h-4 text-orange-400 animate-twinkle shrink-0" />
              <span>
                <strong className="text-white">AI Soundscape Match:</strong> {recommendedReason || "This topic pairs harmoniously with a calming focus soundscape."}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleApplySuggestion}
                className="px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-medium text-[11px] transition-all shadow-xs cursor-pointer"
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

        {/* CLOSED VENUE PILL: Compact, minimal height so user can "see more" */}
        {!isVenueOpen ? (
          <div className="flex items-center justify-end">
            <div className="rounded-full bg-stone-900/90 border border-white/15 backdrop-blur-xl shadow-2xl p-1.5 pl-3 flex items-center gap-3 transition-all hover:bg-stone-900">
              
              {/* Music Indicator */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-orange-400 shrink-0 ${isPlaying ? 'bg-orange-500/20 animate-pulse' : 'bg-white/10'}`}>
                  <Headphones className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block min-w-0 text-left">
                  <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {isCustomAudio && activeCustomTrack ? activeCustomTrack.title : currentTrack.title}
                  </div>
                  <div className="text-[10px] text-white/50 truncate">
                    {isPlaying ? (isCustomAudio ? 'Lyria 3 Audio' : 'Playing • Ambient') : 'Paused'}
                  </div>
                </div>
              </div>

              {/* Quick Play/Pause */}
              <button
                onClick={() => dreamyAudio.togglePlay()}
                className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0"
                title={isPlaying ? "Pause Ambient Sound" : "Play Ambient Sound"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>

              {/* OPEN VENUE DROPDOWN TRIGGER */}
              <button
                id="open-music-venue-btn"
                onClick={() => setIsVenueOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                title="Open Music Dropdown Venue"
              >
                <Music className="w-3 h-3 text-orange-400" />
                <span>Music Venue</span>
                <ChevronUp className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>
        ) : (
          /* OPEN DROPDOWN VENUE: Full interactive music venue with "Close Venue (See More)" */
          <div 
            id="music-dropdown-venue"
            className="rounded-3xl bg-stone-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          >
            
            {/* Venue Header: Title & "Close Venue (See More)" Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <span>Study Sound Sanctuary • Ambient Music Venue</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                      Procedural Audio
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/50">
                    432Hz ambient chord swells, rain noise, and 40Hz binaural focus beats
                  </p>
                </div>
              </div>

              {/* CLOSE VENUE BUTTON: Allows user to close it to see more! */}
              <button
                id="close-music-venue-btn"
                onClick={() => setIsVenueOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Close venue to see more screen area"
              >
                <span>Close to see more</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Current Track Playback & Waveform */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Track Details & Visualizer */}
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={onOpenMusicSanctuary}
                  className="shrink-0 w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300 group shadow-md hover:bg-orange-500/30 transition-all cursor-pointer"
                  title="Open TechTut Harmony Sound Sanctuary"
                >
                  <Music className="w-4 h-4 text-orange-300 group-hover:scale-110 transition-transform" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {isCustomAudio && activeCustomTrack ? activeCustomTrack.title : currentTrack.title}
                    </h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30 uppercase tracking-wider font-mono">
                      {isCustomAudio ? 'TechTut Harmony' : currentTrack.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate max-w-sm">
                    {isCustomAudio && activeCustomTrack ? (activeCustomTrack.prompt || 'Synthesized study audio') : currentTrack.subtitle}
                  </p>
                </div>

                {/* Animated Waveform Canvas */}
                <div className="hidden sm:block ml-2">
                  <canvas ref={canvasRef} width={70} height={24} className="rounded" />
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrevTrack}
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  id="music-venue-play-pause-btn"
                  onClick={() => dreamyAudio.togglePlay()}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? "Pause Ambient Sound" : "Play Ambient Sound"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  id="music-venue-next-btn"
                  onClick={handleNextTrack}
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Ambient Layers & Master Volume */}
              <div className="flex items-center gap-3">
                {/* Layer Toggles */}
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-full border border-white/10 text-xs">
                  <button
                    onClick={() => dreamyAudio.toggleLayer('chimes')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                      layers.chimes ? 'bg-orange-500/20 border border-orange-400/40 text-orange-200 font-medium' : 'text-white/40 hover:text-white/70'
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
                      layers.binaural ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200 font-medium' : 'text-white/40 hover:text-white/70'
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
                    className="w-full h-1 bg-black/40 border border-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400"
                  />
                </div>
              </div>

            </div>

            {/* Quick Track Switcher Chips in Venue */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mr-1 shrink-0">
                  Playlists:
                </span>
                {TRACK_CATALOG.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      dreamyAudio.setTrack(track.id);
                      if (!isPlaying) dreamyAudio.play();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      track.id === currentTrackId
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                    }`}
                  >
                    {track.title}
                  </button>
                ))}
              </div>

              {onOpenMusicSanctuary && (
                <button
                  onClick={onOpenMusicSanctuary}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Screen Sanctuary</span>
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
