import * as Speech from 'expo-speech';

/**
 * Đọc kịch bản Listening dạng "Tên: lời thoại" bằng giọng máy, mỗi người nói một cao độ.
 * Dùng giọng có sẵn của thiết bị nên không tốn hạn mức TTS; trả về hàm dừng.
 */
export type ScriptLine = { speaker: string; text: string };

export function parseScript(script: string): ScriptLine[] {
  return script
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^([A-Z][A-Za-z.' ]{0,24}):\s+(.*)$/.exec(l);
      return m ? { speaker: m[1] ?? 'Narrator', text: m[2] ?? '' } : { speaker: 'Narrator', text: l };
    });
}

const PITCHES = [1.0, 0.8, 1.25, 0.9, 1.15];

export function playScript(lines: ScriptLine[], opts: { rate?: number; onLine?: (i: number) => void; onDone?: () => void } = {}): () => void {
  const speakers: string[] = [];
  let stopped = false;
  const next = (i: number) => {
    if (stopped) return;
    if (i >= lines.length) { opts.onDone?.(); return; }
    const line = lines[i];
    if (!line) { next(i + 1); return; }
    const { speaker, text } = line;
    if (!speakers.includes(speaker)) speakers.push(speaker);
    opts.onLine?.(i);
    Speech.speak(text, {
      language: 'en-GB',
      rate: opts.rate ?? 0.92,
      pitch: speaker === 'Narrator' ? 1 : PITCHES[speakers.indexOf(speaker) % PITCHES.length],
      onDone: () => next(i + 1),
      onStopped: () => undefined,
      onError: () => next(i + 1),
    });
  };
  next(0);
  return () => { stopped = true; Speech.stop(); };
}
