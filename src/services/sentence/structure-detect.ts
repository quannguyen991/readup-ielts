import { analyzeSentence, type SentenceAnalysis } from './sentence-analyze';
import {
  BE_FORMS,
  CONTRACTIONS,
  IMPERATIVE_VERBS,
  isVerbForm,
  verbReadings,
} from './lexicon';

/**
 * Nhận diện các CẤU TRÚC (xem `structure-bank.ts`) có trong một câu tiếng Anh bất
 * kỳ — bằng luật trên chuỗi và trên bộ chia khối, không gọi AI.
 *
 * Nguyên tắc: nhận diện THIẾU còn hơn nhận diện SAI. Một cấu trúc chỉ được báo
 * khi dấu hiệu rõ (từ nối đặc trưng, khuôn be + V3, if + thì…). Câu nào không rơi
 * vào khuôn nào thì vẫn có thì của động từ chính để hiển thị.
 */

export type StructureHit = {
  id: string;
  /** Đoạn nguyên văn khớp, để tô sáng; có thể rỗng. */
  match: string;
};

/** Chuỗi phẳng: chữ thường, bỏ dấu câu (giữ nháy đơn), một dấu cách giữa các từ. */
export function flatten(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PP_OK = (w: string): boolean => /ed$/.test(w) || verbReadings(w).some((r) => r.form === 'pp');
const ING_OK = (w: string): boolean => /ing$/.test(w) && verbReadings(w).some((r) => r.form === 'ing');

type Rule = { id: string; test: (f: string, words: string[], a: SentenceAnalysis, raw: string) => string | null };

const rx = (re: RegExp) => (f: string): string | null => {
  const m = re.exec(f);
  return m ? m[0] : null;
};

const RULES: Rule[] = [
  // ---- điều kiện
  {
    id: 'conditional-3',
    test: (f) => rx(/\bif (?:[a-z']+ ){1,6}had (?:[a-z']+ )?[a-z]+(?:ed|en|t|n|ne|wn|ung|ught)\b.*\bwould (?:not |never )?have\b|\bwould have (?:[a-z']+ )?[a-z]+\b.*\bif\b.*\bhad\b/)(f),
  },
  {
    id: 'conditional-2',
    test: (f) => rx(/\bif (?:[a-z']+ ){1,6}(?:were|[a-z]+ed|had|did|knew|went|came|saw|took|got|made|lived|found|won|lost|[a-z]+d)\b.*\b(?:would|could|might) (?!have\b)[a-z]+/)(f)
      ?? rx(/\b(?:would|could|might) (?!have\b)[a-z]+ (?:[a-z']+ ){0,6}if (?:[a-z']+ ){1,5}(?:were|[a-z]+ed|had|did)\b/)(f),
  },
  {
    id: 'conditional-1',
    test: (f) => rx(/\b(?:if|unless) (?:[a-z']+ ){1,6}[a-z']+\b.*\b(?:will|won't|can|may|must|should)\b|\b(?:will|won't) [a-z]+ (?:[a-z']+ ){0,6}(?:if|unless) /)(f),
  },
  {
    id: 'conditional-0',
    test: (f, _w, a) => {
      if (!/\bif\b/.test(f)) return null;
      return a.mainVerb && a.mainVerb.tense === 'present-simple' && !/\b(would|will|won't|had|were)\b/.test(f) ? (/\bif [^,]+/.exec(f)?.[0] ?? 'if') : null;
    },
  },
  // ---- bị động
  {
    id: 'passive',
    test: (f, words) => {
      for (let i = 0; i < words.length; i += 1) {
        const w = words[i]!;
        if (!(BE_FORMS.has(w) || w === 'got')) continue;
        if (w === 'been' && words[i - 1] && ['has', 'have', 'had'].includes(words[i - 1]!)) {
          if (words[i + 1] && PP_OK(words[i + 1]!) && !ING_OK(words[i + 1]!)) return `${words[i - 1]} been ${words[i + 1]}`;
        }
        let j = i + 1;
        while (words[j] && /ly$|^(also|just|already|often|never|always|usually|still|now|then|not)$/.test(words[j]!)) j += 1;
        const nextW = words[j];
        if (nextW && PP_OK(nextW) && !ING_OK(nextW) && !['am', 'is', 'are', 'was', 'were', 'be', 'been'].includes(nextW)) {
          // Loại tính từ có đuôi -ed hay đi với be: tired, bored, excited… (vẫn là bị động-nhẹ, nhưng không báo).
          if (/^(tired|bored|excited|interested|worried|scared|surprised|pleased|crowded|married|used|supposed|determined|relaxed|located|situated|known)$/.test(nextW) && !/\bby\b/.test(f)) return null;
          return `${w} ${nextW}`;
        }
      }
      void f;
      return null;
    },
  },
  // ---- mệnh đề
  {
    id: 'relative-clause',
    test: (_f, _w, a) => {
      const c = a.clauses.find((x) => x.kind === 'relative' && /^(who|whom|whose|which|where|that)$/i.test(x.connector ?? ''));
      return c ? c.text.split(' ').slice(0, 4).join(' ') : null;
    },
  },
  {
    id: 'concession',
    test: (f, _w, a) => {
      const sub = a.clauses.find((x) => x.kind === 'subordinate' && /^(although|though|even though|whereas)$/i.test(x.connector ?? ''));
      if (sub) return sub.connector;
      const m = rx(/\b(?:despite|in spite of)\b [a-z]+/)(f);
      if (m) return m;
      const w = a.clauses.find((x) => x.kind === 'subordinate' && /^while$/i.test(x.connector ?? ''));
      if (w && !(w.verb && /continuous/.test(w.verb.tense))) return 'while';
      return rx(/\b(?:even though|whereas)\b/)(f);
    },
  },
  { id: 'result-clause', test: (f) => rx(/\bso [a-z]+ (?:[a-z]+ )?that\b|\bsuch (?:a |an )?[a-z]+(?: [a-z]+)? that\b/)(f) },
  { id: 'purpose-clause', test: (f) => rx(/\bin order to\b|\bso as (?:not )?to\b|\bso that\b/)(f) },
  {
    id: 'reason-clause',
    test: (f, _w, a) => {
      const sub = a.clauses.find((x) => x.kind === 'subordinate' && /^(because|since|as)$/i.test(x.connector ?? ''));
      if (sub) return sub.connector;
      return rx(/\bbecause of\b|\bdue to\b|\bowing to\b/)(f);
    },
  },
  {
    id: 'time-clause',
    test: (_f, _w, a) => {
      const sub = a.clauses.find((x) => x.kind === 'subordinate' && /^(when|whenever|while|before|after|until|once|as soon as)$/i.test(x.connector ?? ''));
      if (!sub) return null;
      if (/^while$/i.test(sub.connector ?? '') && !(sub.verb && /continuous/.test(sub.verb.tense))) return null;
      return sub.connector;
    },
  },
  { id: 'that-clause', test: (f) => rx(/\b(?:say|says|said|think|thinks|thought|believe|believes|believed|argue|argues|argued|claim|claims|claimed|suggest|suggests|suggested|show|shows|showed|shown|found|know|knew|hope|hoped|realise|realize|ensure|explain|explained|discover|discovered|notice|noticed|prove|proved|report|reported|insist|insisted) that\b/)(f) },
  // ---- thì / mẫu câu
  { id: 'be-going-to', test: (f) => rx(/\b(?:am|is|are|was|were|'m|'re|'s) going to [a-z]+/)(f) },
  { id: 'used-to', test: (f) => rx(/\bused to [a-z]+|\b(?:am|is|are|was|were|get|got) used to [a-z]+ing\b/)(f) },
  { id: 'there-be', test: (f) => rx(/^there (?:is|are|was|were|has been|have been|will be|used to be|'s)\b|[,;] there (?:is|are|was|were)\b/)(f) },
  { id: 'it-extraposition', test: (f) => rx(/^it (?:is|was|has been|will be|'s|would be) (?:[a-z]+ ){1,3}(?:for [a-z]+ )?to [a-z]+|\bit (?:takes|took|will take|usually takes)\b(?: [a-z]+){0,3} to [a-z]+/)(f) },
  { id: 'cleft', test: (f) => rx(/^it (?:is|was) (?:[a-z']+ ){1,6}(?:that|who) [a-z']+/)(f) },
  { id: 'find-it-adj', test: (f) => rx(/\b(?:find|finds|found|think|thinks|thought|make|makes|made|consider|considers) it (?:[a-z]+ ){1,2}to [a-z]+/)(f) },
  { id: 'prevent-from', test: (f) => rx(/\b(?:prevent|prevents|prevented|stop|stops|stopped|keep|keeps|kept|protect|protects|protected|discourage|discourages|discouraged) (?:[a-z']+ ){1,3}from [a-z]+ing\b/)(f) },
  { id: 'object-to-infinitive', test: (f) => rx(/\b(?:allow|allows|allowed|ask|asks|asked|tell|tells|told|encourage|encourages|encouraged|require|requires|required|want|wants|wanted|expect|expects|expected|enable|enables|enabled|force|forces|forced|invite|invites|invited|advise|advises|advised|persuade|persuades|persuaded|remind|reminds|reminded|teach|teaches|taught|help|helps|helped) (?:[a-z']+ ){1,3}to [a-z]+/)(f) },
  { id: 'causative', test: (f) => rx(/\b(?:make|makes|made|let|lets|have|has|had|get|gets|got) (?:[a-z']+ ){1,3}(?:[a-z]+)\b/)(f) && /\b(?:made|make|makes|let|lets) (?:me|you|him|her|us|them|it|[a-z]+) [a-z]+\b/.test(f) && !/\b(?:made|make|makes) (?:a|an|the|of|up)\b/.test(f) ? (/\b(?:made|make|makes|let|lets) (?:me|you|him|her|us|them) [a-z]+/.exec(f)?.[0] ?? null) : null },
  { id: 'too-enough', test: (f) => rx(/\btoo (?:[a-z]+ ){1,2}(?:for [a-z]+ )?to [a-z]+|\b[a-z]+ enough (?:for [a-z]+ )?to [a-z]+/)(f) },
  { id: 'double-comparative', test: (f) => rx(/^the (?:more|less|[a-z]+er|better|worse) .*\bthe (?:more|less|[a-z]+er|better|worse)\b/)(f) },
  { id: 'correlative', test: (f) => rx(/\bnot only\b.*\bbut also\b|\bboth\b.*\band\b|\beither\b.*\bor\b|\bneither\b.*\bnor\b/)(f) },
  { id: 'equal-comparison', test: (f) => rx(/\b(?:as|so) [a-z]+ as\b|\bas (?:much|many|well|soon|far|long) as\b/)(f) },
  { id: 'superlative', test: (f) => rx(/\bthe (?:most|least) [a-z]+|\bthe [a-z]{3,}est\b|\bthe (?:best|worst|farthest|furthest)\b/)(f) },
  { id: 'comparative', test: (f) => rx(/\b(?:more|less|fewer) [a-z]+ than\b|\b[a-z]{3,}er than\b|\b(?:better|worse|more|less|fewer) than\b/)(f) },
  { id: 'wish', test: (f) => rx(/\b(?:wish|wishes|wished) (?:i|you|he|she|it|we|they|that) [a-z']+|\bif only [a-z']+/)(f) },
  { id: 'inversion', test: (f) => rx(/^(?:never|rarely|seldom|hardly|scarcely|little|no sooner|not only|only when|not until|under no circumstances) (?:do|does|did|have|has|had|is|are|was|were|can|could|will|would|should|must) [a-z']+/)(f) },
  { id: 'participle-clause', test: (f, _w, _a, raw) => (/^(?:having [a-z]+(?:ed|en|t|n)|[a-z]+ing|[a-z]+ed|built|made|written|born|given|taken)\b[^,]*, /.test(f) && /,/.test(raw) && ING_OK(f.split(' ')[0]!) !== false && !/^(?:something|nothing|anything|everything|morning|evening|during|spring|king|thing|ring|bring|sing)/.test(f) ? f.split(',')[0] ?? null : null),
  },
  { id: 'gerund-subject', test: (f, words) => (words[0] && ING_OK(words[0]!) && !/^(?:during|according|including|regarding|concerning)$/.test(words[0]!) && /\b(?:is|are|was|were|can|may|has|have|helps?|makes?|takes?|keeps?|requires?|means?|costs?|becomes?|remains?|[a-z]+s)\b/.test(words.slice(1, 8).join(' ')) ? words.slice(0, 3).join(' ') : null) },
  { id: 'verb-ing', test: (f) => rx(/\b(?:enjoy|enjoys|enjoyed|avoid|avoids|avoided|consider|considers|considered|suggest|suggests|suggested|finish|finishes|finished|keep|keeps|kept|mind|minds|practise|practice|practises|practiced|quit|miss|risk|imagine|admit|deny|postpone|delay|dislike|recommend|recommends|recommended|spend|spends|spent) (?:[a-z']+ ){0,2}[a-z]+ing\b/)(f) },
  { id: 'verb-to-infinitive', test: (f) => rx(/\b(?:want|wants|wanted|decide|decides|decided|plan|plans|planned|hope|hopes|hoped|need|needs|needed|refuse|refuses|refused|promise|promises|promised|learn|learns|learned|manage|manages|managed|afford|agree|agrees|agreed|expect|expects|expected|intend|intends|prefer|prefers|preferred|would like|'d like|fail|fails|failed|tend|tends|seem|seems|seemed|appear|appears|offer|offers|offered|choose|chose|try|tries|tried|start|starts|started|begin|begins|began) (?:not )?to [a-z]+/)(f) },
  { id: 'compound-sentence', test: (f, _w, a) => (a.clauses.some((c) => c.kind === 'coordinate') || /, (?:and|but|so|or|yet) /.test(f) ? ', and/but/so' : null) },
];

/** Thì của động từ chính → id cấu trúc. */
function tenseId(a: SentenceAnalysis): string | null {
  const v = a.mainVerb;
  if (!v) return null;
  if (v.tense === 'modal') {
    const m = v.modal ?? '';
    if (m === 'can' || m === 'could') return 'modal-ability';
    if (m === 'should' || m === 'ought') return 'modal-advice';
    if (m === 'must') return 'modal-obligation';
    if (m === 'may' || m === 'might') return 'modal-possibility';
    return null;
  }
  const ok: Record<string, string> = {
    'present-simple': 'present-simple',
    'past-simple': 'past-simple',
    'present-continuous': 'present-continuous',
    'past-continuous': 'past-continuous',
    'present-perfect': 'present-perfect',
    'past-perfect': 'past-perfect',
    'future-simple': 'future-simple',
    'be-going-to': 'be-going-to',
    imperative: 'imperative',
  };
  return ok[v.tense] ?? null;
}

/**
 * Thì của động từ chính đọc thẳng từ chuỗi — chắc hơn bộ chia khối khi câu dài.
 * Chỉ dùng khi bộ chia khối không cho được kết quả.
 */
function tenseFromText(f: string, words: string[]): string | null {
  if (/\b(?:am|is|are|was|were) going to [a-z]+/.test(f)) return 'be-going-to';
  if (/\b(?:has|have|'ve) (?:(?:just|already|never|ever|not|recently|also|still|always|often|really) )?(?:been|[a-z]+(?:ed|en|ne|wn))\b|\b(?:has|have) (?:[a-z]+ )?(?:had|made|taken|done|gone|come|seen|become|begun|got|got|found|left|lost|met|read|said|told)\b/.test(f)) return 'present-perfect';
  if (/\bhad (?:(?:already|never|just|not|also) )?(?:been|[a-z]+(?:ed|en|ne|wn))\b/.test(f)) return 'past-perfect';
  if (/\b(?:will|won't|'ll) [a-z]+/.test(f)) return 'future-simple';
  if (/\b(?:am|is|are|'m|'re) (?:not )?[a-z]+ing\b/.test(f)) return 'present-continuous';
  if (/\b(?:was|were) (?:not )?[a-z]+ing\b/.test(f)) return 'past-continuous';
  if (words.some((w) => verbReadings(w).some((r) => r.form === 'past') && !/^(?:read|set|put|cut|let|hit|hurt|shut)$/.test(w) && !BE_FORMS.has(w))) return 'past-simple';
  if (/\b(?:was|were|did)\b/.test(f)) return 'past-simple';
  return null;
}

export type DetectResult = {
  analysis: SentenceAnalysis;
  /** Theo thứ tự đáng học: mẫu câu/mệnh đề trước, thì sau. */
  hits: StructureHit[];
  /** Cấu trúc nổi bật nhất (đầu danh sách). */
  main: StructureHit | null;
  /** Thì của động từ chính, nếu xác định được. */
  tenseId: string | null;
};

export function detectStructures(text: string, analysis?: SentenceAnalysis): DetectResult {
  const a = analysis ?? analyzeSentence(text);
  const f = flatten(text);
  const words = f.split(' ').filter(Boolean);
  const hits: StructureHit[] = [];

  const first = words[0] ?? '';
  const isImperativeStart =
    a.isImperative || ((IMPERATIVE_VERBS.has(first) || first === "don't") && !CONTRACTIONS[first] && !/^(?:i|you|he|she|it|we|they)$/.test(first) && (isVerbForm(first) || first === 'please' || first === "don't") && words.length >= 2 && !/ing$|s$/.test(first));
  const isQuestion = /\?\s*$/.test(text.trim());

  for (const rule of RULES) {
    // Mẫu "participle-clause" và "gerund-subject" không áp cho câu hỏi/mệnh lệnh.
    let m: string | null = null;
    try {
      m = rule.test(f, words, a, text);
    } catch {
      m = null;
    }
    if (m) hits.push({ id: rule.id, match: m });
  }

  // Loại trùng/mâu thuẫn: if-conditional chỉ giữ một loại cao nhất.
  const condOrder = ['conditional-3', 'conditional-2', 'conditional-1', 'conditional-0'];
  const keptCond = condOrder.find((c) => hits.some((h) => h.id === c));
  const filtered = hits.filter((h) => !condOrder.includes(h.id) || h.id === keptCond);
  // Báo "so sánh nhất" thì bỏ "so sánh hơn" nếu không có "than".
  const withoutComp = filtered.filter((h) => !(h.id === 'comparative' && filtered.some((x) => x.id === 'superlative') && !/\bthan\b/.test(f)));
  // "reason-clause" từ "since" mơ hồ khi đã có present-perfect → bỏ.
  const cleaned = withoutComp.filter((h) => !(h.id === 'time-clause' && /\bwhile\b/.test(h.match) && filtered.some((x) => x.id === 'concession') && /^while\b/.test(f) && /\bwhereas|although|though\b/.test(f) === false && false));

  const tense = isQuestion ? 'question' : isImperativeStart ? 'imperative' : (tenseId(a) ?? tenseFromText(f, words));
  const ordered = [...cleaned];
  if (isQuestion) ordered.push({ id: 'question', match: '' });
  if (tense && !ordered.some((h) => h.id === tense)) ordered.push({ id: tense, match: '' });

  // Mẫu câu đặc thù (pattern/clause) đứng trước thì cơ bản.
  const rank = (id: string): number => (/^(present|past|future)-|^be-going|^imperative|^question|^modal-/.test(id) ? 1 : 0);
  ordered.sort((x, y) => rank(x.id) - rank(y.id));

  return { analysis: a, hits: ordered, main: ordered[0] ?? null, tenseId: tense };
}
