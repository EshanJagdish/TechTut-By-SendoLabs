// TechTut by SendoLabs - Dreamy Web Audio Ambient Synthesizer

export interface AudioLayerState {
  rain: boolean;
  chimes: boolean;
  binaural: boolean;
}

class DreamyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Pad synthesizer nodes
  private padOscillators: OscillatorNode[] = [];
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padInterval: any = null;

  // Rain noise nodes
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;

  // Binaural tone nodes
  private binauralLeft: OscillatorNode | null = null;
  private binauralRight: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;

  // Chime scheduler
  private chimeTimer: any = null;
  private chimeGain: GainNode | null = null;

  public isPlaying: boolean = false;
  public volume: number = 0.6;
  public currentTrackId: string = 'dreamy_starlight';
  public layers: AudioLayerState = {
    rain: false,
    chimes: true,
    binaural: false,
  };

  private listeners: ((state: { isPlaying: boolean; volume: number; layers: AudioLayerState; currentTrackId: string }) => void)[] = [];

  private ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(fn: any) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn({
      isPlaying: this.isPlaying,
      volume: this.volume,
      layers: { ...this.layers },
      currentTrackId: this.currentTrackId,
    }));
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // Chords for different dreamy themes (frequencies in Hz)
  private getChordForTrack(trackId: string, step: number): number[] {
    switch (trackId) {
      case 'calm_focus':
        // Soft Rhodes progression: Dmaj7 -> F#m7 -> Gmaj7 -> A6
        const calmChords = [
          [146.83, 220.00, 277.18, 329.63, 440.00], // D3, A3, C#4, E4, A4
          [185.00, 220.00, 277.18, 329.63, 440.00], // F#3, A3, C#4, E4, A4
          [196.00, 246.94, 293.66, 369.99, 440.00], // G3, B3, D4, F#4, A4
          [220.00, 277.18, 329.63, 369.99, 440.00], // A3, C#4, E4, F#4, A4
        ];
        return calmChords[step % calmChords.length];

      case 'midnight_river':
        // Deep meditative chord: Bm9 -> Gmaj9 -> Em9 -> F#7sus
        const riverChords = [
          [123.47, 185.00, 220.00, 277.18, 329.63], // B2, F#3, A3, C#4, E4
          [98.00, 146.83, 196.00, 246.94, 293.66],  // G2, D3, G3, B3, D4
          [82.41, 123.47, 164.81, 196.00, 246.94],  // E2, B2, E3, G3, B3
          [92.50, 138.59, 185.00, 220.00, 277.18],  // F#2, C#3, F#3, A3, C#4
        ];
        return riverChords[step % riverChords.length];

      case 'celestial_lofi':
        // Warm jazz-hop chords
        const lofiChords = [
          [130.81, 196.00, 246.94, 311.13, 392.00], // C3, G3, B3, Eb4, G4
          [146.83, 220.00, 261.63, 329.63, 440.00], // D3, A3, C4, E4, A4
          [110.00, 164.81, 220.00, 261.63, 329.63], // A2, E3, A3, C4, E4
          [123.47, 185.00, 246.94, 293.66, 369.99], // B2, F#3, B3, D4, F#4
        ];
        return lofiChords[step % lofiChords.length];

      case 'deep_nebula':
        // Warm drone chord
        const nebulaChords = [
          [110.00, 164.81, 220.00, 277.18, 329.63], // A2, E3, A3, C#4, E4
          [110.00, 146.83, 220.00, 293.66, 369.99], // A2, D3, A3, D4, F#4
        ];
        return nebulaChords[step % nebulaChords.length];

      case 'dreamy_starlight':
      default:
        // Ethereal Starlight chords in F# minor / A major
        const starlightChords = [
          [146.83, 220.00, 277.18, 329.63, 440.00], // Dmaj9 (D3, A3, C#4, E4, A4)
          [185.00, 220.00, 277.18, 329.63, 554.37], // F#m9 (F#3, A3, C#4, E4, C#5)
          [164.81, 220.00, 246.94, 329.63, 493.88], // E6/9 (E3, A3, B3, E4, B4)
          [123.47, 185.00, 220.00, 277.18, 440.00], // Bm7 (B2, F#3, A3, C#4, A4)
        ];
        return starlightChords[step % starlightChords.length];
    }
  }

  // Play a dreamy pad progression
  private startPad() {
    if (!this.ctx || !this.masterGain) return;

    this.stopPad();

    let step = 0;

    const playChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;

      const freqs = this.getChordForTrack(this.currentTrackId, step++);
      const now = this.ctx.currentTime;
      const duration = 6.0;

      // Filter for warm celestial roundness
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);

      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.001, now);
      chordGain.gain.linearRampToValueAtTime(0.28, now + 1.8);
      chordGain.gain.setValueAtTime(0.28, now + duration - 2.0);
      chordGain.gain.linearRampToValueAtTime(0.001, now + duration);

      filter.connect(chordGain);
      chordGain.connect(this.masterGain);

      freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        // Gentle detuning for lush shimmer
        const detune = (i - 2) * 4;
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        osc.connect(filter);
        osc.start(now);
        osc.stop(now + duration + 0.1);
        this.padOscillators.push(osc);
      });

      // Cleanup old stopped oscillators
      setTimeout(() => {
        this.padOscillators = this.padOscillators.filter(o => {
          try {
            return (o as any).playbackState !== 3; // FINISHED_STATE
          } catch {
            return false;
          }
        });
      }, (duration + 0.5) * 1000);
    };

    playChord();
    this.padInterval = setInterval(() => {
      if (this.isPlaying) {
        playChord();
      }
    }, 5500);
  }

  private stopPad() {
    if (this.padInterval) {
      clearInterval(this.padInterval);
      this.padInterval = null;
    }
    this.padOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.padOscillators = [];
  }

  // Pentatonic celestial chimes
  private scheduleChime() {
    if (!this.ctx || !this.masterGain || !this.isPlaying || !this.layers.chimes) return;

    // Pentatonic scale frequencies in Hz (A major / F# minor pentatonic)
    const chimeNotes = [554.37, 659.25, 739.99, 880.00, 987.77, 1108.73, 1318.51];
    const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, now);

    // Bell-like envelope
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.3);

    // Schedule next chime with gentle random organic timing
    const nextInterval = 2500 + Math.random() * 4000;
    this.chimeTimer = setTimeout(() => {
      this.scheduleChime();
    }, nextInterval);
  }

  private stopChimes() {
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
  }

  // Soft procedural rain noise
  private startRain() {
    if (!this.ctx || !this.masterGain || this.rainNode) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Pink noise formula for calm rainfall
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.rainNode = whiteNoise;
  }

  private stopRain() {
    if (this.rainNode) {
      try {
        (this.rainNode as AudioBufferSourceNode).stop();
        this.rainNode.disconnect();
      } catch (e) {}
      this.rainNode = null;
    }
  }

  // 40Hz focus binaural beat
  private startBinaural() {
    if (!this.ctx || !this.masterGain || this.binauralLeft) return;

    const merger = this.ctx.createChannelMerger(2);
    this.binauralGain = this.ctx.createGain();
    this.binauralGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    // Base tone 200 Hz on left, 240 Hz on right -> 40Hz Gamma Focus
    this.binauralLeft = this.ctx.createOscillator();
    this.binauralRight = this.ctx.createOscillator();

    this.binauralLeft.type = 'sine';
    this.binauralRight.type = 'sine';

    this.binauralLeft.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.binauralRight.frequency.setValueAtTime(240, this.ctx.currentTime);

    this.binauralLeft.connect(merger, 0, 0);
    this.binauralRight.connect(merger, 0, 1);

    merger.connect(this.binauralGain);
    this.binauralGain.connect(this.masterGain);

    this.binauralLeft.start();
    this.binauralRight.start();
  }

  private stopBinaural() {
    if (this.binauralLeft) {
      try {
        this.binauralLeft.stop();
        this.binauralRight?.stop();
        this.binauralLeft.disconnect();
        this.binauralRight?.disconnect();
      } catch (e) {}
      this.binauralLeft = null;
      this.binauralRight = null;
    }
  }

  public play() {
    this.ensureContext();
    this.isPlaying = true;
    this.startPad();

    if (this.layers.chimes) this.scheduleChime();
    if (this.layers.rain) this.startRain();
    if (this.layers.binaural) this.startBinaural();

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.stopPad();
    this.stopChimes();
    this.stopRain();
    this.stopBinaural();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setTrack(trackId: string) {
    this.currentTrackId = trackId;
    if (this.isPlaying) {
      this.startPad();
    }
    this.notify();
  }

  public toggleLayer(layer: keyof AudioLayerState) {
    this.layers[layer] = !this.layers[layer];
    if (this.isPlaying) {
      if (layer === 'rain') {
        this.layers.rain ? this.startRain() : this.stopRain();
      } else if (layer === 'chimes') {
        this.layers.chimes ? this.scheduleChime() : this.stopChimes();
      } else if (layer === 'binaural') {
        this.layers.binaural ? this.startBinaural() : this.stopBinaural();
      }
    }
    this.notify();
  }
}

export const dreamyAudio = new DreamyAudioEngine();
