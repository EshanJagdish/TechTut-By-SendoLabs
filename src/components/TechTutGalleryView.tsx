import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, 
  Gamepad2, 
  Music, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  Search, 
  Play, 
  Star, 
  Trash2, 
  Download, 
  Plus, 
  ExternalLink, 
  Calendar, 
  Tag, 
  Trophy, 
  Check, 
  X, 
  Volume2, 
  ArrowRight, 
  Flame, 
  Layers,
  Copy,
  GraduationCap
} from 'lucide-react';
import { GalleryItem, GalleryItemType, GeneratedAiGame, AppMode } from '../types';
import { 
  getStoredGalleryItems, 
  deleteGalleryItem, 
  toggleFavoriteGalleryItem, 
  incrementGalleryItemPlayCount, 
  saveGalleryItem,
  GALLERY_UPDATE_EVENT 
} from '../lib/galleryStorage';
import { CosmicDefenderGame, ScholarRunnerGame, GravityCatcherGame, HtmlSandboxPlayer } from './games/RealHtmlGames';
import { dreamyAudio } from '../lib/audioSynthesizer';

interface TechTutGalleryViewProps {
  onNavigateMode: (mode: AppMode, payload?: any) => void;
  onShowToast?: (title: string, subtitle: string, icon?: string) => void;
}

