// Minimal Web Audio whistle engine for in-game playback.
// Pattern parameters mirror app/dev/sound/page.tsx but kept independent.

type W = { freq: number; dur: number; gap?: number; noise?: boolean };

function playWhistlePattern(notes: W[]) {
  if (typeof window === 'undefined') return;
  const AudioCtxClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return;

  const ctx = new AudioCtxClass();
  let t = ctx.currentTime + 0.04;

  for (const note of notes) {
    const vol = 0.42;
    const attack = 0.015;
    const holdEnd = t + note.dur * 0.72;
    const end = t + note.dur;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    lfo.frequency.value = 11;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.setValueAtTime(vol, holdEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    lfo.start(t);
    osc.stop(end + 0.05);
    lfo.stop(end + 0.05);

    if (note.noise) {
      const bufSize = Math.ceil(ctx.sampleRate * (note.dur + 0.05));
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buf;
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 2200;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, t);
      nGain.gain.exponentialRampToValueAtTime(0.03, t + attack);
      nGain.gain.setValueAtTime(0.03, holdEnd);
      nGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noiseNode.connect(hpf);
      hpf.connect(nGain);
      nGain.connect(ctx.destination);
      noiseNode.start(t);
      noiseNode.stop(end + 0.05);
    }

    t += note.dur + (note.gap ?? 0.05);
  }
}

// #21 full_time_double_long — used when match timer runs out
export function playFullTimeWhistle() {
  playWhistlePattern([
    { freq: 3000, dur: 0.53, gap: 0.45, noise: true },
    { freq: 3000, dur: 0.53, noise: true },
  ]);
}
