import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  CloudRain, 
  Bell, 
  Activity, 
  Sparkles, 
  Music, 
  Sliders, 
  Compass, 
  Check
} from 'lucide-react';
import { dreamyAudio, AudioLayerState } from '../lib/audioSynthesizer';
import { TRACK_CATALOG } from './MusicPlayerBar';

export const MusicSystemView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(dreamyAudio.isPlaying);
  const [volume, setVolume] = useState(dreamyAudio.volume);
  const [layers, setLayers] = useState<AudioLayerState>(dreamyAudio.layers);
  const [currentTrackId, setCurrentTrackId] = useState(dreamyAudio.currentTrackId);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ trackId: string; reason: string } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

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

  // Large audio visualizer canvas
  useEffect(() => {
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

        const barCount = 32;
        const barWidth = canvas.width / barCount - 3;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.7));
          const val = dataArray[index] || 0;
          const barHeight = Math.max(6, (val / 255) * canvas.height * 0.85);

          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#6366f1');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#38bdf8');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 3), canvas.height - barHeight, barWidth, barHeight, 4);
          ctx.fill();
        }
      } else {
        // Serene idle resting wave
        for (let i = 0; i < 32; i++) {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(i * 12, canvas.height - 8, 8, 8, 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleAskAiSoundscape = async () => {
    if (!aiTopicInput.trim() || isSuggesting) return;
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/music/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopicInput }),
      });
      const data = await res.json();
      setAiSuggestion(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSelectTrack = (trackId: string) => {
    dreamyAudio.setTrack(trackId);
    if (!isPlaying) dreamyAudio.play();
  };

  return (
    <div id="music-sanctuary-container" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest">
          <Headphones className="w-3.5 h-3.5 text-indigo-400" />
          <span>TechTut Sound Sanctuary • Continuous Procedural Ambient Music</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-light italic font-serif tracking-tight text-white">
          Study Music & Acoustic Sanctuary
        </h1>
        <p className="text-sm sm:text-base text-[#E0D8F0]/70 max-w-2xl mx-auto leading-relaxed">
          Lush procedural ambient pads, soft lo-fi jazz chords, and harmonic layers that shield against cognitive fatigue.
        </p>
      </div>

      {/* Hero Visualizer & Master Deck */}
      <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider">MUSIC MODE</span>
        </div>

        {/* Waveform Screen */}
        <div className="h-32 sm:h-40 w-full rounded-2xl bg-black/40 border border-white/10 p-4 flex items-center justify-center relative overflow-hidden">
          <canvas ref={canvasRef} width={480} height={140} className="w-full h-full" />
          <div className="absolute top-3 left-4 text-xs font-mono text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Harmonic Web Audio Engine • Real-time synthesis</span>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => dreamyAudio.togglePlay()}
              className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest font-mono">Now Floating</span>
              <h3 className="text-lg font-light italic font-serif text-white">
                {TRACK_CATALOG.find(t => t.id === currentTrackId)?.title}
              </h3>
              <p className="text-xs text-white/50">
                {TRACK_CATALOG.find(t => t.id === currentTrackId)?.subtitle}
              </p>
            </div>
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center gap-3 w-48">
            <Volume2 className="w-4 h-4 text-indigo-300 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => dreamyAudio.setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-black/40 border border-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
            <span className="text-xs text-white/50 font-mono w-8">{Math.round(volume * 100)}%</span>
          </div>

        </div>

        {/* Ambient Sound Layer Mixers */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/50 font-mono">
            <span className="font-semibold text-white/70 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Acoustic Layer Mixers
            </span>
            <span>Layer on top of any track</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Chimes */}
            <button
              onClick={() => dreamyAudio.toggleLayer('chimes')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                layers.chimes ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-100 shadow-md' : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className={`w-4 h-4 ${layers.chimes ? 'text-indigo-300' : 'text-white/40'}`} />
                <div>
                  <span className="text-xs font-semibold block text-white">Star Chimes</span>
                  <span className="text-[10px] text-white/50">Pentatonic bells</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${layers.chimes ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'bg-white/5 text-white/40'}`}>
                {layers.chimes ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            {/* Rain */}
            <button
              onClick={() => dreamyAudio.toggleLayer('rain')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                layers.rain ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-100 shadow-md' : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CloudRain className={`w-4 h-4 ${layers.rain ? 'text-cyan-300' : 'text-white/40'}`} />
                <div>
                  <span className="text-xs font-semibold block text-white">Soft Rainfall</span>
                  <span className="text-[10px] text-white/50">Pink noise filter</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${layers.rain ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-white/40'}`}>
                {layers.rain ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            {/* Binaural */}
            <button
              onClick={() => dreamyAudio.toggleLayer('binaural')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                layers.binaural ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-100 shadow-md' : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className={`w-4 h-4 ${layers.binaural ? 'text-fuchsia-300' : 'text-white/40'}`} />
                <div>
                  <span className="text-xs font-semibold block text-white">40Hz Gamma Beat</span>
                  <span className="text-[10px] text-white/50">Deep logic focus</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${layers.binaural ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40' : 'bg-white/5 text-white/40'}`}>
                {layers.binaural ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

          </div>
        </div>

      </div>

      {/* Themed Playlists Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-light italic font-serif text-white flex items-center gap-2">
          <Music className="w-4 h-4 text-indigo-400" />
          Curated Soundscape Playlists
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRACK_CATALOG.map((track) => {
            const isCurrent = track.id === currentTrackId;

            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`p-5 rounded-[28px] border text-left cursor-pointer transition-all space-y-3 ${
                  isCurrent 
                    ? 'bg-white/10 border-indigo-400/50 shadow-xl ring-1 ring-indigo-400/30 backdrop-blur-xl'
                    : 'bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-md">
                    <Music className="w-5 h-5" />
                  </div>
                  {isCurrent && isPlaying ? (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                      PLAYING
                    </span>
                  ) : null}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{track.title}</h4>
                  <p className="text-xs text-white/50 line-clamp-2 mt-0.5 leading-relaxed">{track.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {track.moodTags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-white/60 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Soundscape Advisor */}
      <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/5 border border-white/10 space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">AI Acoustic Soundscape Advisor</h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Enter your current study subject or mental state (e.g. "Linear Algebra homework", "Late night creative poetry", "Exam anxiety"). The AI will match the ideal auditory frequency.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aiTopicInput}
            onChange={(e) => setAiTopicInput(e.target.value)}
            placeholder="e.g. Organic chemistry synthesis, or World History essay..."
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400/60"
            onKeyDown={(e) => e.key === 'Enter' && handleAskAiSoundscape()}
          />
          <button
            onClick={handleAskAiSoundscape}
            disabled={isSuggesting || !aiTopicInput.trim()}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSuggesting ? 'Matching...' : 'Get Suggestion'}</span>
          </button>
        </div>

        {aiSuggestion && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-indigo-300">Recommended Soundscape: </span>
              <span className="text-white font-semibold">
                {TRACK_CATALOG.find(t => t.id === aiSuggestion.trackId)?.title}
              </span>
              <p className="text-white/70 mt-1">{aiSuggestion.reason}</p>
            </div>
            <button
              onClick={() => handleSelectTrack(aiSuggestion.trackId)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex-shrink-0 shadow-sm cursor-pointer"
            >
              Tune In
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
