import { IN_MATCH_SOUNDS, IN_MATCH_LOOPS } from './inMatchSoundConfig';
import type { InMatchSoundKey, InMatchLoopKey } from './inMatchSoundConfig';

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
  startLoop: (key: InMatchLoopKey, volume?: number) => void;
  stopLoop: (key: InMatchLoopKey, fadeMs?: number) => void;
  setLoopVolume: (key: InMatchLoopKey, volume: number) => void;
  stopAll: () => void;
}

export function createInMatchAudio(): InMatchAudio {
  let unlocked = false;
  const cooldownUntil = new Map<InMatchSoundKey, number>();
  const loopElements = new Map<InMatchLoopKey, HTMLAudioElement>();
  const fadeFrames = new Map<InMatchLoopKey, number>();
  const warnedKeys = new Set<string>();

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

    stopAll() {
      for (const key of loopElements.keys()) cancelFade(key as InMatchLoopKey);
      for (const el of loopElements.values()) {
        el.pause();
        el.currentTime = 0;
      }
    },
  };
}

// Jedna sdílená instance pro zápasové audio — importuj přímo z komponent/RAF loopu.
export const inMatchAudio = createInMatchAudio();
