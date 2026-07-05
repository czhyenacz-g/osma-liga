import { IN_MATCH_SOUNDS, IN_MATCH_LOOPS, IN_MATCH_POOLS, IN_MATCH_BEDS } from './inMatchSoundConfig';
import type { InMatchSoundKey, InMatchLoopKey, InMatchPoolKey, InMatchBedKey } from './inMatchSoundConfig';

// Malý audio helper pro zvuky BĚHEM zápasu (kop, bounce, přepnutí hráče, crowd
// pressure, ...) — oddělený od lib/audio/whistleEngine.ts, který řeší
// syntetizované písknutí rozhodčího/gól/konec zápasu. Žádný z nich druhý nenahrazuje.
//
// Pravidlo: chybějící nebo nenačtený zvukový soubor nikdy nesmí shodit hru ani
// zahltit konzoli — v dev módu se každý chybějící klíč zaloguje jednou jako
// warning, v produkci potichu.
export interface InMatchAudio {
  /** Zavolej v handleru user gesture (klik/tap/klávesa) — jinak play/startLoop nic neudělají. */
  unlock: () => void;
  isUnlocked: () => boolean;
  play: (key: InMatchSoundKey) => void;
  /**
   * Plays a random variant from a sound pool (e.g. crowd reactions) — picks a
   * random file, avoids repeating the previous pick back-to-back when the
   * pool has more than one variant, and is gated by a (per-call overridable)
   * cooldown. Missing/empty pool or unplayable file never throws.
   */
  playRandomFromPool: (key: InMatchPoolKey, options?: { volume?: number; cooldownMs?: number }) => void;
  startLoop: (key: InMatchLoopKey, volume?: number) => void;
  stopLoop: (key: InMatchLoopKey, fadeMs?: number) => void;
  setLoopVolume: (key: InMatchLoopKey, volume: number) => void;
  /**
   * Starts a long "pressure bed" from a random file in the bed's pool (never
   * repeating the previous pick back-to-back when it has more than one
   * variant) — a no-op if that bed is already playing, so it never runs two
   * long files in parallel. Missing/empty pool or unplayable file never throws.
   */
  startRandomBedFromPool: (key: InMatchBedKey, options?: { volume?: number; loop?: boolean }) => void;
  /** Instantly sets a running bed's volume (cancels any in-progress fade). */
  setBedVolume: (key: InMatchBedKey, volume: number) => void;
  /** Smoothly ramps a running bed's volume to the target over fadeMs. */
  fadeBedTo: (key: InMatchBedKey, volume: number, fadeMs: number) => void;
  /** Fades a bed out (if fadeMs given) then pauses and resets it; a no-op if not currently playing. */
  stopBed: (key: InMatchBedKey, options?: { fadeMs?: number }) => void;
  stopAll: () => void;
}

