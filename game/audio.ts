let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/** Call inside a user-gesture handler so the browser unlocks audio. */
export function resumeAudio(): void {
  getCtx()?.resume().catch(() => {});
}

/**
 * Short referee whistle synthesised via Web Audio API.
 * ~280ms sine wave 2050→1900 Hz with fast attack/release envelope.
 */
export function playWhistle(): void {
  const ctx = getCtx();
  if (!ctx) return;

  // Attempt to resume in case still suspended after first interaction
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
    return; // will be played on the next triggered moment after context resumes
  }

  const now = ctx.currentTime;
  const dur = 0.28;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2050, now);
  osc.frequency.linearRampToValueAtTime(1900, now + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.21, now + 0.015);  // quick attack
  gain.gain.setValueAtTime(0.21, now + dur - 0.04);
  gain.gain.linearRampToValueAtTime(0, now + dur);        // quick release

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}
