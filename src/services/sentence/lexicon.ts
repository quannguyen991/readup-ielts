import { IRREGULAR_VERBS } from '@/data/irregular-verbs';

/**
 * Từ điển nhỏ + phép chia động từ cho bộ phân tích câu bằng LUẬT.
 *
 * KHÔNG GỌI AI, KHÔNG MẠNG. Mọi thứ ở đây là bảng tay và quy tắc hình thái, nên
 * chạy được ngoại tuyến, cho cùng một kết quả ở mọi lần, và sai ở đâu thì sửa
 * đúng ở đó. Đổi lại nó chỉ đoán từ loại ở mức "đủ để chia khối câu" — không
 * phải bộ phân tích cú pháp đầy đủ. Mọi chỗ dùng nó phải chịu được việc đoán sai
 * (hạ về "không chắc" thay vì khẳng định bậy).
 */

export const PRONOUN_SUBJECT = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they']);
export const PRONOUN_OBJECT: Record<string, string> = {
  i: 'me', you: 'you', he: 'him', she: 'her', it: 'it', we: 'us', they: 'them',
};
export const PRONOUN_OBJECT_SET = new Set(['me', 'him', 'her', 'us', 'them']);

export const DETERMINERS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'some', 'any', 'no', 'every', 'each', 'many', 'much', 'most', 'all', 'several', 'few', 'another', 'both',
  'other', 'more', 'less', 'fewer', 'enough', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'twenty', 'thirty', 'half', 'whole', 'either', 'neither', 'such', 'what', 'which', 'whose',
]);

export const BE_FORMS = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
export const HAVE_FORMS = new Set(['have', 'has', 'had', 'having']);
export const DO_FORMS = new Set(['do', 'does', 'did']);
export const MODALS = new Set(['will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must']);

/** Dạng rút gọn → [từ đứng trước, trợ động từ]. */
export const CONTRACTIONS: Record<string, [string, string]> = {
  "i'm": ['i', 'am'], "i've": ['i', 'have'], "i'll": ['i', 'will'], "i'd": ['i', 'would'],
  "you're": ['you', 'are'], "you've": ['you', 'have'], "you'll": ['you', 'will'], "you'd": ['you', 'would'],
  "he's": ['he', 'is'], "she's": ['she', 'is'], "it's": ['it', 'is'], "he'll": ['he', 'will'], "she'll": ['she', 'will'],
  "we're": ['we', 'are'], "we've": ['we', 'have'], "we'll": ['we', 'will'], "we'd": ['we', 'would'],
  "they're": ['they', 'are'], "they've": ['they', 'have'], "they'll": ['they', 'will'], "they'd": ['they', 'would'],
  "there's": ['there', 'is'], "that's": ['that', 'is'], "let's": ['let', 'us'],
};
export const NEGATIVE_AUX: Record<string, string> = {
  "don't": 'do', "doesn't": 'does', "didn't": 'did', "isn't": 'is', "aren't": 'are', "wasn't": 'was',
  "weren't": 'were', "haven't": 'have', "hasn't": 'has', "hadn't": 'had', "won't": 'will', "can't": 'can',
  "couldn't": 'could', "shouldn't": 'should', "wouldn't": 'would', "mustn't": 'must', "cannot": 'can',
};

export const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'about', 'into', 'over', 'under', 'after',
  'before', 'during', 'between', 'through', 'across', 'near', 'without', 'within', 'among', 'against', 'around',
  'behind', 'beside', 'despite', 'until', 'since', 'upon', 'toward', 'towards', 'along', 'beyond', 'per', 'like',
  'throughout', 'above', 'below', 'beneath', 'opposite', 'outside', 'inside', 'off', 'onto', 'past', 'as', 'via',
]);

/** Từ nối phụ thuộc luôn mở một mệnh đề. */
export const SUBORDINATORS = new Set([
  'because', 'although', 'though', 'whereas', 'unless', 'if', 'when', 'whenever', 'while', 'whether',
]);
/** Từ vừa là giới từ vừa là liên từ — chỉ là liên từ khi theo sau là một mệnh đề. */
export const AMBIGUOUS_SUBORDINATORS = new Set(['before', 'after', 'since', 'until', 'as', 'once']);
export const RELATIVE_PRONOUNS = new Set(['who', 'whom', 'whose', 'which', 'where']);

