import type { Bi } from '@/i18n/useL';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import type { IntlLevel } from '@/data/intl/level';
import { PART5_BANK } from './toeic-part5-bank';

export type Part5Tag =
  | 'adj_for_adv'
  | 'noun_for_adv'
  | 'comparative_for_adv'
  | 'adv_for_adj'
  | 'noun_for_adj'
  | 'verb_for_adj'
  | 'wrong_preposition'
  | 'wrong_collocation'
  | 'wrong_relative'
  | 'wrong_agreement'
  | 'wrong_tense'
  | 'wrong_voice'
  | 'wrong_quantifier'
  | 'wrong_verb_form'
  | 'wrong_conjunction'
  | 'wrong_degree'
  | 'wrong_word_order'
  | 'wrong_word_form';

export type Part5Option = { text: string; correct: boolean; tag: Part5Tag | null };

export type Part5Item = {
  id: string;
  focus: 'part_of_speech' | 'grammar' | 'vocabulary';
  /** Dạng câu hỏi, ví dụ "Thì" hoặc "Bị động". */
  kind: Bi;
  level: IntlLevel;
  stem: string;
  options: Part5Option[];
  explanation: Bi;
};

type Draft = {
  id: string;
  focus: Part5Item['focus'];
  kind: Bi;
  level: IntlLevel;
  stem: string;
  correct: string;
  distractors: { text: string; tag: Part5Tag }[];
  explanation: Bi;
};

const KIND = {
  adverb: { vi: 'Từ loại: trạng từ', en: 'Part of speech: adverb' },
  adjective: { vi: 'Từ loại: tính từ', en: 'Part of speech: adjective' },
  preposition: { vi: 'Giới từ', en: 'Prepositions' },
  collocation: { vi: 'Cụm từ cố định', en: 'Collocations' },
  relative: { vi: 'Đại từ quan hệ', en: 'Relative pronouns' },
  agreement: { vi: 'Hoà hợp chủ – vị', en: 'Subject–verb agreement' },
  passive: { vi: 'Bị động', en: 'Passive voice' },
  tense: { vi: 'Thì', en: 'Verb tenses' },
  quantifier: { vi: 'Lượng từ', en: 'Quantifiers' },
  gerund: { vi: 'Danh động từ và động từ nguyên mẫu', en: 'Gerunds and infinitives' },
  conjunction: { vi: 'Liên từ chỉ sự tương phản', en: 'Contrast conjunctions' },
  comparative: { vi: 'So sánh hơn', en: 'Comparatives' },
} satisfies Record<string, Bi>;

const SUBJECTS = ['Ms. Lan', 'Mr. Hoang', 'The engineer', 'Our analyst', 'The team lead', 'The clerk'];

const ADVERB_PAIRS = [
  { adj: 'careful', adv: 'carefully', noun: 'carefulness' },
  { adj: 'prompt', adv: 'promptly', noun: 'promptness' },
  { adj: 'thorough', adv: 'thoroughly', noun: 'thoroughness' },
  { adj: 'accurate', adv: 'accurately', noun: 'accuracy' },
  { adj: 'efficient', adv: 'efficiently', noun: 'efficiency' },
  { adj: 'quick', adv: 'quickly', noun: 'quickness' },
];
const ADVERB_VERB_PHRASES = ['reviewed the contract', 'processed the orders', 'answered the questions', 'checked the figures', 'handled the complaint'];

const ADJECTIVE_PAIRS = [
  { adj: 'reliable', adv: 'reliably', noun: 'reliability', verb: 'rely', frames: ['needs a ___ {n} for the project.', 'hired a ___ {n} last month.'], nouns: ['assistant', 'supplier', 'partner'] },
  { adj: 'considerable', adv: 'considerably', noun: 'consideration', verb: 'consider', frames: ['reported a ___ {n} in orders this year.'], nouns: ['increase', 'rise', 'gain'] },
];

