import { synonymEntry, SYN_ENTRIES } from '@/data/sentence-synonyms';
import { analyzeSentence, type Chunk, type SentenceAnalysis } from './sentence-analyze';
import {
  PRONOUN_OBJECT,
  PRONOUN_SUBJECT,
  VERB_BASE,
  canLowerFirst,
  fromGerund,
  gerund,
  inflect,
  isAdjectiveLike,
  norm,
  pastParticiple,
  verbReadings,
  type VerbForm,
} from './lexicon';

/**
 * CÁCH DIỄN ĐẠT KHÁC bằng luật — viết lại một câu theo cấu trúc khác mà vẫn giữ
 * nghĩa. Mỗi luật chỉ chạy khi khuôn câu khớp RÕ và tự dựng câu mới từ chính
 * các mảnh của câu gốc, nên câu ra luôn đúng ngữ pháp theo khuôn (không "bịa").
 * Câu nào không luật nào áp được thì trả mảng rỗng — người dùng khi đó chỉ thấy
 * phần ghi chú soạn tay (nếu có), không bao giờ thấy câu viết lại sai.
 */

export type Rewrite = { en: string; label: string };
export type SynonymHit = { phrase: string; alts: string[]; vi: string };

const END = /[.!?]+["”’']?$/;

function splitEnd(text: string): { body: string; end: string } {
  const t = text.trim();
  const m = END.exec(t);
  return m ? { body: t.slice(0, m.index).trim(), end: m[0] } : { body: t, end: '.' };
}

function capFirst(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function lowerFirst(s: string): string {
  const first = s.split(' ')[0] ?? '';
  return canLowerFirst(first) ? s[0]!.toLowerCase() + s.slice(1) : s;
}

function stripComma(s: string): string {
  return s.replace(/[,;:]+$/, '').trim();
}

const SWAPPABLE = new Set(['because', 'although', 'though', 'when', 'while', 'if', 'before', 'after', 'since', 'unless', 'until', 'whereas']);

function swapClauseOrder(a: SentenceAnalysis, text: string): Rewrite | null {
  if (a.clauses.length !== 2) return null;
  const [c1, c2] = a.clauses as [SentenceAnalysis['clauses'][number], SentenceAnalysis['clauses'][number]];
  const { end } = splitEnd(text);
  // "Main conn Sub." → "Conn Sub, main."
  if (c1.kind === 'main' && c2.kind === 'subordinate' && SWAPPABLE.has((c2.connector ?? '').toLowerCase())) {
    if (c1.text.includes(',') && !/^[^,]+,$/.test(c1.text)) return null;
    const main = stripComma(c1.text);
    const sub = stripComma(c2.text).replace(END, '');
    if (!main || !sub) return null;
    return { en: `${capFirst(sub)}, ${lowerFirst(main)}${end}`, label: 'Đảo mệnh đề phụ lên đầu câu' };
  }
  // "Conn Sub, main." → "Main conn sub."
  if (c1.kind === 'subordinate' && SWAPPABLE.has((c1.connector ?? '').toLowerCase()) && c2.kind === 'main') {
    const sub = stripComma(c1.text);
    const main = stripComma(c2.text).replace(END, '');
    if (!main || !sub) return null;
    return { en: `${capFirst(main)} ${lowerFirst(sub)}${end}`, label: 'Đưa mệnh đề phụ xuống cuối câu' };
  }
  return null;
}

function butToAlthough(a: SentenceAnalysis, text: string): Rewrite | null {
  if (a.clauses.length !== 2) return null;
  const [c1, c2] = a.clauses as [SentenceAnalysis['clauses'][number], SentenceAnalysis['clauses'][number]];
  if (c2.kind !== 'coordinate' || (c2.connector ?? '').toLowerCase() !== 'but') return null;
  const { end } = splitEnd(text);
  const first = stripComma(c1.text);
  const second = c2.text.replace(/^but\s+/i, '').replace(END, '');
  if (!first || !second) return null;
  return { en: `Although ${lowerFirst(first)}, ${second}${end}`, label: 'Đổi "but" thành "although"' };
}

function soToBecause(a: SentenceAnalysis, text: string): Rewrite | null {
  if (a.clauses.length !== 2) return null;
  const [c1, c2] = a.clauses as [SentenceAnalysis['clauses'][number], SentenceAnalysis['clauses'][number]];
  if (c2.kind !== 'coordinate' || (c2.connector ?? '').toLowerCase() !== 'so') return null;
  const { end } = splitEnd(text);
  const cause = stripComma(c1.text);
  const result = c2.text.replace(/^so\s+/i, '').replace(END, '');
  if (!cause || !result) return null;
  return { en: `${capFirst(result)} because ${lowerFirst(cause)}${end}`, label: 'Đổi "so" thành "because" (đảo vế)' };
}

function extraposition(text: string): Rewrite | null {
  const { body, end } = splitEnd(text);
  let m = /^It (is|was|'s|would be|will be) ((?:[a-z]+ )?[a-z]+) to ([a-z]+) (.+)$/i.exec(body);
  if (m && !/^(for|of)\b/.test(m[2]!) && isAdjectiveLike(m[2]!.split(' ').pop()!)) {
    const be = m[1]!.toLowerCase() === "'s" ? 'is' : m[1]!.toLowerCase();
    return { en: `${capFirst(gerund(m[3]!.toLowerCase()))} ${m[4]} ${be} ${m[2]}${end}`, label: 'Dùng V-ing làm chủ ngữ' };
  }
  m = /^([A-Z][a-z]+ing) (.+?) (is|was) ((?:[a-z]+ )?[a-z]+)$/.exec(body);
  if (m) {
    const base = fromGerund(m[1]!.toLowerCase());
    if (base && isAdjectiveLike(m[4]!.split(' ').pop()!)) return { en: `It ${m[3]} ${m[4]} to ${base} ${m[2]}${end}`, label: 'Dùng chủ ngữ giả "It … to V"' };
  }
  return null;
}

const IRREGULAR_PLURAL = new Set(['people', 'children', 'men', 'women', 'police']);

function beFor(objectText: string, past: boolean): string {
  const head = (objectText.split(' ').pop() ?? '').toLowerCase();
  const plural = IRREGULAR_PLURAL.has(head) || (/s$/.test(head) && !/(ss|us|is)$/.test(head));
  if (past) return plural ? 'were' : 'was';
  return plural ? 'are' : 'is';
}

function toPassive(a: SentenceAnalysis, text: string): Rewrite | null {
  if (!a.trusted || a.clauses.length !== 1) return null;
  const c = a.clauses[0]!;
  const v = c.verb;
  if (!v || v.negative || v.passive || v.linking || !v.base || !VERB_BASE.has(v.base)) return null;
  if (v.tense !== 'present-simple' && v.tense !== 'past-simple') return null;
  const chunks = c.chunks;
  const si = chunks.findIndex((k) => k.role === 'subject');
  const vi = chunks.findIndex((k) => k.role === 'verb');
  const oi = chunks.findIndex((k) => k.role === 'object');
  if (si < 0 || vi < 0 || oi < 0 || !(si < vi && vi < oi)) return null;
  if (chunks.some((k) => k.role === 'indirect' || k.role === 'complement' || k.role === 'rest')) return null;
  const subj = chunks[si]!.text;
  const obj = chunks[oi]!.text;
  if (/^(to|that|how|what|whether)\b/i.test(obj) || /ing$/.test(obj.split(' ')[0]!)) return null;
  if (/\b(and|or)\b/i.test(obj) || /\b(and|or)\b/i.test(subj)) return null;
  if (/^(each other|myself|himself|herself|themselves|yourself|ourselves)$/i.test(obj)) return null;
  const subjLower = subj.toLowerCase();
  const agentWord = PRONOUN_SUBJECT.has(subjLower) ? PRONOUN_OBJECT[subjLower]! : lowerFirst(subj);
  if (/^(everyone|everybody|someone|somebody|people|they|we|you|one)$/i.test(subjLower)) return null;
  const objNew = capFirst(PRONOUN_OBJECT && Object.values(PRONOUN_OBJECT).includes(obj.toLowerCase()) ? ({ me: 'I', him: 'he', her: 'she', us: 'we', them: 'they', it: 'it', you: 'you' } as Record<string, string>)[obj.toLowerCase()] ?? obj : obj);
  const past = v.tense === 'past-simple';
  const be = Object.values(PRONOUN_OBJECT).includes(obj.toLowerCase()) ? (obj.toLowerCase() === 'me' ? (past ? 'was' : 'am') : past ? (/^(us|them|you)$/.test(obj.toLowerCase()) ? 'were' : 'was') : (/^(us|them|you)$/.test(obj.toLowerCase()) ? 'are' : 'is')) : beFor(obj, past);
  const pp = pastParticiple(v.base);
  const tail = chunks.filter((_, i) => i > oi).map((k: Chunk) => k.text).join(' ');
  const { end } = splitEnd(text);
  const adverbBefore = chunks.slice(0, si).map((k) => k.text);
  if (adverbBefore.length) return null;
  const out = `${objNew} ${be} ${pp} by ${agentWord}${tail ? ` ${tail}` : ''}${end}`;
  return { en: out.replace(/\s+/g, ' '), label: 'Đổi sang câu bị động' };
}

function frontAdverbial(a: SentenceAnalysis, text: string): Rewrite | null {
  if (!a.trusted || a.clauses.length !== 1) return null;
  const chunks = a.clauses[0]!.chunks;
  const last = chunks[chunks.length - 1];
  if (!last || (last.role !== 'time' && last.role !== 'place')) return null;
  if (chunks.length < 3 || chunks[0]!.role !== 'subject') return null;
  const { end } = splitEnd(text);
  const bodyChunks = chunks.slice(0, -1).map((k) => k.text).join(' ');
  return { en: `${capFirst(last.text)}, ${lowerFirst(bodyChunks)}${end}`, label: last.role === 'time' ? 'Đưa trạng ngữ thời gian lên đầu' : 'Đưa trạng ngữ nơi chốn lên đầu' };
}

// ------------------------------------------------------------ đồng nghĩa

function formOf(word: string, base: string): VerbForm | null {
  const r = verbReadings(word).find((x) => x.base === base);
  return r ? r.form : null;
}

/** Từ/cụm trong câu có thể thay bằng cách nói khác — dựa trên bảng tay, chia lại đúng dạng. */
export function findSynonyms(text: string, limit = 3): SynonymHit[] {
  const raw = text.trim().split(/\s+/);
  const words = raw.map((w) => norm(w));
  const hits: SynonymHit[] = [];
  const used = new Set<number>();
  for (let i = 0; i < words.length && hits.length < limit; i += 1) {
    if (used.has(i)) continue;
    for (const len of [3, 2, 1]) {
      if (i + len > words.length) continue;
      const slice = words.slice(i, i + len);
      const phrase = slice.join(' ');
      let entry = synonymEntry(phrase);
      let form: VerbForm | null = null;
      if (!entry && len <= 3) {
        // động từ chia: so gốc của từ đầu + phần còn lại
        const base = verbReadings(slice[0]!)[0]?.base;
        if (base) {
          const cand = synonymEntry([base, ...slice.slice(1)].join(' '));
          if (cand && cand.pos === 'v') {
            entry = cand;
            form = formOf(slice[0]!, base);
          }
        }
      }
      if (!entry) {
        // danh từ số nhiều đơn giản
        if (len === 1 && /s$/.test(phrase)) {
          const cand = synonymEntry(phrase.slice(0, -1));
          if (cand && cand.pos === 'n') {
            hits.push({ phrase: raw[i]!.replace(/[^\w'’-]+$/g, ''), alts: cand.alts.filter((x) => !/\s/.test(x)).map((x) => `${x}s`), vi: cand.vi });
            used.add(i);
            break;
          }
        }
        continue;
      }
      // Một mình "so", "but", "very"… dễ trùng nghĩa khác — chỉ nhận từ nội dung.
      if (len === 1 && ['so', 'but', 'because', 'also', 'many', 'most', 'very'].includes(entry.word) && false) continue;
      let alts = entry.alts;
      if (entry.pos === 'v') {
        const f = form ?? 'base';
        alts = alts
          .map((alt) => {
            const parts = alt.split(' ');
            const head = parts[0]!;
            if (f === 'base') return alt;
            if (!(VERB_BASE.has(head) && !['be', 'would'].includes(head))) return null;
            return [inflect(head, f), ...parts.slice(1)].join(' ');
          })
          .filter((x): x is string => !!x);
      }
      if (alts.length === 0) continue;
      const surface = raw.slice(i, i + len).join(' ').replace(/[^\w'’\s-]+$/g, '');
      hits.push({ phrase: surface, alts: alts.slice(0, 3), vi: entry.vi });
      for (let k = 0; k < len; k += 1) used.add(i + k);
      break;
    }
  }
  return hits;
}

function replaceSynonym(text: string, hit: SynonymHit): Rewrite | null {
  const alt = hit.alts[0];
  if (!alt) return null;
  const idx = text.indexOf(hit.phrase);
  if (idx < 0) return null;
  let rep = alt;
  if (/^[A-Z]/.test(hit.phrase)) rep = capFirst(rep);
  const out = text.slice(0, idx) + rep + text.slice(idx + hit.phrase.length);
  return { en: out, label: `Thay "${hit.phrase}" bằng "${alt}"` };
}

export function rewriteSentence(text: string, analysis?: SentenceAnalysis, max = 3): Rewrite[] {
  const a = analysis ?? analyzeSentence(text);
  const out: Rewrite[] = [];
  const push = (r: Rewrite | null) => {
    if (!r) return;
    const k = norm(r.en).replace(/[^a-z0-9 ]/g, '');
    if (k === norm(text).replace(/[^a-z0-9 ]/g, '')) return;
    if (out.some((x) => x.en === r.en)) return;
    out.push(r);
  };
  push(swapClauseOrder(a, text));
  push(butToAlthough(a, text));
  push(soToBecause(a, text));
  push(extraposition(text));
  push(toPassive(a, text));
  push(frontAdverbial(a, text));
  for (const hit of findSynonyms(text, 2)) {
    if (out.length >= max) break;
    push(replaceSynonym(text, hit));
  }
  return out.slice(0, max);
}

export { SYN_ENTRIES };
