/**
 * Đo độ phủ ÂM THANH của từ vựng bộ chủ đề: bao nhiêu từ có clip giọng Gemini (Aoede) trong public/audio/words,
 * bao nhiêu phải lùi về bản ghi âm gstatic (đoán URL) hoặc giọng máy.
 *   npx tsx scripts/vocab/audio-coverage.ts [--probe 60]   (--probe: thử HTTP thật N từ ngẫu nhiên trên gstatic)
 */
import fs from 'node:fs';
import path from 'node:path';

import { VOCAB_TOPICS } from '../../src/data/vocab-topics';
import pronunciationVoice from '../../src/data/pronunciation-voice.json';

const root = path.resolve(__dirname, '../../public/audio/words');
const load = (v: string) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, v, 'index.json'), 'utf8')) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
};
const norm = (s: string) => s.trim().toLowerCase();
const defaultIndex = load(pronunciationVoice.id);
const defaultClips = new Set(Object.entries(defaultIndex)
  .filter(([, file]) => fs.existsSync(path.join(root, pronunciationVoice.id, file)))
  .map(([word]) => norm(word)));

const all = new Map<string, string>();
for (const t of VOCAB_TOPICS) for (const w of t.words) all.set(norm(w.word), t.slug);
const words = [...all.keys()];
const single = words.filter((w) => /^[a-z'-]+$/.test(w));
const inDefault = words.filter((w) => defaultClips.has(w)).length;
console.log(`tổng từ/cụm khác nhau: ${words.length} (từ đơn: ${single.length}, cụm nhiều chữ: ${words.length - single.length})`);
console.log(`giọng mặc định ${pronunciationVoice.name}: ${inDefault}/${words.length} = ${((inDefault / words.length) * 100).toFixed(1)}%`);

const arg = process.argv.indexOf('--probe');
if (arg > 0) {
  const n = Number(process.argv[arg + 1] ?? 60);
  const pool = single.filter((w) => !defaultClips.has(w));
  const pick = Array.from({ length: n }, (_, i) => pool[(i * 7919) % pool.length]!);
  void (async () => {
    let ok = 0;
    for (const w of pick) {
      try {
        const r = await fetch(`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${w}--_us_1.mp3`, { method: 'HEAD' });
        if (r.ok) ok += 1;
      } catch {
        /* mạng lỗi: tính là không có */
      }
    }
    console.log(`gstatic (từ đơn chưa có clip Aoede): ${ok}/${pick.length} có bản ghi âm = ${((ok / pick.length) * 100).toFixed(0)}%`);
  })();
}
