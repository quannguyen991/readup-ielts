import type { SceneKey } from '@/data/hub/scenes';
import { CALLS } from '@/data/hub/calls';
import { NHAP_VAI } from '@/data/hub/roleplays';

/**
 * Kịch bản luyện nói chấm bằng lựa chọn (không cần AI): nhập vai và gọi điện. Mỗi lượt có ba cách đáp,
 * một cách tốt và hai cách còn lại kèm lời giải thích ngắn bằng tiếng Việt.
 * Dữ liệu: src/data/hub/roleplays.ts (nhập vai) và src/data/hub/calls.ts (gọi điện).
 */

export type RoleplayDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type RoleplayMode = 'roleplay' | 'call';
export type ScenarioCategory = 'daily' | 'work' | 'travel' | 'dining' | 'shopping' | 'health' | 'services' | 'education' | 'home';
export type RoleplayOption = { text: string; good: boolean; tip: string };
export type RoleplayStep = { ai: string; options: RoleplayOption[] };
export type VocabItem = { word: string; pos: string; meaning: string };
export type Roleplay = {
  id: string;
  mode: RoleplayMode;
  title: string;
  scene: string;
  difficulty: RoleplayDifficulty;
  minutes: number;
  category: ScenarioCategory;
  setting: SceneKey;
  /** Nhiệm vụ: việc người học phải làm trong hội thoại. */
  tasks: string[];
  /** Từ mục tiêu: từ cần dùng, kèm từ loại và nghĩa tiếng Việt. */
  vocab: VocabItem[];
  steps: RoleplayStep[];
};

/** Tất cả kịch bản nhập vai và gọi điện (30 + 30). */
export const ROLEPLAYS: Roleplay[] = [...NHAP_VAI, ...CALLS];

export const CATEGORY_LABEL: Record<ScenarioCategory, string> = {
  daily: 'Đời sống',
  work: 'Công việc',
  travel: 'Du lịch',
  dining: 'Ăn uống',
  shopping: 'Mua sắm',
  health: 'Sức khoẻ',
  services: 'Dịch vụ',
  education: 'Học tập',
  home: 'Nhà ở',
};

export function roleplayById(id: string): Roleplay | undefined {
  return ROLEPLAYS.find((r) => r.id === id);
}

/** Điểm một lượt: số lựa chọn tốt. Đạt khi chọn tốt ở ít nhất 2 lượt trên 3. */
export function gradeRoleplay(picks: (number | null)[], steps: RoleplayStep[]): { good: number; total: number; passed: boolean } {
  const total = steps.length;
  const good = steps.reduce((n, step, i) => {
    const p = picks[i];
    return n + (p !== null && p !== undefined && step.options[p]?.good ? 1 : 0);
  }, 0);
  return { good, total, passed: good >= Math.ceil((total * 2) / 3) };
}
