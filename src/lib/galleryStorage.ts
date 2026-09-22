import { GalleryItem, GalleryItemType, GeneratedAiGame, QuizSession, StudySolution, MusicTrack } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';

const GALLERY_STORAGE_KEY = 'techtut_gallery_items_v2';
export const GALLERY_UPDATE_EVENT = 'techtut_gallery_updated';

// Initial pre-seeded collection so the Gallery feels rich, functional, and organized
const SEED_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'seed_game_cosmic_calc',
    type: 'game',
    title: 'Cosmic Defender: Derivative Blaster',
    subtitle: 'Real-time space shooter targeting rates of change & power rules',
    topic: 'Calculus & Physics',
    dateAdded: Date.now() - 3600000 * 24,
    tags: ['Interactive Game', 'Calculus', 'HTML5 Arcade', 'Space Blaster'],
    badge: '🚀 Space Shooter',
    favorite: true,
    playCount: 14,
    payload: {
      gameData: {
        id: 'game_seed_calc',
        title: 'Cosmic Defender: Derivative Blaster',
        archetype: 'cosmic_defender',
        topic: 'Calculus: Derivatives & Rates of Change',
        sourceType: 'text',
        description: 'Pilot your scholar spacecraft through asteroid belts. Target asteroids carrying true derivative solutions and dodge incorrect distractors!',
        rules: 'Use Left/Right arrow keys (or on-screen buttons) to steer, Spacebar/Fire to blast targets. Match the active target derivative.',
        targetLevel: 'college',
        gameplayItems: [
          {
            id: 'item_1',
            prompt: "What is d/dx [x^4]?",
            targetAnswer: "4x^3",
            distractors: ["3x^4", "4x", "x^3 / 4"],
            explanation: "Power rule: bring exponent forward and subtract 1: 4*x^(4-1) = 4x^3."
          },
          {
            id: 'item_2',
            prompt: "What is d/dx [sin(x)]?",
            targetAnswer: "cos(x)",
            distractors: ["-cos(x)", "tan(x)", "-sin(x)"],
            explanation: "The rate of change of sine is cosine."
          },
          {
            id: 'item_3',
            prompt: "What is d/dx [e^(3x)]?",
            targetAnswer: "3e^(3x)",
            distractors: ["e^(3x)", "3x * e^(3x)", "e^(3x) / 3"],
            explanation: "Chain rule: derivative of e^u with u=3x is e^u * u' = 3e^(3x)."
          },
          {
            id: 'item_4',
            prompt: "What is d/dx [ln(x)] for x > 0?",
            targetAnswer: "1/x",
            distractors: ["x", "1 / x^2", "e^x"],
            explanation: "The instantaneous rate of change of the natural log is 1/x."
          }
        ],
        xpReward: 150,
        stardustReward: 60,
        highScore: 820,
        savedToGallery: true
      }
    }
  },
  {
    id: 'seed_music_main_theme',
    type: 'music',
    title: 'TechTut Main Theme',
    subtitle: '432Hz ambient chord swells & celestial chimes for relaxed encoding',
    topic: 'Mindful Ambient Soundscapes',
    dateAdded: Date.now() - 3600000 * 18,
    tags: ['Ambient', '432Hz', 'Lyria', 'Procedural Audio'],
    badge: '🎵 Main Theme',
    favorite: true,
    playCount: 42,
    payload: {
      musicTrack: {
        id: 'dreamy_starlight',
        title: 'TechTut Main Theme',
        subtitle: '432Hz ambient chord swells & celestial chimes',
        category: 'dreamy',
        moodTags: ['Curiosity', 'Relaxed Encoding', 'Gentle Wonder'],
        color: 'from-orange-500/20 to-amber-500/20',
        bpm: 60,
        key: 'A Major / F# Minor (432Hz)',
        description: 'Signature study soundscape synthesized via procedural audio oscillator bank.'
      }
    }
  },
  {
    id: 'seed_quiz_cs_honors',
    type: 'quiz',
    title: 'Computer Science & AI Honors Benchmark',
    subtitle: 'Proctored 10-digit exam arena testing asymptotic runtime & transformer models',
    topic: 'Computer Science & AI',
    dateAdded: Date.now() - 3600000 * 12,
    tags: ['Quiz Arena', 'Proctored', '10-Digit Code', 'Algorithms'],
    badge: '🏆 10-Digit Code: 4829 - 1038 - 47',
    favorite: false,
    playCount: 9,
    payload: {
      quizCode: '4829103847',
      quizSession: {
        code: '4829103847',
        hostId: 'teacher_proctor_1',
        hostName: 'Prof. Alistair Vance',
        title: 'Computer Science & AI Honors Benchmark',
        createdAt: Date.now() - 86400000,
        status: 'lobby',
        settings: {
          timePerQuestionSec: 45,
          strictFullscreen: true,
          shuffleQuestions: true,
          revealAnswersLive: true,
          pointsPerCorrect: 100
        },
        questions: [
          {
            id: 'q_1',
            prompt: 'What is the average-case runtime complexity of quicksort with a randomized pivot?',
            options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'],
            correctIndex: 0,
            explanation: 'Randomized quicksort splits subarrays evenly on average, yielding O(n log n) expected comparisons.',
            timeLimitSec: 45
          },
          {
            id: 'q_2',
            prompt: 'In modern Transformer models, what mechanism allows tokens to compute contextual representations in parallel?',
            options: ['Multi-Head Self-Attention', 'Recurrent Hidden Backprop', 'Markov State Transition', 'K-Means Clustering'],
            correctIndex: 0,
            explanation: 'Scaled Dot-Product Self-Attention computes pairwise token scores without sequential recurrence.',
            timeLimitSec: 45
          }
        ],
        participants: {},
        violationsLog: []
      }
    }
  },
  {
    id: 'seed_study_vector_calc',
    type: 'study',
    title: "Stokes' Theorem & Circulation Derivation",
    subtitle: 'Step-by-step rigorous boundary contour derivation with mental anchors',
    topic: 'Multivariable Calculus',
    dateAdded: Date.now() - 3600000 * 6,
    tags: ['Derivations', 'Vector Fields', 'Scholar Studio', 'Curl & Flux'],
    badge: '📚 Derivation Guide',
    favorite: false,
    playCount: 5,
    payload: {
      studySolution: {
        topic: "Multivariable Calculus: Stokes' Theorem",
        level: 'university',
        summary: "The line integral of a vector field F around a closed boundary curve C equals the surface integral of the curl of F over any orientable surface S bounded by C: ∮_C F · dr = ∬_S (∇ × F) · dS.",
        steps: [
          {
            stepNumber: 1,
            title: "Geometric Formulation & Orientation",
            explanation: "Let S be a smooth oriented surface bounded by a piecewise-smooth simple closed curve C with positive orientation governed by the right-hand rule.",
            mathSnippet: "\\oint_{\\partial S} \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}"
          },
          {
            stepNumber: 2,
            title: "Decomposition into Planar Rectangles",
            explanation: "Subdivide S into infinitesimal coordinate patches. Apply Green's Theorem to each microscopic loop. Internal line segments cancel each other out.",
            mathSnippet: "\\sum_{i} \\oint_{C_i} \\mathbf{F} \\cdot d\\mathbf{r} = \\oint_C \\mathbf{F} \\cdot d\\mathbf{r}"
          },
          {
            stepNumber: 3,
            title: "Curl Density as Microscopic Circulation",
            explanation: "As area ΔA -> 0, circulation per unit area is the normal component of curl: (∇ × F) · n.",
            mathSnippet: "(\\nabla \\times \\mathbf{F}) \\cdot \\mathbf{n} = \\lim_{\\Delta A \\to 0} \\frac{1}{\\Delta A} \\oint \\mathbf{F} \\cdot d\\mathbf{r}"
          }
        ],
        recommendations: {
          recommendedMood: 'Deep Mathematical Flow',
          ambientSoundtrack: 'Alpha Waves & 432Hz Calm',
          circadianTiming: 'Peak Morning Cognitive Window'
        }
      }
    }
  }
];

