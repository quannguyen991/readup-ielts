/**
 * Động từ bất quy tắc thường gặp (V1 – V2 – V3), kèm nghĩa tiếng Việt.
 * Dạng có hai cách viết ghi cách nhau bằng "/" (vd. `burnt/burned`); khi chấm đáp án, dạng nào cũng được.
 * Người học AIO English đề xuất mục này (27 bình chọn) — "không nhớ dạng chia thì phải ra ngoài tra".
 */

export type IrregularVerb = {
  base: string;
  past: string;
  pp: string;
  vi: string;
  /** Điểm dễ nhầm, hiện dưới dòng nghĩa. */
  note?: string;
};

/** Kiểu biến đổi: A = dạng gốc, B/C = dạng khác. */
export type VerbPattern = 'AAA' | 'ABA' | 'ABB' | 'ABC';

export const PATTERN_LABEL: Record<VerbPattern, { vi: string; en: string; hint: string }> = {
  AAA: { vi: 'Giữ nguyên cả ba', en: 'All three the same', hint: 'cut – cut – cut' },
  ABA: { vi: 'V1 = V3', en: 'V1 = V3', hint: 'come – came – come' },
  ABB: { vi: 'V2 = V3', en: 'V2 = V3', hint: 'buy – bought – bought' },
  ABC: { vi: 'Ba dạng khác nhau', en: 'All different', hint: 'go – went – gone' },
};

export const PATTERNS: readonly VerbPattern[] = ['AAA', 'ABA', 'ABB', 'ABC'];

