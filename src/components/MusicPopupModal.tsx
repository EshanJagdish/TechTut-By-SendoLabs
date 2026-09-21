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
  CheckCircle2,
  FolderHeart,
  Wand2,
  Download,
  Trash2,
  Upload,
  RefreshCw,
  Disc3,
  Clock,
  Zap,
  Check
} from 'lucide-react';
import { dreamyAudio, AudioLayerState } from '../lib/audioSynthesizer';
import { TRACK_CATALOG } from './MusicPlayerBar';
import { GeneratedMusicTrack } from '../types';
import { 
  loadMusicGallery, 
  saveTrackToGallery, 
  deleteTrackFromGallery, 
  downloadWavTrack,
  generateClientProceduralWav
} from '../utils/musicStorage';

interface MusicPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, subtitle: string, icon?: string) => void;
}

type MusicModalTab = 'curated' | 'engine' | 'gallery';

const PROMPT_PRESETS = [
  {
    title: 'Calculus Flow',
    prompt: 'Warm Rhodes electric piano chords with 432Hz ambient sine pulse and subtle vinyl warmth',
    model: 'lyria-3-clip-preview' as const,
  },
  {
    title: 'Midnight Chemistry',
    prompt: 'Gentle water droplets, nocturnal synth drone, and harmonic resonance for molecular organic study',
    model: 'lyria-3-clip-preview' as const,
  },
  {
    title: 'Baroque Neural Focus',
    prompt: 'Delicate classical chamber strings interwoven with soft binaural alpha waves for deep memory consolidation',
    model: 'lyria-3-pro-preview' as const,
  },
  {
    title: 'Quantum Lo-Fi',
    prompt: 'Downtempo dusty cassette jazz chords with relaxed tape flutter and serene focus beat',
    model: 'lyria-3-clip-preview' as const,
  },
];

