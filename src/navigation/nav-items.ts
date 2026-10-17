import type { IconName } from '@/components/ui/Icon';
import { hasPublishedHistory, HISTORY_LEARNING_ENABLED, isDevBuild } from '@/data/history';

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
  /** Chỉ hiện khi đã có nội dung lịch sử qua cổng xuất bản (bản phát triển thì luôn hiện). */
  requires?: 'history';
  /**
   * Ẩn trên ĐIỆN THOẠI (dưới `PHONE_MAX_WIDTH`): thanh tab dưới, bảng Khám phá. Trang
   * vẫn mở được bằng đường dẫn; máy tính và máy tính bảng vẫn thấy mục này.
   */
  phoneHidden?: boolean;
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
          { key: 'learning-path', label: 'Lộ trình học', href: '/lo-trinh-hoc', icon: 'compass' },
          { key: 'progress', label: 'Tiến độ', href: '/progress', icon: 'trending' },
          { key: 'errors', label: 'Hồ sơ lỗi', href: '/errors', icon: 'target' },
          { key: 'clips', label: 'Clip tiếng Anh', href: '/clip', icon: 'play' },
        ],
      },
      {
        key: 'ielts',
        label: 'IELTS',
        href: '/practice',
        icon: 'book',
        inBottomTabs: true,
        children: [
          { key: 'luyen-doc', label: 'Luyện đọc', href: '/luyen-doc', icon: 'book' },
          { key: 'mock-tests', label: 'Thi thử Reading', href: '/mock-tests', icon: 'clipboard' },
          { key: 'ielts-source-practice', label: 'Bộ đề riêng trên máy', href: '/ielts-source-practice', icon: 'list' },
          { key: 'library', label: 'Kho bài đọc', href: '/library', icon: 'list' },
          { key: 'bilingual', label: 'Đọc báo song ngữ', href: '/bilingual', icon: 'languages' },
          { key: 'writing', label: 'Writing', href: '/write', icon: 'pencil' },
          { key: 'listening', label: 'Listening', href: '/listening', icon: 'volume' },
          { key: 'sentence', label: 'Nghe & chép', href: '/sentence', icon: 'volume' },
          { key: 'dictation-sets', label: 'Bộ đề chép chính tả', href: '/sentence/sets', icon: 'play' },
          { key: 'dictation-youtube', label: 'Chép theo video', href: '/sentence/youtube', icon: 'play' },
          { key: 'shadow', label: 'Đọc theo VOA', href: '/shadow', icon: 'mic' },
          { key: 'speaking', label: 'Phòng luyện nói', href: '/speaking', icon: 'chat' },
          // Khu luyện nói: phát âm, gia sư AI, khoá học. Có thanh tab riêng (app/hub/_layout.tsx).
          { key: 'hub', label: 'Luyện nói AI', href: '/hub', icon: 'mic' },
          { key: 'toeic-toefl', label: 'TOEIC · TOEFL', href: '/toeic', icon: 'letters' },
          { key: 'hsa-english', label: 'Luyện HSA · Tiếng Anh', href: '/hsa', icon: 'target' },
        ],
      },
      {
        key: 'sat',
        label: 'SAT',
        href: '/sat',
        icon: 'grid',
        inBottomTabs: true,
        children: [
          /*
            Bốn trang con (01/10/2026, "nhiều tác vụ quá, người ta rối"). Bài
            học, lộ trình 27 chương, kiến thức SAT, chẩn đoán, thi thử Math vẫn
            còn nguyên — chúng nằm trong bốn bước của trang Tổng quan và trong
            khung Học → Luyện → Kiểm tra của hai hub (`navigation/sat-hub.ts`).
          */
          { key: 'sat-home', label: 'Tổng quan SAT', href: '/sat', icon: 'compass' },
          { key: 'math', label: 'SAT Math', href: '/math', icon: 'grid' },
          { key: 'sat-rw', label: 'SAT Verbal', href: '/sat-rw', icon: 'letters' },
          { key: 'sat-full-test', label: 'Thi thử SAT', href: '/sat/full-test', icon: 'clock' },
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
        phoneHidden: true,
        children: [
          { key: 'quest-city', label: 'Thành phố Tri thức', href: '/quest/city', icon: 'building', desktopOnly: true },
          { key: 'quest-rail', label: 'Chuyến bay từ vựng', href: '/quest/rail', icon: 'compass' },
          { key: 'quest-travel', label: 'Du ngoạn thế giới', href: '/quest/du-ngoan', icon: 'compass' },
          { key: 'quest-history', label: 'Lịch sử Việt Nam song ngữ', href: '/history', icon: 'book', requires: 'history' },
          { key: 'quest-world', label: 'Bản đồ Band 9', href: '/quest/world', icon: 'grid' },
          { key: 'quest-hero', label: 'Nhân vật & nhiệm vụ', href: '/quest/hero', icon: 'shield' },
          { key: 'community', label: 'Cộng đồng học tập', href: '/community', icon: 'chat' },
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
          { key: 'books', label: 'Tủ sách PDF', href: '/tu-sach', icon: 'book' },
          { key: 'settings', label: 'Cài đặt', href: '/settings', icon: 'settings' },
          { key: 'teacher', label: 'Lớp học (giáo viên)', href: '/teacher', icon: 'clipboard' },
          { key: 'join-class', label: 'Vào lớp bằng mã', href: '/join', icon: 'letters' },
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

/** Dưới mốc này là điện thoại — khớp breakpoint `sm` của Tailwind. */
export const PHONE_MAX_WIDTH = 640;

/** Mục này có bị ẩn ở chiều rộng màn hình `width` không. */
export function hiddenOnPhone(item: NavItem, width: number): boolean {
  return item.phoneHidden === true && width < PHONE_MAX_WIDTH;
}

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
      // Hoà độ dài thì lấy mục ĐỨNG SAU — tức trang con "Tổng quan SAT" thắng
      // mục cha cùng đường dẫn `/sat`, để dòng trang con được tô sáng.
      if (!best || item.href.length >= best.href.length) best = item;
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

/**
 * Bỏ các mục chỉ-máy-tính khi thiết bị không đủ điều kiện (không để lại dấu vết).
 *
 * `ieltsFeatures`: các trang con IELTS người học đã chọn (xem ielts-focus.ts).
 * `null` = chưa chọn, hiện đủ. Chỉ lọc các trang con của mục IELTS.
 */
export function visibleGroups(
  groups: readonly NavGroup[],
  desktop: boolean,
  ieltsFeatures: readonly string[] | null = null,
): NavGroup[] {
  const historyOk = HISTORY_LEARNING_ENABLED && (isDevBuild() || hasPublishedHistory());
  const keep = (i: NavItem): boolean => (desktop || !i.desktopOnly) && (i.requires !== 'history' || historyOk);
  const keepIelts = (parentKey: string, i: NavItem): boolean =>
    parentKey !== 'ielts' || ieltsFeatures === null || ieltsFeatures.includes(i.key);
  return groups.map((g) => ({
    ...g,
    items: g.items
      .filter(keep)
      .map((i) => (i.children ? { ...i, children: i.children.filter((c) => keep(c) && keepIelts(i.key, c)) } : i)),
  }));
}

/**
 * Nhãn TIẾNG ANH của từng mục điều hướng (theo `key`) — dùng khi người dùng
 * chọn English. Thiếu khoá thì giữ nhãn tiếng Việt.
 */
export const NAV_LABEL_EN: Record<string, string> = {
  home: 'Home',
  dashboard: 'Today',
  plan: 'My plan',
  'learning-path': 'Learning path',
  progress: 'Progress',
  errors: 'Mistake log',
  mastery: 'Evidence book',
  clips: 'English clips',
  'luyen-doc': 'Reading practice',
  ielts: 'IELTS',
  'mock-tests': 'Reading mock tests',
  'ielts-source-practice': 'Private IELTS tests',
  library: 'Reading library',
  bilingual: 'Bilingual news',
  writing: 'Writing',
  listening: 'Listening',
  sentence: 'Listen & dictate',
  'dictation-sets': 'Dictation sets',
  'dictation-youtube': 'Dictate from video',
  shadow: 'VOA shadowing',
  speaking: 'Speaking room',
  'toeic-toefl': 'TOEIC · TOEFL',
  'hsa-english': 'HSA English practice',
  sat: 'SAT',
  'sat-home': 'SAT overview',
  math: 'SAT Math',
  'sat-rw': 'SAT Verbal',
  'sat-full-test': 'SAT practice test',
  vocabulary: 'Vocabulary',
  'vocab-book': 'Word book',
  'vocab-topics': 'IELTS topics',
  'vocab-sat-quiz': 'SAT vocabulary review',
  'vocab-import': 'Learn words from any text',
  'vocab-garden': 'Word garden',
  notes: 'Notes',
  bookmarks: 'Saved',
  quest: 'Quest',
  'quest-city': 'Knowledge City',
  'quest-rail': 'Vocab flight',
  'quest-travel': 'Travel the world',
  'quest-history': 'Vietnamese history, bilingual',
  'quest-world': 'Band 9 map',
  'quest-hero': 'Character & quests',
  community: 'Study community',
  leaderboard: 'Leaderboard',
  weekly: 'Weekly test',
  duel: '1-on-1 duel',
  shop: 'Rewards shop',
  me: 'Me',
  books: 'PDF bookshelf',
  settings: 'Settings',
  observatory: 'AI question quality',
  teacher: 'Classes (teachers)',
  'join-class': 'Join a class',
  admin: 'Users & plans',
};

/** Nhãn hiển thị của một mục theo ngôn ngữ. */
export function navLabel(item: { key: string; label: string }, locale: 'vi' | 'en'): string {
  return locale === 'en' ? (NAV_LABEL_EN[item.key] ?? item.label) : item.label;
}