export const TIME_WORDS = new Set([
  'today', 'tomorrow', 'yesterday', 'tonight', 'now', 'nowadays', 'recently', 'later', 'soon', 'then', 'morning',
  'evening', 'afternoon', 'night', 'week', 'weekend', 'weekends', 'month', 'year', 'years', 'decade', 'century',
  'summer', 'winter', 'spring', 'autumn', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  'sunday', 'weekdays', 'day', 'days', 'hour', 'hours', 'minutes', 'minute', 'o’clock', "o'clock", 'past',
]);
export const FREQUENCY_ADVERBS = new Set([
  'always', 'usually', 'often', 'sometimes', 'never', 'rarely', 'seldom', 'generally', 'frequently', 'normally',
  'occasionally', 'typically', 'regularly', 'constantly',
]);
export const PLACE_WORDS = new Set([
  'here', 'there', 'home', 'abroad', 'outside', 'inside', 'upstairs', 'downstairs', 'nearby', 'everywhere',
]);
export const COMMON_ADVERBS = new Set([
  'very', 'too', 'also', 'even', 'only', 'just', 'still', 'already', 'yet', 'ever', 'quite', 'rather', 'really',
  'almost', 'nearly', 'barely', 'hardly', 'not', 'now', 'then', 'again', 'together', 'away', 'back', 'well',
  'fast', 'hard', 'far', 'much', 'more', 'less', 'so', 'therefore', 'however', 'instead', 'otherwise',
  ...FREQUENCY_ADVERBS,
]);

export const LINKING_VERBS = new Set([
  'be', 'become', 'seem', 'look', 'feel', 'remain', 'stay', 'sound', 'get', 'grow', 'turn', 'appear', 'smell', 'taste',
]);

/** Động từ thường đứng đầu câu mệnh lệnh. */
export const IMPERATIVE_VERBS = new Set([
  'turn', 'go', 'take', 'walk', 'keep', 'follow', 'cross', 'continue', 'stop', 'wait', 'make', 'put', 'bring',
  'give', 'tell', 'try', 'remember', 'check', 'use', 'open', 'close', 'read', 'write', 'come', 'look', 'listen',
  'call', 'be', 'let', 'please', 'don’t', "don't", 'pass', 'ask', 'send', 'drink', 'eat', 'add', 'cut', 'heat',
  'wash', 'mix', 'pour', 'stir', 'boil', 'slice', 'peel', 'fill', 'push', 'pull', 'sit', 'stand', 'wake', 'get',
  'start', 'finish', 'save', 'sign', 'fix', 'meet', 'visit', 'leave', 'stay', 'help', 'bake', 'cook', 'drive',
]);

/**
 * Động từ gốc thường gặp. Ghép từ: bảng bất quy tắc của app + danh sách tay này
 * (nhặt từ chính kho câu luyện + động từ hay gặp trong IELTS). Thiếu một động từ
 * thì chỉ làm bộ nhận diện bỏ sót, không làm nó khẳng định sai.
 */
