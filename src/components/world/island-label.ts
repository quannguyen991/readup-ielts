import type { Locale } from '@/i18n/keys';
import type { Island, IslandId, Mission } from '@/services/world/islands';
import { MATH_SKILL_LABEL, type MathSkill } from '@/lib/math/types';
import { SAT_RW_SKILL_LABEL_EN } from '@/components/sat-rw/skill-label-en';

/**
 * CHỮ TIẾNG ANH CHO BẢN ĐỒ BAND 9 — tên đảo, khẩu hiệu đảo, nhiệm vụ Đấu trường,
 * nhãn độ khó, tên quái.
 *
 * Dữ liệu gốc (`services/world/islands.ts`, `services/game/rules.ts`) giữ tiếng
 * Việt và vẫn là nguồn sự thật; tệp này chỉ dịch tại chỗ hiển thị. Bài lý thuyết
 * Toán / Verbal hiện tên kỹ năng tiếng Anh; tên bộ từ, bài nghe/dịch là học liệu
 * nên để nguyên.
 */

const ISLAND_EN: Record<IslandId, { name: string; tagline: string }> = {
  math: { name: 'SAT Math Island', tagline: 'Math theory lessons, one question type each' },
  verbal: { name: 'SAT Verbal Island', tagline: 'Reading, grammar and sentence writing' },
  vocab: { name: 'Vocabulary Island', tagline: 'SAT word sets — remember 70% to pass' },
  listen: { name: 'Dictation Island', tagline: '50 topic-based dictation sets' },
  translate: { name: 'Translation Island', tagline: '50 Vietnamese → English translation sets' },
  arena: { name: 'Arena', tagline: 'Defeat all seven kinds of study-game monster' },
};

/** Tên đảo ngắn (bỏ chữ "Đảo") dùng ở thẻ chọn mảng. */
const ISLAND_SHORT_EN: Record<IslandId, string> = {
  math: 'SAT Math',
  verbal: 'SAT Verbal',
  vocab: 'Vocabulary',
  listen: 'Dictation',
  translate: 'Translation',
  arena: 'Arena',
};

const ENEMY_EN: Record<string, string> = {
  'typo-bug': 'Typo Bug',
  'comma-slime': 'Comma Slime',
  'tense-ghost': 'Tense Ghost',
  'math-golem': 'Equation Golem',
  'idiom-bat': 'Idiom Bat',
  'false-friend': 'False Friend Chest',
  'blank-dragon': 'Blank Page Dragon',
};

const LEVEL_EN: Record<string, string> = {
  'Nền tảng': 'Foundation',
  'Trung bình': 'Intermediate',
  'Nâng cao': 'Advanced',
  Dễ: 'Easy',
  Khó: 'Hard',
};

export function islandName(island: Pick<Island, 'id' | 'name'>, locale: Locale): string {
  return locale === 'en' ? (ISLAND_EN[island.id]?.name ?? island.name) : island.name;
}

export function islandShortName(island: Pick<Island, 'id' | 'name'>, locale: Locale): string {
  return locale === 'en' ? (ISLAND_SHORT_EN[island.id] ?? island.name) : island.name.replace(/^Đảo /, '');
}

export function islandTagline(island: Pick<Island, 'id' | 'tagline'>, locale: Locale): string {
  return locale === 'en' ? (ISLAND_EN[island.id]?.tagline ?? island.tagline) : island.tagline;
}

export function enemyName(e: { id: string; name: string }, locale: Locale): string {
  return locale === 'en' ? (ENEMY_EN[e.id] ?? e.name) : e.name;
}

/**
 * Tên nhiệm vụ. Ở tiếng Anh: nhiệm vụ Đấu trường ("Hạ <quái>") dịch tên quái;
 * bài lý thuyết Toán / Verbal đổi sang tên kỹ năng College Board (mỗi bài ứng
 * đúng một kỹ năng). Các bài còn lại (bộ từ, nghe, dịch) là học liệu, để nguyên.
 */
export function missionTitle(m: Pick<Mission, 'id' | 'title'>, locale: Locale): string {
  if (locale !== 'en') return m.title;
  if (m.id.startsWith('math:')) return MATH_SKILL_LABEL[m.id.slice('math:'.length) as MathSkill] ?? m.title;
  if (m.id.startsWith('verbal:')) return SAT_RW_SKILL_LABEL_EN[m.id.slice('verbal:'.length)] ?? m.title;
  if (!m.id.startsWith('arena:')) return m.title;
  const name = ENEMY_EN[m.id.slice('arena:'.length)];
  if (!name) return m.title;
  return `Defeat ${m.title.includes('Boss ') ? 'Boss ' : ''}${name}`;
}

/** Nhãn độ khó / nhóm bài ("Nền tảng", "Dễ"…); nhãn đã là tiếng Anh (CEFR, SAT Math) giữ nguyên. */
export function levelLabel(level: string, locale: Locale): string {
  return locale === 'en' ? (LEVEL_EN[level] ?? level) : level;
}
