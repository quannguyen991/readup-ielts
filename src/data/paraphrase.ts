/**
 * Bảng diễn đạt lại — viết tay, dùng cho bộ sinh đề bằng luật.
 *
 * VÌ SAO PHẢI CÓ. Bản sinh-bằng-luật trước chết vì đúng một lý do, ghi rõ trong
 * `offline-generator.ts`: bốn dạng câu chính của IELTS đều đòi DIỄN ĐẠT LẠI ý
 * của bài bằng chữ khác, mà phép thay chuỗi thuần thì hoặc ra câu sai nghĩa,
 * hoặc giữ nguyên đủ chữ để dò ngược.
 *
 * Bảng này là chỗ thoát: nó cấp cho code cái vốn từ mà code không tự có. Không
 * gọi model dòng nào — đây là dữ liệu soạn tay, đọc được, sửa được, và sai ở đâu
 * thì thấy ngay ở đó.
 *
 * NGUYÊN TẮC CHỌN TỪ. Chỉ nhận cặp GIỮ NGUYÊN NGHĨA trong văn cảnh học thuật
 * thông thường. Không nhận cặp "gần đúng": `big`→`enormous` đổi cả mức độ, mà đề
 * TRUE/FALSE thì mức độ chính là chỗ ăn thua. Thà bảng ngắn mà mỗi dòng đúng.
 */

/** Thay được cho nhau mà không đổi nghĩa. Dùng để dựng nhận định ĐÚNG. */
export const SYNONYMS: Readonly<Record<string, string>> = Object.freeze({
  // động từ hay gặp trong bài học thuật
  found: 'discovered',
  discovered: 'found',
  showed: 'demonstrated',
  demonstrated: 'showed',
  used: 'employed',
  employed: 'used',
  caused: 'led to',
  produced: 'generated',
  generated: 'produced',
  reduced: 'lowered',
  lowered: 'reduced',
  increased: 'rose',
  rose: 'increased',
  began: 'started',
  started: 'began',
  allowed: 'permitted',
  permitted: 'allowed',
  required: 'needed',
  needed: 'required',
  received: 'obtained',
  obtained: 'received',
  changed: 'altered',
  altered: 'changed',
  removed: 'eliminated',
  helped: 'assisted',
  built: 'constructed',
  constructed: 'built',
  measured: 'recorded',
  suggested: 'proposed',
  proposed: 'suggested',
  believed: 'thought',
  argued: 'claimed',
  claimed: 'argued',
  noticed: 'observed',
  observed: 'noticed',
  affected: 'influenced',
  influenced: 'affected',
  prevented: 'stopped',
  contained: 'held',
  supported: 'backed',
  developed: 'created',
  created: 'developed',
  reached: 'attained',
  remained: 'stayed',
  stayed: 'remained',

  // tính từ và trạng từ
  difficult: 'hard',
  hard: 'difficult',
  common: 'widespread',
  widespread: 'common',
  rare: 'uncommon',
  uncommon: 'rare',
  important: 'significant',
  significant: 'important',
  quickly: 'rapidly',
  rapidly: 'quickly',
  slowly: 'gradually',
  gradually: 'slowly',
  entirely: 'completely',
  completely: 'entirely',
  mainly: 'largely',
  largely: 'mainly',
  usually: 'typically',
  typically: 'usually',
  recently: 'lately',
  expensive: 'costly',
  costly: 'expensive',
  dangerous: 'hazardous',
  hazardous: 'dangerous',
  ancient: 'very old',
  modern: 'contemporary',
  contemporary: 'modern',
  huge: 'very large',
  tiny: 'very small',

  // danh từ
  scientists: 'researchers',
  researchers: 'scientists',
  study: 'research',
  research: 'study',
  problem: 'difficulty',
  difficulty: 'problem',
  method: 'technique',
  technique: 'method',
  result: 'outcome',
  outcome: 'result',
  reason: 'cause',
  cause: 'reason',
  area: 'region',
  region: 'area',
  people: 'individuals',
  individuals: 'people',
  children: 'young people',
  money: 'funding',
  funding: 'money',
  goal: 'aim',
  aim: 'goal',
  change: 'shift',
  effect: 'impact',
  impact: 'effect',
});

/**
 * Đảo nghĩa. Dùng để dựng nhận định SAI — và mỗi cặp là MỘT lỗi có tên.
 *
 * Cùng cách làm với đáp án nhiễu của SAT Math: nhiễu không phải giá trị bịa, nó
 * là kết quả của việc phá đúng một luật có tên. Ở đây cũng vậy — người học chọn
 * nhầm thì biết mình đã đọc lướt qua chỗ nào.
 */
export const ANTONYMS: Readonly<Record<string, string>> = Object.freeze({
  increased: 'decreased',
  decreased: 'increased',
  rose: 'fell',
  fell: 'rose',
  more: 'less',
  less: 'more',
  higher: 'lower',
  lower: 'higher',
  larger: 'smaller',
  smaller: 'larger',
  longer: 'shorter',
  shorter: 'longer',
  faster: 'slower',
  slower: 'faster',
  earlier: 'later',
  later: 'earlier',
  before: 'after',
  after: 'before',
  easy: 'difficult',
  difficult: 'easy',
  common: 'rare',
  rare: 'common',
  possible: 'impossible',
  succeeded: 'failed',
  failed: 'succeeded',
  improved: 'worsened',
  accepted: 'rejected',
  rejected: 'accepted',
  supported: 'opposed',
  opposed: 'supported',
  allowed: 'banned',
  banned: 'allowed',
});

/** Lượng từ — chỗ mất điểm TFNG nhiều nhất, nên tách riêng thành một luật. */
export const QUANTIFIER_FLIPS: Readonly<Record<string, string>> = Object.freeze({
  all: 'some',
  some: 'all',
  every: 'some',
  most: 'few',
  few: 'most',
  many: 'few',
  always: 'never',
  never: 'always',
  often: 'rarely',
  rarely: 'often',
  only: 'also',
  entirely: 'partly',
  partly: 'entirely',
  both: 'neither',
});

/** Tên của từng luật phá — hiện ra trong lời giải để người học biết mình sai gì. */
export type MutationRule = 'antonym' | 'quantifier' | 'number' | 'agent-swap';

export const MUTATION_LABEL: Readonly<Record<MutationRule, string>> = Object.freeze({
  antonym: 'đảo nghĩa một từ khoá',
  quantifier: 'đổi lượng từ (all/some, always/never…)',
  number: 'đổi con số',
  'agent-swap': 'đổi chủ thể của hành động',
});