const CORE_VERBS = `accept achieve add address adjust admire admit adopt advise afford agree aim allow answer apologise apologize appear apply
arrange arrive ask assess assist attend attract avoid bake balance bear beat become begin believe belong benefit boil book borrow bring build
buy call cancel care carry catch cause celebrate change charge chase check choose clean clear climb close collect combine come communicate compare
compete complain complete concentrate confirm connect consider consist construct consume contain continue contribute control cook cope cost cover
create cross cry cut damage dance deal decide declare decline decrease deliver demand demonstrate depend describe deserve design destroy develop
die disagree discover discuss display distinguish divide donate doubt draw dream dress drink drive drop earn eat educate emphasise emphasize employ
enable encourage end enjoy ensure enter escape establish evaluate examine exist expand expect experience explain explore express face fail fall
feed feel fight fill find finish fit fix flow fly focus follow forget forgive form gain gather generate get give go grow guess guide handle happen
hate have heal hear heat help hide highlight hire hold hope hurry identify ignore imagine improve include increase indicate influence inform
inspire install intend introduce invent invest invite involve join judge jump keep kill know lack land last laugh launch lead learn leave lend
let lie lift like limit link listen live look lose love maintain make manage mark match matter mean measure meet mention mind miss mix move
need negotiate notice obtain occur offer open operate order organise organize own pack paint park pass pay perform pick plan plant play point
postpone practise practice predict prefer prepare present preserve press prevent print produce promise promote protect prove provide publish pull
push put raise reach read realise realize receive recognise recognize recommend record recover reduce refer reflect refuse regret reject relate
relax rely remain remember remind remove rent repair repeat replace reply report represent request require research reserve respect respond rest
restore result retire return reveal review rise risk run rush save say scroll search see seek seem sell send separate serve set settle share
shop show shut sign sing sit sleep smile solve sort sound speak spend spread stand start stay steal stick stop store study succeed suffer suggest
suit supply support suppose surprise survive swim switch take talk taste teach tell tend test thank think threaten throw touch train transform
translate travel treat trust try turn understand undo update use visit vote wait wake walk want warn wash waste watch wear welcome win wish
wonder work worry write widen weaken strengthen displace transition undermine alleviate pursue incentivize implement comply struggle sweep
substitute symbolise symbolize postpone prioritise prioritize procrastinate vaccinate swallow prescribe diagnose cook substitute symbolise symbolize postpone prioritise prioritize procrastinate vaccinate swallow prescribe diagnose cook argue ensure aspire hinder exceed represent pursue wash wake grow hope hunt hate hide fix delete ruin sweep stain land trust push pull register collect invent admit mention undo bare gradually care admire explain allow develop achieve promise publish recover depart arrange access confirm shop mix enjoy concentrate clean communicate sweep boil rewatch haunt apologize refuse apply delay board fly submit integrate scroll endure rush experience ordered organize allocate lack seek sign donate raise negotiate deserve evaluate highlight demonstrate undermine alleviate transition strengthen incentivize attract implement manage dedicate compete rise replace adapt process strike deliver sustain explore regenerate reproduce screen address widen gather construct comply request shape lead recycle abandon treat struggle restore provide cut fall rent lift swim handle spend wish stir pour slice peel bake heat decrease`.split(/\s+/);

export const VERB_BASE: Set<string> = new Set<string>(CORE_VERBS);
const IRREGULAR_PAST: Map<string, string> = new Map();
const IRREGULAR_PP: Map<string, string> = new Map();
const IRREGULAR_BY_FORM: Map<string, string> = new Map();
for (const v of IRREGULAR_VERBS) {
  const base = v.base.toLowerCase();
  VERB_BASE.add(base);
  const past = v.past.split('/')[0]!.trim().toLowerCase();
  const pp = v.pp.split('/')[0]!.trim().toLowerCase();
  IRREGULAR_PAST.set(base, past);
  IRREGULAR_PP.set(base, pp);
  for (const p of v.past.split('/')) IRREGULAR_BY_FORM.set(p.trim().toLowerCase(), base);
  for (const p of v.pp.split('/')) IRREGULAR_BY_FORM.set(p.trim().toLowerCase(), base);
}
// "be" có hai dạng quá khứ — không đưa vào các bảng bất quy tắc.
IRREGULAR_PAST.delete('be');
for (const f of ['was', 'were', 'been', 'am', 'is', 'are']) IRREGULAR_BY_FORM.delete(f);

const VOWELS = /[aeiou]/;

/** Số âm tiết gần đúng, đủ để quyết định có gấp đôi phụ âm cuối hay không. */
function syllables(word: string): number {
  const m = word.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g);
  return m ? m.length : 1;
}

function doublesFinalConsonant(base: string): boolean {
  if (!/[^aeiou][aeiou][^aeiouwxy]$/.test(base)) return false;
  if (syllables(base) === 1) return true;
  // Hai âm tiết nhấn âm sau: admit, begin, prefer, refer, occur, permit, regret, control, forget, submit.
  return /(admit|begin|prefer|refer|occur|permit|regret|control|forget|submit|commit|equip|compel|propel|transfer|omit)$/.test(base);
}

