import type { IconName } from '@/components/ui/Icon';

export type NavItem = {
  key: string;
  label: string;
  /** Nhãn ngắn dùng cho bottom tab trên mobile. */
  shortLabel?: string;
  href: string;
  icon: IconName;
  /** Có mặt ở bottom tab trên mobile. Phần còn lại vào tab "More". */
  inBottomTabs?: boolean;
  /**
   * Trang con — chỉ hiện dưới mục cha khi người dùng ĐANG Ở trong mục đó.
   * Xem ghi chú đầu `NAV_GROUPS`.
   */
  children?: NavItem[];
  /**
   * Chỉ hiện trên MÁY TÍNH (web, chuột, rộng ≥ 1024) — Thành Phố Tri Thức 3D.
   * Điện thoại / máy tính bảng không thấy mục này (xem `visibleGroups`).
   */
  desktopOnly?: boolean;
};

export type NavGroup = {
  key: string;
  /** null = không có tiêu đề nhóm, các mục đứng thẳng trên cùng. */
  title: string | null;
  items: NavItem[];
};

/**
 * Điều hướng: 13 mục chính, trang phụ nằm LỒNG trong mục của nó.
 *
 * Bản trước bày phẳng 27 mục — Reading, Thi thử Reading, Kho bài đọc, Đọc
 * báo song ngữ, Sổ từ, Luyện từ vựng, Từ vựng chủ đề, Ghi chú, Đã lưu… Thanh
 * bên phải thu về chỉ còn biểu tượng mới nhét vừa màn laptop, và 27 biểu tượng
 * không tên thì không ai nhớ nổi cái nào là cái nào.
 *
 * Giờ mỗi mục chính là MỘT VIỆC người học đến làm (luyện Reading, luyện SAT
 * Math…). Trang phụ của việc đó — thi thử, kho bài, bộ đề — là `children`, chỉ
 * mở ra dưới mục cha khi đang ở trong mục ấy. Nhờ vậy thanh bên đủ chỗ hiện
 * đầy đủ tên, mà không trang nào mất lối vào (có test canh ở nav-items.test.ts).
 *
 * VẪN TÁCH IELTS VÀ SAT thành hai nhóm có tiêu đề: gần như không ai luyện cả
 * hai trong cùng một buổi, và người ôn SAT không nên phải đọc qua mục IELTS.
 *
 * Tên mục dùng tiếng Việt, TRỪ tên kỹ năng thi (Reading, Writing…) và tên kỳ
 * thi: đó là từ người luyện thi đọc trong mọi tài liệu.
 */