export const TechTutGalleryView: React.FC<TechTutGalleryViewProps> = ({
  onNavigateMode,
  onShowToast
}) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<GalleryItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alpha'>('newest');

  // Modals / Preview States
  const [activePlayGame, setActivePlayGame] = useState<GeneratedAiGame | null>(null);
  const [activeStudyModal, setActiveStudyModal] = useState<GalleryItem | null>(null);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // New Bookmark Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState<GalleryItemType>('game');
  const [newSubtitle, setNewSubtitle] = useState('');

  // Load items & subscribe to updates
  useEffect(() => {
    setItems(getStoredGalleryItems());

    const handleUpdate = () => {
      setItems(getStoredGalleryItems());
    };

    window.addEventListener(GALLERY_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(GALLERY_UPDATE_EVENT, handleUpdate);
  }, []);

  // Filter & Sort Logic
  const filteredItems = items
    .filter(item => {
      if (selectedFilter !== 'all' && item.type !== selectedFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesTopic = item.topic.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        return matchesTitle || matchesTopic || matchesSubtitle || matchesTags;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.dateAdded - a.dateAdded;
      if (sortBy === 'popular') return (b.playCount || 0) - (a.playCount || 0);
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      return 0;
    });

  // Action Handlers
  const handleLaunchItem = (item: GalleryItem) => {
    incrementGalleryItemPlayCount(item.id);

    if (item.type === 'game' && item.payload.gameData) {
      setActivePlayGame(item.payload.gameData);
    } else if (item.type === 'music') {
      const trackId = item.payload.musicTrack?.id || 'dreamy_starlight';
      dreamyAudio.setTrack(trackId);
      dreamyAudio.play();
      setActiveAudioPlaying(trackId);
      onShowToast?.("Now Playing", item.title, "🎵");
    } else if (item.type === 'quiz') {
      onNavigateMode('quiz', { joinCode: item.payload.quizCode });
      onShowToast?.("Quiz Arena Ready", `Loaded room: ${item.payload.quizCode}`, "🏆");
    } else if (item.type === 'study') {
      setActiveStudyModal(item);
    } else if (item.type === 'workspace') {
      onNavigateMode('workspace');
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGalleryItem(id);
    setItems(getStoredGalleryItems());
    onShowToast?.("Item Removed", "Removed from your TechTut Gallery", "🗑️");
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteGalleryItem(id);
    setItems(getStoredGalleryItems());
  };

  const handleExportJson = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${item.title.toLowerCase().replace(/\s+/g, '_')}_techtut.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast?.("Exported", `${item.title} downloaded as JSON`, "📥");
  };

  const handleCopyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    onShowToast?.("Copied Code", `10-digit code: ${code}`, "📋");
  };

  const handleCreateCustomBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    saveGalleryItem({
      type: newType,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Custom Scholar Bookmark',
      topic: newTopic.trim() || 'General Studies',
      tags: ['Custom', newType],
      payload: {}
    });

    setNewTitle('');
    setNewTopic('');
    setNewSubtitle('');
    setIsAddModalOpen(false);
    onShowToast?.("Bookmark Saved", "New entry added to your Gallery", "✨");
  };

  // Counts by category
  const countAll = items.length;
  const countGames = items.filter(i => i.type === 'game').length;
  const countMusic = items.filter(i => i.type === 'music').length;
  const countQuiz = items.filter(i => i.type === 'quiz').length;
  const countStudy = items.filter(i => i.type === 'study').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Central Academic Archive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            TechTut Gallery
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
            Your personal treasury of generated HTML games, ambient music pieces, proctored quiz arenas, and step-by-step mathematical derivations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Bookmark Item</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vault Total</span>
            <FolderHeart className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{countAll}</div>
          <div className="text-[11px] text-stone-500">Saved resources</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Playable Games</span>
            <Gamepad2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{countGames}</div>
          <div className="text-[11px] text-stone-500">Real HTML arcades</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Music Tracks</span>
            <Music className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{countMusic}</div>
          <div className="text-[11px] text-stone-500">Soundscape themes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Quiz Arenas</span>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{countQuiz}</div>
          <div className="text-[11px] text-stone-500">10-Digit test rooms</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/60 p-2 rounded-2xl border border-stone-200/60">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            All Items ({countAll})
          </button>
          <button
            onClick={() => setSelectedFilter('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'game'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games ({countGames})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('music')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'music'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music ({countMusic})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'quiz'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quizzes ({countQuiz})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('study')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'study'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Derivations ({countStudy})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-orange-500"
          />
        </div>

      </div>

      {/* Gallery Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
            <FolderHeart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No items match your criteria</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search query or generate new games, tracks, and test rooms to add them to your Gallery.
          </p>
          <button
            onClick={() => { setSelectedFilter('all'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isGame = item.type === 'game';
            const isMusic = item.type === 'music';
            const isQuiz = item.type === 'quiz';
            const isStudy = item.type === 'study';

            const badgeBg = isGame 
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : isMusic 
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : isQuiz 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200';

            const icon = isGame 
              ? <Gamepad2 className="w-4 h-4 text-orange-500" />
              : isMusic 
                ? <Music className="w-4 h-4 text-purple-500" />
                : isQuiz 
                  ? <HelpCircle className="w-4 h-4 text-emerald-500" />
                  : <BookOpen className="w-4 h-4 text-blue-500" />;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-lg hover:border-orange-300 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar on Card */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeBg}`}>
                      {icon}
                      <span className="capitalize">{item.badge || item.type}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className={`p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer ${
                          item.favorite ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
                        }`}
                        title="Star / Favorite"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleExportJson(item, e)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete from Gallery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.subtitle || `Stored ${item.type} in TechTut repository.`}
                    </p>
                  </div>

                  {/* Topic Tag */}
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                    <Tag className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{item.topic}</span>
                  </div>

                  {/* If Quiz: show 10-digit code pill */}
                  {isQuiz && item.payload.quizCode && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 text-xs font-mono font-bold">
                      <span>Room: {item.payload.quizCode}</span>
                      <button
                        onClick={(e) => handleCopyCode(item.payload.quizCode!, item.id, e)}
                        className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodeId === item.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-stone-400 font-mono">
                    {item.playCount ? `${item.playCount} launches` : 'Ready to use'}
                  </div>

                  <button
                    onClick={() => handleLaunchItem(item)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                      isGame 
                        ? 'bg-orange-600 hover:bg-orange-500 text-white' 
                        : isMusic 
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : isQuiz 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>
                      {isGame ? 'Play Game' : isMusic ? 'Listen' : isQuiz ? 'Launch Arena' : 'Read Solution'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: GAME PLAYER MODAL (Directly Play Game from Gallery) */}
      {activePlayGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-stone-950 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎮</span>
                <h3 className="text-lg font-bold text-white">{activePlayGame.title}</h3>
              </div>
              <button
                onClick={() => setActivePlayGame(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Launch Appropriate Engine */}
            {activePlayGame.archetype === 'cosmic_defender' && (
              <CosmicDefenderGame 
                game={activePlayGame} 
                onGameOver={(score) => onShowToast?.("Game Complete", `High score: ${score} PTS!`, "🏆")} 
              />
            )}
            {activePlayGame.archetype === 'scholar_runner' && (
              <ScholarRunnerGame 
                game={activePlayGame} 
                onGameOver={(score) => onShowToast?.("Runner Finished", `Distance: ${score} meters!`, "🏃")} 
              />
            )}
            {activePlayGame.archetype === 'gravity_catcher' && (
              <GravityCatcherGame 
                game={activePlayGame} 
                onGameOver={(score) => onShowToast?.("Catcher Complete", `Final score: ${score} PTS!`, "🪂")} 
              />
            )}
            {(activePlayGame.archetype === 'html_sandbox' || !['cosmic_defender', 'scholar_runner', 'gravity_catcher'].includes(activePlayGame.archetype)) && (
              <HtmlSandboxPlayer 
                game={activePlayGame} 
                onGameOver={(score) => onShowToast?.("Session Complete", `Score: ${score} PTS!`, "🕹️")} 
              />
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: STUDY DERIVATION VIEWER */}
      {activeStudyModal && activeStudyModal.payload.studySolution && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  Scholar Studio Derivation
                </span>
                <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                  {activeStudyModal.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {activeStudyModal.topic}
                </p>
              </div>
              <button
                onClick={() => setActiveStudyModal(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 leading-relaxed">
              <strong>Executive Formulation: </strong>
              {activeStudyModal.payload.studySolution.summary}
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Step-by-Step Derivation</h4>
              {activeStudyModal.payload.studySolution.steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-stone-900">{step.title}</span>
                  </div>
                  <p className="text-xs text-stone-600 pl-8 leading-relaxed">{step.explanation}</p>
                  {step.mathSnippet && (
                    <div className="ml-8 p-2.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto">
                      {step.mathSnippet}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  setActiveStudyModal(null);
                  onNavigateMode('study');
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <span>Open in Scholar Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL BOOKMARK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Add to TechTut Gallery</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Item Type:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as GalleryItemType)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 text-stone-900 focus:outline-hidden focus:border-orange-500 font-medium"
                >
                  <option value="game">🎮 Interactive Game</option>
                  <option value="music">🎵 Music Track / Soundscape</option>
                  <option value="quiz">🏆 Quiz Arena Room</option>
                  <option value="study">📚 Scholar Derivation / Notes</option>
                  <option value="workspace">🎨 Workspace Canvas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Quantum Wave Mechanics Arena"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Subject / Topic:</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Modern Physics"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Summary / Notes:</label>
                <textarea
                  rows={2}
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Brief description or reminder..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
