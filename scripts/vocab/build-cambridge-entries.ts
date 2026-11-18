/**
 * Dựng `src/data/seed/vocab-cambridge/entries.json`: nghĩa, phiên âm, ví dụ cho từ khóa của Cambridge IELTS 10–21,
 * lấy từ MỌI kho từ đã có trong app (bộ chủ đề IELTS, Oxford, bộ bổ trợ, từ điển song ngữ…).
 * Chỉ nhận khớp NGUYÊN DẠNG: từ chia ("commissioned") không mượn nghĩa của gốc ("commission") vì phiên âm và câu ví dụ sẽ sai dạng.
 * Từ chưa có đủ nghĩa/ví dụ/phiên âm được ghi vào `tmp/cam-need-fill.json` để soạn bổ sung (xem `cam-fill.json`).
 *
 * Chạy: npx tsx scripts/vocab/build-cambridge-entries.ts
 */
import fs from 'node:fs';
import { VOCAB_TOPICS, GLOBAL_SUCCESS_DECKS, BOOK_VOCAB_DECKS } from '@/data/vocab-topics';
import { DESTINATION_DECKS } from '@/data/destination-vocab';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS } from '@/data/vocab-listening';
import { STUDY4_DECKS } from '@/data/study4-vocab';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { OXFORD_3000, OXFORD_ADVANCED, OXFORD_EXTRA } from '@/data/oxford';

type Entry = { pos?: string; ipa?: string; meaningVi?: string; definitionEn?: string; example?: string; synonyms?: string[]; collocation?: string };
const pool = new Map<string, Entry>();
const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const score = (e: Entry) => (e.meaningVi ? 8 : 0) + (e.example ? 4 : 0) + (e.ipa ? 2 : 0) + (e.definitionEn ? 1 : 0);
function put(word: string, e: Entry) {
  const k = norm(word);
  const cur = pool.get(k);
  if (!cur || score(e) > score(cur)) pool.set(k, e);
  else if (cur) {
    // Giữ bản tốt nhất nhưng bù trường còn trống từ bản khác.
    for (const f of ['pos', 'ipa', 'definitionEn', 'example', 'collocation'] as const) if (!cur[f] && e[f]) cur[f] = e[f];
    if (!cur.synonyms?.length && e.synonyms?.length) cur.synonyms = e.synonyms;
  }
}
const take = (decks: readonly any[]) => { for (const d of decks) for (const w of d.words ?? []) put(w.word, w); };
take(VOCAB_TOPICS); take(BOOK_VOCAB_DECKS); take(GLOBAL_SUCCESS_DECKS); take(DESTINATION_DECKS);
take(VFI_DECKS); take(VFIA_DECKS); take(LISTENING_DECKS); take(STUDY4_DECKS); take(SAT_VOCAB_LESSONS as any);
for (const o of [...OXFORD_3000, ...OXFORD_ADVANCED, ...OXFORD_EXTRA] as any[]) put(o.word, { pos: o.pos, meaningVi: o.meaningVi, example: o.example });
const rich = JSON.parse(fs.readFileSync('content/bilingual-rich-dictionary.json', 'utf8')) as Record<string, any[]>;
for (const [w, v] of Object.entries(rich)) put(w, { ipa: v[0], pos: v[1], definitionEn: v[2], meaningVi: v[3], example: v[4], synonyms: v[5] });

const cam = JSON.parse(fs.readFileSync('src/data/seed/vocab-cambridge/index.json', 'utf8'));
const uniq = new Set<string>();
for (const b of cam.books) for (const p of b.passages) for (const w of p.words) uniq.add(norm(w));

const filled = fs.existsSync('src/data/seed/vocab-cambridge/cam-fill.json')
  ? (JSON.parse(fs.readFileSync('src/data/seed/vocab-cambridge/cam-fill.json', 'utf8')) as Record<string, Entry>)
  : {};

const out: Record<string, (string | string[])[]> = {};
const needMeaning: string[] = [];
const needExtras: string[] = [];
for (const w of uniq) {
  const hit = pool.get(w) ?? pool.get(w.replace(/-/g, ' ')) ?? pool.get(w.replace(/\s+/g, '-'));
  const fill = filled[w];
  const e: Entry = { ...(hit ?? {}), ...Object.fromEntries(Object.entries(fill ?? {}).filter(([, v]) => v)) };
  if (!e.meaningVi) { needMeaning.push(w); continue; }
  if (!e.example || !e.ipa) needExtras.push(w);
  out[w] = [e.ipa ?? '', e.pos ?? '', e.definitionEn ?? '', e.meaningVi, e.example ?? '', e.synonyms ?? [], e.collocation ?? ''];
}
fs.writeFileSync('src/data/seed/vocab-cambridge/entries.json', JSON.stringify(out));
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/cam-need-fill.json', JSON.stringify({ needMeaning, needExtras }));
console.log({ unique: uniq.size, withMeaning: Object.keys(out).length, needMeaning: needMeaning.length, needExtras: needExtras.length });