/**
 * TRANG CHỦ + SÁU MỤC LỚN (27/09/2026). Người dùng muốn thanh bên gọn như The IELTS
 * Dictionary: ít biểu tượng, gộp thành các mục lớn, thu gọn được, mục đang học
 * được tô thành khối kèm tên trang con. Trang con chỉ mở ra dưới mục đang học.
 * Mọi đích đến cũ vẫn còn (xem MUST_STAY_REACHABLE trong test).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'main',
    title: null,
    items: [
      // Trang chủ đứng đầu như bản cũ — app mở ra ở đây (app/index.tsx → /intro).
      { key: 'home', label: 'Trang chủ', href: '/intro', icon: 'home' },
      {
        key: 'dashboard',
        label: 'Hôm nay',
        href: '/dashboard',
        icon: 'gauge',
        inBottomTabs: true,
        children: [
          { key: 'plan', label: 'Lộ trình của tôi', href: '/plan', icon: 'calendar' },
          { key: 'progress', label: 'Tiến độ', href: '/progress', icon: 'trending' },
          { key: 'errors', label: 'Hồ sơ lỗi', href: '/errors', icon: 'target' },
          { key: 'mastery', label: 'Sổ bằng chứng', href: '/mastery', icon: 'clipboard' },
        ],
      },
      {
        key: 'ielts',
        label: 'IELTS',
        href: '/practice',
        icon: 'book',
        inBottomTabs: true,
        children: [
          { key: 'mock-tests', label: 'Thi thử Reading', href: '/mock-tests', icon: 'clipboard' },
          { key: 'library', label: 'Kho bài đọc', href: '/library', icon: 'list' },
          { key: 'bilingual', label: 'Đọc báo song ngữ', href: '/bilingual', icon: 'languages' },
          { key: 'writing', label: 'Writing', href: '/write', icon: 'pencil' },
          { key: 'sentence', label: 'Nghe & chép', href: '/sentence', icon: 'volume' },
          { key: 'dictation-sets', label: 'Bộ đề chép chính tả', href: '/sentence/sets', icon: 'play' },
          { key: 'dictation-youtube', label: 'Chép theo video', href: '/sentence/youtube', icon: 'play' },
          { key: 'shadow', label: 'Đọc theo VOA', href: '/shadow', icon: 'mic' },
          { key: 'speaking', label: 'Phòng luyện nói', href: '/speaking', icon: 'chat' },
        ],
      },
      {
        key: 'sat',
        label: 'SAT',
        href: '/sat',
        icon: 'grid',
        inBottomTabs: true,
        children: [
          { key: 'math', label: 'SAT Math', href: '/math', icon: 'grid' },
          { key: 'math-learn', label: 'Bài học SAT Math', href: '/math/learn', icon: 'book' },
          { key: 'sat-roadmap', label: 'Lộ trình SAT Math', href: '/sat/lo-trinh', icon: 'compass' },
          { key: 'sat-knowledge', label: 'Kiến thức SAT', href: '/sat/kien-thuc', icon: 'book' },
          { key: 'sat-rw', label: 'SAT Verbal', href: '/sat-rw', icon: 'letters' },
          { key: 'sat-rw-learn', label: 'Bài học SAT Verbal', href: '/sat-rw/learn', icon: 'book' },
          { key: 'sat-full-test', label: 'Thi thử SAT đầy đủ', href: '/sat/full-test', icon: 'clock' },
        ],
      },
      {
        key: 'vocabulary',
        label: 'Từ vựng',
        href: '/vocabulary/quiz',
        icon: 'letters',
        inBottomTabs: true,
        children: [
          { key: 'vocab-book', label: 'Sổ từ', href: '/vocabulary', icon: 'bookmark' },
          { key: 'vocab-topics', label: 'Chủ đề IELTS', href: '/vocabulary/topics', icon: 'grid' },
          { key: 'vocab-sat-quiz', label: 'Ôn từ vựng SAT', href: '/vocabulary/sat-quiz', icon: 'trophy' },
          { key: 'vocab-import', label: 'Học từ bài bạn thích', href: '/vocabulary/import', icon: 'plus' },
          { key: 'vocab-garden', label: 'Vườn từ', href: '/vocabulary/garden', icon: 'leaf' },
          { key: 'notes', label: 'Ghi chú', href: '/notes', icon: 'note' },
          { key: 'bookmarks', label: 'Đã lưu', href: '/bookmarks', icon: 'bookmark' },
        ],
      },
      {
        key: 'quest',
        label: 'Quest',
        shortLabel: 'Quest',
        href: '/quest',
        icon: 'sparkle',
        inBottomTabs: true,
        children: [
          { key: 'quest-city', label: 'Thành phố Tri thức', href: '/quest/city', icon: 'building', desktopOnly: true },
          { key: 'quest-rail', label: 'Chuyến tàu từ vựng', href: '/quest/rail', icon: 'compass' },
          { key: 'quest-world', label: 'Bản đồ Band 9', href: '/quest/world', icon: 'grid' },
          { key: 'quest-hero', label: 'Nhân vật & nhiệm vụ', href: '/quest/hero', icon: 'shield' },
          { key: 'leaderboard', label: 'Xếp hạng', href: '/leaderboard', icon: 'trophy' },
          { key: 'weekly', label: 'Đề của tuần', href: '/weekly', icon: 'trophy' },
          { key: 'duel', label: 'Đấu 1–1', href: '/duel', icon: 'target' },
          { key: 'shop', label: 'Đổi quà', href: '/shop', icon: 'gift' },
        ],
      },
      {
        key: 'me',
        label: 'Cá nhân',
        href: '/profile',
        icon: 'star',
        children: [
          { key: 'invite', label: 'Mời bạn, học miễn phí', href: '/invite', icon: 'sparkle' },
          { key: 'upgrade', label: 'Gói học', href: '/upgrade', icon: 'sparkle' },
          { key: 'settings', label: 'Cài đặt', href: '/settings', icon: 'settings' },
          { key: 'observatory', label: 'Chất lượng đề AI', href: '/observatory', icon: 'info' },
          { key: 'teacher', label: 'Cho giáo viên', href: '/teacher', icon: 'letters' },
        ],
      },
    ],
  },
];

/**
 * Nhóm chỉ hiện với tài khoản quản trị.
 *
 * Để NGOÀI `NAV_GROUPS` chứ không gắn cờ `adminOnly` vào từng mục: mọi nơi
 * duyệt `NAV_GROUPS` (sidebar, bottom tab, tab More) sẽ mặc định KHÔNG thấy nó.
 * Cách ngược lại — thêm cờ rồi trông chờ mọi chỗ nhớ lọc — chỉ cần một chỗ quên
 * là mục quản trị hiện ra với mọi người.
 */
