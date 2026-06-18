export type SoundEngine = 'tone' | 'webaudio';

export type WhistleNote = {
  freq: number;
  dur: number;
  gap?: number;
  vol?: number;
  descend?: boolean;
  noise?: boolean;
  vibrato?: number;
};

export type SoundDefinition = {
  key: string;
  number: number;
  baseId: string;
  engine: SoundEngine;
  name: string;
  notes: WhistleNote[];
  volDb?: number;  // Tone.js only: override master volume (default −7 dB)
};