// base | past | pp | nghĩa | ghi chú (tuỳ chọn)
const RAW: ReadonlyArray<readonly [string, string, string, string, string?]> = [
  ['arise', 'arose', 'arisen', 'nảy sinh, xuất hiện'],
  ['awake', 'awoke', 'awoken', 'thức dậy; đánh thức'],
  ['be', 'was/were', 'been', 'thì, là, ở', 'was dùng với I/he/she/it; were dùng với you/we/they.'],
  ['bear', 'bore', 'borne', 'chịu đựng; mang'],
  ['beat', 'beat', 'beaten', 'đánh, đánh bại'],
  ['become', 'became', 'become', 'trở nên, trở thành'],
  ['begin', 'began', 'begun', 'bắt đầu'],
  ['bend', 'bent', 'bent', 'uốn cong, cúi xuống'],
  ['bet', 'bet', 'bet', 'đặt cược'],
  ['bid', 'bid', 'bid', 'đặt giá, trả giá'],
  ['bind', 'bound', 'bound', 'trói, buộc'],
  ['bite', 'bit', 'bitten', 'cắn'],
  ['bleed', 'bled', 'bled', 'chảy máu'],
  ['blow', 'blew', 'blown', 'thổi'],
  ['break', 'broke', 'broken', 'làm vỡ, phá vỡ'],
  ['breed', 'bred', 'bred', 'nuôi, gây giống'],
  ['bring', 'brought', 'brought', 'mang đến'],
  ['broadcast', 'broadcast', 'broadcast', 'phát sóng'],
  ['build', 'built', 'built', 'xây dựng'],
  ['burn', 'burnt/burned', 'burnt/burned', 'đốt cháy'],
  ['burst', 'burst', 'burst', 'nổ tung, vỡ ra'],
  ['buy', 'bought', 'bought', 'mua'],
  ['cast', 'cast', 'cast', 'ném, quăng; chọn vai'],
  ['catch', 'caught', 'caught', 'bắt, chộp lấy'],
  ['choose', 'chose', 'chosen', 'chọn'],
  ['cling', 'clung', 'clung', 'bám chặt'],
  ['come', 'came', 'come', 'đến'],
  ['cost', 'cost', 'cost', 'có giá, tốn'],
  ['creep', 'crept', 'crept', 'bò, lẻn'],
  ['cut', 'cut', 'cut', 'cắt'],
  ['deal', 'dealt', 'dealt', 'giải quyết, xử lý', 'deal with: giải quyết; deal in: buôn bán.'],
  ['dig', 'dug', 'dug', 'đào'],
  ['do', 'did', 'done', 'làm'],
  ['draw', 'drew', 'drawn', 'vẽ; kéo'],
  ['dream', 'dreamt/dreamed', 'dreamt/dreamed', 'mơ, mơ ước'],
  ['drink', 'drank', 'drunk', 'uống'],
  ['drive', 'drove', 'driven', 'lái xe'],
  ['eat', 'ate', 'eaten', 'ăn'],
  ['fall', 'fell', 'fallen', 'rơi, ngã'],
  ['feed', 'fed', 'fed', 'cho ăn'],
  ['feel', 'felt', 'felt', 'cảm thấy'],
  ['fight', 'fought', 'fought', 'đánh nhau, chiến đấu'],
  ['find', 'found', 'found', 'tìm thấy'],
  ['flee', 'fled', 'fled', 'chạy trốn'],
  ['fling', 'flung', 'flung', 'ném mạnh'],
  ['fly', 'flew', 'flown', 'bay'],
  ['forbid', 'forbade', 'forbidden', 'cấm'],
  ['foresee', 'foresaw', 'foreseen', 'đoán trước, lường trước'],
  ['forget', 'forgot', 'forgotten', 'quên'],
  ['forgive', 'forgave', 'forgiven', 'tha thứ'],
  ['freeze', 'froze', 'frozen', 'đóng băng'],
  ['get', 'got', 'got/gotten', 'nhận được; trở nên', 'Anh–Anh dùng got; Anh–Mỹ hay dùng gotten.'],
  ['give', 'gave', 'given', 'cho, tặng'],
  ['go', 'went', 'gone', 'đi'],
  ['grind', 'ground', 'ground', 'xay, nghiền'],
  ['grow', 'grew', 'grown', 'mọc, lớn lên; trồng'],
  ['hang', 'hung', 'hung', 'treo', 'Nghĩa "treo cổ" thì dùng hanged – hanged.'],
  ['have', 'had', 'had', 'có'],
  ['hear', 'heard', 'heard', 'nghe thấy'],
  ['hide', 'hid', 'hidden', 'giấu, trốn'],
  ['hit', 'hit', 'hit', 'đánh, va vào'],
  ['hold', 'held', 'held', 'cầm, giữ, tổ chức'],
  ['hurt', 'hurt', 'hurt', 'làm đau, bị đau'],
  ['keep', 'kept', 'kept', 'giữ'],
  ['kneel', 'knelt/kneeled', 'knelt/kneeled', 'quỳ'],
  ['know', 'knew', 'known', 'biết'],
  ['lay', 'laid', 'laid', 'đặt, để', 'lay cần tân ngữ (lay the book); đừng nhầm với lie (nằm).'],
  ['lead', 'led', 'led', 'dẫn dắt'],
  ['lean', 'leant/leaned', 'leant/leaned', 'nghiêng, dựa vào'],
  ['leap', 'leapt/leaped', 'leapt/leaped', 'nhảy vọt'],
  ['learn', 'learnt/learned', 'learnt/learned', 'học'],
  ['leave', 'left', 'left', 'rời đi, để lại'],
  ['lend', 'lent', 'lent', 'cho mượn'],
  ['let', 'let', 'let', 'để cho, cho phép'],
  ['lie', 'lay', 'lain', 'nằm', 'lie (nằm) khác lie (nói dối): nói dối là lie – lied – lied.'],
  ['light', 'lit', 'lit', 'thắp sáng, châm lửa'],
  ['lose', 'lost', 'lost', 'mất, thua'],
  ['make', 'made', 'made', 'làm, tạo ra'],
  ['mean', 'meant', 'meant', 'có nghĩa là'],
  ['meet', 'met', 'met', 'gặp'],
  ['mislead', 'misled', 'misled', 'đánh lừa, dẫn đi sai'],
  ['mistake', 'mistook', 'mistaken', 'nhầm lẫn'],
  ['outdo', 'outdid', 'outdone', 'làm tốt hơn, vượt trội'],
  ['overcome', 'overcame', 'overcome', 'vượt qua'],
  ['override', 'overrode', 'overridden', 'bác bỏ, ghi đè'],
  ['oversee', 'oversaw', 'overseen', 'giám sát'],
  ['overtake', 'overtook', 'overtaken', 'vượt qua, đuổi kịp'],
  ['pay', 'paid', 'paid', 'trả tiền'],
  ['put', 'put', 'put', 'đặt'],
  ['quit', 'quit', 'quit', 'bỏ, từ bỏ'],
  ['read', 'read', 'read', 'đọc', 'Viết giống nhau nhưng quá khứ đọc là /red/, khác dạng gốc /riːd/.'],
  ['rebuild', 'rebuilt', 'rebuilt', 'xây lại'],
  ['redo', 'redid', 'redone', 'làm lại'],
  ['repay', 'repaid', 'repaid', 'hoàn trả'],
  ['rewrite', 'rewrote', 'rewritten', 'viết lại'],
  ['ride', 'rode', 'ridden', 'cưỡi, đi (xe đạp, xe máy)'],
  ['ring', 'rang', 'rung', 'rung chuông, gọi điện'],
  ['rise', 'rose', 'risen', 'mọc, tăng lên', 'rise không cần tân ngữ; raise (nâng lên) là động từ có quy tắc.'],
  ['run', 'ran', 'run', 'chạy'],
  ['say', 'said', 'said', 'nói'],
  ['see', 'saw', 'seen', 'nhìn thấy'],
  ['seek', 'sought', 'sought', 'tìm kiếm'],
  ['sell', 'sold', 'sold', 'bán'],
  ['send', 'sent', 'sent', 'gửi'],
  ['set', 'set', 'set', 'đặt, thiết lập'],
  ['sew', 'sewed', 'sewn/sewed', 'may, khâu'],
  ['shake', 'shook', 'shaken', 'lắc, rung'],
  ['shed', 'shed', 'shed', 'rụng, đổ (lá, nước mắt)'],
  ['shine', 'shone', 'shone', 'chiếu sáng'],
  ['shoot', 'shot', 'shot', 'bắn'],
  ['show', 'showed', 'shown/showed', 'cho xem, chỉ ra'],
  ['shrink', 'shrank', 'shrunk', 'co lại'],
  ['shut', 'shut', 'shut', 'đóng'],
  ['sing', 'sang', 'sung', 'hát'],
  ['sink', 'sank', 'sunk', 'chìm'],
  ['sit', 'sat', 'sat', 'ngồi'],
  ['sleep', 'slept', 'slept', 'ngủ'],
  ['slide', 'slid', 'slid', 'trượt'],
  ['smell', 'smelt/smelled', 'smelt/smelled', 'ngửi; có mùi'],
  ['sow', 'sowed', 'sown/sowed', 'gieo hạt'],
  ['speak', 'spoke', 'spoken', 'nói'],
  ['speed', 'sped', 'sped', 'tăng tốc, chạy nhanh'],
  ['spell', 'spelt/spelled', 'spelt/spelled', 'đánh vần'],
  ['spend', 'spent', 'spent', 'tiêu (tiền); dành (thời gian)'],
  ['spill', 'spilt/spilled', 'spilt/spilled', 'làm đổ, tràn ra'],
  ['spin', 'spun', 'spun', 'quay, xoay'],
  ['spit', 'spat', 'spat', 'nhổ'],
  ['split', 'split', 'split', 'chia, tách'],
  ['spoil', 'spoilt/spoiled', 'spoilt/spoiled', 'làm hỏng, nuông chiều'],
  ['spread', 'spread', 'spread', 'lan rộng, trải ra'],
  ['spring', 'sprang', 'sprung', 'nhảy bật lên'],
  ['stand', 'stood', 'stood', 'đứng'],
  ['steal', 'stole', 'stolen', 'ăn trộm'],
  ['stick', 'stuck', 'stuck', 'dính, dán'],
  ['sting', 'stung', 'stung', 'đốt, chích'],
  ['stink', 'stank', 'stunk', 'bốc mùi hôi'],
  ['strike', 'struck', 'struck', 'đánh, đập; đình công'],
  ['string', 'strung', 'strung', 'xâu, treo dây'],
  ['strive', 'strove', 'striven', 'cố gắng hết sức'],
  ['swear', 'swore', 'sworn', 'thề; chửi thề'],
  ['sweep', 'swept', 'swept', 'quét'],
  ['swell', 'swelled', 'swollen/swelled', 'sưng, phồng lên'],
  ['swim', 'swam', 'swum', 'bơi'],
  ['swing', 'swung', 'swung', 'đu đưa, vung'],
  ['take', 'took', 'taken', 'lấy, cầm; mất (thời gian)'],
  ['teach', 'taught', 'taught', 'dạy'],
  ['tear', 'tore', 'torn', 'xé, rách'],
  ['tell', 'told', 'told', 'kể, bảo'],
  ['think', 'thought', 'thought', 'nghĩ'],
  ['throw', 'threw', 'thrown', 'ném'],
  ['thrust', 'thrust', 'thrust', 'đẩy mạnh, xô'],
  ['tread', 'trod', 'trodden', 'giẫm lên, bước đi'],
  ['undergo', 'underwent', 'undergone', 'trải qua'],
  ['understand', 'understood', 'understood', 'hiểu'],
  ['undertake', 'undertook', 'undertaken', 'đảm nhận, tiến hành'],
  ['undo', 'undid', 'undone', 'tháo ra, hoàn tác'],
  ['uphold', 'upheld', 'upheld', 'duy trì, giữ vững'],
  ['upset', 'upset', 'upset', 'làm buồn, làm đảo lộn'],
  ['wake', 'woke', 'woken', 'thức dậy; đánh thức'],
  ['wear', 'wore', 'worn', 'mặc, đeo'],
  ['weave', 'wove', 'woven', 'dệt'],
  ['weep', 'wept', 'wept', 'khóc'],
  ['win', 'won', 'won', 'thắng'],
  ['wind', 'wound', 'wound', 'quấn, lên dây', 'wind /waɪnd/ (quấn) khác wind /wɪnd/ (gió).'],
  ['withdraw', 'withdrew', 'withdrawn', 'rút lui, rút tiền'],
  ['withstand', 'withstood', 'withstood', 'chống chịu'],
  ['write', 'wrote', 'written', 'viết'],
];

