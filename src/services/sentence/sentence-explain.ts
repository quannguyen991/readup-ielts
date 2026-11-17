import { SENTENCE_NOTES } from '@/data/sentence-notes';
import { SENTENCE_ENRICHMENT } from '@/data/sentence-enrichment';
import { analyzeSentence, TENSE_LABEL, type Role } from './sentence-analyze';
import { detectStructures } from './structure-detect';
import { getStructure, type StructureDef, type StructureExample } from './structure-bank';
import { findSynonyms, rewriteSentence, type Rewrite, type SynonymHit } from './sentence-rewrite';

/**
 * GIẢI CHI TIẾT một câu: thành phần, cấu trúc, câu cùng khuôn, từ tương đương,
 * cách diễn đạt khác. Một cửa duy nhất cho màn Chép chính tả, Dịch câu, Tự diễn
 * đạt và Viết cả đoạn.
 *
 * Nguồn, theo thứ tự ưu tiên:
 *   1. ghi chú SOẠN SẴN theo mã câu (`sentence-notes.ts`) — chính xác nhất;
 *   2. với câu dịch: cặp "cách diễn đạt khác + từ vựng" soạn sẵn (`sentence-enrichment.ts`);
 *   3. LUẬT (`sentence-analyze`, `structure-detect`, `sentence-rewrite`) — cho mọi câu còn lại,
 *      kể cả câu người dùng tự viết. Chỉ hiển thị khối câu khi bộ luật tự tin.
 */

export type ExplainChunk = { role: Role; text: string };

export type SentenceExplain = {
  text: string;
  source: 'curated' | 'rules';
  /** Khối câu theo thứ tự; `null` nếu không đủ tin cậy để hiển thị. */
  chunks: ExplainChunk[] | null;
  /** Cấu trúc đáng học (tối đa 3), cái đầu là chính. */
  structures: StructureDef[];
  /** Một câu ghi chú riêng cho CHÍNH câu này (chỉ có ở nguồn soạn sẵn). */
  note: string | null;
  tenseLabel: string | null;
  similar: StructureExample[];
  synonyms: SynonymHit[];
  rewrites: Rewrite[];
};

const ROLE_CODE: Record<string, Role> = {
  S: 'subject', V: 'verb', O: 'object', I: 'indirect', C: 'complement', T: 'time', P: 'place', M: 'manner', R: 'reason', U: 'purpose', A: 'adverbial', J: 'connector',
};

function cleanPunct(s: string): string {
  return s.replace(/[.!?]+$/g, '').replace(/,+$/g, '').trim();
}

export function explainSentence(text: string, id?: string): SentenceExplain {
  const note = id ? SENTENCE_NOTES[id] : undefined;
  const det = detectStructures(text);
  const tenseLabel = det.tenseId && TENSE_LABEL[det.tenseId as keyof typeof TENSE_LABEL] ? TENSE_LABEL[det.tenseId as keyof typeof TENSE_LABEL].vi : null;

  if (note) {
    const structures = note.s.map((sid) => getStructure(sid)).filter((x): x is StructureDef => !!x);
    return {
      text,
      source: 'curated',
      chunks: note.c.map(([code, t]) => ({ role: ROLE_CODE[code] ?? 'adverbial', text: cleanPunct(t) })),
      structures,
      note: note.n,
      tenseLabel,
      similar: note.x.map(([en, vi]) => ({ en, vi })),
      synonyms: note.y.map((row) => ({ phrase: row[0]!, alts: row.slice(1, -1), vi: row[row.length - 1]! })),
      rewrites: note.r.map(([en, label]) => ({ en, label })),
    };
  }

  // ---- nguồn luật (có thể bổ sung bằng bảng enrichment của câu dịch)
  const a = det.analysis;
  const structures = det.hits.map((h) => getStructure(h.id)).filter((x): x is StructureDef => !!x).slice(0, 3);
  const enrich = id ? SENTENCE_ENRICHMENT[id] : undefined;
  const rewrites: Rewrite[] = [];
  if (enrich) for (const p of enrich.paraphrases.slice(0, 2)) rewrites.push({ en: p, label: 'Cách diễn đạt khác' });
  for (const r of rewriteSentence(text, a, 3)) if (rewrites.length < 3) rewrites.push(r);
  const synonyms: SynonymHit[] = findSynonyms(text, 3);
  const similar = structures[0]?.examples.slice(0, 3) ?? [];
  return {
    text,
    source: 'rules',
    chunks: a.trusted ? a.clauses.flatMap((c) => c.chunks.map((k) => ({ role: k.role, text: k.text }))) : null,
    structures,
    note: null,
    tenseLabel,
    similar,
    synonyms,
    rewrites,
  };
}
