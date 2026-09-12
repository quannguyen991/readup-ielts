import type { IconName } from '@/components/ui/Icon';
import { PLANS } from '@/lib/billing/plans';
import { REWARD_PLAN } from '@/services/referral/rewards';

export type NavItem = {
  key: string;
  label: string;
  /** Nhãn ngắn dùng cho bottom tab trên mobile. */
  shortLabel?: string;
  href: string;
  icon: IconName;
  /** Có mặt ở bottom tab trên mobile. Phần còn lại vào tab "More". */
  inBottomTabs?: boolean;
};

export type NavGroup = {
  key: string;
  /** null = không có tiêu đề nhóm, các mục đứng thẳng trên cùng. */
  title: string | null;
  items: NavItem[];
};

/**
 * Điều hướng, GOM THEO NHÓM VIỆC.
 *
 * Bản trước là 12 mục phẳng xếp thành một cột dài: Dashboard, Practice, Writing,
 * SAT Math, Library, Vocabulary, Progress, Mock Tests, Notes, Bookmarks, Nâng
 * cấp, Settings. Danh sách phẳng dài như vậy buộc mắt phải đọc từng dòng mới
 * tìm được thứ cần, vì không có gì cho biết mục nào gần mục nào.
 *
 * Ba nhóm dưới đây trả lời ba câu hỏi khác nhau:
 *
 *   LUYỆN TẬP — "hôm nay tôi làm bài gì"      (bốn nơi có đề để làm)
 *   THƯ VIỆN  — "tôi tra lại cái đã lưu ở đâu" (bài đọc, từ, ghi chú, đánh dấu)
 *   THEO DÕI  — "tôi đang tiến tới đâu"
 *
 * Tổng quan đứng riêng trên đầu vì nó không thuộc nhóm nào — nó là chỗ nhìn
 * thấy cả ba. Nâng cấp và Cài đặt xuống chân, tách khỏi việc học.
 *
 * Tên mục dùng tiếng Việt, TRỪ tên bốn kỹ năng thi (Reading, Writing…) và tên
 * kỳ thi: đó là từ người luyện thi đọc trong mọi tài liệu, dịch ra lại thành xa lạ.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    title: null,
    items: [
      { key: 'dashboard', label: 'Tổng quan', href: '/dashboard', icon: 'home', inBottomTabs: true },
    ],
  },
  {
    key: 'practice',
    title: 'Luyện tập',
    items: [
      { key: 'reading', label: 'Reading', href: '/practice', icon: 'book', inBottomTabs: true },
      { key: 'writing', label: 'Writing', href: '/write', icon: 'pencil', inBottomTabs: true },
      { key: 'math', label: 'SAT Math', href: '/math', icon: 'grid', inBottomTabs: true },
      { key: 'sat-rw', label: 'SAT Verbal', href: '/sat-rw', icon: 'letters' },
      { key: 'mock-tests', label: 'Thi thử', shortLabel: 'Thi thử', href: '/mock-tests', icon: 'clipboard' },
      { key: 'sat-full-test', label: 'Thi thử SAT đầy đủ', href: '/sat/full-test', icon: 'clock' },
      { key: 'sentence', label: 'Luyện câu', href: '/sentence', icon: 'volume' },
      { key: 'dictation-sets', label: 'Bộ đề chép chính tả', href: '/sentence/sets', icon: 'play' },
      { key: 'dictation-youtube', label: 'Chép chính tả theo video', href: '/sentence/youtube', icon: 'volume' },
    ],
  },
  {
    key: 'library',
    title: 'Thư viện',
    items: [
      { key: 'library', label: 'Kho bài đọc', href: '/library', icon: 'list' },
      { key: 'bilingual', label: 'Đọc song ngữ', href: '/bilingual', icon: 'languages' },
      { key: 'vocabulary', label: 'Sổ từ', shortLabel: 'Sổ từ', href: '/vocabulary', icon: 'letters', inBottomTabs: true },
      { key: 'vocab-practice', label: 'Luyện từ vựng', href: '/vocabulary/practice', icon: 'refresh' },
      { key: 'vocab-topics', label: 'Từ vựng chủ đề', href: '/vocabulary/topics', icon: 'grid' },
      { key: 'notes', label: 'Ghi chú', href: '/notes', icon: 'note' },
      { key: 'bookmarks', label: 'Đã lưu', href: '/bookmarks', icon: 'bookmark' },
    ],
  },
  {
    key: 'track',
    title: 'Theo dõi',
    items: [
      { key: 'plan', label: 'Lộ trình 60 tuần', href: '/plan', icon: 'calendar' },
      { key: 'progress', label: 'Tiến độ', href: '/progress', icon: 'trending' },
      { key: 'mastery', label: 'Sổ bằng chứng', href: '/mastery', icon: 'clipboard' },
      /*
        Đài quan sát nằm ở nhóm THEO DÕI chứ không phải một nhóm riêng: nó trả
        lời đúng câu hỏi của nhóm này — "đang tiến tới đâu" — nhưng hỏi về CHÍNH
        BỘ ĐỀ chứ không phải về người học. Đề mà không đo được cái nó tự nhận
        đang đo thì mọi con số tiến độ bên trên đều rỗng, nên hai thứ thuộc về
        cùng một chỗ.
      */
      { key: 'observatory', label: 'Chất lượng đề AI', href: '/observatory', icon: 'info' },
      { key: 'teacher', label: 'Cho giáo viên', href: '/teacher', icon: 'letters' },
    ],
  },
  {
    key: 'account',
    title: null,
    items: [
      // Nhãn lấy từ chính luật thưởng: đổi gói thưởng ở `rewards.ts` mà quên sửa
      // chỗ này thì thanh điều hướng hứa một gói, trang mời trả một gói khác.
      { key: 'invite', label: `Mời bạn, nhận ${PLANS[REWARD_PLAN].name}`, href: '/invite', icon: 'sparkle' },
      { key: 'intro', label: 'Giới thiệu', href: '/intro', icon: 'info' },
      { key: 'upgrade', label: 'Nâng cấp', href: '/upgrade', icon: 'sparkle' },
      { key: 'settings', label: 'Cài đặt', href: '/settings', icon: 'settings' },
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

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const BOTTOM_TAB_ITEMS = NAV_ITEMS.filter((i) => i.inBottomTabs);
/** Những mục không nằm trong bottom tab sẽ gom vào tab "More" trên mobile. */
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !i.inBottomTabs);

/**
 * Mục đang mở, tính theo đường dẫn dài nhất khớp tiền tố.
 *
 * So bằng `startsWith` đơn thuần là hỏng: `/math` khớp cả `/math` lẫn
 * `/mock-tests`? không, nhưng `/write` khớp cả `/write/sat`, và nếu có hai mục
 * cùng khớp thì cả hai cùng sáng. Lấy mục có href DÀI NHẤT khớp được là đúng.
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