const PREPOSITION_DATES = ['Friday', 'the end of June', 'noon on Monday', 'the first week of May'];
const DEADLINE_NOUNS = ['final report', 'project plan', 'expense claim'];
const COLLOCATION_FRAMES = ['Please', 'Could you', 'Ms. Lan asks you to'];

const COLLOCATIONS = [
  { noun: 'a payment', verb: 'make' },
  { noun: 'progress', verb: 'make' },
  { noun: 'a mistake', verb: 'make' },
];

const RELATIVE_OBJECT = [
  { head: 'The client', clause: 'we met last week' },
  { head: 'The client', clause: 'we visited in May' },
  { head: 'The investor', clause: 'we contacted in March' },
];
const RELATIVE_POSSESSIVE = [
  { head: 'The supplier', clause: 'office is in Da Nang' },
  { head: 'The supplier', clause: 'factory is in Binh Duong' },
  { head: 'The partner', clause: 'warehouse is in Hai Phong' },
];

const AGREEMENT_SUBJECTS = ['Many of the applicants', 'Several of the managers', 'Most of the reports', 'Both of the proposals'];
const COUNT_SUBJECTS = ['The number of applicants', 'The number of complaints', 'The number of visitors'];
const PASSIVE_PAIRS = [
  { noun: 'The report', base: 'prepare', pp: 'prepared', time: 'last Monday' },
  { noun: 'The invoice', base: 'send', pp: 'sent', time: 'yesterday' },
  { noun: 'The order', base: 'ship', pp: 'shipped', time: 'last week' },
];

function adverbDrafts(): Draft[] {
  const out: Draft[] = [];
  ADVERB_PAIRS.forEach((pair, p) => {
    SUBJECTS.forEach((subject, s) => {
      ADVERB_VERB_PHRASES.forEach((phrase, v) => {
        out.push({
          id: `adv:${p}:${s}:${v}`,
          focus: 'part_of_speech',
          kind: KIND.adverb,
          level: 'easy',
          stem: `${subject} ${phrase} ___.`,
          correct: pair.adv,
          distractors: [
            { text: pair.adj, tag: 'adj_for_adv' },
            { text: pair.noun, tag: 'noun_for_adv' },
            { text: `more ${pair.adj}`, tag: 'comparative_for_adv' },
          ],
          explanation: {
            vi: 'Cần trạng từ để bổ nghĩa cho động từ. Tính từ và danh từ không đứng sau động từ để chỉ cách làm.',
            en: 'An adverb is needed to modify the verb. Adjectives and nouns cannot describe how an action is done.',
          },
        });
      });
    });
  });
  return out;
}

function adjectiveDrafts(): Draft[] {
  const out: Draft[] = [];
  ADJECTIVE_PAIRS.forEach((pair, p) => {
    pair.frames.forEach((frame, f) => {
      pair.nouns.forEach((noun, n) => {
        SUBJECTS.forEach((subject, s) => {
          out.push({
            id: `adj:${p}:${f}:${n}:${s}`,
            focus: 'part_of_speech',
            kind: KIND.adjective,
            level: p === 1 ? 'medium' : 'easy',
            stem: `${subject} ${frame.replace('{n}', noun)}`,
            correct: pair.adj,
            distractors: [
              { text: pair.adv, tag: 'adv_for_adj' },
              { text: pair.noun, tag: 'noun_for_adj' },
              { text: pair.verb, tag: 'verb_for_adj' },
            ],
            explanation: {
              vi: 'Trước danh từ cần tính từ để bổ nghĩa cho danh từ đó.',
              en: 'An adjective is needed before a noun to describe it.',
            },
          });
        });
      });
    });
  });
  return out;
}

