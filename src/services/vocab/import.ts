/**
 * "HỌC TỪ BÀI BẠN THÍCH" — dán một bài tiếng Anh bất kỳ (tin bóng đá, K-pop,
 * game…), lọc ra những từ ĐÁNG HỌC, mỗi từ lấy chính câu trong bài làm câu ví dụ.
 *
 * Không gọi mạng, không gọi AI. Nghĩa tra trong các kho có sẵn của app, theo
 * thứ tự tin cậy: 50 bộ chủ đề IELTS (có nghĩa, phiên âm, định nghĩa, cụm đi
 * kèm) → từ điển SAT Verbal → thuật ngữ SAT Math → từ điển song ngữ dựng sẵn.
 * Từ không tra được vẫn được đưa ra (người học tự điền nghĩa).
 *
 * "Đáng học" = không nằm trong 2.500 từ thông dụng nhất, dài từ 4 chữ cái, không
 * phải tên riêng (viết hoa giữa câu ở MỌI lần xuất hiện).
 */
import commonWords from '@/data/common-words.json';
import { SAT_RW_LEXICON } from '@/data/sat-rw-lexicon';
import { SAT_VOCAB_TERMS } from '@/data/sat-math-vocab';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { offlineGloss } from '@/services/dictionary/offline-glossary';
import type { StudyWord } from './topic-study';

const COMMON = new Set((commonWords as string[]).slice(0, 2500));

type Entry = { word: string; meaningVi: string; pos: string; ipa: string; definitionEn: string; collocation: string; source: ImportSource };
export type ImportSource = 'topic' | 'sat' | 'glossary';

let INDEX: Map<string, Entry> | null = null;
function index(): Map<string, Entry> {
  if (INDEX) return INDEX;
  const m = new Map<string, Entry>();
  for (const t of VOCAB_TOPICS) {
    for (const w of t.words) {
      const k = w.word.toLowerCase();
      if (!m.has(k)) m.set(k, { word: w.word, meaningVi: w.meaningVi, pos: w.pos, ipa: w.ipa, definitionEn: w.definitionEn, collocation: w.collocation, source: 'topic' });
    }
  }
  for (const [k, e] of Object.entries(SAT_RW_LEXICON)) {
    if (!m.has(k)) m.set(k, { word: k, meaningVi: e.meaningVi, pos: e.logic ? 'transition' : e.pos, ipa: '', definitionEn: e.definitionEn, collocation: '', source: 'sat' });
  }
  for (const t of SAT_VOCAB_TERMS) {
    const k = t.term.toLowerCase();
    if (!m.has(k)) m.set(k, { word: t.term, meaningVi: t.meaningVi, pos: '', ipa: '', definitionEn: t.definitionEn, collocation: '', source: 'sat' });
  }
  INDEX = m;
  return m;
}

/** Các dạng gốc có thể của một từ đã chia — thử lần lượt khi tra. */
export function baseForms(lower: string): string[] {
  const out = [lower];
  const push = (f: string) => {
    if (f.length >= 3 && !out.includes(f)) out.push(f);
  };
  if (lower.endsWith('ies')) push(`${lower.slice(0, -3)}y`);
  if (lower.endsWith('ied')) push(`${lower.slice(0, -3)}y`);
  if (lower.endsWith('es')) push(lower.slice(0, -2));
  if (lower.endsWith('s') && !lower.endsWith('ss')) push(lower.slice(0, -1));
  if (lower.endsWith('ed')) {
    push(lower.slice(0, -2));
    push(lower.slice(0, -1));
    if (/(.)\1ed$/.test(lower)) push(lower.slice(0, -3));
  }
  if (lower.endsWith('ing')) {
    push(lower.slice(0, -3));
    push(`${lower.slice(0, -3)}e`);
    if (/(.)\1ing$/.test(lower)) push(lower.slice(0, -4));
  }
  if (lower.endsWith('ly')) push(lower.slice(0, -2));
  return out;
}

