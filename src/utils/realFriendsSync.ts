import { FriendProfile, ChatMessage, UserProfile, FlashcardItem } from '../types';
import { INITIAL_FRIENDS, INITIAL_CHAT_MESSAGES } from '../data/friendsData';

const FRIENDS_STORAGE_KEY = 'techtut_real_friends_v2';
const CHAT_STORAGE_KEY = 'techtut_real_chat_messages_v2';
const CHANNEL_NAME = 'techtut_real_friends_sync_bus';

export interface PresencePayload {
  type: 'PRESENCE_HEARTBEAT';
  profile: {
    id: string;
    name: string;
    avatar: string;
    title: string;
    level: string;
    status: 'studying' | 'online' | 'focus_sprint' | 'offline';
    currentTopic?: string;
    studyStreak: number;
    xp: number;
    stardust: number;
    sharedFlashcardCount: number;
  };
  timestamp: number;
}

export interface ChatPayload {
  type: 'REAL_CHAT_MESSAGE';
  message: ChatMessage;
}

export interface PomodoroPayload {
  type: 'REAL_POMODORO_SYNC';
  active: boolean;
  seconds: number;
  startedBy: string;
  timestamp: number;
}

export type FriendsBusEvent = PresencePayload | ChatPayload | PomodoroPayload;

class RealFriendsSyncService {
  private channel: BroadcastChannel | null = null;
  private messageListeners: Array<(msg: ChatMessage) => void> = [];
  private presenceListeners: Array<(peer: FriendProfile) => void> = [];
  private pomodoroListeners: Array<(state: { active: boolean; seconds: number; startedBy: string }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<FriendsBusEvent>) => {
          this.handleIncomingEvent(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, falling back to storage listener', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'techtut_last_broadcast_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.handleIncomingEvent(parsed);
          } catch (err) {
            console.warn('Error parsing storage sync event:', err);
          }
        }
      });
    }
  }

  private handleIncomingEvent(data: FriendsBusEvent) {
    if (!data || !data.type) return;

    if (data.type === 'REAL_CHAT_MESSAGE') {
      this.messageListeners.forEach(listener => listener(data.message));
    } else if (data.type === 'PRESENCE_HEARTBEAT') {
      const peerProfile: FriendProfile = {
        id: data.profile.id,
        name: data.profile.name,
        avatar: data.profile.avatar,
        title: data.profile.title,
        level: (data.profile.level as any) || 'college',
        majorOrFocus: data.profile.title.replace(' Scholar', '') || 'Active Study',
        status: data.profile.status,
        currentTopic: data.profile.currentTopic || 'Studying in TechTut',
        studyStreak: data.profile.studyStreak || 1,
        xp: data.profile.xp || 100,
        stardust: data.profile.stardust || 50,
        sharedFlashcardCount: data.profile.sharedFlashcardCount || 0,
        bio: `Active TechTut scholar co-learning and sharing notes.`,
        badges: ['Live Peer', 'Active Scholar'],
        joinedDate: 'Live session',
        isAiPeer: false,
      };
      this.presenceListeners.forEach(listener => listener(peerProfile));
    } else if (data.type === 'REAL_POMODORO_SYNC') {
      this.pomodoroListeners.forEach(listener => listener({
        active: data.active,
        seconds: data.seconds,
        startedBy: data.startedBy,
      }));
    }
  }

  private postEvent(event: FriendsBusEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.warn('Error posting to BroadcastChannel:', e);
      }
    }
    try {
      localStorage.setItem('techtut_last_broadcast_event', JSON.stringify({ ...event, _t: Date.now() }));
    } catch (e) {
      console.warn('Storage sync fallback error:', e);
    }
  }

  // Broadcast own presence to other tabs/classmates
  public sendPresenceHeartbeat(user: UserProfile, status: 'studying' | 'online' | 'focus_sprint' = 'online', topic?: string) {
    const payload: PresencePayload = {
      type: 'PRESENCE_HEARTBEAT',
      profile: {
        id: user.id || 'current_user',
        name: user.name || 'Scholar',
        avatar: user.avatar || '🎓',
        title: user.title || 'TechTut Scholar',
        level: user.level || 'college',
        status: status,
        currentTopic: topic || (user.savedFlashcards?.length ? `Studying ${user.savedFlashcards[0].topic}` : 'Deep Study Session'),
        studyStreak: user.currentStreak || 1,
        xp: user.xp || 100,
        stardust: user.stardust || 50,
        sharedFlashcardCount: user.savedFlashcards?.length || 0,
      },
      timestamp: Date.now(),
    };
    this.postEvent(payload);
  }

  // Broadcast a real chat message
  public sendChatMessage(message: ChatMessage) {
    // 1. Save to local storage
    const existing = this.loadChatMessages();
    const updated = [...existing, message];
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving chat message to storage:', e);
    }

    // 2. Broadcast to other open tabs / live classmates
    const payload: ChatPayload = {
      type: 'REAL_CHAT_MESSAGE',
      message,
    };
    this.postEvent(payload);
  }

  // Broadcast synchronized Pomodoro state
  public sendPomodoroSync(active: boolean, seconds: number, startedBy: string) {
    const payload: PomodoroPayload = {
      type: 'REAL_POMODORO_SYNC',
      active,
      seconds,
      startedBy,
      timestamp: Date.now(),
    };
    this.postEvent(payload);
  }

  // Listeners
  public onChatMessage(callback: (msg: ChatMessage) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  public onPresence(callback: (peer: FriendProfile) => void) {
    this.presenceListeners.push(callback);
    return () => {
      this.presenceListeners = this.presenceListeners.filter(l => l !== callback);
    };
  }

  public onPomodoro(callback: (state: { active: boolean; seconds: number; startedBy: string }) => void) {
    this.pomodoroListeners.push(callback);
    return () => {
      this.pomodoroListeners = this.pomodoroListeners.filter(l => l !== callback);
    };
  }

  // Load and save friends
  public loadFriends(): FriendProfile[] {
    try {
      const raw = localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (raw) {
        const parsed: FriendProfile[] = JSON.parse(raw);
        // Ensure no isAiPeer remains
        return parsed.map(f => ({ ...f, isAiPeer: false }));
      }
    } catch (e) {
      console.warn('Failed to load friends:', e);
    }
    // Clean initial peers (convert to real classmates directory)
    return INITIAL_FRIENDS.map(f => ({ ...f, isAiPeer: false }));
  }

  public saveFriends(friends: FriendProfile[]) {
    try {
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
    } catch (e) {
      console.warn('Failed to save friends:', e);
    }
  }

  // Load chat messages
  public loadChatMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load chat messages:', e);
    }
    return INITIAL_CHAT_MESSAGES;
  }
}

export const realFriendsSync = new RealFriendsSyncService();
