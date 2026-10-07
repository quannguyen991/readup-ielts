/**
 * Bài từ vựng SAT — mỗi CHỦ ĐỀ là một bài, ít nhất 30 từ (người dùng yêu cầu
 * 30/09/2026: "mỗi cái ít phải 30 từ cho từng chủ đề"; trước đó bài bị cắt còn
 * 4–13 từ). Mỗi bài là một "bộ học" chạy được mọi chế độ của màn Từ vựng (thẻ
 * lật, Học, Nghe chép, Điền câu, Kiểm tra, Bóng bay) — các chế độ đó tự chia
 * lượt học nhỏ nên một bài 30+ từ vẫn học được theo từng buổi ngắn.
 *
 * - SAT Math: thuật ngữ đề bài, cắt theo mảng kiến thức.
 * - SAT Verbal: từ của dạng Words in Context gom theo CHỦ ĐỀ NGHĨA, để các cặp
 *   trái nghĩa (provisional ↔ permanent, candid ↔ reticent) nằm cùng một bài;
 *   từ nối gom theo quan hệ logic.
 */
import { SAT_VOCAB_CATEGORY_LABEL, SAT_VOCAB_CATEGORY_ORDER, SAT_VOCAB_TERMS } from '../sat-math-vocab';
import { SAT_RW_LEXICON } from '../sat-rw-lexicon';
import { THEME_ADDITIONS as ADD_A } from '../sat-rw-lexicon-more-a';
import { THEME_ADDITIONS as ADD_B } from '../sat-rw-lexicon-more-b';
import { THEME_ADDITIONS as ADD_C } from '../sat-rw-lexicon-more-c';
import type { StudyWord } from '@/services/vocab/topic-study';

export type VocabLesson = {
  slug: string;
  subject: 'math' | 'verbal';
  title: string;
  blurb: string;
  words: StudyWord[];
};

// ------------------------------------------------------------------ Math
/** Mỗi mảng kiến thức một bài (không cắt nhỏ). */
const mathLessons: VocabLesson[] = [];
for (const cat of SAT_VOCAB_CATEGORY_ORDER) {
  const terms = SAT_VOCAB_TERMS.filter((t) => t.category === cat);
  const parts = [terms];
  parts.forEach((part) => {
    mathLessons.push({
      slug: `sat-math-bai-${mathLessons.length + 1}`,
      subject: 'math',
      title: SAT_VOCAB_CATEGORY_LABEL[cat],
      blurb: `${part.length} thuật ngữ · ` + part.slice(0, 4).map((t) => t.term).join(', ') + '…',
      words: part.map((t) => ({
        word: t.term,
        pos: '',
        ipa: '',
        meaningVi: t.meaningVi,
        definitionEn: t.definitionEn,
        example: t.example,
        collocation: '',
        band: SAT_VOCAB_CATEGORY_LABEL[cat],
      })),
    });
  });
}