export type ImportCandidate = {
  /** Dạng sẽ học (dạng gốc nếu tra được). */
  word: string;
  /** Dạng gặp trong bài lần đầu. */
  surface: string;
  count: number;
  /** Câu trong bài chứa từ, dùng làm câu ví dụ. */
  example: string;
  meaningVi: string | null;
  pos: string;
  ipa: string;
  definitionEn: string;
  collocation: string;
  source: ImportSource | null;
};

function resolve(lower: string): Entry | null {
  const idx = index();
  for (const f of baseForms(lower)) {
    const hit = idx.get(f);
    if (hit) return hit;
  }
  // Từ điển song ngữ giữ khoá theo ĐÚNG dạng trong bài ("buildings" → "các toà nhà").
  const g = offlineGloss(lower);
  if (g) return { word: g.word, meaningVi: g.meaningVi, pos: g.pos, ipa: '', definitionEn: '', collocation: '', source: 'glossary' };
  return null;
}

/** Cắt câu dài quanh vị trí của từ, để câu ví dụ gọn trên thẻ. */
function trimAround(sentence: string, at: number, max = 220): string {
  const s = sentence.trim();
  if (s.length <= max) return s;
  const start = Math.max(0, at - Math.floor(max / 2));
  const cut = s.slice(start, start + max);
  return `${start > 0 ? '…' : ''}${cut.trim()}${start + max < s.length ? '…' : ''}`;
}

export function extractCandidates(text: string, max = 40): ImportCandidate[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+(?=["'“‘(]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  // properOnly: viết hoa GIỮA câu ở mọi lần gặp. allCaps: lần nào cũng viết hoa (kể cả đầu câu).
  type Acc = ImportCandidate & { properOnly: boolean; allCaps: boolean; key: string };
  const acc = new Map<string, Acc>();
  for (const sentence of sentences) {
    const re = /[A-Za-z][A-Za-z’'-]*[A-Za-z]/g;
    let m: RegExpExecArray | null;
    let first = true;
    while ((m = re.exec(sentence))) {
      const surface = m[0].replace(/’/g, "'");
      const lower = surface.toLowerCase();
      const capital = /^[A-Z]/.test(surface);
      const capitalMid = !first && capital;
      first = false;
      if (lower.length < 4 || lower.includes("'")) continue;
      if (baseForms(lower).some((f) => COMMON.has(f))) continue;
      const entry = resolve(lower);
      const key = entry ? entry.word.toLowerCase() : lower;
      const prev = acc.get(key);
      if (prev) {
        prev.count += 1;
        prev.properOnly = prev.properOnly && capitalMid;
        prev.allCaps = prev.allCaps && capital;
        continue;
      }
      acc.set(key, {
        key,
        word: entry?.word ?? lower,
        surface,
        count: 1,
        example: trimAround(sentence, m.index),
        meaningVi: entry?.meaningVi ?? null,
        pos: entry?.pos ?? '',
        ipa: entry?.ipa ?? '',
        definitionEn: entry?.definitionEn ?? '',
        collocation: entry?.collocation ?? '',
        source: entry?.source ?? null,
        properOnly: capitalMid,
        allCaps: capital,
      });
    }
  }
  return [...acc.values()]
    // Tên riêng: viết hoa giữa câu ở mọi lần gặp, HOẶC lần nào cũng viết hoa mà
    // từ điển không có (tên người, CLB, địa danh đứng đầu câu).
    .filter((c) => !c.properOnly && !(c.allCaps && c.source === null))
    .sort(
      (a, b) =>
        Number(b.meaningVi !== null) - Number(a.meaningVi !== null) || b.count - a.count || b.word.length - a.word.length,
    )
    .slice(0, max)
    .map(({ key: _k, properOnly: _p, allCaps: _c, ...c }) => c);
}

export function candidateToStudyWord(c: ImportCandidate, meaningVi?: string): StudyWord {
  return {
    word: c.word,
    pos: c.pos,
    ipa: c.ipa,
    meaningVi: (meaningVi ?? c.meaningVi ?? '').trim(),
    definitionEn: c.definitionEn,
    example: c.example,
    collocation: c.collocation,
    band: 'Bài của bạn',
  };
}
