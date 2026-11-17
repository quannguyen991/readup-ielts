import { LINKERS, UPGRADES } from '@/data/sentence-synonyms';
import { checkExpression, type ExpressCheck } from './expression-check';
import { findIssues, hasFiniteVerbHint, wordsWithPositions, type Issue } from './grammar-rules';
import { BE_FORMS, DETERMINERS, DO_FORMS, HAVE_FORMS, MODALS, PREPOSITIONS, PRONOUN_SUBJECT, norm, stem } from './lexicon';
import { detectStructures } from './structure-detect';
import { getStructure } from './structure-bank';
import { rewriteSentence, type Rewrite } from './sentence-rewrite';

/**
 * Góp ý BÀI VIẾT CẢ ĐOẠN, từng câu một, bằng luật — không gọi AI.
 *
 * Mỗi câu nhận: lỗi cụ thể (ngữ pháp, chính tả, lỗi người Việt hay mắc), gợi ý
 * từ vựng (nâng từ cơ bản, từ lặp), cấu trúc đã dùng, mạch (từ nối, mở đầu lặp),
 * và một cách viết khác khi câu đã sạch lỗi. Cả đoạn nhận bốn nhận xét có số đo
 * (ngữ pháp, từ vựng, mạch lạc, đa dạng cấu trúc) CỘNG lời nhận xét tiếng Việt.
 * KHÔNG có điểm band: luật không đủ cơ sở để cho một con số band đáng tin.
 *
 * Chế độ "dịch cả đoạn": nếu đề có câu mẫu từng câu, mỗi câu của người học còn
 * được đối chiếu với câu mẫu tương ứng để chỉ ra ý còn thiếu.
 */

export type SentenceReview = {
  index: number;
  text: string;
  start: number;
  end: number;
  words: number;
  issues: Issue[];
  /** Ghi chú từ vựng: nâng từ, từ lặp. */
  vocab: { text: string; kind: 'upgrade' | 'repeat'; better?: string[] }[];
  /** Tên các cấu trúc nhận ra trong câu. */
  structures: string[];
  /** Nhận xét mạch: từ nối đã dùng + lưu ý. */
  coherence: string[];
  rewrite: Rewrite | null;
  /** Chỉ có ở chế độ dịch cả đoạn. */
  versus: ExpressCheck | null;
  /** Câu sạch lỗi cứng. */
  clean: boolean;
};

export type Criterion = { key: 'grammar' | 'vocab' | 'coherence' | 'variety'; label: string; score: 0 | 1 | 2 | 3; note: string };

export type ParagraphReview = {
  sentences: SentenceReview[];
  wordCount: number;
  sentenceCount: number;
  cleanCount: number;
  criteria: Criterion[];
  goodVi: string[];
  improveVi: string[];
  /** Một việc nên làm ngay. */
  priorityVi: string;
  meetsLength: boolean;
  /** Đạt mốc để tính là "đã học". */
  passed: boolean;
};

export type ParagraphTask = {
  id: string;
  minSentences: number;
  /** Từ khoá của đề (để không báo sai chính tả). */
  keywords?: string[];
  /** Câu mẫu từng câu (chế độ dịch cả đoạn) hoặc cấu trúc nên thử. */
  models?: { en: string; vi: string }[];
  structures?: string[];
};

export function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[^.!?\n]+(?:[.!?]+["”’']?|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (t.length === 0) continue;
    out.push({ text: t, start: m.index + lead, end: m.index + lead + t.length });
  }
  return out;
}

const STOP_FOR_REPEAT = new Set(
  `that this with from they them their there here have has had been were was are will would could should about which what when where while because although also than then into over after before more most some such very much many other each every both only just like make made get got going come came take took know people`.split(/\s+/),
);
const isFunctionWord = (w: string): boolean => BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || MODALS.has(w) || PREPOSITIONS.has(w) || DETERMINERS.has(w) || PRONOUN_SUBJECT.has(w);

const LINKER_ALL: [string, string][] = Object.entries(LINKERS).flatMap(([cat, list]) => list.map((l) => [cat, l] as [string, string]));

function linkersIn(sentence: string): { cat: string; word: string }[] {
  const f = ` ${sentence.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ')} `;
  const found: { cat: string; word: string }[] = [];
  for (const [cat, l] of LINKER_ALL) if (f.includes(` ${l} `)) found.push({ cat, word: l });
  return found;
}

function stdDev(xs: number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
}

