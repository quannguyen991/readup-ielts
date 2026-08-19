import type { IconName } from '@/components/ui/Icon';

export type NavItem = {
  key: string;
  label: string;
  /** Nhãn ngắn dùng cho bottom tab trên mobile. */
  shortLabel?: string;
  href: string;
  icon: IconName;
  /** Có mặt ở top nav ngang trên web (ảnh 1–5 chỉ hiện 5 mục chính). */
  inTopNav?: boolean;
  /** Có mặt ở bottom tab trên mobile. Phần còn lại vào tab "More". */
  inBottomTabs?: boolean;
};

/** Sidebar trái cố định trên web — đúng thứ tự trong ảnh tham chiếu. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'home', inTopNav: true, inBottomTabs: true },
  { key: 'practice', label: 'Practice', href: '/practice', icon: 'pencil', inTopNav: true, inBottomTabs: true },
  { key: 'writing', label: 'Writing', href: '/write', icon: 'note', inTopNav: true, inBottomTabs: true },
  { key: 'library', label: 'Library', href: '/library', icon: 'book', inTopNav: true, inBottomTabs: true },
  { key: 'vocabulary', label: 'Vocabulary', shortLabel: 'Vocab', href: '/vocabulary', icon: 'letters', inTopNav: true, inBottomTabs: true },
  { key: 'progress', label: 'Progress', href: '/progress', icon: 'trending', inTopNav: true },
  { key: 'mock-tests', label: 'Mock Tests', href: '/mock-tests', icon: 'clipboard' },
  { key: 'notes', label: 'Notes', href: '/notes', icon: 'note' },
  { key: 'bookmarks', label: 'Bookmarks', href: '/bookmarks', icon: 'bookmark' },
  { key: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
];

export const TOP_NAV_ITEMS = NAV_ITEMS.filter((i) => i.inTopNav);
export const BOTTOM_TAB_ITEMS = NAV_ITEMS.filter((i) => i.inBottomTabs);
/** Những mục không nằm trong bottom tab sẽ gom vào tab "More" trên mobile. */
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !i.inBottomTabs);
