/**
 * Bối cảnh cho câu Command of Evidence định lượng.
 *
 * VÌ SAO CÓ NHIỀU BỐI CẢNH. Một khuôn duy nhất thì tới câu thứ năm người học đã
 * đoán được hình dạng đề mà không cần đọc — đúng kiểu hỏng mà bộ đề trộn R&W đã
 * ghi lại: "làm hết unit đại từ thì tới câu thứ năm là đoán được đáp án".
 *
 * BỐI CẢNH CHỌN THEO CHẤT LIỆU SAT HAY DÙNG: nghiên cứu sinh thái, khảo sát xã
 * hội, đo đạc vật liệu — không phải chuyện đời thường. Đề thật lấy văn từ báo
 * khoa học và khoa học xã hội, nên bảng số cũng phải nghe ra như trích từ đó.
 *
 * TÊN THỰC THỂ LÀ TIẾNG ANH và bịa hoàn toàn. Bịa là chủ ý: người học không được
 * phép biết trước con số nào từ kiến thức nền, nếu không thì câu ấy quay lại
 * đúng lỗi 32% đã đo.
 */

export type EvidenceContext = {
  slug: string;
  caption: string;
  entityHeader: string;
  unit: string;
  /** Đơn vị viết trong câu văn — đôi khi khác nhãn cột ("species" vs "loài"). */
  unitPhrase: string;
  entities: readonly string[];
  columns: readonly [string, string];
  /** Khoảng giá trị hợp lý cho bối cảnh này. */
  range: readonly [number, number];
  /** Câu dẫn, chưa gồm nhận định. */
  lead: string;
  /** Cách gọi một thực thể trong câu văn: "reserve", "district"… */
  noun: string;

  /*
    BA CÁCH DIỄN ĐẠT PHẢI KHAI RIÊNG CHO TỪNG BỐI CẢNH, không suy ra được.

    Bản đầu dựng câu theo một khuôn duy nhất và vỡ ngay khi nhãn cột không phải
    năm: "In Heat-treated, Alloy A recorded 524 megapascals" — sai ngữ pháp, và
    "the number of megapascals" thì sai cả về nghĩa vì MPa là đại lượng đo chứ
    không đếm được. Một câu SAT sai ngữ pháp là một câu bỏ đi, dù đáp án đúng.
  */

  /** Dẫn một mốc: "In 2019," hoặc "When untreated,". */
  atColumn: (column: string) => string;
  /** Chủ ngữ của mệnh đề thay đổi: "The number of bird species at Marsh Hollow". */
  measureOf: (entity: string) => string;
  /** Động từ đo được: "recorded" cho số đếm, "measured" cho đại lượng. */
  recordVerb: string;
  /** Nhận định trong bài dẫn, viết riêng để bốn bối cảnh không đọc ra như một. */
  thesisPhrase: (entity: string) => string;
};

export const CONTEXTS: readonly EvidenceContext[] = Object.freeze([
  {
    slug: 'reserve-species',
    caption: 'Table 1. Bird species recorded at four reserves',
    entityHeader: 'Reserve',
    unit: 'species',
    unitPhrase: 'bird species',
    entities: ['Marsh Hollow', 'Pine Ridge', 'Cedar Flats', 'Stone Creek'],
    columns: ['2019', '2022'],
    range: [28, 96],
    lead: 'Ecologists surveyed bird diversity at four protected reserves before and after a wetland restoration programme.',
    noun: 'reserve',
    atColumn: (c) => `In ${c},`,
    measureOf: (e) => `The number of bird species recorded at ${e}`,
    recordVerb: 'recorded',
    thesisPhrase: (e) => `the restoration produced its clearest gain at ${e}`,
  },
  {
    slug: 'library-visits',
    caption: 'Table 1. Weekly visits to four branch libraries (thousands)',
    entityHeader: 'Branch',
    unit: 'thousand visits',
    unitPhrase: 'thousand weekly visits',
    entities: ['Halden', 'Oakmoor', 'Riverton', 'Selby'],
    columns: ['2020', '2023'],
    range: [4, 40],
    lead: 'A city council compared weekly visits at four branch libraries before and after extending opening hours.',
    noun: 'branch',
    atColumn: (c) => `In ${c},`,
    measureOf: (e) => `Weekly visits to ${e}`,
    recordVerb: 'received',
    thesisPhrase: (e) => `the longer hours drew the most additional readers to ${e}`,
  },
  {
    slug: 'alloy-strength',
    caption: 'Table 1. Tensile strength of four alloy samples (MPa)',
    entityHeader: 'Sample',
    unit: 'MPa',
    unitPhrase: 'megapascals',
    entities: ['Alloy A', 'Alloy B', 'Alloy C', 'Alloy D'],
    columns: ['Untreated', 'Heat-treated'],
    range: [180, 640],
    lead: 'Materials engineers measured the tensile strength of four alloy samples before and after heat treatment.',
    noun: 'sample',
    atColumn: (c) => (c === 'Untreated' ? 'Before treatment,' : 'After heat treatment,'),
    measureOf: (e) => `The tensile strength of ${e}`,
    recordVerb: 'measured',
    thesisPhrase: (e) => `heat treatment strengthened ${e} more than any other sample`,
  },
  {
    slug: 'reef-cover',
    caption: 'Table 1. Live coral cover at four survey sites (percent)',
    entityHeader: 'Site',
    unit: '%',
    unitPhrase: 'percent live coral cover',
    entities: ['Anse Bay', 'Kelo Shoal', 'Tarn Point', 'Wyre Bank'],
    columns: ['2018', '2024'],
    range: [9, 74],
    lead: 'Marine biologists recorded live coral cover at four survey sites over a six-year period.',
    noun: 'site',
    atColumn: (c) => `In ${c},`,
    measureOf: (e) => `Live coral cover at ${e}`,
    recordVerb: 'reached',
    thesisPhrase: (e) => `the reef recovered most strongly at ${e}`,
  },
  {
    slug: 'commute-share',
    caption: 'Table 1. Share of commuters cycling in four districts (percent)',
    entityHeader: 'District',
    unit: '%',
    unitPhrase: 'percent of commuters',
    entities: ['Ashfield', 'Bramley', 'Corran', 'Dunmore'],
    columns: ['2017', '2023'],
    range: [3, 38],
    lead: 'Transport researchers tracked the share of commuters cycling to work in four districts after separated bike lanes were installed.',
    noun: 'district',
    atColumn: (c) => `In ${c},`,
    measureOf: (e) => `The share of commuters cycling in ${e}`,
    recordVerb: 'reached',
    thesisPhrase: (e) => `the new lanes changed travel habits most in ${e}`,
  },
]);

export function contextBySlug(slug: string): EvidenceContext | undefined {
  return CONTEXTS.find((c) => c.slug === slug);
}
