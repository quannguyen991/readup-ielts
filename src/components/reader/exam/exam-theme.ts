/**
 * Màu và cỡ chữ của phòng thi Reading — MỘT chỗ, để màn đọc, thanh công cụ và
 * khối câu hỏi cùng một giọng. Màu nhấn là vàng kim của Band 9; muốn đổi tông
 * cả màn chỉ cần sửa `accent*` ở đây.
 */
export const EXAM = {
  page: '#F6F3EC',
  white: '#FFFFFF',
  ink: '#1E293B',
  body: '#334155',
  muted: '#6B7280',
  line: '#E8E2D7',
  accent: '#B8955A',
  accentDeep: '#8A6A2E',
  accentSoft: '#F6EEDD',
  accentLine: '#E3D2AE',
  flag: '#E0A93B',
} as const;

export const PAPER_THEMES = [
  { key: 'white', label: 'trắng', labelEn: 'White', bg: '#FFFFFF', ink: '#1C1B16', body: '#35342C', muted: '#8B8878', rule: '#ECE8DA' },
  { key: 'cream', label: 'kem', labelEn: 'Cream', bg: '#FBF6E9', ink: '#1F1B12', body: '#3A3527', muted: '#8E8672', rule: '#EAE2CC' },
  { key: 'sepia', label: 'ngà', labelEn: 'Ivory', bg: '#F3E7CF', ink: '#33281A', body: '#4A3C2A', muted: '#8F7B5E', rule: '#E2D2B2' },
  { key: 'mint', label: 'xanh nhạt', labelEn: 'Light green', bg: '#EDF3E4', ink: '#1F2A12', body: '#33402A', muted: '#76826A', rule: '#D9E3C9' },
] as const;

export type PaperTheme = (typeof PAPER_THEMES)[number];

/** Chữ số La Mã thường (i, ii, iii…) — danh sách List of Headings đánh số kiểu này. */
export function roman(n: number): string {
  const table: [number, string][] = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let rest = n;
  let out = '';
  for (const [value, sym] of table) {
    while (rest >= value) {
      out += sym;
      rest -= value;
    }
  }
  return out;
}

/**
 * Tách lời dẫn TFNG / YNNG thành câu hỏi + ba dòng chú giải (TRUE · FALSE · NOT
 * GIVEN) để xếp hai cột gọn. Không khớp mẫu thì trả `null` và để nguyên văn.
 */
export function parseLegend(rubric: string): { lead: string; rows: { key: string; text: string }[] } | null {
  const lines = rubric.split('\n');
  if (lines.length < 2) return null;
  const m = lines.slice(1).join(' ').match(/^Write\s+(\w+)\s+if\s+(.*?),\s*(\w+)\s+if\s+(.*?),\s*(NOT GIVEN)\s+if\s+(.*?)\.?$/);
  if (!m) return null;
  return {
    lead: lines[0] as string,
    rows: [
      { key: m[1] as string, text: m[2] as string },
      { key: m[3] as string, text: m[4] as string },
      { key: m[5] as string, text: m[6] as string },
    ],
  };
}
