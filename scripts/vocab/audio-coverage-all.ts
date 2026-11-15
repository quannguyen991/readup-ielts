/**
 * Đo độ phủ phát âm của MỌI nguồn từ vựng tiếng Anh trong app (không chỉ 50 chủ đề IELTS).
 *   npx tsx scripts/vocab/audio-coverage-all.ts [--write tmp-art/vocab-missing-audio.json]
 * Một mục "có phát âm" khi có clip trong kho từ HOẶC kho câu của Aoede, hoặc (dự phòng) của Sarah.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const audio = path.join(ROOT, 'public/audio');
const key = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/[’‘]/g, "'").toLowerCase();
function idx(rel: string): Set<string> {
  try {
    const dir = path.join(audio, rel);
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')) as Record<string, string>;
    return new Set(Object.entries(j).filter(([, f]) => fs.existsSync(path.join(dir, f))).map(([k]) => key(k)));
  } catch { return new Set(); }
}
const aoede = new Set([...idx('words/aoede'), ...idx('lines/aoede')]);
const sarah = new Set([...idx('words/sarah'), ...idx('lines/sarah')]);

const sources = new Map<string, Set<string>>();
const add = (src: string, w: unknown) => {
  if (typeof w !== 'string') return;
  const k = key(w);
  if (!k || k.length > 60 || /[^\x20-\x7e’‘]/.test(k) || !/[a-z]/.test(k)) return;
  if (!sources.has(src)) sources.set(src, new Set());
  sources.get(src)!.add(k);
};
const WORD_KEYS = new Set(['word', 'term', 'headword', 'en', 'english']);
function walk(src: string, o: unknown, depth = 0) {
  if (depth > 8 || o == null) return;
  if (Array.isArray(o)) { for (const x of o) walk(src, x, depth + 1); return; }
  if (typeof o === 'object') {
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (WORD_KEYS.has(k) && typeof v === 'string') add(src, v);
      else walk(src, v, depth + 1);
    }
  }
}
function scanJson(src: string, rel: string) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return;
  const files = fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => f.endsWith('.json')).map((f) => path.join(p, f)) : [p];
  for (const f of files) { try { walk(src, JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { /* bỏ qua */ } }
}
for (const [src, rel] of [
  ['topics', 'src/data/seed/vocab-topics'], ['cefr', 'src/data/seed/vocab-cefr'], ['for-ielts', 'src/data/seed/vocab-for-ielts'],
  ['for-ielts-adv', 'src/data/seed/vocab-for-ielts-advanced'], ['global-success', 'src/data/seed/vocab-global-success'],
  ['listening', 'src/data/seed/vocab-listening'], ['book-vocab', 'src/data/book-vocab.json'], ['exam', 'src/data/exam-vocabulary.json'],
  ['common', 'src/data/common-words.json'],
] as const) scanJson(src, rel);

void (async () => {
  try {
    const ox = await import('../../src/data/oxford-topics-decks');
    for (const d of ox.OXFORD_TOPIC_DECKS as { words: { word: string }[] }[]) for (const w of d.words) add('oxford', w.word);
  } catch (e) { console.log('oxford: bỏ qua —', (e as Error).message.slice(0, 80)); }
  const oxDir = path.join(ROOT, 'src/data/oxford');
  if (fs.existsSync(oxDir)) for (const f of fs.readdirSync(oxDir)) {
    if (f.endsWith('.json')) scanJson('oxford', `src/data/oxford/${f}`);
    else if (f.endsWith('.ts')) for (const m of fs.readFileSync(path.join(oxDir, f), 'utf8').matchAll(/\bword:\s*['"]([^'"]+)['"]/g)) add('oxford', m[1]);
  }
  let total = 0, miss = 0, missSarah = 0;
  const all = new Set<string>(); const missing = new Map<string, string>();
  console.log('nguồn'.padEnd(16), 'tổng'.padStart(7), 'Aoede'.padStart(7), 'thiếu'.padStart(7), 'còn thiếu sau Sarah'.padStart(22));
  for (const [src, set] of sources) {
    const m = [...set].filter((w) => !aoede.has(w));
    const m2 = m.filter((w) => !sarah.has(w));
    console.log(src.padEnd(16), String(set.size).padStart(7), String(set.size - m.length).padStart(7), String(m.length).padStart(7), String(m2.length).padStart(22));
    for (const w of set) all.add(w);
    for (const w of m) if (!missing.has(w)) missing.set(w, src);
  }
  total = all.size; miss = missing.size; missSarah = [...missing.keys()].filter((w) => !sarah.has(w)).length;
  console.log(`\nTỔNG khác nhau: ${total}; có Aoede: ${total - miss}; thiếu: ${miss}; thiếu cả Sarah: ${missSarah}`);
  const arg = process.argv.indexOf('--write');
  if (arg > 0) { fs.writeFileSync(path.resolve(ROOT, process.argv[arg + 1]!), JSON.stringify([...missing.keys()].sort(), null, 1)); console.log('đã ghi', process.argv[arg + 1]); }
})();
