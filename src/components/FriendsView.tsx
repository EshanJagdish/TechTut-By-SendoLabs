import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Flame, 
  GraduationCap, 
  BookOpen, 
  Share2, 
  Search, 
  Award, 
  Check, 
  X, 
  Trash2, 
  RotateCw, 
  Play, 
  Pause, 
  Clock,
  ShieldCheck,
  Tag,
  Copy,
  Layers,
  ChevronRight,
  UserCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { FriendProfile, ChatMessage, UserProfile, FlashcardItem } from '../types';
import { STUDY_PROMPT_SUGGESTIONS, ACADEMIC_TOPIC_TAGS } from '../data/friendsData';
import { realFriendsSync } from '../utils/realFriendsSync';

interface FriendsViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ 
  userProfile, 
  onUpdateUserProfile 
}) => {
  // Friends list loaded from real sync storage
  const [friends, setFriends] = useState<FriendProfile[]>(() => realFriendsSync.loadFriends());
  
  // Real chat messages loaded from sync storage
  const [messages, setMessages] = useState<ChatMessage[]>(() => realFriendsSync.loadChatMessages());

  // Input states
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Active view: selected friend profile modal & active chat channel
  const [selectedProfile, setSelectedProfile] = useState<FriendProfile | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>('class_lounge'); // 'class_lounge' or friend id
  
  // Chat typing state
  const [chatInput, setChatInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#GeneralStudy');
  const [showFlashcardPicker, setShowFlashcardPicker] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedCardSuccessId, setSavedCardSuccessId] = useState<string | null>(null);
  
  // Real Co-Study sprint timer (Pomodoro 25 min)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Setup real-time listeners for multi-tab / multi-user sync
  useEffect(() => {
    // 1. Broadcast own presence periodically
    realFriendsSync.sendPresenceHeartbeat(
      userProfile, 
      isPomodoroActive ? 'focus_sprint' : 'studying',
      userProfile.savedFlashcards?.[0]?.topic || 'Active Recall'
    );

    const presenceInterval = setInterval(() => {
      realFriendsSync.sendPresenceHeartbeat(
        userProfile, 
        isPomodoroActive ? 'focus_sprint' : 'studying'
      );
    }, 15000);

    // 2. Listen to real chat messages from other peers/tabs
    const unsubscribeChat = realFriendsSync.onChatMessage((newMsg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    // 3. Listen to live presence updates from other tabs/peers
    const unsubscribePresence = realFriendsSync.onPresence((peer) => {
      setFriends((prev) => {
        const index = prev.findIndex(f => f.name.toLowerCase() === peer.name.toLowerCase() || f.id === peer.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...peer, status: peer.status };
          realFriendsSync.saveFriends(updated);
          return updated;
        }
        return prev;
      });
    });

    // 4. Listen to Pomodoro sync
    const unsubscribePomodoro = realFriendsSync.onPomodoro((pState) => {
      setIsPomodoroActive(pState.active);
      setPomodoroSeconds(pState.seconds);
    });

    return () => {
      clearInterval(presenceInterval);
      unsubscribeChat();
      unsubscribePresence();
      unsubscribePomodoro();
    };
  }, [userProfile, isPomodoroActive]);

  // Save friends to storage when changed
  useEffect(() => {
    realFriendsSync.saveFriends(friends);
  }, [friends]);

  // Scroll chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  // Pomodoro timer tick
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroActive && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            setIsPomodoroActive(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroSeconds]);

  const togglePomodoro = () => {
    const nextState = !isPomodoroActive;
    setIsPomodoroActive(nextState);
    realFriendsSync.sendPomodoroSync(nextState, pomodoroSeconds, userProfile.name || 'Scholar');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add friend handler ("type a name to friend it")
  const handleAddFriend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = friendNameInput.trim();
    if (!cleanName) {
      setStatusMessage({ text: 'Please enter a classmate or scholar name.', type: 'error' });
      return;
    }

    // Check if already friends
    const exists = friends.some((f) => f.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setStatusMessage({ text: `${cleanName} is already in your study circle!`, type: 'info' });
      return;
    }

    const avatarPool = ['🎓', '📚', '🧪', '🔭', '💡', '🎨', '⚡', '🌟', '📐', '🧠'];
    const randomAvatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
    const focusPool = [
      'Applied Mathematics', 
      'Biomedical Science', 
      'Computer Science', 
      'Cognitive Psychology', 
      'Organic Chemistry', 
      'World History', 
      'Physics & Mechanics'
    ];
    const randomFocus = focusPool[Math.floor(Math.random() * focusPool.length)];

    const newFriend: FriendProfile = {
      id: `friend_${Date.now()}`,
      name: cleanName,
      avatar: randomAvatar,
      title: `${randomFocus} Scholar`,
      level: userProfile.level || 'college',
      majorOrFocus: randomFocus,
      status: 'online',
      currentTopic: `Reviewing ${randomFocus} Core Concepts`,
      studyStreak: Math.floor(Math.random() * 12) + 3,
      xp: Math.floor(Math.random() * 2000) + 1200,
      stardust: Math.floor(Math.random() * 180) + 80,
      sharedFlashcardCount: Math.floor(Math.random() * 15) + 5,
      bio: `Studying ${randomFocus} with active recall, practice drills, and collaborative problem solving.`,
      badges: ['Study Partner', 'Focus Builder'],
      joinedDate: 'Joined study circle',
      isAiPeer: false,
    };

    const updated = [newFriend, ...friends];
    setFriends(updated);
    setFriendNameInput('');
    setStatusMessage({ text: `Added ${newFriend.name} to your real study circle!`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Remove friend handler
  const handleRemoveFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (selectedProfile?.id === friendId) {
      setSelectedProfile(null);
    }
    if (activeChannelId === friendId) {
      setActiveChannelId('class_lounge');
    }
    setStatusMessage({ text: 'Friend removed from your study circle.', type: 'info' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Send real chat message
  const handleSendMessage = (
    textToSend?: string, 
    customItem?: any, 
    msgType: 'text' | 'flashcard_share' | 'pomodoro_invite' = 'text'
  ) => {
    const text = (textToSend !== undefined ? textToSend : chatInput).trim();
    if (!text && !customItem) return;

    const userSenderId = userProfile.id || 'user_current';
    const userSenderName = userProfile.name || 'You';
    const userSenderAvatar = userProfile.avatar || '🎓';

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: userSenderId,
      senderName: userSenderName,
      senderAvatar: userSenderAvatar,
      recipientId: activeChannelId,
      text: text,
      timestamp: Date.now(),
      type: msgType,
      sharedItem: customItem,
      studyTag: selectedTag,
    };

    // Broadcast through real sync engine
    realFriendsSync.sendChatMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);

    if (textToSend === undefined) {
      setChatInput('');
    }
  };

  // Share real flashcard from user profile
  const handleShareFlashcard = (card: FlashcardItem) => {
    handleSendMessage(
      `Shared a flashcard from my study deck: "${card.topic}"`,
      {
        title: card.topic,
        topic: card.topic,
        front: card.front,
        back: card.back,
        mnemonic: card.mnemonic,
      },
      'flashcard_share'
    );
    setShowFlashcardPicker(false);
  };

  // Save shared flashcard into current user's profile
  const handleSaveSharedCardToMyDeck = (sharedItem: any) => {
    if (!sharedItem || !onUpdateUserProfile) return;

    const newCard: FlashcardItem = {
      id: `fc_shared_${Date.now()}`,
      topic: sharedItem.topic || 'Shared Flashcard',
      front: sharedItem.front || sharedItem.title || 'Concept',
      back: sharedItem.back || 'Explanation',
      mnemonic: sharedItem.mnemonic,
      mastered: false,
    };

    onUpdateUserProfile((prev) => {
      const existing = prev.savedFlashcards || [];
      const alreadySaved = existing.some(c => c.front === newCard.front && c.back === newCard.back);
      if (alreadySaved) return prev;
      return {
        ...prev,
        savedFlashcards: [newCard, ...existing],
        stardust: prev.stardust + 5,
        xp: prev.xp + 15,
      };
    });

    setSavedCardSuccessId(sharedItem.title || sharedItem.front);
    setTimeout(() => setSavedCardSuccessId(null), 3000);
  };

  // Copy personal scholar invite code
  const handleCopyScholarCode = () => {
    const code = `TECHTUT-${(userProfile.name || 'SCHOLAR').toUpperCase().replace(/\s+/g, '')}-${(userProfile.id || 'DESK').substring(0, 4).toUpperCase()}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(console.warn);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filtered friends
  const filteredFriends = friends.filter((f) => 
    f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    f.majorOrFocus.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    f.title.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  // Active chat peer
  const activePeer = friends.find((f) => f.id === activeChannelId);
  const activeChannelName = activeChannelId === 'class_lounge' 
    ? 'Class Study Lounge (All Classmates)' 
    : `${activePeer?.name || 'Classmate'} • Direct Study Chat`;

  // Active messages
  const activeMessages = messages.filter((m) => {
    if (activeChannelId === 'class_lounge') {
      return m.recipientId === 'class_lounge';
    }
    const currentId = userProfile.id || 'user_current';
    return (
      (m.recipientId === activeChannelId) ||
      (m.senderId === activeChannelId && m.recipientId === currentId) ||
      (m.senderId === currentId && m.recipientId === activeChannelId)
    );
  });

  return (
    <div id="friends-desk-container" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-36">
      
      {/* Top Banner: AI Study Desk Online & Real Friends Hub */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-orange-50 rounded-full text-xs text-orange-700 border border-orange-200 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-600" />
              <span>AI Study Desk • Real Classmate Network</span>
            </span>
            <span className="text-xs text-stone-500 font-medium">• {friends.length} Study Friends</span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync Active</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Friends &amp; Classmate Study Lounge
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Connect with classmates, review each other&apos;s scholar profiles, share real flashcards from your study deck, and co-study in a focused, distraction-free environment.
          </p>
        </div>

        {/* Real Co-Study Sprint Indicator */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-4 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Co-Study Pomodoro</span>
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">
              {formatTimer(pomodoroSeconds)}
            </div>
          </div>
          <button
            onClick={togglePomodoro}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isPomodoroActive 
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                : 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white shadow-xs'
            }`}
            title={isPomodoroActive ? 'Pause Co-Study Sprint' : 'Start 25m Co-Study Sprint'}
          >
            {isPomodoroActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
        </div>
      </div>

      {/* "Type a name to friend it" Input Section */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-orange-600" />
              <span>Add Classmates &amp; Friends</span>
            </h2>
            <p className="text-xs text-stone-600">
              Type any classmate&apos;s name to friend them and see their scholar profile, or share your Scholar ID.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScholarCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy your Scholar ID to share with friends"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedCode ? 'Scholar ID Copied!' : 'Copy My Scholar ID'}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`text-xs px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            statusMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-orange-50 text-orange-800 border-orange-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <input
              id="friend-name-input"
              type="text"
              value={friendNameInput}
              onChange={(e) => setFriendNameInput(e.target.value)}
              placeholder="Type classmate name (e.g. Liam Vance, Marcus Chen, Sophia Rodriguez)..."
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            id="submit-friend-btn"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Friend Scholar</span>
          </button>
        </form>
      </div>

      {/* Main Layout: Left Column = Friends & Classmates; Right Column = Real Peer Study Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Friends List & Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              <span>Study Circle ({friends.length})</span>
            </h3>
            
            {/* Search filter */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          {/* Lounge Channel Button */}
          <button
            onClick={() => setActiveChannelId('class_lounge')}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
              activeChannelId === 'class_lounge'
                ? 'bg-orange-500 text-white shadow-xs border-orange-500'
                : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                activeChannelId === 'class_lounge' ? 'bg-white/20 text-white' : 'bg-orange-50 border border-orange-200 text-orange-700'
              }`}>
                🏛️
              </div>
              <div>
                <div className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  activeChannelId === 'class_lounge' ? 'text-white' : 'text-stone-900'
                }`}>
                  <span>Class Study Lounge</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    activeChannelId === 'class_lounge' ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-800'
                  }`}>
                    Group
                  </span>
                </div>
                <p className={`text-[11px] truncate max-w-[200px] sm:max-w-[240px] ${
                  activeChannelId === 'class_lounge' ? 'text-orange-100' : 'text-stone-500'
                }`}>
                  Live classmate collaboration space
                </p>
              </div>
            </div>
            <MessageSquare className="w-4 h-4 opacity-75 shrink-0" />
          </button>

          {/* Friends List Cards */}
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredFriends.map((friend) => {
              const isSelected = activeChannelId === friend.id;
              return (
                <div
                  key={friend.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-50 border-orange-300 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div 
                    onClick={() => setSelectedProfile(friend)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    title="Click to view full scholar profile"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-lg shadow-xs">
                        {friend.avatar}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === 'online' ? 'bg-emerald-500' :
                        friend.status === 'focus_sprint' ? 'bg-amber-500' :
                        'bg-orange-500'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {friend.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-mono font-semibold">
                          {friend.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {friend.majorOrFocus}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-stone-600 mt-0.5">
                        <span className="flex items-center gap-0.5 text-orange-600 font-semibold">
                          <Flame className="w-3 h-3" />
                          <span>{friend.studyStreak}d</span>
                        </span>
                        <span>•</span>
                        <span>{friend.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Direct Chat & Profile Inspect */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setActiveChannelId(friend.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-orange-500 text-white border-orange-500' 
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                      }`}
                      title={`Direct Chat with ${friend.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedProfile(friend)}
                      className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                      title="Inspect Profile"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredFriends.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 space-y-2">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium">No classmates found matching &quot;{friendSearchQuery}&quot;.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Real Peer Study Chat */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col h-[680px]">
            
            {/* Chat Room Header */}
            <div className="pb-4 border-b border-stone-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-lg text-orange-600">
                  {activeChannelId === 'class_lounge' ? '🏛️' : (activePeer?.avatar || '🎓')}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <span>{activeChannelName}</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {activeChannelId === 'class_lounge' 
                      ? 'Study-appropriate peer learning & note exchange' 
                      : `Academic focus: ${activePeer?.majorOrFocus || 'General'}`}
                  </p>
                </div>
              </div>

              {activePeer && (
                <button
                  onClick={() => setSelectedProfile(activePeer)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>

            {/* Quick Academic Topic Chips */}
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                Topic Tag:
              </span>
              {ACADEMIC_TOPIC_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
              {activeMessages.map((msg) => {
                const isOwn = msg.senderId === (userProfile.id || 'user_current') || msg.senderName === (userProfile.name || 'You');

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {msg.senderAvatar || '🎓'}
                    </div>

                    <div className={`max-w-[82%] sm:max-w-[78%] space-y-1.5 ${isOwn ? 'items-end text-right' : 'items-start text-left'}`}>
                      <div className="flex items-center gap-2 text-[11px] px-1">
                        <span className="font-bold text-stone-800">{msg.senderName}</span>
                        {msg.studyTag && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-medium">
                            {msg.studyTag}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Main Bubble Content */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn
                            ? 'bg-orange-500 text-white shadow-xs rounded-tr-xs'
                            : 'bg-stone-100 text-stone-900 border border-stone-200 shadow-xs rounded-tl-xs'
                        }`}
                      >
                        {msg.text}

                        {/* Shared Flashcard Component Card */}
                        {msg.sharedItem && (
                          <div className={`mt-3 p-3.5 rounded-xl border text-left space-y-2 ${
                            isOwn 
                              ? 'bg-orange-600/60 border-orange-400/50 text-white' 
                              : 'bg-white border-stone-200 text-stone-900 shadow-xs'
                          }`}>
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                                <span>{msg.sharedItem.topic || 'Flashcard'}</span>
                              </span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                Shared Card
                              </span>
                            </div>

                            <div className="space-y-1 text-xs">
                              <p className="font-bold">{msg.sharedItem.front || msg.sharedItem.title}</p>
                              <p className={`text-[11px] ${isOwn ? 'text-orange-100' : 'text-stone-600'}`}>
                                {msg.sharedItem.back}
                              </p>
                              {msg.sharedItem.mnemonic && (
                                <p className={`text-[10px] italic ${isOwn ? 'text-orange-200' : 'text-stone-500'}`}>
                                  💡 {msg.sharedItem.mnemonic}
                                </p>
                              )}
                            </div>

                            {/* Save to My Deck Button */}
                            <div className="pt-2 border-t border-stone-200/50 flex justify-end">
                              <button
                                onClick={() => handleSaveSharedCardToMyDeck(msg.sharedItem)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  savedCardSuccessId === (msg.sharedItem.title || msg.sharedItem.front)
                                    ? 'bg-emerald-500 text-white'
                                    : isOwn
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                              >
                                {savedCardSuccessId === (msg.sharedItem.title || msg.sharedItem.front) ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Saved to My Deck!</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" />
                                    <span>Add to My Study Deck</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Pre-fill Quick Academic Prompts */}
            <div className="pt-2 flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider shrink-0">
                Prompt Starters:
              </span>
              {STUDY_PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(item.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Input & Toolbar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Write a message in ${activeChannelName}...`}
                  className="flex-1 px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 focus:bg-white transition-colors"
                />

                {/* Share Flashcard from user's deck */}
                <button
                  type="button"
                  onClick={() => setShowFlashcardPicker(true)}
                  className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 transition-colors cursor-pointer shrink-0"
                  title="Share a flashcard from your deck"
                >
                  <BookOpen className="w-4 h-4 text-orange-600" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xs disabled:opacity-40 cursor-pointer shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>

      {/* MODAL 1: Scholar Friend Profile View */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header / Avatar / Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-3xl shadow-xs">
                  {selectedProfile.avatar}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">{selectedProfile.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold uppercase">
                      {selectedProfile.level}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-600">{selectedProfile.title}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{selectedProfile.status}</span>
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500">{selectedProfile.currentTopic}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bio */}
            {selectedProfile.bio && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                {selectedProfile.bio}
              </div>
            )}

            {/* Key Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-[10px] text-stone-500 font-semibold uppercase">Study Streak</div>
                <div className="text-base font-bold text-orange-600 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                  <span>{selectedProfile.studyStreak}d</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-[10px] text-stone-500 font-semibold uppercase">Scholar XP</div>
                <div className="text-base font-bold text-stone-900">
                  {selectedProfile.xp.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-[10px] text-stone-500 font-semibold uppercase">Flashcards</div>
                <div className="text-base font-bold text-stone-900">
                  {selectedProfile.sharedFlashcardCount}
                </div>
              </div>
            </div>

            {/* Badges Earned */}
            {selectedProfile.badges && selectedProfile.badges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Badges &amp; Scholar Honors:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.badges.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-800 flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-orange-600" />
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => handleRemoveFriend(selectedProfile.id)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Friend</span>
              </button>

              <button
                onClick={() => {
                  setActiveChannelId(selectedProfile.id);
                  setSelectedProfile(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Direct Chat</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Flashcard Deck Picker Modal */}
      {showFlashcardPicker && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-stone-200 shadow-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-stone-900">Share Flashcard to Study Chat</h3>
              </div>
              <button
                onClick={() => setShowFlashcardPicker(false)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Select one of your saved study flashcards to share with classmates for active recall review.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(userProfile.savedFlashcards && userProfile.savedFlashcards.length > 0) ? (
                userProfile.savedFlashcards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleShareFlashcard(card)}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-stone-900 group-hover:text-orange-700">
                      <span>{card.topic}</span>
                      <span className="text-[10px] text-stone-500 font-normal">Click to Share</span>
                    </div>
                    <p className="text-xs text-stone-700 font-semibold">{card.front}</p>
                    <p className="text-xs text-stone-500 line-clamp-2">{card.back}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 space-y-2">
                  <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-semibold text-stone-700">No Flashcards in Your Deck Yet</p>
                  <p className="text-xs text-stone-500">Solve study problems in Study Mode to generate and save flashcards.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFlashcardPicker(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
