import type { IconName } from '@/components/ui/Icon';
import { activeNavKey, parentNavKey } from './nav-items';

/**
 * Thanh bên PHẲNG (15/11/2026): mỗi dòng là một TÍNH NĂNG CHÍNH, theo bản tham chiếu AIO English
 * (Học qua gõ câu, Luyện từ vựng, Luyện ngữ pháp, Luyện đọc & dịch, Luyện phát âm, Dictation &
 * Shadowing, Từ điển chuyên sâu, Lộ trình học, Tiến độ & Bạn bè, Yêu cầu tính năng), cộng hai mục
 * lớn của Band 9 là IELTS và SAT.
 *
 * Các tác vụ nhỏ (Thi thử Reading, Kho bài đọc, Sổ từ, Đấu 1–1…) KHÔNG nằm ở đây: người học chọn
 * chúng bên trong trang của mục. Dữ liệu đầy đủ vẫn ở `NAV_GROUPS` (nav-items.ts) — nút "Khám
 * phá", thanh tab điện thoại và các trang hub đọc từ đó, nên không trang nào mất lối vào.
 */
export type SidebarItem = {
  key: string;
  label: string;
  labelEn: string;
  href: string;
  icon: IconName;
  /** Màu nền pastel của ô biểu tượng. */
  tint: string;
  /** Tiền tố đường dẫn thuộc về mục này (ngoài `href`). */
  match?: string[];
  /** Khoá mục cha trong `NAV_GROUPS`: trang nào thuộc nhánh đó (và không khớp mục nào khác) thì sáng mục này. */
  navKey?: string;
};

export type SidebarGroup = { key: string; items: SidebarItem[] };

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: 'learn',
    items: [
      { key: 'home', label: 'Trang chủ', labelEn: 'Home', href: '/intro', icon: 'home', tint: '#F6E7C8', match: ['/'] },
      { key: 'today', label: 'Hôm nay', labelEn: 'Today', href: '/dashboard', icon: 'gauge', tint: '#D6E8FB', navKey: 'dashboard' },
      { key: 'ielts', label: 'IELTS', labelEn: 'IELTS', href: '/practice', icon: 'book', tint: '#E3DAFB', navKey: 'ielts' },
      { key: 'sat', label: 'SAT', labelEn: 'SAT', href: '/sat', icon: 'grid', tint: '#D3F0DF', navKey: 'sat' },
      { key: 'type', label: 'Học qua gõ câu', labelEn: 'Learn by typing', href: '/sentence', icon: 'pencil', tint: '#DCE6FF' },
      { key: 'vocab', label: 'Luyện từ vựng', labelEn: 'Vocabulary', href: '/vocabulary/quiz', icon: 'letters', tint: '#FBD9E6', navKey: 'vocabulary', match: ['/vocabulary', '/oxford', '/tu-vung-cefr'] },
      { key: 'grammar', label: 'Luyện ngữ pháp', labelEn: 'Grammar', href: '/ngu-phap', icon: 'list', tint: '#FFE3C2', match: ['/dong-tu-bat-quy-tac'] },
      { key: 'read', label: 'Luyện đọc & dịch', labelEn: 'Read & translate', href: '/bilingual', icon: 'languages', tint: '#CFEFE3' },
      { key: 'pronounce', label: 'Luyện phát âm', labelEn: 'Pronunciation', href: '/hub/learn', icon: 'mic', tint: '#CDEBF7', match: ['/hub/phoneme', '/hub/pitch', '/hub/analyze'] },
      { key: 'dictshadow', label: 'Dictation & Shadowing', labelEn: 'Dictation & Shadowing', href: '/shadow', icon: 'volume', tint: '#F8D4E4', match: ['/sentence/dictation', '/sentence/listen', '/sentence/audio'] },
      { key: 'dictionary', label: 'Từ điển chuyên sâu', labelEn: 'Deep dictionary', href: '/tu-dien', icon: 'search', tint: '#EBDDBE' },
      { key: 'path', label: 'Lộ trình học', labelEn: 'Learning path', href: '/lo-trinh-hoc', icon: 'compass', tint: '#D8DDF8' },
    ],
  },
  {
    key: 'more',
    items: [
      { key: 'friends', label: 'Tiến độ & Bạn bè', labelEn: 'Progress & Friends', href: '/progress', icon: 'trending', tint: '#FAD4CB', match: ['/errors', '/leaderboard', '/community', '/invite'] },
      { key: 'quest', label: 'Quest', labelEn: 'Quest', href: '/quest', icon: 'sparkle', tint: '#FFDCCB', navKey: 'quest' },
      { key: 'feature', label: 'Yêu cầu tính năng', labelEn: 'Feature requests', href: '/feature-requests', icon: 'star', tint: '#F3E3B5' },
    ],
  },
];

export const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_GROUPS.flatMap((g) => g.items);

function covers(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/' || pathname === '/intro';
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Dòng thanh bên đang sáng. Ưu tiên tiền tố đường dẫn DÀI NHẤT (nên `/sentence/dictation` thuộc
 * Dictation & Shadowing còn `/sentence` thuộc Học qua gõ câu); không khớp thì suy từ mục cha trong
 * `NAV_GROUPS` (mọi trang con IELTS → IELTS, Đấu 1–1 → Quest…).
 */
export function activeSidebarKey(pathname: string): string | null {
  let best: { key: string; len: number } | null = null;
  for (const item of SIDEBAR_ITEMS) {
    for (const prefix of [item.href, ...(item.match ?? [])]) {
      if (covers(pathname, prefix) && (!best || prefix.length > best.len)) best = { key: item.key, len: prefix.length };
    }
  }
  const viaNav = parentNavKey(activeNavKey(pathname));
  const navOwner = viaNav ? SIDEBAR_ITEMS.find((i) => i.navKey === viaNav) : undefined;
  // Trang con của IELTS/SAT/Quest… thắng tiền tố ngắn (vd. `/`), nhưng không thắng tiền tố cụ thể hơn của mục khác.
  if (navOwner && (!best || best.len <= 1)) return navOwner.key;
  if (best) return best.key;
  return navOwner?.key ?? null;
}
