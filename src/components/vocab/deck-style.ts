import type { IconName } from '@/components/ui/Icon';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG } from '@/data/study-decks';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS, type ListeningSection } from '@/data/vocab-listening';
import { GLOBAL_SUCCESS_DECKS, VOCAB_TOPICS } from '@/data/vocab-topics';
import { CUSTOM_PREFIX } from '@/store/useCustomDeckStore';

/**
 * Màu nhấn + biểu tượng + nhãn nguồn của từng bộ từ — dùng chung cho thẻ ở thư
 * viện bộ từ và phần đầu trang một bộ, để bấm vào thẻ nào thì trang bộ đó cùng màu.
 */

export type DeckSource = 'mine' | 'ielts' | 'globalSuccess' | 'vfi' | 'vfia' | 'listening' | 'satMath' | 'satVerbal';

export type DeckLook = { source: DeckSource; sourceLabel: string; sourceLabelEn: string; accent: readonly [string, string]; icon: IconName };

/** Mười cặp (nền nhạt, màu đậm); chủ đề IELTS lấy theo thứ tự để thẻ cạnh nhau không trùng màu. */
const PALETTE: readonly (readonly [string, string])[] = [
  ['#FBF5EC', '#A8843F'],
  ['#DCFCE7', '#16A34A'],
  ['#CCFBF1', '#0D9488'],
  ['#EEF1F6', '#24375A'],
  ['#FEF3C7', '#D97706'],
  ['#FEE2E2', '#DC2626'],
  ['#E6F6F4', '#0D9488'],
  ['#FCE7F3', '#DB2777'],
  ['#FFE4E6', '#E11D48'],
  ['#FFEDD5', '#EA580C'],
];

const TOPIC_ICON: Record<string, IconName> = {
  education: 'book',
  environment: 'leaf',
  technology: 'grid',
  health: 'heart',
  work: 'briefcase',
  society: 'chat',
  government: 'clipboard',
  economy: 'trending',
  media: 'volume',
  culture: 'sparkle',
  family: 'home',
  transport: 'compass',
  tourism: 'compass',
  'city-life': 'building',
  crime: 'lock',
  science: 'flask',
  art: 'sparkle',
  sport: 'trophy',
  food: 'flame',
  housing: 'building',
  money: 'trending',
  globalisation: 'compass',
  language: 'languages',
  children: 'star',
  elderly: 'clock',
  animals: 'leaf',
  space: 'target',
  happiness: 'heart',
  history: 'bookmark',
  energy: 'gauge',
  personality: 'star',
  emotions: 'heart',
  places: 'compass',
  memories: 'clock',
  'success-failure': 'trophy',
  'risk-safety': 'shield',
  ethics: 'shield',
  change: 'refresh',
  comparison: 'list',
  'cause-effect': 'arrow-right',
  agriculture: 'leaf',
  'animals-nature': 'leaf',
  'weather-climate': 'sparkle',
  architecture: 'building',
  fashion: 'star',
  festivals: 'gift',
  shopping: 'gift',
  leisure: 'play',
  communication: 'chat',
  'ai-future': 'sparkle',
};

/** Bộ Nghe: mỗi Section một màu (lấy từ bảng màu trên) để cả nhóm đọc ra là cùng một phần của đề. */
const LISTENING_ACCENT: Record<ListeningSection, readonly [string, string]> = {
  1: ['#FBF5EC', '#A8843F'],
  2: ['#E6F6F4', '#0D9488'],
  3: ['#EEF1F6', '#24375A'],
  4: ['#FFEDD5', '#EA580C'],
  tips: ['#FEF3C7', '#D97706'],
};
const LISTENING_ICON: Record<string, IconName> = {
  'listening-accommodation': 'home',
  'listening-travel-booking': 'compass',
  'listening-personal-details': 'note',
  'listening-shopping-services': 'gift',
  'listening-membership-events': 'bookmark',
  'listening-jobs-work': 'briefcase',
  'listening-tourism-tours': 'compass',
  'listening-directions-maps': 'target',
  'listening-community-facilities': 'building',
  'listening-sports-leisure': 'trophy',
  'listening-university-life': 'book',
  'listening-research-methods': 'flask',
  'listening-presentations-groupwork': 'chat',
  'listening-courses-library': 'letters',
  'listening-environment-wildlife': 'leaf',
  'listening-history-architecture': 'clock',
  'listening-science-engineering': 'gauge',
  'listening-psychology-health': 'heart',
  'listening-business-economics': 'trending',
  'listening-numbers-dates-money': 'calendar',
  'listening-signposts-corrections': 'volume',
};
const LISTENING_BY_SLUG = new Map(LISTENING_DECKS.map((d) => [d.slug, d]));