function prepositionDrafts(): Draft[] {
  return PREPOSITION_DATES.flatMap((date, d) =>
    DEADLINE_NOUNS.map((noun, n) => ({
      id: `prep:${d}:${n}`,
      focus: 'grammar' as const,
      kind: KIND.preposition,
      level: 'easy' as const,
      stem: `The ${noun} is due ___ ${date}.`,
      correct: 'by',
      distractors: [
        { text: 'until', tag: 'wrong_preposition' as const },
        { text: 'since', tag: 'wrong_preposition' as const },
        { text: 'during', tag: 'wrong_preposition' as const },
      ],
      explanation: {
        vi: 'Hạn chót dùng "by" (không muộn hơn mốc đó). "Until", "since", "during" không đi với "due" để chỉ hạn.',
        en: 'Use "by" for a deadline (no later than that time). "Until", "since" and "during" do not express a deadline with "due".',
      },
    })),
  );
}

function collocationDrafts(): Draft[] {
  return COLLOCATIONS.flatMap((c, i) =>
    COLLOCATION_FRAMES.map((frame, s) => ({
      id: `coll:${i}:${s}`,
      focus: 'vocabulary' as const,
      kind: KIND.collocation,
      level: 'medium' as const,
      stem: `${frame} ___ ${c.noun} by Monday.`,
      correct: c.verb,
      distractors: [
        { text: 'do', tag: 'wrong_collocation' as const },
        { text: 'have', tag: 'wrong_collocation' as const },
        { text: 'keep', tag: 'wrong_collocation' as const },
      ],
      explanation: {
        vi: 'Cụm cố định là "make" + danh từ (make a payment, make progress, make a mistake).',
        en: 'The fixed collocation is "make" + noun (make a payment, make progress, make a mistake).',
      },
    })),
  );
}

function relativeDrafts(): Draft[] {
  const objectDrafts = RELATIVE_OBJECT.map((r, i) => ({
    id: `rel-obj:${i}`,
    focus: 'grammar' as const,
    kind: KIND.relative,
    level: 'medium' as const,
    stem: `${r.head}, ___ ${r.clause}, signed the contract.`,
    correct: 'whom',
    distractors: [
      { text: 'who', tag: 'wrong_relative' as const },
      { text: 'which', tag: 'wrong_relative' as const },
      { text: 'whose', tag: 'wrong_relative' as const },
    ],
    explanation: {
      vi: '"Whom" làm tân ngữ cho người trong mệnh đề quan hệ ("we met" có tân ngữ là người đó).',
      en: '"Whom" is the object of the relative clause for a person ("we met" needs an object).',
    },
  }));
  const possessiveDrafts = RELATIVE_POSSESSIVE.map((r, i) => ({
    id: `rel-poss:${i}`,
    focus: 'grammar' as const,
    kind: KIND.relative,
    level: 'medium' as const,
    stem: `${r.head}, ___ ${r.clause}, delivered the parts.`,
    correct: 'whose',
    distractors: [
      { text: 'who', tag: 'wrong_relative' as const },
      { text: 'which', tag: 'wrong_relative' as const },
      { text: 'whom', tag: 'wrong_relative' as const },
    ],
    explanation: {
      vi: '"Whose" chỉ sở hữu. Mệnh đề sau đó cho biết "office", "factory" hoặc "warehouse" thuộc về người/đơn vị này.',
      en: '"Whose" shows possession: the clause that follows names something that belongs to the person or company.',
    },
  }));
  return [...objectDrafts, ...possessiveDrafts];
}