// ---------------------------------------------------------------- Verbal
/** Thứ tự từ trong mỗi bài = thứ tự học; cặp trái nghĩa đặt cạnh nhau. */
export const VERBAL_THEMES_BASE: { title: string; blurb: string; words: string[] }[] = [
  { title: 'Từ nối: kết quả và bổ sung', blurb: 'therefore, thus, as a result, moreover…', words: ['therefore', 'thus', 'consequently', 'as a result', 'moreover', 'furthermore', 'in addition'] },
  { title: 'Từ nối: tương phản và nhượng bộ', blurb: 'however, by contrast, nevertheless, even so', words: ['however', 'by contrast', 'nevertheless', 'even so'] },
  { title: 'Từ nối: ví dụ, diễn giải, thời gian', blurb: 'for example, that is, previously, meanwhile…', words: ['for example', 'for instance', 'that is', 'in other words', 'previously', 'subsequently', 'meanwhile'] },
  { title: 'Chắc chắn hay còn bỏ ngỏ', blurb: 'provisional ↔ permanent, undisputed ↔ controversial', words: ['provisional', 'permanent', 'temporary', 'settled', 'undisputed', 'controversial', 'contentious', 'tenuous', 'inevitable', 'preliminary', 'hypothetical', 'theoretical'] },
  { title: 'Thật, giả và trung thực', blurb: 'candid ↔ reticent, accurate ↔ fabricated', words: ['accurate', 'inaccurate', 'mistaken', 'fabricated', 'fraudulent', 'dishonest', 'candid', 'reticent', 'fictional', 'original', 'derivative'] },
  { title: 'Kỹ lưỡng hay qua loa', blurb: 'meticulous ↔ cursory, intentional ↔ accidental', words: ['meticulous', 'thorough', 'cursory', 'exhaustive', 'selective', 'arbitrary', 'intentional', 'accidental', 'incremental', 'immediate', 'brief'] },
  { title: 'Thấy được, nghe được', blurb: 'conspicuous ↔ camouflaged, audible ↔ inaudible', words: ['obvious', 'obscure', 'conspicuous', 'camouflaged', 'invisible', 'audible', 'inaudible', 'illegible', 'silent', 'motionless', 'static'] },
  { title: 'Mạnh, yếu, lợi, hại', blurb: 'fragile ↔ resilient, harmless ↔ invasive', words: ['fragile', 'resilient', 'harmless', 'innocuous', 'invasive', 'useful', 'irrelevant', 'insignificant', 'urgent', 'expensive'] },
  { title: 'Phổ biến, hiếm và đều đặn', blurb: 'ubiquitous ↔ unprecedented, uniform ↔ uneven', words: ['ubiquitous', 'unprecedented', 'predictable', 'uniform', 'uneven', 'monotonous', 'eclectic', 'seasonal', 'regional', 'recent', 'prolific'] },
  { title: 'Con người, thái độ và nơi chốn', blurb: 'indifferent, ambivalent, unanimous, austere…', words: ['indifferent', 'ambivalent', 'uninformed', 'unanimous', 'amateur', 'technical', 'experimental', 'austere', 'cluttered', 'crowded', 'confidential', 'illegal', 'unfinished'] },
  { title: 'Dữ liệu và cụm từ cố định', blurb: 'statistical ↔ anecdotal, consistent with ↔ at odds with', words: ['statistical', 'anecdotal', 'derived from', 'indifferent to', 'consistent with', 'at odds with'] },
  {
    title: 'Luận cứ khoa học, kiểm chứng và bác bỏ',
    blurb: 'postulate, anomaly, untenable, conjecture, scrutinize…',
    words: [
      'postulate', 'anomaly', 'untenable', 'conjecture', 'subvert',
      'paradoxical', 'nuance', 'scrutinize', 'discrepancy', 'attenuate',
      'extrapolate', 'salient', 'validity', 'preclude', 'elucidate',
      'rebuttal', 'axiom', 'concur', 'dissent', 'incongruous',
      'confound', 'fallacy', 'antithesis', 'correlate', 'diverge',
      'deduce', 'presuppose', 'tenable', 'corroborating', 'refutation',
      'substantiating', 'substantiation',
    ],
  },
  {
    title: 'Văn học, tâm lý và tính cách nhân vật',
    blurb: 'aloof, gregarious, condescending, disdain, earnest, poignant…',
    words: [
      'aloof', 'gregarious', 'condescending', 'deferential', 'disdain',
      'veneration', 'earnest', 'flippant', 'melancholy', 'loquacious',
      'resolute', 'vacillating', 'indignant', 'complacent', 'cynical',
      'ingenuous', 'ostentatious', 'unpretentious', 'temperament', 'trepidation',
      'solitude', 'wistful', 'impetuous', 'fastidious', 'sardonic',
      'capricious', 'benevolent', 'malevolent', 'penchant', 'animosity',
      'stoic', 'fickle',
    ],
  },
  {
    title: 'Lịch sử, quyền lực và cải cách xã hội',
    blurb: 'sovereignty, autonomy, emancipate, disenfranchise, egalitarian…',
    words: [
      'sovereignty', 'autonomy', 'subjugation', 'emancipate', 'disenfranchise',
      'enfranchise', 'hegemony', 'oppressive', 'egalitarian', 'hierarchical',
      'advocate', 'adversary', 'rhetoric', 'sedition', 'tyranny',
      'insurrection', 'subversion', 'ratify', 'repeal', 'polarization',
      'discourse', 'mandate', 'faction', 'solidarity', 'encroachment',
      'grievance', 'partisanship', 'coercion', 'precedent', 'inalienable',
      'usurp', 'clemency',
    ],
  },
  {
    title: 'Tự nhiên, biến đổi và sinh thái',
    blurb: 'symbiotic, equilibrium, mitigate, deplete, proliferate, biodiversity…',
    words: [
      'symbiotic', 'parasitic', 'equilibrium', 'catalyst', 'mitigate',
      'exacerbate', 'deplete', 'replenish', 'proliferate', 'dwindle',
      'volatile', 'precipitate', 'endemic', 'biodiversity', 'degradation',
      'succumb', 'adaptation', 'finite', 'inexhaustible', 'flora',
      'fauna', 'contamination', 'arid', 'forage', 'disperse',
      'canopy', 'pristine', 'terrestrial', 'viable', 'sediment',
      'carnivore', 'herbivore',
    ],
  },
];

/** Chủ đề đầy đủ: từ gốc + từ bổ sung 30/09/2026 (mỗi chủ đề ≥ 30 từ) + từ của bộ câu khó 01/10/2026. */
export const VERBAL_THEMES = VERBAL_THEMES_BASE.map((t, i) => ({ ...t, words: [...t.words, ...(ADD_A[i] ?? []), ...(ADD_B[i] ?? []), ...(ADD_C[i] ?? [])] }));

const verbalLessons: VocabLesson[] = VERBAL_THEMES.map((theme, i) => ({
  slug: `sat-verbal-bai-${i + 1}`,
  subject: 'verbal',
  title: theme.title,
  blurb: `${theme.words.length} từ · ${theme.blurb}`,
  words: theme.words.map((w) => {
    const e = SAT_RW_LEXICON[w]!;
    return {
      word: w,
      pos: e.logic ? `từ nối · ${e.logic}` : e.pos,
      ipa: '',
      meaningVi: e.meaningVi,
      definitionEn: e.definitionEn,
      example: e.example,
      collocation: '',
      band: e.logic ? 'Từ nối' : 'Words in Context',
      synonyms: e.synonyms,
      antonyms: e.antonyms,
    };
  }),
}));

export const SAT_MATH_VOCAB_LESSONS = mathLessons;
export const SAT_VERBAL_VOCAB_LESSONS = verbalLessons;
export const SAT_VOCAB_LESSONS: VocabLesson[] = [...mathLessons, ...verbalLessons];