/** Vocabulary for IELTS: mỗi unit một biểu tượng theo nội dung, màu xoay theo thứ tự unit. */
const VFI_ICON: Record<number, IconName> = {
  1: 'home', 2: 'star', 3: 'heart', 4: 'sparkle', 5: 'book', 6: 'chat', 7: 'compass', 8: 'clock', 9: 'leaf', 10: 'target',
  11: 'building', 12: 'grid', 13: 'trending', 14: 'building', 15: 'leaf', 16: 'gauge', 17: 'briefcase', 18: 'shield', 19: 'volume', 20: 'gift',
};
const VFI_BY_SLUG = new Map(VFI_DECKS.map((d) => [d.slug, d]));
const VFIA_BY_SLUG = new Map(VFIA_DECKS.map((d) => [d.slug, d]));

const TOPIC_INDEX = new Map(VOCAB_TOPICS.map((t, i) => [t.slug, i]));
const GLOBAL_SUCCESS_SLUGS = new Set(GLOBAL_SUCCESS_DECKS.map((d) => d.slug));
const SAT_SUBJECT = new Map(SAT_VOCAB_LESSONS.map((l) => [l.slug, l.subject]));

export function deckLook(slug: string): DeckLook {
  if (slug === NOTEBOOK_SLUG) return { source: 'mine', sourceLabel: 'Sổ từ của bạn', sourceLabelEn: 'Your notebook', accent: ['#FBF5EC', '#A8843F'], icon: 'book' };
  if (slug.startsWith(CUSTOM_PREFIX)) return { source: 'mine', sourceLabel: 'Bộ bạn tạo', sourceLabelEn: 'Your deck', accent: ['#D1FAE5', '#059669'], icon: 'note' };
  const subject = SAT_SUBJECT.get(slug);
  if (subject === 'math') return { source: 'satMath', sourceLabel: 'SAT Math', sourceLabelEn: 'SAT Math', accent: ['#EEF1F6', '#24375A'], icon: 'grid' };
  if (subject) return { source: 'satVerbal', sourceLabel: 'SAT Verbal', sourceLabelEn: 'SAT Verbal', accent: ['#FFE4E6', '#E11D48'], icon: 'letters' };
  const listening = LISTENING_BY_SLUG.get(slug);
  if (listening) return { source: 'listening', sourceLabel: 'Nghe IELTS', sourceLabelEn: 'IELTS listening', accent: LISTENING_ACCENT[listening.section], icon: LISTENING_ICON[slug] ?? 'volume' };
  const vfi = VFI_BY_SLUG.get(slug);
  if (vfi) return { source: 'vfi', sourceLabel: 'Vocabulary for IELTS', sourceLabelEn: 'Vocabulary for IELTS', accent: PALETTE[(vfi.unit - 1) % PALETTE.length]!, icon: VFI_ICON[vfi.unit] ?? 'book' };
  const vfia = VFIA_BY_SLUG.get(slug);
  if (vfia) return { source: 'vfia', sourceLabel: 'Vocabulary for IELTS Advanced', sourceLabelEn: 'Vocabulary for IELTS Advanced', accent: PALETTE[(vfia.unit + 4) % PALETTE.length]!, icon: VFI_ICON[vfia.unit] ?? 'book' };
  if (GLOBAL_SUCCESS_SLUGS.has(slug)) return { source: 'globalSuccess', sourceLabel: 'Global Success 10–12', sourceLabelEn: 'Global Success 10–12', accent: ['#E6F6F4', '#0D9488'], icon: 'letters' };
  const i = TOPIC_INDEX.get(slug) ?? 0;
  return { source: 'ielts', sourceLabel: 'Chủ đề IELTS', sourceLabelEn: 'IELTS topic', accent: PALETTE[i % PALETTE.length]!, icon: TOPIC_ICON[slug] ?? 'book' };
}
