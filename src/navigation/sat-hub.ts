/**
 * Cấu trúc phần SAT (01/10/2026): một trang tổng quan `/sat` với bốn bước, và
 * hai hub `/math`, `/sat-rw` đi thẳng vào ngân hàng câu, kèm một hàng liên kết
 * nhỏ.
 *
 * Người dùng: "hiện tại hơi nhiều tác vụ mọi người sẽ rối". Thanh bên nhóm SAT
 * từng có 7 trang con; giờ còn 4, và các trang bị bỏ khỏi thanh bên được dẫn
 * từ đúng một chỗ trong các hub dưới đây. Dữ liệu tách ra file thuần để test
 * (`nav-items.test.ts`) kiểm được: trang nào rời thanh bên thì PHẢI có mặt ở
 * đây, không thì mất lối vào.
 */

export type HubLink = { href: string; vi: string; en: string };

export type HubStep = {
  id: string;
  /** Số thứ tự in ở lề trái của phiếu. */
  n: string;
  title: { vi: string; en: string };
  /** Đúng MỘT câu ngắn — người dùng ghét chữ giải thích dài. */
  line: { vi: string; en: string };
  primary: HubLink;
  more: HubLink[];
};

/** Bốn bước của trang tổng quan `/sat`. */
export const SAT_PATH_STEPS: HubStep[] = [
  {
    id: 'diagnose',
    n: '01',
    title: { vi: 'Kiểm tra đầu vào', en: 'Placement check' },
    line: { vi: 'Biết mình hổng chỗ nào trước khi học.', en: 'Find your gaps before you study.' },
    primary: { href: '/math/diagnostic', vi: 'Chẩn đoán Math · 19 câu', en: 'Math diagnostic · 19 questions' },
    more: [{ href: '/sat-rw/mix/satrw-mix-01', vi: 'Đề trộn Verbal số 1', en: 'Verbal mixed set 1' }],
  },
  {
    id: 'learn',
    n: '02',
    title: { vi: 'Học theo chủ đề', en: 'Learn by topic' },
    line: { vi: 'Lý thuyết ngắn, ví dụ và bẫy của từng dạng.', en: 'Short theory, examples and traps for each type.' },
    primary: { href: '/math/learn', vi: 'Bài học Math', en: 'Math lessons' },
    more: [
      { href: '/sat-rw/learn', vi: 'Bài học Verbal', en: 'Verbal lessons' },
      { href: '/sat/lo-trinh', vi: 'Lộ trình Math 27 chương', en: 'Math roadmap · 27 chapters' },
      { href: '/sat/kien-thuc', vi: 'Kiến thức SAT', en: 'SAT essentials' },
      { href: '/vocabulary/sat-quiz', vi: 'Từ vựng SAT', en: 'SAT vocabulary' },
    ],
  },
  {
    id: 'practice',
    n: '03',
    title: { vi: 'Luyện theo dạng', en: 'Practice by type' },
    line: { vi: 'Mỗi dạng đi từ Dễ → Vừa → Khó.', en: 'Every type goes Easy → Medium → Hard.' },
    primary: { href: '/math', vi: 'Luyện Math', en: 'Practise Math' },
    more: [{ href: '/sat-rw', vi: 'Luyện Verbal', en: 'Practise Verbal' }],
  },
  {
    id: 'test',
    n: '04',
    title: { vi: 'Thi thử', en: 'Mock test' },
    line: { vi: 'Đủ hai phần, đúng giờ, như phòng thi.', en: 'Both sections, timed, like the real room.' },
    primary: { href: '/sat/full-test', vi: 'Thi thử SAT đầy đủ', en: 'Full SAT practice test' },
    more: [{ href: '/math/mock', vi: 'Thi thử Math hai module', en: 'Two-module Math mock' }],
  },
];

/**
 * Hàng liên kết nhỏ dưới tên hai hub. Hub đi thẳng vào ngân hàng câu — bốn
 * bước đầy đủ đã nằm ở `/sat`, nhắc lại ở hub chỉ chiếm chỗ (người dùng chê
 * 01/10/2026). Chỉ giữ hai lối: học lý thuyết và thi thử.
 */
export const MATH_HUB_LINKS: HubLink[] = [
  { href: '/math/learn', vi: 'Học lý thuyết', en: 'Theory lessons' },
  { href: '/math/mock', vi: 'Thi thử', en: 'Mock test' },
];

export const RW_HUB_LINKS: HubLink[] = [
  { href: '/sat/practice-tests', vi: 'Kho 65 đề SAT', en: 'SAT practice tests' },
  { href: '/sat-rw/learn', vi: 'Học lý thuyết', en: 'Theory lessons' },
  { href: '/sat/full-test', vi: 'Thi thử', en: 'Mock test' },
];

/** Lối sang Lộ trình học theo trình độ (mức SAT ~1000 / ~1200 / 1400+). */
export const SAT_LEVELS_LINK: HubLink = { href: '/lo-trinh-hoc', vi: 'Lộ trình học theo trình độ', en: 'Level-based learning path' };

/** Mọi đích mà ba hub SAT dẫn tới (bỏ phần truy vấn `?tab=`). */
export function satHubTargets(): Set<string> {
  const all = SAT_PATH_STEPS.flatMap((s) => [s.primary, ...s.more]);
  return new Set([...all, ...MATH_HUB_LINKS, ...RW_HUB_LINKS, SAT_LEVELS_LINK].map((l) => l.href.split('?')[0]!));
}
