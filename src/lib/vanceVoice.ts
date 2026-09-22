// Professor Vance Primary Voice Synthesis Engine
// Delivers articulate, intellectual, and natural oral delivery

export interface VanceSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getProfessorVanceVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return null;

  // Normal standard Professor Vance voice
  const preferredNormalVoices = [
    'Daniel',
    'David',
    'George',
    'Oliver',
    'Google UK English Male',
    'Google US English',
    'en-GB',
    'en-US'
  ];

  for (const name of preferredNormalVoices) {
    const found = voices.find(v => v.name.includes(name) || v.lang === name);
    if (found) return found;
  }

  // Fallback to system default English voice or first voice
  const defaultEn = voices.find(v => v.lang.startsWith('en') && v.default);
  if (defaultEn) return defaultEn;

  const anyEn = voices.find(v => v.lang.startsWith('en'));
  return anyEn || voices[0] || null;
}

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown code blocks & inline code
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers, bold, italics, strikethrough, blockquotes
    .replace(/^[#>-]+\s*/gm, '')
    .replace(/[*_~]/g, '')
    // Replace markdown links [label](url) with just label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Replace common math symbols with spoken phonetic phrases
    .replace(/\b([a-zA-Z])\^2\b/g, '$1 squared')
    .replace(/\b([a-zA-Z])\^3\b/g, '$1 cubed')
    .replace(/\b([a-zA-Z])'\(x\)/g, '$1 prime of x')
    .replace(/!=/g, ' does not equal ')
    .replace(/<=/g, ' is less than or equal to ')
    .replace(/>=/g, ' is greater than or equal to ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakProfessorVance(
  text: string, 
  options: VanceSpeechOptions = {}
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) return null;
  const synth = window.speechSynthesis;

  // Cancel any ongoing speech
  try {
    synth.cancel();
  } catch (e) {
    console.warn("Speech cancel error:", e);
  }

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return null;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  const chosenVoice = getProfessorVanceVoice();
  if (chosenVoice) {
    utterance.voice = chosenVoice;
  }

  utterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (err) => {
    activeUtterance = null;
    if (options.onError) options.onError(err);
  };

  activeUtterance = utterance;

  // Chrome bug workaround: voices can be empty on first call until loaded
  if (synth.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const v = getProfessorVanceVoice();
      if (v) utterance.voice = v;
      synth.speak(utterance);
    };
  } else {
    synth.speak(utterance);
  }

  return utterance;
}

export function stopProfessorVance(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch (err) {
    console.warn("Failed to stop voice:", err);
  }
}