function agreementDrafts(): Draft[] {
  const plural = AGREEMENT_SUBJECTS.map((subject, i) => ({
    id: `agr-plural:${i}`,
    focus: 'grammar' as const,
    kind: KIND.agreement,
    level: 'medium' as const,
    stem: `${subject} ___ ready for review.`,
    correct: 'are',
    distractors: [
      { text: 'is', tag: 'wrong_agreement' as const },
      { text: 'has', tag: 'wrong_agreement' as const },
      { text: 'be', tag: 'wrong_verb_form' as const },
    ],
    explanation: {
      vi: 'Chủ ngữ "many of / several of / most of / both of" theo sau là danh từ số nhiều, nên động từ chia số nhiều: "are".',
      en: 'With "many of / several of / most of / both of" followed by a plural noun, the verb is plural: "are".',
    },
  }));
  const singular = COUNT_SUBJECTS.map((subject, i) => ({
    id: `agr-count:${i}`,
    focus: 'grammar' as const,
    kind: KIND.agreement,
    level: 'hard' as const,
    stem: `${subject} ___ increased this year.`,
    correct: 'has',
    distractors: [
      { text: 'have', tag: 'wrong_agreement' as const },
      { text: 'are', tag: 'wrong_agreement' as const },
      { text: 'were', tag: 'wrong_tense' as const },
    ],
    explanation: {
      vi: 'Chủ ngữ là "the number of + danh từ số nhiều", nhưng trung tâm ngữ pháp là "the number" (số ít), nên động từ là "has".',
      en: '"The number of + plural noun" takes a singular verb, because "number" is the head: "has increased".',
    },
  }));
  const extra = {
    id: 'agr-neither:0',
    focus: 'grammar' as const,
    kind: KIND.agreement,
    level: 'hard' as const,
    stem: 'Neither of the candidates ___ the required certificate.',
    correct: 'has',
    distractors: [
      { text: 'have', tag: 'wrong_agreement' as const },
      { text: 'are', tag: 'wrong_agreement' as const },
      { text: 'had', tag: 'wrong_tense' as const },
    ],
    explanation: {
      vi: '"Neither of + danh từ số nhiều" vẫn đi với động từ số ít: "neither ... has".',
      en: '"Neither of" plus a plural noun still takes a singular verb: "neither ... has".',
    },
  };
  return [...plural, ...singular, extra];
}

function passiveDrafts(): Draft[] {
  return PASSIVE_PAIRS.map((pair, i) => ({
    id: `passive:${i}`,
    focus: 'grammar' as const,
    kind: KIND.passive,
    level: 'medium' as const,
    stem: `${pair.noun} ___ by our legal team ${pair.time}.`,
    correct: `was ${pair.pp}`,
    distractors: [
      { text: `is ${pair.pp}`, tag: 'wrong_tense' as const },
      { text: `has ${pair.pp}`, tag: 'wrong_voice' as const },
      { text: `being ${pair.pp}`, tag: 'wrong_voice' as const },
    ],
    explanation: {
      vi: `Hành động đã xảy ra vào thời điểm cụ thể trong quá khứ ("${pair.time}") và chủ ngữ chịu tác động, nên dùng bị động quá khứ: "was ${pair.pp}".`,
      en: `The action happened at a specific past time ("${pair.time}") and the subject receives it, so use the past passive: "was ${pair.pp}".`,
    },
  }));
}

function tenseDrafts(): Draft[] {
  const since = ['The company', 'Our firm'].map((subject, i) => ({
    id: `tense-since:${i}`,
    focus: 'grammar' as const,
    kind: KIND.tense,
    level: 'medium' as const,
    stem: `${subject} ___ three new branches since 2020.`,
    correct: 'has opened',
    distractors: [
      { text: 'opened', tag: 'wrong_tense' as const },
      { text: 'opens', tag: 'wrong_tense' as const },
      { text: 'will open', tag: 'wrong_tense' as const },
    ],
    explanation: {
      vi: '"Since + mốc thời gian" đi với hiện tại hoàn thành: "has opened". Quá khứ đơn không đi với mốc kéo dài đến hiện tại.',
      en: '"Since + a starting point" takes the present perfect: "has opened". The simple past does not fit a period that continues to now.',
    },
  }));
  const forPeriod = ['We', 'Our team'].map((subject, i) => ({
    id: `tense-for:${i}`,
    focus: 'grammar' as const,
    kind: KIND.tense,
    level: 'medium' as const,
    stem: `${subject} ___ on this project for three years.`,
    correct: 'have worked',
    distractors: [
      { text: 'worked', tag: 'wrong_tense' as const },
      { text: 'work', tag: 'wrong_tense' as const },
      { text: 'will work', tag: 'wrong_tense' as const },
    ],
    explanation: {
      vi: '"For + khoảng thời gian" kéo dài đến hiện tại đi với hiện tại hoàn thành: "have worked".',
      en: '"For + a period" that continues up to now takes the present perfect: "have worked".',
    },
  }));
  return [...since, ...forPeriod];
}

