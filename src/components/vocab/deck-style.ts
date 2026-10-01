import type { IconName } from '@/components/ui/Icon';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG } from '@/data/study-decks';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { CUSTOM_PREFIX } from '@/store/useCustomDeckStore';

/**
 * Màu nhấn + biểu tượng + nhãn nguồn của từng bộ từ — dùng chung cho thẻ ở thư
 * viện bộ từ và phần đầu trang một bộ, để bấm vào thẻ nào thì trang bộ đó cùng màu.
 */

export type DeckSource = 'mine' | 'ielts' | 'satMath' | 'satVerbal';

export type DeckLook = { source: DeckSource; sourceLabel: string; accent: readonly [string, string]; icon: IconName };

/** Mười cặp (nền nhạt, màu đậm); chủ đề IELTS lấy theo thứ tự để thẻ cạnh nhau không trùng màu. */
const PALETTE: readonly (readonly [string, string])[] = [
  ['#FBF5EC', '#CCA35B'],
  ['#DCFCE7', '#16A34A'],
  ['#CCFBF1', '#0D9488'],
  ['#F3E6C8', '#9C7A3A'],
  ['#FEF3C7', '#D97706'],
  ['#FEE2E2', '#DC2626'],
  ['#F9F2E6', '#CDA45E'],
  ['#FCE7F3', '#DB2777'],
  ['#CFFAFE', '#8E6A2C'],
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

const TOPIC_INDEX = new Map(VOCAB_TOPICS.map((t, i) => [t.slug, i]));
const SAT_SUBJECT = new Map(SAT_VOCAB_LESSONS.map((l) => [l.slug, l.subject]));

export function deckLook(slug: string): DeckLook {
  if (slug === NOTEBOOK_SLUG) return { source: 'mine', sourceLabel: 'Sổ từ của bạn', accent: ['#FBF5EC', '#CCA35B'], icon: 'book' };
  if (slug.startsWith(CUSTOM_PREFIX)) return { source: 'mine', sourceLabel: 'Bộ bạn tạo', accent: ['#D1FAE5', '#059669'], icon: 'note' };
  const subject = SAT_SUBJECT.get(slug);
  if (subject === 'math') return { source: 'satMath', sourceLabel: 'SAT Math', accent: ['#F9F2E6', '#CDA45E'], icon: 'grid' };
  if (subject) return { source: 'satVerbal', sourceLabel: 'SAT Verbal', accent: ['#FFE4E6', '#E11D48'], icon: 'letters' };
  const i = TOPIC_INDEX.get(slug) ?? 0;
  return { source: 'ielts', sourceLabel: 'Chủ đề IELTS', accent: PALETTE[i % PALETTE.length]!, icon: TOPIC_ICON[slug] ?? 'book' };
}