export function createInMatchAudio(): InMatchAudio {
  let unlocked = false;
  const cooldownUntil = new Map<InMatchSoundKey, number>();
  const loopElements = new Map<InMatchLoopKey, HTMLAudioElement>();
  const fadeFrames = new Map<InMatchLoopKey, number>();
  const warnedKeys = new Set<string>();
  const poolCooldownUntil = new Map<InMatchPoolKey, number>();
  const poolLastIndex = new Map<InMatchPoolKey, number>();
  const bedElements = new Map<InMatchBedKey, HTMLAudioElement>();
  const bedLastIndex = new Map<InMatchBedKey, number>();
  const bedFadeFrames = new Map<InMatchBedKey, number>();

  function pickIndexAvoidingRepeat(lastIndex: number | undefined, length: number): number {
    if (length <= 1) return 0;
    let index = Math.floor(Math.random() * length);
    if (index === lastIndex) index = (index + 1) % length;
    return index;
  }

  function cancelBedFade(key: InMatchBedKey): void {
    const frame = bedFadeFrames.get(key);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      bedFadeFrames.delete(key);
    }
  }

  function warnOnce(key: string, err: unknown): void {
    if (process.env.NODE_ENV === 'production') return;
    if (warnedKeys.has(key)) return;
    warnedKeys.add(key);
    // eslint-disable-next-line no-console
    console.warn(`[inMatchAudio] "${key}" se nepodařilo přehrát (chybějící/nepodporovaný soubor?)`, err);
  }

  function getOrCreateLoopElement(key: InMatchLoopKey): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    let el = loopElements.get(key);
    if (!el) {
      const config = IN_MATCH_LOOPS[key];
      el = new Audio(config.src);
      el.loop = true;
      el.preload = 'auto';
      el.volume = config.volume;
      loopElements.set(key, el);
    }
    return el;
  }

  function cancelFade(key: InMatchLoopKey): void {
    const frame = fadeFrames.get(key);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      fadeFrames.delete(key);
    }
  }

  return {
    unlock() {
      unlocked = true;
    },

    isUnlocked() {
      return unlocked;
    },

    play(key) {
      if (!unlocked || typeof window === 'undefined') return;
      const now = performance.now();
      const config = IN_MATCH_SOUNDS[key];
      if (now < (cooldownUntil.get(key) ?? 0)) return;
      cooldownUntil.set(key, now + config.cooldownMs);

      try {
        const el = new Audio(config.src);
        el.volume = config.volume;
        void el.play().catch((err) => warnOnce(key, err));
      } catch (err) {
        warnOnce(key, err);
      }
    },

    playRandomFromPool(key, options) {
      if (!unlocked || typeof window === 'undefined') return;
      const config = IN_MATCH_POOLS[key];
      if (!config || config.files.length === 0) return;

      const now = performance.now();
      const cooldownMs = options?.cooldownMs ?? config.cooldownMs;
      if (now < (poolCooldownUntil.get(key) ?? 0)) return;
      poolCooldownUntil.set(key, now + cooldownMs);

      const index = pickIndexAvoidingRepeat(poolLastIndex.get(key), config.files.length);
      poolLastIndex.set(key, index);

      const src = config.files[index];
      const volume = options?.volume ?? config.volume;

      try {
        const el = new Audio(src);
        el.volume = Math.max(0, Math.min(1, volume));
        void el.play().catch((err) => warnOnce(key, err));
      } catch (err) {
        warnOnce(key, err);
      }
    },

    startLoop(key, volume) {
      if (!unlocked || typeof window === 'undefined') return;
      const el = getOrCreateLoopElement(key);
      if (!el) return;
      cancelFade(key);
      if (volume !== undefined) el.volume = Math.max(0, Math.min(1, volume));
      if (!el.paused) return; // already running — never start a second parallel loop
      void el.play().catch((err) => warnOnce(key, err));
    },

    stopLoop(key, fadeMs = 0) {
      const el = loopElements.get(key);
      if (!el || el.paused) return;
      cancelFade(key);

      if (fadeMs <= 0) {
        el.pause();
        el.currentTime = 0;
        return;
      }

      const startVolume = el.volume;
      const startedAt = performance.now();
      const step = () => {
        const t = Math.min((performance.now() - startedAt) / fadeMs, 1);
        el.volume = startVolume * (1 - t);
        if (t < 1) {
          fadeFrames.set(key, requestAnimationFrame(step));
        } else {
          el.pause();
          el.currentTime = 0;
          el.volume = startVolume;
          fadeFrames.delete(key);
        }
      };
      fadeFrames.set(key, requestAnimationFrame(step));
    },

    setLoopVolume(key, volume) {
      const el = loopElements.get(key);
      if (!el) return;
      el.volume = Math.max(0, Math.min(1, volume));
    },

    startRandomBedFromPool(key, options) {
      if (!unlocked || typeof window === 'undefined') return;
      const config = IN_MATCH_BEDS[key];
      if (!config || config.files.length === 0) return;

      const existing = bedElements.get(key);
      if (existing && !existing.paused) return; // already running — never start a second parallel bed

      cancelBedFade(key);
      const index = pickIndexAvoidingRepeat(bedLastIndex.get(key), config.files.length);
      bedLastIndex.set(key, index);
      const volume = Math.max(0, Math.min(1, options?.volume ?? config.volume));

      try {
        let el = existing;
        if (!el) {
          el = new Audio(config.files[index]);
          el.preload = 'auto';
          bedElements.set(key, el);
        } else {
          el.src = config.files[index];
        }
        el.loop = options?.loop ?? true;
        el.volume = volume;
        void el.play().catch((err) => warnOnce(key, err));
      } catch (err) {
        warnOnce(key, err);
      }
    },

    setBedVolume(key, volume) {
      const el = bedElements.get(key);
      if (!el) return;
      cancelBedFade(key);
      el.volume = Math.max(0, Math.min(1, volume));
    },

    fadeBedTo(key, volume, fadeMs) {
      const el = bedElements.get(key);
      if (!el) return;
      cancelBedFade(key);
      const target = Math.max(0, Math.min(1, volume));

      if (fadeMs <= 0) {
        el.volume = target;
        return;
      }

      const startVolume = el.volume;
      const startedAt = performance.now();
      const step = () => {
        const t = Math.min((performance.now() - startedAt) / fadeMs, 1);
        el.volume = startVolume + (target - startVolume) * t;
        if (t < 1) {
          bedFadeFrames.set(key, requestAnimationFrame(step));
        } else {
          bedFadeFrames.delete(key);
        }
      };
      bedFadeFrames.set(key, requestAnimationFrame(step));
    },

    stopBed(key, options) {
      const el = bedElements.get(key);
      if (!el || el.paused) return;
      cancelBedFade(key);
      const fadeMs = options?.fadeMs ?? 0;

      if (fadeMs <= 0) {
        el.pause();
        el.currentTime = 0;
        return;
      }

      const startVolume = el.volume;
      const startedAt = performance.now();
      const step = () => {
        const t = Math.min((performance.now() - startedAt) / fadeMs, 1);
        el.volume = startVolume * (1 - t);
        if (t < 1) {
          bedFadeFrames.set(key, requestAnimationFrame(step));
        } else {
          el.pause();
          el.currentTime = 0;
          el.volume = startVolume;
          bedFadeFrames.delete(key);
        }
      };
      bedFadeFrames.set(key, requestAnimationFrame(step));
    },

    stopAll() {
      for (const key of loopElements.keys()) cancelFade(key as InMatchLoopKey);
      for (const el of loopElements.values()) {
        el.pause();
        el.currentTime = 0;
      }
      for (const key of bedElements.keys()) cancelBedFade(key as InMatchBedKey);
      for (const el of bedElements.values()) {
        el.pause();
        el.currentTime = 0;
      }
    },
  };
}

// Jedna sdílená instance pro zápasové audio — importuj přímo z komponent/RAF loopu.
export const inMatchAudio = createInMatchAudio();
