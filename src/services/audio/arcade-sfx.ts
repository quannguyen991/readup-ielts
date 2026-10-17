import { engine, noise, tone } from './sfx';

/** Short, synthesized gameplay cues. They share the app's volume and mute switch. */
export type ArcadeCue = 'cast' | 'bite' | 'reel' | 'strike' | 'forge' | 'impact' | 'guard' | 'loot' | 'dig' | 'trap' | 'win';

const lastPlayed = new Map<ArcadeCue, number>();

export function playArcadeCue(cue: ArcadeCue): void {
  const now = Date.now();
  if (now - (lastPlayed.get(cue) ?? 0) < 110) return;
  lastPlayed.set(cue, now);
  const e = engine();
  if (!e) return;

  switch (cue) {
    case 'cast':
      noise(e, { dur: 0.22, gain: 0.035, hz: 850, to: 260, q: 0.75 });
      tone(e, 520, { at: 0.04, dur: 0.16, gain: 0.045, type: 'triangle', to: 320 });
      break;
    case 'bite':
      tone(e, 660, { dur: 0.1, gain: 0.055, type: 'triangle', to: 880 });
      tone(e, 990, { at: 0.09, dur: 0.16, gain: 0.05, type: 'triangle', to: 1320 });
      break;
    case 'reel':
      noise(e, { dur: 0.18, gain: 0.03, hz: 350, to: 1250, q: 1.1 });
      tone(e, 390, { dur: 0.24, gain: 0.05, type: 'sawtooth', to: 690 });
      break;
    case 'strike':
      noise(e, { dur: 0.12, gain: 0.045, hz: 1900, to: 420, q: 0.8 });
      tone(e, 720, { at: 0.02, dur: 0.13, gain: 0.04, type: 'triangle', to: 280 });
      break;
    case 'forge':
      noise(e, { dur: 0.2, gain: 0.05, hz: 1250, to: 300, q: 1.3 });
      tone(e, 310, { at: 0.02, dur: 0.22, gain: 0.055, type: 'triangle', to: 145 });
      tone(e, 930, { at: 0.1, dur: 0.18, gain: 0.035, type: 'sine', to: 670 });
      break;
    case 'impact':
      noise(e, { dur: 0.17, gain: 0.055, hz: 250, to: 90, q: 1.4 });
      tone(e, 190, { dur: 0.16, gain: 0.065, type: 'square', to: 95 });
      break;
    case 'guard':
      tone(e, 440, { dur: 0.13, gain: 0.04, type: 'sine', to: 720 });
      tone(e, 880, { at: 0.06, dur: 0.22, gain: 0.035, type: 'sine', to: 660 });
      break;
    case 'loot':
      [659.25, 830.61, 1046.5].forEach((hz, i) => tone(e, hz, { at: i * 0.065, dur: 0.21, gain: 0.045, type: 'triangle' }));
      break;
    case 'dig':
      noise(e, { dur: 0.16, gain: 0.045, hz: 620, to: 160, q: 1.6 });
      tone(e, 170, { at: 0.09, dur: 0.13, gain: 0.045, type: 'triangle', to: 110 });
      break;
    case 'trap':
      tone(e, 260, { dur: 0.18, gain: 0.065, type: 'sawtooth', to: 115 });
      noise(e, { at: 0.05, dur: 0.12, gain: 0.035, hz: 450, to: 170, q: 1.2 });
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => tone(e, hz, { at: i * 0.09, dur: 0.3, gain: 0.05, type: 'triangle' }));
      break;
  }
}