export const IRREGULAR_VERBS: readonly IrregularVerb[] = RAW.map(([base, past, pp, vi, note]) => ({
  base,
  past,
  pp,
  vi,
  ...(note ? { note } : {}),
}));

export function patternOf(v: Pick<IrregularVerb, 'base' | 'past' | 'pp'>): VerbPattern {
  if (v.base === v.past && v.past === v.pp) return 'AAA';
  if (v.past === v.pp) return 'ABB';
  if (v.base === v.pp) return 'ABA';
  return 'ABC';
}

/** Bỏ dấu tiếng Việt, hạ chữ thường: "Bắt đầu" khớp "bat dau". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Tìm theo dạng gốc / V2 / V3 / nghĩa tiếng Việt. Dạng gốc khớp từ đầu được xếp lên trước. */
export function searchVerbs(query: string, list: readonly IrregularVerb[] = IRREGULAR_VERBS): IrregularVerb[] {
  const q = fold(query);
  if (!q) return [...list];
  const score = (v: IrregularVerb): number => {
    const base = fold(v.base);
    if (base === q) return 0;
    if (base.startsWith(q)) return 1;
    if ([v.past, v.pp].some((f) => f.split('/').some((x) => fold(x) === q))) return 2;
    if (base.includes(q) || fold(v.past).includes(q) || fold(v.pp).includes(q)) return 3;
    if (fold(v.vi).includes(q)) return 4;
    return 9;
  };
  return list
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || a.v.base.localeCompare(b.v.base))
    .map((x) => x.v);
}

/** Một đáp án có đúng không: bỏ khoảng trắng và hoa/thường, dạng nào trong "a/b" cũng được. */
export function isCorrectForm(answer: string, expected: string): boolean {
  const a = answer.trim().toLowerCase();
  if (!a) return false;
  return expected.toLowerCase().split('/').some((form) => form.trim() === a);
}

/** Chọn ngẫu nhiên `count` động từ khác nhau cho bài kiểm tra nhanh. */
export function pickQuizVerbs(count: number, list: readonly IrregularVerb[] = IRREGULAR_VERBS, random: () => number = Math.random): IrregularVerb[] {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
