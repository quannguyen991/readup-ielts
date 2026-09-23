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
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    title: null,
    items: [
      { key: 'home', label: 'Trang chủ', href: '/intro', icon: 'home', inBottomTabs: true },
      { key: 'dashboard', label: 'Hôm nay', href: '/dashboard', icon: 'gauge', inBottomTabs: true },
    ],
  },
  {
    key: 'ielts',
    title: 'IELTS',
    items: [
      {
        key: 'reading',
        label: 'Reading',
        href: '/practice',
        icon: 'book',
        inBottomTabs: true,
        children: [
          { key: 'mock-tests', label: 'Thi thử Reading', href: '/mock-tests', icon: 'clipboard' },
          { key: 'library', label: 'Kho bài đọc', href: '/library', icon: 'list' },
          { key: 'bilingual', label: 'Đọc báo song ngữ', href: '/bilingual', icon: 'languages' },
        ],
      },
      { key: 'writing', label: 'Writing', href: '/write', icon: 'pencil', inBottomTabs: true },
    ],
  },
  {
    key: 'sat',
    title: 'SAT',
    items: [
      {
        key: 'math',
        label: 'SAT Math',
        href: '/math',
        icon: 'grid',
        inBottomTabs: true,
        children: [
          { key: 'math-learn', label: 'Bài học SAT Math', href: '/math/learn', icon: 'book' },
          { key: 'sat-full-test', label: 'Thi thử SAT đầy đủ', href: '/sat/full-test', icon: 'clock' },
        ],
      },
      {
        key: 'sat-rw',
        label: 'SAT Verbal',
        href: '/sat-rw',
        icon: 'letters',
        children: [{ key: 'sat-rw-learn', label: 'Bài học SAT Verbal', href: '/sat-rw/learn', icon: 'book' }],
      },
    ],
  },
  {
    key: 'skills',
    title: 'Luyện thêm',
    items: [
      {
        key: 'sentence',
        label: 'Nghe & chép',
        href: '/sentence',
        icon: 'volume',
        children: [
          { key: 'dictation-sets', label: 'Bộ đề chép chính tả', href: '/sentence/sets', icon: 'play' },
          { key: 'dictation-youtube', label: 'Chép theo video', href: '/sentence/youtube', icon: 'play' },
        ],
      },
      {
        key: 'vocabulary',
        label: 'Từ vựng',
        href: '/vocabulary',
        icon: 'letters',
        children: [
          { key: 'vocab-practice', label: 'Luyện từ vựng', href: '/vocabulary/practice', icon: 'refresh' },
          { key: 'vocab-topics', label: 'Từ vựng chủ đề', href: '/vocabulary/topics', icon: 'grid' },
          { key: 'notes', label: 'Ghi chú', href: '/notes', icon: 'note' },
          { key: 'bookmarks', label: 'Đã lưu', href: '/bookmarks', icon: 'bookmark' },
        ],
      },
      { key: 'quest', label: 'ReadUp Quest', shortLabel: 'Quest', href: '/quest', icon: 'sparkle' },
    ],
  },
  {
    key: 'track',
    title: 'Theo dõi',
    items: [
      { key: 'plan', label: 'Lộ trình 60 tuần', href: '/plan', icon: 'calendar' },
      {
        key: 'progress',
        label: 'Tiến độ',
        href: '/progress',
        icon: 'trending',
        children: [
          { key: 'errors', label: 'Hồ sơ lỗi', href: '/errors', icon: 'target' },
          { key: 'mastery', label: 'Sổ bằng chứng', href: '/mastery', icon: 'clipboard' },
          // Đo CHÍNH BỘ ĐỀ chứ không đo người học — nhưng đề không đo được cái nó
          // tự nhận đang đo thì mọi con số tiến độ bên trên đều rỗng.
          { key: 'observatory', label: 'Chất lượng đề AI', href: '/observatory', icon: 'info' },
          { key: 'teacher', label: 'Cho giáo viên', href: '/teacher', icon: 'letters' },
        ],
      },
      {
        key: 'leaderboard',
        label: 'Xếp hạng',
        href: '/leaderboard',
        icon: 'trophy',
        children: [
          { key: 'weekly', label: 'Đề của tuần', href: '/weekly', icon: 'trophy' },
          { key: 'shop', label: 'Cửa hàng đổi điểm', href: '/shop', icon: 'gift' },
        ],
      },
    ],
  },
  {
    key: 'account',
    title: null,
    items: [
      { key: 'invite', label: 'Mời bạn, học miễn phí', href: '/invite', icon: 'sparkle' },
      {
        key: 'settings',
        label: 'Cài đặt',
        href: '/settings',
        icon: 'settings',
        children: [{ key: 'upgrade', label: 'Gói học', href: '/upgrade', icon: 'sparkle' }],
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