export function reviewParagraph(task: ParagraphTask, text: string): ParagraphReview {
  const parts = splitSentences(text);
  const extra = new Set<string>();
  for (const k of task.keywords ?? []) for (const t of k.toLowerCase().split(/[^a-z']+/)) if (t) extra.add(t);
  for (const m of task.models ?? []) for (const w of wordsWithPositions(m.en)) extra.add(w.lower);

  // Từ nội dung lặp quá 3 lần trong cả đoạn.
  const counts = new Map<string, { n: number; word: string }>();
  for (const w of wordsWithPositions(text)) {
    const n = norm(w.text);
    if (n.length < 4 || STOP_FOR_REPEAT.has(n) || isFunctionWord(n)) continue;
    const s = stem(n);
    const cur = counts.get(s);
    counts.set(s, { n: (cur?.n ?? 0) + 1, word: cur?.word ?? n });
  }
  const repeated = new Set([...counts.entries()].filter(([, v]) => v.n >= 3).map(([s]) => s));

  const reviews: SentenceReview[] = parts.map((p, index) => {
    const issues = findIssues(p.text, { extraWords: extra, requireEndPunct: true, checkCapital: true }).map((i) => ({ ...i, start: i.start + p.start, end: i.end + p.start }));
    const det = detectStructures(p.text);
    const wordsN = wordsWithPositions(p.text).length;
    const structures = det.hits.map((h) => getStructure(h.id)?.vi).filter((x): x is string => !!x).slice(0, 3);

    const vocab: SentenceReview['vocab'] = [];
    const lower = ` ${p.text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ')} `;
    for (const u of UPGRADES) {
      if (lower.includes(` ${u.basic} `)) vocab.push({ text: u.basic, kind: 'upgrade', better: u.better });
      if (vocab.length >= 2) break;
    }
    for (const w of wordsWithPositions(p.text)) {
      const s = stem(norm(w.text));
      if (repeated.has(s) && !vocab.some((v) => v.text === norm(w.text))) {
        vocab.push({ text: norm(w.text), kind: 'repeat' });
        break;
      }
    }

    const coherence: string[] = [];
    const links = linkersIn(p.text);
    if (links.length) coherence.push(`Từ nối: ${links.map((l) => l.word).join(', ')}.`);
    const first = wordsWithPositions(p.text)[0]?.lower;
    const prevFirst = index > 0 ? wordsWithPositions(parts[index - 1]!.text)[0]?.lower : undefined;
    const prevPrev = index > 1 ? wordsWithPositions(parts[index - 2]!.text)[0]?.lower : undefined;
    if (first && prevFirst === first && prevPrev === first) coherence.push(`Ba câu liền bắt đầu bằng "${first}" — thử đổi cách mở câu.`);
    if (wordsN <= 5 && wordsN > 0) coherence.push('Câu rất ngắn — thử nối với câu bên cạnh bằng and/but/because/which.');

    const hardErrors = issues.filter((i) => i.severity === 'error').length;
    const noVerb = !hasFiniteVerbHint(p.text) && wordsN >= 3;
    if (noVerb && hardErrors === 0) {
      issues.push({ id: `no-verb-${index}`, kind: 'grammar', severity: 'error', start: p.start, end: p.end, found: p.text, vi: 'Câu chưa có động từ chia rõ ràng.' });
    }
    const errors = issues.filter((i) => i.severity === 'error').length;

    let versus: ExpressCheck | null = null;
    const models = task.models;
    if (models && models.length > 0 && parts.length === models.length) {
      const m = models[index]!;
      versus = checkExpression({ id: `${task.id}-${index}`, en: m.en, vi: m.vi }, p.text);
    }

    // Chỉ gợi ý cách viết khác cho câu đã sạch hoàn toàn: viết lại một câu còn lỗi chỉ sao chép lỗi đó.
    const rewrite = issues.length === 0 ? (rewriteSentence(p.text, det.analysis, 1)[0] ?? null) : null;
    return { index, text: p.text, start: p.start, end: p.end, words: wordsN, issues, vocab, structures, coherence, rewrite, versus, clean: errors === 0 };
  });

  const wordCount = reviews.reduce((a, r) => a + r.words, 0);
  const sentenceCount = reviews.length;
  const cleanCount = reviews.filter((r) => r.clean).length;
  const errorTotal = reviews.reduce((a, r) => a + r.issues.filter((i) => i.severity === 'error').length, 0);

  // ---- bốn tiêu chí
  const errPerSentence = sentenceCount ? errorTotal / sentenceCount : 0;
  const grammarScore: Criterion['score'] = sentenceCount === 0 ? 0 : errPerSentence === 0 ? 3 : errPerSentence <= 0.4 ? 2 : errPerSentence <= 1 ? 1 : 0;

  const upgrades = reviews.reduce((a, r) => a + r.vocab.filter((v) => v.kind === 'upgrade').length, 0);
  const repeats = reviews.reduce((a, r) => a + r.vocab.filter((v) => v.kind === 'repeat').length, 0);
  const lexIssues = upgrades + repeats;
  const vocabScore: Criterion['score'] = sentenceCount === 0 ? 0 : lexIssues === 0 ? 3 : lexIssues <= sentenceCount * 0.3 ? 2 : lexIssues <= sentenceCount * 0.6 ? 1 : 0;

  const linkerCats = new Set<string>();
  let linkerSentences = 0;
  for (const p of parts) {
    const l = linkersIn(p.text);
    if (l.length) linkerSentences += 1;
    for (const x of l) linkerCats.add(x.cat);
  }
  const cohScore: Criterion['score'] = sentenceCount === 0 ? 0 : linkerCats.size >= 3 && linkerSentences >= Math.ceil(sentenceCount / 3) ? 3 : linkerCats.size >= 2 ? 2 : linkerSentences >= 1 ? 1 : 0;

  const lengths = reviews.map((r) => r.words);
  const complexN = reviews.filter((r) => r.structures.length > 0 && detectStructures(r.text).analysis.clauses.length >= 2).length;
  const structureIds = new Set<string>();
  for (const r of reviews) for (const h of detectStructures(r.text).hits) structureIds.add(h.id);
  const varietyScore: Criterion['score'] = sentenceCount === 0 ? 0 : complexN >= Math.ceil(sentenceCount / 2) && structureIds.size >= 5 && stdDev(lengths) >= 3 ? 3 : complexN >= 2 && structureIds.size >= 3 ? 2 : complexN >= 1 ? 1 : 0;

  const criteria: Criterion[] = [
    { key: 'grammar', label: 'Ngữ pháp & chính tả', score: grammarScore, note: errorTotal === 0 ? 'Không còn lỗi cứng.' : `${errorTotal} lỗi trong ${sentenceCount} câu.` },
    { key: 'vocab', label: 'Từ vựng', score: vocabScore, note: lexIssues === 0 ? 'Từ ngữ đa dạng, không lặp.' : `${upgrades} từ nên nâng, ${repeats} chỗ lặp từ.` },
    { key: 'coherence', label: 'Mạch lạc', score: cohScore, note: `Dùng ${linkerCats.size} nhóm từ nối trong ${linkerSentences}/${sentenceCount} câu.` },
    { key: 'variety', label: 'Đa dạng cấu trúc', score: varietyScore, note: `${complexN} câu nhiều mệnh đề, ${structureIds.size} cấu trúc khác nhau.` },
  ];

  const goodVi: string[] = [];
  const improveVi: string[] = [];
  if (grammarScore === 3) goodVi.push('Ngữ pháp và chính tả sạch lỗi cứng.');
  if (cohScore >= 2) goodVi.push('Có dùng từ nối để nối ý.');
  if (varietyScore >= 2) goodVi.push('Có câu phức và nhiều cấu trúc khác nhau.');
  if (vocabScore === 3) goodVi.push('Từ vựng đa dạng, ít lặp.');
  if (sentenceCount >= task.minSentences) goodVi.push(`Đủ độ dài (${sentenceCount} câu).`);

  if (sentenceCount < task.minSentences) improveVi.push(`Đoạn mới ${sentenceCount} câu — viết ít nhất ${task.minSentences} câu.`);
  if (grammarScore <= 1) improveVi.push('Sửa các lỗi ngữ pháp/chính tả đã đánh dấu đỏ trước.');
  if (cohScore <= 1) improveVi.push('Thêm từ nối: because, however, for example, as a result…');
  if (varietyScore <= 1) improveVi.push('Nối hai câu ngắn thành một câu phức (which, although, because…).');
  if (vocabScore <= 1) improveVi.push('Thay các từ cơ bản như good, very, a lot of bằng từ chính xác hơn.');
  const wanted = (task.structures ?? []).filter((s) => !structureIds.has(s));
  if (wanted.length) {
    const names = wanted.map((s) => getStructure(s)?.vi).filter(Boolean).slice(0, 2).join(', ');
    if (names) improveVi.push(`Thử dùng cấu trúc: ${names}.`);
  }

  const priorityVi =
    sentenceCount === 0
      ? 'Hãy viết đoạn văn của bạn.'
      : sentenceCount < task.minSentences
        ? 'Viết thêm cho đủ số câu của đề.'
        : grammarScore <= 1
          ? 'Sửa lỗi ngữ pháp/chính tả trước — chúng làm mất điểm nhiều nhất.'
          : cohScore <= 1
            ? 'Thêm từ nối để các câu dính vào nhau.'
            : varietyScore <= 1
              ? 'Nối các câu ngắn thành câu phức.'
              : vocabScore <= 1
                ? 'Nâng từ vựng ở những chỗ được gợi ý.'
                : 'Đoạn đã tốt — thử viết lại bằng cấu trúc khó hơn.';

  const meetsLength = sentenceCount >= task.minSentences;
  const passed = meetsLength && sentenceCount > 0 && cleanCount / sentenceCount >= 0.8;
  return { sentences: reviews, wordCount, sentenceCount, cleanCount, criteria, goodVi, improveVi: improveVi.slice(0, 4), priorityVi, meetsLength, passed };
}

