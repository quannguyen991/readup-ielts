/**
 * LÊN KỶ: kết hợp cấp người học (XP của game khi học), dân số và công trình nền
 * đã hoàn thành. Kỷ không tự nhảy — người học bấm "Lên kỷ" khi đủ điều kiện,
 * để có một khoảnh khắc ăn mừng thay vì lặng lẽ đổi số.
 */
import { catalogItem, type Era } from '@/data/city/catalog';
import { isDone, populationOf, type Site } from './construction';

export type EraRequirement = { level: number; population: number; buildings: Record<string, number> };

/** Điều kiện ĐỂ LÊN kỷ `key` (từ kỷ key-1). */
export const ERA_REQUIREMENTS: Record<2 | 3 | 4 | 5, EraRequirement> = {
  2: { level: 2, population: 4, buildings: { tent: 2, campfire: 1, well: 1, depot: 1 } },
  3: { level: 4, population: 20, buildings: { house_wood: 3, warehouse: 1 } },
  4: { level: 6, population: 60, buildings: { house_brick: 3, school: 1, market: 1 } },
  5: { level: 9, population: 150, buildings: { townhouse: 3, hospital: 1, fountain_plaza: 1 } },
};

export type RequirementLine = { kind: 'level' | 'population' | 'building'; id?: string; have: number; need: number; ok: boolean };

export function eraChecklist(era: number, sites: readonly Site[], level: number): RequirementLine[] | null {
  const next = (era + 1) as 2 | 3 | 4 | 5;
  const req = ERA_REQUIREMENTS[next];
  if (!req) return null;
  const lines: RequirementLine[] = [
    { kind: 'level', have: level, need: req.level, ok: level >= req.level },
    { kind: 'population', have: populationOf(sites), need: req.population, ok: populationOf(sites) >= req.population },
  ];
  for (const [id, need] of Object.entries(req.buildings)) {
    const have = sites.filter((s) => s.type === id && isDone(s)).length;
    lines.push({ kind: 'building', id, have, need, ok: have >= need });
  }
  return lines;
}

export function canAdvanceEra(era: number, sites: readonly Site[], level: number): boolean {
  const list = eraChecklist(era, sites, level);
  return !!list && list.every((l) => l.ok);
}

/** Công trình mở theo kỷ. */
export function unlockedByEra(id: string, era: number): boolean {
  const it = catalogItem(id);
  return !!it && it.era <= (era as Era);
}