export function thirdPerson(base: string): string {
  if (/(s|sh|ch|x|z|o)$/.test(base)) return `${base}es`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ies`;
  return `${base}s`;
}

export function gerund(base: string): string {
  if (base === 'be') return 'being';
  if (/ie$/.test(base)) return `${base.slice(0, -2)}ying`;
  if (/[^e]e$/.test(base) && !/(ee|oe|ye)$/.test(base)) return `${base.slice(0, -1)}ing`;
  if (doublesFinalConsonant(base)) return `${base}${base.slice(-1)}ing`;
  return `${base}ing`;
}

export function pastSimple(base: string): string {
  const irr = IRREGULAR_PAST.get(base);
  if (irr) return irr;
  if (/e$/.test(base)) return `${base}d`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ied`;
  if (doublesFinalConsonant(base)) return `${base}${base.slice(-1)}ed`;
  return `${base}ed`;
}

export function pastParticiple(base: string): string {
  const irr = IRREGULAR_PP.get(base);
  if (irr) return irr;
  return pastSimple(base);
}

export type VerbForm = 'base' | 'third' | 'past' | 'pp' | 'ing';
export type VerbReading = { base: string; form: VerbForm };

/**
 * Từ này có thể là dạng chia của động từ nào? Trả TẤT CẢ cách đọc (một từ như
 * "increased" vừa là quá khứ vừa là phân từ). Rỗng nghĩa là không nhận ra.
 */
export function verbReadings(word: string): VerbReading[] {
  const w = word.toLowerCase();
  const out: VerbReading[] = [];
  const push = (base: string, form: VerbForm) => {
    if (!out.some((r) => r.base === base && r.form === form)) out.push({ base, form });
  };
  if (VERB_BASE.has(w)) push(w, 'base');
  const irr = IRREGULAR_BY_FORM.get(w);
  if (irr) {
    if (IRREGULAR_PAST.get(irr) === w || IRREGULAR_PAST.get(irr)?.split('/').includes(w)) push(irr, 'past');
    if (IRREGULAR_PP.get(irr) === w) push(irr, 'pp');
    if (irr === w) push(irr, 'base');
  }
  const test = (cand: string, form: VerbForm) => {
    if (!VERB_BASE.has(cand)) return;
    // be/have/do có quá khứ bất quy tắc riêng — không được sinh dạng -ed giả (be+d = "bed").
    if (cand === 'be' || cand === 'have' || cand === 'do') return;
    const make =
      form === 'third' ? thirdPerson(cand) : form === 'ing' ? gerund(cand) : form === 'past' ? pastSimple(cand) : pastParticiple(cand);
    if (make === w) push(cand, form);
  };
  if (w.length > 2) {
    if (/s$/.test(w)) {
      test(w.slice(0, -1), 'third');
      test(w.slice(0, -2), 'third');
      if (/ies$/.test(w)) test(`${w.slice(0, -3)}y`, 'third');
    }
    if (/ing$/.test(w)) {
      const stem = w.slice(0, -3);
      test(stem, 'ing');
      test(`${stem}e`, 'ing');
      if (/(.)\1$/.test(stem)) test(stem.slice(0, -1), 'ing');
      if (/y$/.test(w.slice(0, -3)) === false && /yi?ng$/.test(w)) test(`${w.slice(0, -4)}ie`, 'ing');
    }
    if (/ed$/.test(w)) {
      const stem = w.slice(0, -2);
      for (const form of ['past', 'pp'] as const) {
        test(stem, form);
        test(`${stem}e`, form);
        if (/(.)\1$/.test(stem)) test(stem.slice(0, -1), form);
        if (/i$/.test(stem)) test(`${stem.slice(0, -1)}y`, form);
      }
      test(w.slice(0, -1), 'past');
      test(w.slice(0, -1), 'pp');
    }
  }
  return out;
}

export function isVerbForm(word: string): boolean {
  return verbReadings(word).length > 0;
}

/** Đổi dạng -ing về động từ gốc nếu đoán được. */
export function fromGerund(word: string): string | null {
  const r = verbReadings(word.toLowerCase()).find((x) => x.form === 'ing');
  return r ? r.base : null;
}

