/**
 * MỤC TIÊU DÀI HẠN của thành phố — cho người đã lên Kỷ 5 (không còn kỷ mới để
 * mở) vẫn có đích để nhắm. Mỗi mục tiêu có nhiều bậc; bậc sau mở khi xong bậc
 * trước. Chỉ ĐỌC trạng thái sẵn có (công trình, vùng đất, bộ sưu tập, nội
 * thất) — không thưởng thêm gì, nên không đụng tới kinh tế vật liệu / sao.
 */
import { catalogItem, isTower } from '@/data/city/catalog';
import { isDone, populationOf, type Site } from './construction';

export type GoalInput = {
  era: number;
  regions: number;
  sites: readonly Site[];
  /** Số loài khác nhau đã bắt. */
  species: number;
  speciesTotal: number;
  /** Số món nội thất đang bày. */
  furniture: number;
};

export type Goal = { id: string; glyph: string; vi: string; en: string; value: number; target: number; tier: number; tiers: number; done: boolean };

const SKILL_TYPES = ['vocab_house', 'listen_house', 'reading_house', 'library', 'academy'];

type Def = { id: string; glyph: string; vi: (n: number) => string; en: (n: number) => string; ladder: number[]; value: (i: GoalInput) => number };

const DEFS: Def[] = [
  { id: 'era', glyph: '🏛️', vi: (n) => `Đưa thành phố lên Kỷ ${n}`, en: (n) => `Reach Era ${n}`, ladder: [2, 3, 4, 5], value: (i) => i.era },
  { id: 'land', glyph: '🧭', vi: (n) => `Mở ${n}/16 vùng đất`, en: (n) => `Open ${n}/16 land regions`, ladder: [6, 10, 16], value: (i) => i.regions },
  { id: 'built', glyph: '🏘️', vi: (n) => `Hoàn thành ${n} công trình`, en: (n) => `Finish ${n} buildings`, ladder: [10, 30, 60, 100], value: (i) => i.sites.filter((s) => isDone(s)).length },
  { id: 'people', glyph: '👥', vi: (n) => `Đạt ${n.toLocaleString('vi-VN')} dân`, en: (n) => `Reach ${n.toLocaleString('en-US')} residents`, ladder: [50, 200, 800, 2000], value: (i) => populationOf(i.sites) },
  {
    id: 'skills',
    glyph: '🎓',
    vi: (n) => `Xây đủ ${n}/5 công trình kỹ năng`,
    en: (n) => `Build ${n}/5 skill buildings`,
    ladder: [2, 5],
    value: (i) => SKILL_TYPES.filter((t) => i.sites.some((s) => s.type === t && isDone(s))).length,
  },
  {
    id: 'towers',
    glyph: '🏙️',
    vi: (n) => `Dựng ${n} cao ốc`,
    en: (n) => `Raise ${n} towers`,
    ladder: [1, 4, 10],
    value: (i) => i.sites.filter((s) => isTower(catalogItem(s.type)) && isDone(s)).length,
  },
  { id: 'collection', glyph: '🎒', vi: (n) => `Bắt được ${n} loài cá / bọ`, en: (n) => `Catch ${n} fish / bug species`, ladder: [5, 10, 20], value: (i) => i.species },
  { id: 'home', glyph: '🛋️', vi: (n) => `Bày ${n} món nội thất trong nhà`, en: (n) => `Place ${n} furniture pieces`, ladder: [3, 8, 15], value: (i) => i.furniture },
];

export function cityGoals(input: GoalInput): Goal[] {
  return DEFS.map((d) => {
    const ladder = d.id === 'collection' ? [...d.ladder.slice(0, -1), input.speciesTotal] : d.ladder;
    const value = d.value(input);
    const idx = ladder.findIndex((t) => value < t);
    const tier = idx === -1 ? ladder.length - 1 : idx;
    const target = ladder[tier]!;
    return { id: d.id, glyph: d.glyph, vi: d.vi(target), en: d.en(target), value: Math.min(value, target), target, tier: idx === -1 ? ladder.length : idx, tiers: ladder.length, done: idx === -1 };
  });
}
