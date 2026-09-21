import { GeneratedMusicTrack } from '../types';

const GALLERY_STORAGE_KEY = 'techtut_music_gallery';

// Generate a valid, lightweight 16-bit PCM WAV base64 buffer on the client
export function generateClientProceduralWav(prompt: string = 'Ambient Study', durationSeconds: number = 8): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Hash seed
  let seed = 7;
  for (let i = 0; i < prompt.length; i++) {
    seed = (seed * 31 + prompt.charCodeAt(i)) % 9973;
  }

  const chords = [
    [220.0, 277.18, 329.63, 440.0], // A
    [261.63, 329.63, 392.0, 523.25], // C
    [196.0, 246.94, 293.66, 392.0], // G
    [174.61, 220.0, 261.63, 349.23], // F
  ];
  const chord = chords[seed % chords.length];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const root = chord[Math.floor(t / 2) % chord.length];
    const fifth = chord[(Math.floor(t / 2) + 2) % chord.length];

    const env = Math.sin((t % 2) / 2 * Math.PI) * 0.8 + 0.2;
    const wave1 = Math.sin(2 * Math.PI * root * t);
    const wave2 = Math.sin(2 * Math.PI * fifth * t) * 0.6;
    const tone = (wave1 + wave2) * 0.25 * env;

    const sample = Math.max(-32768, Math.min(32767, Math.floor(tone * 32767)));
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  // Convert to binary string -> base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const SEED_TRACKS: GeneratedMusicTrack[] = [
  {
    id: 'track_celestial_calculus',
    title: 'Calculus Resonance Field',
    prompt: 'Warm Rhodes ambient chords with 432Hz sine pulse for multivariable integration',
    model: 'lyria-3-clip-preview',
    duration: '30s',
    createdAt: Date.now() - 3600000 * 3,
    mimeType: 'audio/wav',
    lyrics: 'Harmonic sine resonance and alpha frequencies for analytical deep work.',
    tags: ['Calculus', 'Focus', 'Ambient'],
    audioBase64: generateClientProceduralWav('Calculus Resonance Field', 6),
  },
  {
    id: 'track_quantum_flow',
    title: 'Midnight Quantum Drone',
    prompt: 'Subtle binaural delta ripples with gentle acoustic harmonics and tape saturation',
    model: 'lyria-3-pro-preview',
    duration: 'Full Track',
    createdAt: Date.now() - 3600000 * 24,
    mimeType: 'audio/wav',
    lyrics: 'Binaural delta ripples engineered to quiet the verbal chatter during exam prep.',
    tags: ['Physics', 'Quantum', 'Late Night'],
    audioBase64: generateClientProceduralWav('Midnight Quantum Drone', 6),
  }
];

export function loadMusicGallery(): GeneratedMusicTrack[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(SEED_TRACKS));
      return SEED_TRACKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_TRACKS;
  } catch (e) {
    console.error('Failed to load music gallery:', e);
    return SEED_TRACKS;
  }
}

export function saveTrackToGallery(track: GeneratedMusicTrack): GeneratedMusicTrack[] {
  try {
    const current = loadMusicGallery();
    const updated = [track, ...current.filter(t => t.id !== track.id)];
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save track to gallery:', e);
    return [];
  }
}

export function deleteTrackFromGallery(id: string): GeneratedMusicTrack[] {
  try {
    const current = loadMusicGallery();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete track from gallery:', e);
    return [];
  }
}

export function downloadWavTrack(track: GeneratedMusicTrack): void {
  try {
    const cleanBase64 = track.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_techtut.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    console.error('Failed to download track:', e);
  }
}
