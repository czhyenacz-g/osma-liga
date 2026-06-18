import type { WhistleNote } from './types';
import { getSound } from './soundBank';

// ── WebAudio engine (legacy / comparison) ────────────────────────────────────

function playWebAudioPattern(notes: WhistleNote[]) {
  if (typeof window === 'undefined') return;
  const AudioCtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtxClass();
  let t = ctx.currentTime + 0.04;

  for (const w of notes) {
    const vol    = w.vol    ?? 0.42;
    const vDepth = w.vibrato ?? 30;
    const attack = 0.015;
    const holdEnd = t + w.dur * 0.72;
    const end = t + w.dur;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(w.freq, t);
    if (w.descend) {
      osc.frequency.exponentialRampToValueAtTime(w.freq * 0.82, end);
    }

    if (vDepth > 0) {
      const lfo      = ctx.createOscillator();
      const lfoGain  = ctx.createGain();
      lfo.frequency.value  = 11;
      lfoGain.gain.value   = vDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(end + 0.05);
    }

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.setValueAtTime(vol, holdEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(end + 0.05);

    if (w.noise) {
      const bufSize   = Math.ceil(ctx.sampleRate * (w.dur + 0.05));
      const buf       = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data      = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise     = ctx.createBufferSource();
      noise.buffer    = buf;
      const hpf       = ctx.createBiquadFilter();
      hpf.type        = 'highpass';
      hpf.frequency.value = 2200;
      const nGain     = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, t);
      nGain.gain.exponentialRampToValueAtTime(0.03, t + attack);
      nGain.gain.setValueAtTime(0.03, holdEnd);
      nGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noise.connect(hpf);
      hpf.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(end + 0.05);
    }

    t += w.dur + (w.gap ?? 0.05);
  }
}

// ── Tone.js engine ────────────────────────────────────────────────────────────

async function playTonePattern(notes: WhistleNote[], volumeDb = -7) {
  if (typeof window === 'undefined') return;
  const Tone = await import('tone');
  await Tone.start();

  const vibrato = new Tone.Vibrato(10, 0.12);
  const filter  = new Tone.Filter(2500, 'highpass');
  const vol     = new Tone.Volume(volumeDb);
  const synth   = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.015, decay: 0.04, sustain: 0.85, release: 0.15 },
  });

  synth.chain(vibrato, filter, vol, Tone.Destination);

  let now = Tone.now() + 0.04;
  let totalDur = 0;

  for (const note of notes) {
    const gap = note.gap ?? 0.05;
    if (note.descend) {
      synth.triggerAttack(note.freq, now);
      synth.frequency.setValueAtTime(note.freq, now);
      synth.frequency.exponentialRampToValueAtTime(note.freq * 0.75, now + note.dur);
      synth.triggerRelease(now + note.dur);
    } else {
      synth.triggerAttackRelease(note.freq, note.dur, now);
    }
    now += note.dur + gap;
    totalDur += note.dur + gap;
  }

  setTimeout(() => {
    synth.dispose();
    vibrato.dispose();
    filter.dispose();
    vol.dispose();
  }, (totalDur + 0.5) * 1000);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function unlockAudio(): Promise<void> {
  if (typeof window === 'undefined') return;
  const Tone = await import('tone');
  await Tone.start();
}

export async function playSound(key: string): Promise<void> {
  const def = getSound(key);
  if (!def) {
    console.warn(`[sound] unknown key: "${key}"`);
    return;
  }
  if (def.engine === 'tone') {
    await playTonePattern(def.notes, def.volDb ?? -7);
  } else {
    playWebAudioPattern(def.notes);
  }
}

// ── Game event wrappers ───────────────────────────────────────────────────────
// These are called from GameCanvas, useOnlineGame, OnlineGameClient.
// Fire-and-forget; callers do not need to await.

export function playKickoffWhistle(): void {
  void playSound('01-tone').catch(() => {});
}

export function playFullTimeWhistle(): void {
  void playSound('21-tone').catch(() => {});
}

// Goal sound — plays at the moment a goal is scored
export function playGoalSound(): void {
  void playSound('goal-tone').catch(() => {});
}

// Restart sound — plays when play resumes after a goal
export function playRestartSound(): void {
  void playSound('19-tone').catch(() => {});
}

// Legacy wrapper — kept for backward compatibility.
// Prefer playGoalSound() for goal events or a future playRestartSound() for restarts.
export function playGoalRestartWhistle(): void {
  playGoalSound();
}
