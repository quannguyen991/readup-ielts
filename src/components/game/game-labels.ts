import type { Locale } from '@/i18n/keys';
import { enemyName } from '@/components/world/island-label';
import { achievementTitle } from '@/services/gamification/labels-en';
import { ACHIEVEMENTS, ENEMIES, type DailyQuest, type ItemKind } from '@/services/game/rules';

/**
 * CHỮ TIẾNG ANH CHO TRẬN ĐẤU — tên đồ trong túi, lời khiêu khích của quái, tên
 * nhiệm vụ ngày, và tra ngược tên quái / huy hiệu khi sự kiện chỉ mang tên
 * tiếng Việt.
 *
 * Dữ liệu gốc (`services/game/rules.ts`) giữ tiếng Việt và vẫn là nguồn sự
 * thật; tệp này chỉ dịch tại chỗ hiển thị. Tên quái dùng chung bảng của
 * `components/world/island-label`.
 */

const ITEM_KIND_EN: Record<ItemKind, { name: string; detail: string }> = {
  potion: { name: 'Health potion', detail: 'Restores 2 hearts.' },
  shield: { name: 'Shield', detail: 'Blocks one wrong answer: no heart lost, combo kept.' },
  double: { name: 'Double XP', detail: 'Your next 10 correct answers earn double XP.' },
  hint: { name: "Owl's hint", detail: 'Removes 2 wrong options from the current multiple-choice question.' },
};

const TAUNT_EN: Record<string, string> = {
  'typo-bug': 'Miss one letter and I live!',
  'comma-slime': 'Comma splices — yum!',
  'tense-ghost': 'Yesterday or today?',
  'math-golem': 'You forgot to flip the sign!',
  'idiom-bat': 'Every word right, the meaning wrong.',
  'false-friend': 'Looks familiar, means something else!',
  'blank-dragon': 'The blank page is mine!',
};

const QUEST_EN: Record<string, string> = {
  'correct-20': 'Answer 20 questions correctly',
  'correct-40': 'Answer 40 questions correctly',
  'answers-30': 'Answer any 30 questions',
  'combo-8': 'Reach a combo of 8',
  'combo-15': 'Reach a combo of 15',
  'defeat-2': 'Defeat 2 monsters',
  'defeat-4': 'Defeat 4 monsters',
  'xp-300': 'Earn 300 XP',
  'vocab-30': 'Do 30 vocabulary reviews',
  'vocab-60': 'Do 60 vocabulary reviews',
};

export function itemKindName(k: ItemKind, vi: string, locale: Locale): string {
  return locale === 'en' ? ITEM_KIND_EN[k].name : vi;
}

export function itemKindDetail(k: ItemKind, vi: string, locale: Locale): string {
  return locale === 'en' ? ITEM_KIND_EN[k].detail : vi;
}

export function enemyTaunt(e: { id: string; taunt: string }, locale: Locale): string {
  return locale === 'en' ? (TAUNT_EN[e.id] ?? e.taunt) : e.taunt;
}

/** Tên quái khi chỉ có tên tiếng Việt (sự kiện "hạ quái"). Boss giữ tên gốc của loài. */
export function enemyNameByVi(vi: string, locale: Locale): string {
  if (locale !== 'en') return vi;
  const e = ENEMIES.find((x) => x.name === vi);
  return e ? enemyName(e, locale) : vi;
}

export function questTitle(q: Pick<DailyQuest, 'id' | 'title'>, locale: Locale): string {
  return locale === 'en' ? (QUEST_EN[q.id] ?? q.title) : q.title;
}

/** Tên nhiệm vụ khi sự kiện chỉ mang tiêu đề tiếng Việt. */
export function questTitleByVi(vi: string, locale: Locale): string {
  if (locale !== 'en') return vi;
  const id = Object.keys(QUEST_EN).find((k) => QUEST_POOL_VI[k] === vi);
  return id ? QUEST_EN[id]! : vi;
}

/** Tiêu đề tiếng Việt của nhiệm vụ theo id — để tra ngược; khớp `QUEST_POOL` trong rules. */
const QUEST_POOL_VI: Record<string, string> = {
  'correct-20': 'Trả lời đúng 20 câu',
  'correct-40': 'Trả lời đúng 40 câu',
  'answers-30': 'Làm 30 câu bất kỳ',
  'combo-8': 'Đạt combo 8',
  'combo-15': 'Đạt combo 15',
  'defeat-2': 'Hạ 2 con quái',
  'defeat-4': 'Hạ 4 con quái',
  'xp-300': 'Kiếm 300 XP',
  'vocab-30': 'Ôn 30 lượt từ vựng',
  'vocab-60': 'Ôn 60 lượt từ vựng',
};

/** Tên huy hiệu khi sự kiện chỉ mang tiêu đề tiếng Việt. */
export function achievementByVi(vi: string, locale: Locale): string {
  if (locale !== 'en') return vi;
  const a = ACHIEVEMENTS.find((x) => x.title === vi);
  return a ? achievementTitle(a, locale) : vi;
}