export const MusicPopupModal: React.FC<MusicPopupModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<MusicModalTab>('curated');
  const [isPlaying, setIsPlaying] = useState(dreamyAudio.isPlaying);
  const [volume, setVolume] = useState(dreamyAudio.volume);
  const [layers, setLayers] = useState<AudioLayerState>(dreamyAudio.layers);
  const [currentTrackId, setCurrentTrackId] = useState(dreamyAudio.currentTrackId);
  const [isCustomAudio, setIsCustomAudio] = useState(dreamyAudio.isCustomAudio);
  const [activeCustomTrack, setActiveCustomTrack] = useState(dreamyAudio.activeCustomTrack);
  const [activeMoodFilter, setActiveMoodFilter] = useState<string>('all');
  
  // TechTut Harmony Generator State
  const [trackPrompt, setTrackPrompt] = useState('Warm ambient study focus soundscape with soft Rhodes chords and calm celestial resonance');
  const [trackTitle, setTrackTitle] = useState('Focus Symphony');
  const [selectedModel, setSelectedModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedMusicTrack | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Music Gallery State
  const [galleryTracks, setGalleryTracks] = useState<GeneratedMusicTrack[]>(() => loadMusicGallery());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Sync gallery tracks when modal opens
  useEffect(() => {
    if (isOpen) {
      setGalleryTracks(loadMusicGallery());
    }
  }, [isOpen]);

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

  const currentCuratedTrack = TRACK_CATALOG.find(t => t.id === currentTrackId) || TRACK_CATALOG[0];

  const handleSelectCuratedTrack = (trackId: string) => {
    dreamyAudio.setTrack(trackId);
    if (!isPlaying) {
      dreamyAudio.play();
    }
  };

  const handleNextCuratedTrack = () => {
    const currentIndex = TRACK_CATALOG.findIndex(t => t.id === currentTrackId);
    const nextIndex = (currentIndex + 1) % TRACK_CATALOG.length;
    dreamyAudio.setTrack(TRACK_CATALOG[nextIndex].id);
  };

  const handlePrevCuratedTrack = () => {
    const currentIndex = TRACK_CATALOG.findIndex(t => t.id === currentTrackId);
    const prevIndex = (currentIndex - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    dreamyAudio.setTrack(TRACK_CATALOG[prevIndex].id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setImagePreview(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateMusic = async () => {
    if (!trackPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setSavedSuccessId(null);

    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trackPrompt.trim(),
          title: trackTitle.trim() || 'TechTut Resonance',
          model: selectedModel,
          imageData: imagePreview,
          mimeType: imagePreview ? 'image/jpeg' : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      
      const newTrack: GeneratedMusicTrack = {
        id: 'gen_' + Date.now(),
        title: data.title || trackTitle || 'TechTut Focus Piece',
        prompt: trackPrompt,
        model: selectedModel,
        audioBase64: data.audioBase64 || generateClientProceduralWav(trackPrompt, 10),
        mimeType: data.mimeType || 'audio/wav',
        duration: data.duration || (selectedModel === 'lyria-3-pro-preview' ? 'Full Track' : '30s'),
        createdAt: Date.now(),
        lyrics: data.lyrics,
        tags: [selectedModel === 'lyria-3-pro-preview' ? 'Lyria-Pro' : 'Lyria-Clip', 'Focus', 'TechTut'],
      };

      setGeneratedPreview(newTrack);
    } catch (err: any) {
      console.warn('Network call failed, utilizing client synthesis engine:', err);
      const fallbackTrack: GeneratedMusicTrack = {
        id: 'gen_' + Date.now(),
        title: trackTitle || 'TechTut Focus Piece',
        prompt: trackPrompt,
        model: selectedModel,
        audioBase64: generateClientProceduralWav(trackPrompt, 10),
        mimeType: 'audio/wav',
        duration: selectedModel === 'lyria-3-pro-preview' ? 'Full Track' : '30s',
        createdAt: Date.now(),
        lyrics: `Harmonic focus synthesis generated for: "${trackPrompt}"`,
        tags: ['Procedural', 'Focus', 'TechTut'],
      };
      setGeneratedPreview(fallbackTrack);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayCustomTrack = async (track: GeneratedMusicTrack) => {
    if (isCustomAudio && activeCustomTrack?.id === track.id && isPlaying) {
      dreamyAudio.pause();
    } else {
      const ok = await dreamyAudio.playCustomAudio(track.audioBase64, {
        id: track.id,
        title: track.title,
        prompt: track.prompt,
      });
      if (!ok) {
        console.warn('Falling back to browser player');
      }
    }
  };

  const handleSaveToGallery = (track: GeneratedMusicTrack) => {
    const updated = saveTrackToGallery(track);
    setGalleryTracks(updated);
    setSavedSuccessId(track.id);
    if (onShowToast) {
      onShowToast('Track Saved to Music Gallery!', `"${track.title}" is ready in your library.`, 'music');
    }
    setTimeout(() => setSavedSuccessId(null), 3000);
  };

  const handleDeleteFromGallery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCustomTrack?.id === id) {
      dreamyAudio.stopCustomAudio();
    }
    const updated = deleteTrackFromGallery(id);
    setGalleryTracks(updated);
  };

  const filteredTracks = activeMoodFilter === 'all' 
    ? TRACK_CATALOG 
    : TRACK_CATALOG.filter(t => t.category === activeMoodFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-stone-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Music Sanctuary</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                  v2.5 Engine
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Procedural 432Hz focus soundscapes &amp; Lyria 3 generative music
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close music popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-white/10 bg-stone-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'curated'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Curated Sanctuary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-orange-400 group-hover:text-white" />
            <span>TechTut Harmony</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              Lyria 3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Music Gallery</span>
            {galleryTracks.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/15 text-stone-200 font-mono">
                {galleryTracks.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Active Now Playing Banner Card (Omnipresent) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
                  <Music className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white tracking-tight truncate">
                      {isCustomAudio && activeCustomTrack ? activeCustomTrack.title : currentCuratedTrack.title}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono uppercase shrink-0">
                      {isCustomAudio ? 'TechTut Harmony' : currentCuratedTrack.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 truncate">
                    {isCustomAudio && activeCustomTrack ? (activeCustomTrack.prompt || 'Generated study track') : currentCuratedTrack.subtitle}
                  </p>
                  {!isCustomAudio && (
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                      <span>Key: <strong className="text-stone-300">{currentCuratedTrack.key}</strong></span>
                      <span>•</span>
                      <span>Tempo: <strong className="text-stone-300">{currentCuratedTrack.bpm} BPM</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Waveform Visualizer */}
              <div className="flex items-center gap-2 shrink-0">
                <canvas ref={canvasRef} width={120} height={32} className="rounded" />
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                {!isCustomAudio && (
                  <button
                    onClick={handlePrevCuratedTrack}
                    className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}

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

                {!isCustomAudio && (
                  <button
                    onClick={handleNextCuratedTrack}
                    className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}

                <span className="text-xs text-stone-400 pl-2">
                  {isPlaying ? (isCustomAudio ? 'Playing Custom Audio' : 'Playing Curated Track') : 'Paused'}
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

          {/* TAB 1: CURATED SANCTUARY */}
          {activeTab === 'curated' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Tracks Catalog Section */}
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
                    const isSelected = track.id === currentTrackId && !isCustomAudio;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectCuratedTrack(track.id)}
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
                                  Selected
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
          )}

          {/* TAB 2: TECHTUT MUSIC ENGINE (GENERATE) */}
          {activeTab === 'engine' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-stone-950/60 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-orange-400" />
                      <span>TechTut Harmony Studio</span>
                    </h4>
                    <p className="text-xs text-stone-400 mt-1">
                      Compose study music powered by TechTut Harmony with Google Lyria 3 generative models. Save any creation to your personal Music Gallery.
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 font-mono border border-orange-500/30 shrink-0">
                    TechTut Harmony
                  </span>
                </div>

                {/* Model Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('lyria-3-clip-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedModel === 'lyria-3-clip-preview'
                        ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500/40'
                        : 'border-white/10 bg-stone-900/60 text-stone-300 hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Lyria 3 Clip</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-orange-300 font-mono">
                        Up to 30s
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Ideal for fast study loops, rhythmic momentum, and quick concept intervals.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('lyria-3-pro-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedModel === 'lyria-3-pro-preview'
                        ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500/40'
                        : 'border-white/10 bg-stone-900/60 text-stone-300 hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Lyria 3 Pro</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-orange-300 font-mono">
                        Full Track
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Full-length high fidelity study compositions with progressive harmonic development.
                    </p>
                  </button>
                </div>

                {/* Track Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Track Title
                  </label>
                  <input
                    type="text"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    placeholder="e.g. Celestial Calculus Flow"
                    className="w-full px-3 py-2 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Prompt Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                    <span>Music Prompt &amp; Instrumentation</span>
                    <span className="text-[10px] text-stone-500">Describe instruments, mood, or subject</span>
                  </label>
                  <textarea
                    rows={3}
                    value={trackPrompt}
                    onChange={(e) => setTrackPrompt(e.target.value)}
                    placeholder="Describe your desired study soundtrack (e.g., warm rhodes chords, vinyl dust, 432Hz sine wave...)"
                    className="w-full p-3 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-400" />
                    <span>Quick Prompt Presets:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTrackTitle(p.title);
                          setTrackPrompt(p.prompt);
                          setSelectedModel(p.model);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 hover:text-orange-300 text-stone-300 text-[11px] transition-colors cursor-pointer border border-white/5"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Multimodal Image Attachment */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-300">
                      Inspire from Study Diagram or Notes (Optional)
                    </label>
                    <span className="text-[10px] text-orange-400 font-mono">
                      Multimodal Audio
                    </span>
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />

                  {!imagePreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 border border-dashed border-white/15 hover:border-orange-500/60 rounded-xl bg-stone-900/40 text-stone-400 hover:text-white text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-stone-400" />
                      <span>Attach lecture diagram, equation, or slide image</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-white/10">
                      <div className="flex items-center gap-2.5">
                        <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-xs text-stone-300">Diagram attached for audio inspiration</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="p-1.5 text-stone-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {generationError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {generationError}
                  </div>
                )}

                {/* Generate Action Button */}
                <button
                  type="button"
                  onClick={handleGenerateMusic}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>TechTut Harmony is synthesizing {selectedModel === 'lyria-3-pro-preview' ? 'Lyria 3 Pro Track' : 'Lyria 3 Clip'}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Music Track</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Result Preview Card */}
              {generatedPreview && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {generatedPreview.title}
                        </h4>
                        <span className="text-[10px] text-orange-300 font-mono">
                          {generatedPreview.model} • {generatedPreview.duration}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayCustomTrack(generatedPreview)}
                        className="py-1.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        {isCustomAudio && activeCustomTrack?.id === generatedPreview.id && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-white" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadWavTrack(generatedPreview)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs transition-colors cursor-pointer"
                        title="Download WAV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 font-mono bg-stone-950/60 p-2.5 rounded-xl border border-white/5">
                    {generatedPreview.lyrics || generatedPreview.prompt}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-400">
                      Ready to add to your persistent library
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveToGallery(generatedPreview)}
                      className="py-2 px-4 rounded-xl bg-white text-stone-900 hover:bg-orange-50 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      {savedSuccessId === generatedPreview.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Saved to Gallery!</span>
                        </>
                      ) : (
                        <>
                          <FolderHeart className="w-3.5 h-3.5 text-orange-600" />
                          <span>Save in Music Gallery</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MUSIC GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                    <FolderHeart className="w-3.5 h-3.5 text-orange-400" />
                    <span>Your Music Gallery</span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Saved tracks generated with TechTut Harmony &amp; Lyria 3
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('engine')}
                  className="py-1.5 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Create with TechTut Harmony</span>
                </button>
              </div>

              {galleryTracks.length === 0 ? (
                <div className="text-center py-12 px-4 bg-stone-950/40 rounded-2xl border border-white/5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
                    <Music className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-white">Your Music Gallery is Empty</h5>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Use TechTut Harmony to compose study soundtracks using Lyria 3 models and save them here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('engine')}
                    className="py-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Launch TechTut Harmony</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {galleryTracks.map((track) => {
                    const isTrackActive = isCustomAudio && activeCustomTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handlePlayCustomTrack(track)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isTrackActive
                            ? 'bg-orange-500/15 border-orange-500/50 text-white shadow-md'
                            : 'bg-stone-950/50 border-white/5 hover:border-white/15 text-stone-300 hover:bg-stone-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCustomTrack(track);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer ${
                              isTrackActive
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-white/10 hover:bg-orange-500 hover:text-white text-stone-300'
                            }`}
                          >
                            {isTrackActive && isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                {track.title}
                              </span>
                              <span className="text-[9px] px-2 py-0.2 rounded-full bg-white/10 text-orange-300 font-mono">
                                {track.model}
                              </span>
                              {isTrackActive && (
                                <span className="text-[9px] px-2 py-0.2 rounded-full bg-orange-500 text-white font-bold">
                                  Now Playing
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {track.prompt}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-stone-500 mt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {track.duration}
                              </span>
                              <span>•</span>
                              <span>{new Date(track.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => downloadWavTrack(track)}
                            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Download WAV file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFromGallery(track.id, e)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete from gallery"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio continuous streaming in background</span>
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