/** Chia lại một động từ gốc theo dạng yêu cầu. */
export function inflect(base: string, form: VerbForm): string {
  switch (form) {
    case 'third': return thirdPerson(base);
    case 'ing': return gerund(base);
    case 'past': return pastSimple(base);
    case 'pp': return pastParticiple(base);
    default: return base;
  }
}

const ADJ_SUFFIX = /(ous|ful|less|ive|able|ible|al|ic|ish|ary|ent|ant|ical|ular|ny|ty|my)$/;
const COMMON_ADJ = new Set(`good bad big small large little long short high low new old young early late easy hard difficult simple free
real true false main major minor public private local national global social economic political cultural modern ancient serious heavy light
cold hot warm cool fresh clean dirty busy quiet loud strong weak rich poor happy sad angry tired healthy sick ill able sure safe dangerous
careful friendly helpful useful important necessary essential popular famous common rare different similar same other own whole entire
daily weekly monthly annual regular recent current future past previous next last first second third final single double double total
full empty open closed wide narrow deep shallow thick thin flat round square plastic digital online remote urban rural coastal renewable
mental physical general particular special specific certain possible impossible likely unlikely available aware ready willing glad
nice kind sweet sour bitter bright dark proud shy brave lazy smart clever stupid funny boring exciting interesting amazing wonderful terrible
extra several numerous various rapid slow quick sudden gradual steady sharp smooth rough soft hard medical legal financial academic
scientific technical creative critical practical theoretical personal professional international domestic foreign native`.split(/\s+/));

export function isAdjectiveLike(word: string): boolean {
  const w = word.toLowerCase();
  return COMMON_ADJ.has(w) || (w.length > 4 && ADJ_SUFFIX.test(w) && !isVerbForm(w));
}

export function isAdverbLike(word: string): boolean {
  const w = word.toLowerCase();
  return COMMON_ADVERBS.has(w) || (w.length > 4 && /ly$/.test(w) && !/^(family|friendly|early|only|daily|weekly|monthly|lonely|likely|lovely|elderly)$/.test(w));
}

/** Từ viết hoa giữa câu không nằm trong bảng → coi là danh từ riêng. */
export function looksLikeProperNoun(word: string, isFirst: boolean): boolean {
  if (isFirst) return false;
  return /^[A-Z][a-z]/.test(word) && word !== 'I';
}

/** Chữ cái đầu đổi thường được an toàn (không phải "I" hay tên riêng). */
export function canLowerFirst(word: string): boolean {
  const lower = word.toLowerCase();
  if (word === 'I' || /^I['’]/.test(word)) return false;
  return (
    DETERMINERS.has(lower) ||
    PRONOUN_SUBJECT.has(lower) ||
    PREPOSITIONS.has(lower) ||
    SUBORDINATORS.has(lower) ||
    COMMON_ADVERBS.has(lower) ||
    BE_FORMS.has(lower) ||
    MODALS.has(lower) ||
    TIME_WORDS.has(lower) ||
    lower === 'there' ||
    lower === 'it' ||
    isVerbForm(lower) ||
    isAdjectiveLike(lower)
  );
}

/**
 * Chuẩn hoá một từ để SO SÁNH: chữ thường, bỏ dấu câu đầu/cuối, nháy cong → thẳng.
 */
export function norm(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

/** Cắt thân từ thô (bỏ -s/-es/-ed/-ing/-ly/-er…) để so khớp "cùng gốc". */
export function stem(word: string): string {
  let w = norm(word);
  if (w.length <= 3) return w;
  const irr = IRREGULAR_BY_FORM.get(w);
  if (irr) w = irr;
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ied') && w.length > 4) return `${w.slice(0, -3)}y`;
  for (const suf of ['ing', 'ed', 'es', 'ly', 'er', 's']) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      let s = w.slice(0, -suf.length);
      if (/(.)\1$/.test(s) && suf !== 'es' && suf !== 's') s = s.slice(0, -1);
      if (s.endsWith('e')) s = s.slice(0, -1);
      return s;
    }
  }
  if (w.endsWith('e') && w.length >= 4) return w.slice(0, -1);
  return w;
}

export { VOWELS };