export function getStoredGalleryItems(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(SEED_GALLERY_ITEMS));
      return SEED_GALLERY_ITEMS;
    }
    const parsed: GalleryItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(SEED_GALLERY_ITEMS));
      return SEED_GALLERY_ITEMS;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to parse gallery items from local storage, fallback to seeds:', err);
    return SEED_GALLERY_ITEMS;
  }
}

export function saveGalleryItem(item: Omit<GalleryItem, 'id' | 'dateAdded'> & { id?: string }): GalleryItem {
  const current = getStoredGalleryItems();
  const newItem: GalleryItem = {
    id: item.id || `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle || '',
    topic: item.topic || 'General Studies',
    dateAdded: Date.now(),
    tags: item.tags || [],
    thumbnailUrl: item.thumbnailUrl,
    badge: item.badge,
    favorite: Boolean(item.favorite),
    playCount: item.playCount || 0,
    payload: item.payload
  };

  // Replace if existing with same id, or prepend to front
  const existingIdx = current.findIndex(i => i.id === newItem.id);
  let updated: GalleryItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newItem;
  } else {
    updated = [newItem, ...current];
  }

  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(GALLERY_UPDATE_EVENT, { detail: newItem }));
  } catch (err) {
    console.error('Failed to store gallery item locally:', err);
  }

  // Attempt async firestore sync if user is logged in
  try {
    const user = auth.currentUser;
    if (user && db) {
      const docRef = doc(db, 'users', user.uid, 'gallery_items', newItem.id);
      setDoc(docRef, newItem, { merge: true }).catch(err => {
        console.info('Gallery Firestore item save:', err?.message || err);
      });
    }
  } catch (syncErr) {
    // Non-blocking
  }

  return newItem;
}

export function deleteGalleryItem(id: string): void {
  const current = getStoredGalleryItems();
  const filtered = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(GALLERY_UPDATE_EVENT, { detail: { id, deleted: true } }));
  } catch (err) {
    console.error('Failed to delete gallery item:', err);
  }

  try {
    const user = auth.currentUser;
    if (user && db) {
      const docRef = doc(db, 'users', user.uid, 'gallery_items', id);
      deleteDoc(docRef).catch(() => {});
    }
  } catch (err) {
    // Non-blocking
  }
}

export function toggleFavoriteGalleryItem(id: string): boolean {
  const current = getStoredGalleryItems();
  let nextState = false;
  const updated = current.map(item => {
    if (item.id === id) {
      nextState = !item.favorite;
      return { ...item, favorite: nextState };
    }
    return item;
  });

  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(GALLERY_UPDATE_EVENT, { detail: { id, favorite: nextState } }));
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
  }

  return nextState;
}

export function incrementGalleryItemPlayCount(id: string): void {
  const current = getStoredGalleryItems();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, playCount: (item.playCount || 0) + 1 };
    }
    return item;
  });

  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    // Silent
  }
}