function quantifierDrafts(): Draft[] {
  return [
    {
      id: 'quant:0',
      focus: 'grammar' as const,
      kind: KIND.quantifier,
      level: 'medium' as const,
      stem: 'There is not ___ time left before the deadline.',
      correct: 'much',
      distractors: [
        { text: 'many', tag: 'wrong_quantifier' as const },
        { text: 'few', tag: 'wrong_quantifier' as const },
        { text: 'a few', tag: 'wrong_quantifier' as const },
      ],
      explanation: {
        vi: '"Time" là danh từ không đếm được, nên đi với "much". "Many", "few", "a few" dùng cho danh từ đếm được.',
        en: '"Time" is uncountable, so it takes "much". "Many", "few" and "a few" are for countable nouns.',
      },
    },
    {
      id: 'quant:1',
      focus: 'grammar' as const,
      kind: KIND.quantifier,
      level: 'medium' as const,
      stem: 'We have ___ budget left for this quarter.',
      correct: 'little',
      distractors: [
        { text: 'few', tag: 'wrong_quantifier' as const },
        { text: 'many', tag: 'wrong_quantifier' as const },
        { text: 'a few', tag: 'wrong_quantifier' as const },
      ],
      explanation: {
        vi: '"Budget" không đếm được, nên đi với "little" (ít). "Few" và "a few" chỉ dùng cho danh từ đếm được.',
        en: '"Budget" is uncountable, so use "little". "Few" and "a few" are for countable nouns.',
      },
    },
  ];
}

function gerundDrafts(): Draft[] {
  const frames: { stem: string; correct: string; distractors: string[]; tag: Part5Tag }[] = [
    { stem: 'We look forward to ___ from you soon.', correct: 'hearing', distractors: ['hear', 'to hear', 'heard'], tag: 'wrong_verb_form' },
    { stem: 'She is interested in ___ the new software.', correct: 'learning', distractors: ['learn', 'to learn', 'learned'], tag: 'wrong_verb_form' },
    { stem: 'They insisted on ___ the meeting early.', correct: 'starting', distractors: ['start', 'to start', 'started'], tag: 'wrong_verb_form' },
    { stem: 'They are considering ___ a new supplier.', correct: 'switching', distractors: ['switch', 'to switch', 'switched'], tag: 'wrong_verb_form' },
  ];
  return frames.map((f, i) => ({
    id: `gerund:${i}`,
    focus: 'grammar' as const,
    kind: KIND.gerund,
    level: 'hard' as const,
    stem: f.stem,
    correct: f.correct,
    distractors: f.distractors.map((text) => ({ text, tag: f.tag })),
    explanation: {
      vi: 'Sau giới từ "to" (trong "look forward to"), "in", "on" phải dùng danh động từ (V-ing), không dùng động từ nguyên mẫu hay quá khứ.',
      en: 'After a preposition such as "to", "in" or "on" (as in "look forward to"), use a gerund (V-ing), not a base verb or past form.',
    },
  }));
}

function conjunctionDrafts(): Draft[] {
  return [
    {
      id: 'conj:0',
      focus: 'grammar' as const,
      kind: KIND.conjunction,
      level: 'hard' as const,
      stem: '___ the price was high, the team bought the equipment.',
      correct: 'Although',
      distractors: [
        { text: 'Despite', tag: 'wrong_conjunction' as const },
        { text: 'Unless', tag: 'wrong_conjunction' as const },
        { text: 'However', tag: 'wrong_conjunction' as const },
      ],
      explanation: {
        vi: '"Although + mệnh đề" diễn tả sự tương phản. "Despite" cần cụm danh từ, "unless" là điều kiện phủ định, "however" không nối hai mệnh đề trực tiếp.',
        en: '"Although + clause" expresses contrast. "Despite" needs a noun phrase, "unless" gives a negative condition, and "however" cannot join two clauses directly.',
      },
    },
    {
      id: 'conj:1',
      focus: 'grammar' as const,
      kind: KIND.conjunction,
      level: 'hard' as const,
      stem: 'The meeting continued ___ it was late in the evening.',
      correct: 'although',
      distractors: [
        { text: 'despite', tag: 'wrong_conjunction' as const },
        { text: 'unless', tag: 'wrong_conjunction' as const },
        { text: 'however', tag: 'wrong_conjunction' as const },
      ],
      explanation: {
        vi: 'Mệnh đề "it was late" cần liên từ "although". "Despite" đi với danh từ, không đi với mệnh đề.',
        en: 'The clause "it was late" needs "although". "Despite" takes a noun, not a clause.',
      },
    },
  ];
}