export const ADMIN_GROUP: NavGroup = {
  key: 'admin',
  title: 'Quản trị',
  items: [{ key: 'admin', label: 'Người dùng & gói', href: '/admin', icon: 'lock' }],
};

/** Trải phẳng một danh sách mục, kể cả trang con, theo thứ tự hiển thị. */
export function flattenItems(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ?? [])]);
}

/** Mọi đích đến trong điều hướng, kể cả trang con. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => flattenItems(g.items));

export const BOTTOM_TAB_ITEMS = NAV_ITEMS.filter((i) => i.inBottomTabs);
/** Những mục không nằm trong bottom tab sẽ gom vào tab "More" trên mobile. */
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !i.inBottomTabs);

/**
 * Mục đang mở, tính theo đường dẫn dài nhất khớp tiền tố.
 *
 * So bằng `startsWith` đơn thuần là hỏng: `/write` khớp cả `/write/sat`, và nếu
 * hai mục cùng khớp thì cả hai cùng sáng. Lấy mục có href DÀI NHẤT là đúng.
 * Trả về khoá của TRANG CON nếu trang con khớp — muốn biết mục cha thì dùng
 * `parentNavKey`.
 */
export function activeNavKey(pathname: string): string | null {
  let best: NavItem | null = null;
  for (const item of [...NAV_ITEMS, ...ADMIN_GROUP.items]) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best?.key ?? null;
}

/** Khoá của mục CHÍNH chứa `key` (chính nó nếu nó đã là mục chính). */
export function parentNavKey(key: string | null): string | null {
  if (!key) return null;
  for (const group of [...NAV_GROUPS, ADMIN_GROUP]) {
    for (const item of group.items) {
      if (item.key === key || item.children?.some((c) => c.key === key)) return item.key;
    }
  }
  return null;
}

/** Bỏ các mục chỉ-máy-tính khi thiết bị không đủ điều kiện (không để lại dấu vết). */
export function visibleGroups(groups: readonly NavGroup[], desktop: boolean): NavGroup[] {
  if (desktop) return [...groups];
  const keep = (i: NavItem): boolean => !i.desktopOnly;
  return groups.map((g) => ({
    ...g,
    items: g.items.filter(keep).map((i) => (i.children ? { ...i, children: i.children.filter(keep) } : i)),
  }));
}
