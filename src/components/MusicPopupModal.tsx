import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Headphones, 
  CloudRain, 
  Bell, 
  Activity, 
  Sparkles,
  Music,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { dreamyAudio, AudioLayerState } from '../lib/audioSynthesizer';
import { TRACK_CATALOG } from './MusicPlayerBar';

interface MusicPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPopupModal: React.FC<MusicPopupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(dreamyAudio.isPlaying);
  const [volume, setVolume] = useState(dreamyAudio.volume);
  const [layers, setLayers] = useState<AudioLayerState>(dreamyAudio.layers);
  const [currentTrackId, setCurrentTrackId] = useState(dreamyAudio.currentTrackId);
  const [activeMoodFilter, setActiveMoodFilter] = useState<string>('all');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = dreamyAudio.subscribe((state: any) => {
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
      setLayers(state.layers);
      setCurrentTrackId(state.currentTrackId);
    });
    return unsub;
  }, []);

  // Visualizer loop
  useEffect(() => {
    if (!isOpen) return;
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = dreamyAudio.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = 3;
        let x = 0;
        const barCount = 20;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.7));
          const val = dataArray[index] || 0;
          const barHeight = Math.max(3, (val / 255) * canvas.height * 0.95);

          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(1, '#fb923c');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2);
          ctx.fill();

          x += barWidth + 3;
        }
      } else {
        // Idle calm bars
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = '#52525b';
          ctx.beginPath();
          ctx.roundRect(i * 6, canvas.height - 4, 3, 4, 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentTrack = TRACK_CATALOG.find(t => t.id === currentTrackId) || TRACK_CATALOG[0];

  const handleSelectTrack = (trackId: string) => {
    dreamyAudio.setTrack(trackId);
    if (!isPlaying) {
      dreamyAudio.play();
    }
  };

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

  const filteredTracks = activeMoodFilter === 'all' 
    ? TRACK_CATALOG 
    : TRACK_CATALOG.filter(t => t.category === activeMoodFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-stone-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Music Sanctuary</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                  Track Selector
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Procedural 432Hz ambient focus music &amp; custom layers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close music popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Active Now Playing Banner Card */}
          <div className="p-5 rounded-2xl bg-stone-950/80 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                  <Music className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {currentTrack.title}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono uppercase">
                      {currentTrack.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {currentTrack.subtitle}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                    <span>Key: <strong className="text-stone-300">{currentTrack.key}</strong></span>
                    <span>•</span>
                    <span>Tempo: <strong className="text-stone-300">{currentTrack.bpm} BPM</strong></span>
                  </div>
                </div>
              </div>

              {/* Waveform Visualizer */}
              <div className="flex items-center gap-2">
                <canvas ref={canvasRef} width={120} height={32} className="rounded" />
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrevTrack}
                  className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => dreamyAudio.togglePlay()}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? "Pause Music" : "Play Music"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <span className="text-xs text-stone-400 pl-2">
                  {isPlaying ? 'Playing • Continuous' : 'Paused'}
                </span>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => dreamyAudio.setVolume(volume > 0 ? 0 : 0.5)}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title={volume > 0 ? "Mute" : "Unmute"}
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => dreamyAudio.setVolume(parseFloat(e.target.value))}
                  className="w-24 sm:w-28 accent-orange-500 cursor-pointer"
                />
                <span className="text-[11px] font-mono text-stone-400 min-w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Change Tracks Catalog Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Select Track to Play
              </h4>
              <div className="flex items-center gap-1 text-[11px]">
                {['all', 'dreamy', 'focus', 'night', 'soft_lofi'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMoodFilter(cat)}
                    className={`px-2 py-0.5 rounded-md transition-colors capitalize cursor-pointer ${
                      activeMoodFilter === cat
                        ? 'bg-orange-500/20 text-orange-300 font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredTracks.map((track) => {
                const isSelected = track.id === currentTrackId;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/40 text-white shadow-md'
                        : 'bg-stone-950/50 border-white/5 hover:border-white/15 text-stone-300 hover:bg-stone-950'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-orange-500 text-white shadow-xs' 
                          : 'bg-white/5 text-stone-400'
                      }`}>
                        {isSelected && isPlaying ? (
                          <Activity className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-white truncate">
                            {track.title}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-orange-500 text-white font-bold">
                              Now Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">
                          {track.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {track.moodTags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-stone-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-stone-500 block">
                        {track.bpm} BPM
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 block">
                        {track.key}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ambient Acoustic Layers */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-white/10 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>Ambient Sound Enhancers</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => dreamyAudio.toggleLayer('rain')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  layers.rain 
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
                    : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Soft Rain</span>
              </button>

              <button
                onClick={() => dreamyAudio.toggleLayer('chimes')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  layers.chimes 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Star Chimes</span>
              </button>

              <button
                onClick={() => dreamyAudio.toggleLayer('binaural')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  layers.binaural 
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                    : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>40Hz Binaural</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio continues playing smoothly in background</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