function comparativeDrafts(): Draft[] {
  const pairs = [
    { adj: 'fast', comp: 'faster', frame: 'Our new model is ___ than the previous one.' },
    { adj: 'short', comp: 'shorter', frame: 'This route is ___ than the old one.' },
  ];
  return pairs.map((p, i) => ({
    id: `comp:${i}`,
    focus: 'part_of_speech' as const,
    kind: KIND.comparative,
    level: 'easy' as const,
    stem: p.frame,
    correct: p.comp,
    distractors: [
      { text: p.adj, tag: 'wrong_degree' as const },
      { text: `${p.adj === 'fast' ? 'fastest' : 'shortest'}`, tag: 'wrong_degree' as const },
      { text: `more ${p.adj}`, tag: 'wrong_degree' as const },
    ],
    explanation: {
      vi: 'So sánh hơn với "than" dùng dạng hơn của tính từ: "faster", "shorter". Dạng nhất cần "the", dạng gốc không so sánh được.',
      en: 'A comparison with "than" uses the comparative form: "faster", "shorter". The superlative needs "the", and the base form cannot compare.',
    },
  }));
}

function allDrafts(): Draft[] {
  return [
    ...adverbDrafts(),
    ...adjectiveDrafts(),
    ...prepositionDrafts(),
    ...collocationDrafts(),
    ...relativeDrafts(),
    ...agreementDrafts(),
    ...passiveDrafts(),
    ...tenseDrafts(),
    ...quantifierDrafts(),
    ...gerundDrafts(),
    ...conjunctionDrafts(),
    ...comparativeDrafts(),
    ...PART5_BANK,
  ];
}

function toItem(draft: Draft, seed: number): Part5Item {
  const rng = mulberry32(hashString(`${draft.id}:${seed}`));
  const options: Part5Option[] = shuffle(
    [
      { text: draft.correct, correct: true, tag: null },
      ...draft.distractors.map((d) => ({ text: d.text, correct: false, tag: d.tag })),
    ],
    rng,
  );
  return { id: draft.id, focus: draft.focus, kind: draft.kind, level: draft.level, stem: draft.stem, options, explanation: draft.explanation };
}

/** Ngân hàng câu Part 5 do bộ sinh tạo. Cùng seed luôn ra cùng thứ tự và cùng đáp án. */
export function buildPart5Set(seed: string, size = 10, level: IntlLevel | 'all' = 'all'): Part5Item[] {
  const rng = mulberry32(hashString(`part5:${seed}`));
  const pool = allDrafts().filter((d) => level === 'all' || d.level === level);
  const picked = shuffle(pool, rng).slice(0, size);
  return picked.map((draft) => toItem(draft, hashString(seed)));
}

export function part5PoolSize(level: IntlLevel | 'all' = 'all'): number {
  return allDrafts().filter((d) => level === 'all' || d.level === level).length;
}

/** Kiểm câu: đúng một đáp án, bốn lựa chọn khác nhau, đúng một chỗ trống. */
export function isValidPart5Item(item: Part5Item): boolean {
  const texts = item.options.map((o) => o.text);
  const correct = item.options.filter((o) => o.correct).length;
  return (
    item.options.length === 4 &&
    new Set(texts).size === 4 &&
    correct === 1 &&
    item.stem.split('___').length === 2
  );
}
