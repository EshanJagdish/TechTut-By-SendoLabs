/**
 * TechTut Web Audio Anti-Cheat Siren
 * Synthesizes an unmistakable 2-second alert siren when fullscreen is exited
 * or when a candidate switches browser tabs.
 */
export function playViolationAlarmSound(durationSeconds: number = 2.0): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Create oscillator and gain envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sawtooth creates an attention-grabbing alarm timbre
    osc.type = 'sawtooth';

    // 2-second alternating siren frequency sweep (between 880Hz and 587Hz)
    const cycles = 5;
    const stepDuration = durationSeconds / (cycles * 2);

    for (let i = 0; i < cycles * 2; i++) {
      const time = now + i * stepDuration;
      const freq = i % 2 === 0 ? 880 : 587.33;
      osc.frequency.setValueAtTime(freq, time);
    }

    // Volume ramp: starts crisp, stays audible, smoothly decays at end
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + durationSeconds - 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);

    // Clean up audio context
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (durationSeconds + 0.5) * 1000);
  } catch (err) {
    console.warn('AudioContext alert could not play:', err);
  }
}
