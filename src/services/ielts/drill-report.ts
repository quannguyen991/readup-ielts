import { READING_BAND_TABLE, rawScoreToBand } from '@/lib/band';
import { LISTENING_BAND_TABLE, bandFromRaw40 } from '@/services/listening/scoring';

/**
 * Chấm chi tiết một lượt luyện (set 20 câu hoặc bài tổng hợp 40 câu): điểm thô, quy ra band, độ chính xác theo từng dạng
 * câu hỏi, và phổ điểm (số câu đúng cần cho mỗi band). Hàm thuần, không đụng store hay giao diện.
 *
 * Quy đổi band: bảng chuẩn 40 câu (Reading Academic / Listening). Lượt ít hơn 40 câu được quy tỉ lệ lên 40 và
 * kèm khoảng sai số ±1 câu, vì 20 câu chưa đủ để kết luận band chắc chắn.
 */

export type ReportSkill = 'reading' | 'listening';

export type ReportItem = {
  /** Số thứ tự câu trong lượt làm (từ 1). */
  index: number;
  typeId: string;
  prompt: string;
  options?: string[];
  /** Đáp án đúng đầy đủ (có thể có đáp án phụ cách nhau " | "). */
  answer: string;
  /** Đáp án người học chọn hoặc gõ; null nếu bỏ trống. */
  given: string | null;
  correct: boolean;
  why: string;
  quote?: string;
};

export type TypeAccuracy = { typeId: string; correct: number; total: number; pct: number };

export type BandRow = { band: number; minRaw: number; maxRaw: number };

export type DrillReport = {
  skill: ReportSkill;
  correct: number;
  total: number;
  unanswered: number;
  pct: number;
  /** Điểm quy về thang 40 câu. */
  scaled40: number;
  band: number;
  bandLow: number;
  bandHigh: number;
  /** true nếu lượt làm đủ 40 câu: band chắc chắn hơn, không cần khoảng sai số. */
  fullLength: boolean;
  byType: TypeAccuracy[];
  weakest: TypeAccuracy | null;
  strongest: TypeAccuracy | null;
};

export function bandFor(skill: ReportSkill, correct: number, total: number): number {
  if (total <= 0) return 0;
  return skill === 'reading' ? rawScoreToBand(correct, total) : bandFromRaw40(Math.round((correct / total) * 40));
}

/** Phổ điểm: mỗi band ứng với khoảng số câu đúng trên thang 40 (từ band 9 xuống band 4). */
export function bandSpectrum(skill: ReportSkill): BandRow[] {
  const table: ReadonlyArray<readonly [number, number]> = skill === 'reading' ? READING_BAND_TABLE : LISTENING_BAND_TABLE;
  const rows: BandRow[] = [];
  let upper = 40;
  for (const [min, band] of table) {
    if (band < 4) break;
    rows.push({ band, minRaw: min, maxRaw: upper });
    upper = min - 1;
  }
  return rows;
}

/** Hàng của phổ điểm chứa điểm này (thang 40). */
export function spectrumRowFor(skill: ReportSkill, scaled40: number): BandRow | null {
  return bandSpectrum(skill).find((r) => scaled40 >= r.minRaw && scaled40 <= r.maxRaw) ?? null;
}

export function buildReport(skill: ReportSkill, items: ReportItem[]): DrillReport {
  const total = items.length;
  const correct = items.filter((i) => i.correct).length;
  const unanswered = items.filter((i) => i.given === null).length;
  const scaled40 = total === 0 ? 0 : Math.round((correct / total) * 40);
  const band = bandFor(skill, correct, total);
  const fullLength = total >= 40;
  const low = bandFor(skill, Math.max(0, correct - 1), total);
  const high = bandFor(skill, Math.min(total, correct + 1), total);

  const map = new Map<string, TypeAccuracy>();
  for (const it of items) {
    const cur = map.get(it.typeId) ?? { typeId: it.typeId, correct: 0, total: 0, pct: 0 };
    cur.total += 1;
    if (it.correct) cur.correct += 1;
    map.set(it.typeId, cur);
  }
  const byType = [...map.values()].map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) })).sort((a, b) => a.pct - b.pct || b.total - a.total);
  // Dạng có ít hơn 3 câu chưa đủ để gọi là yếu hay mạnh.
  const reliable = byType.filter((t) => t.total >= 3);

  return {
    skill,
    correct,
    total,
    unanswered,
    pct: total === 0 ? 0 : Math.round((correct / total) * 100),
    scaled40,
    band,
    bandLow: fullLength ? band : low,
    bandHigh: fullLength ? band : high,
    fullLength,
    byType,
    weakest: reliable[0] ?? null,
    strongest: reliable.length > 1 ? reliable[reliable.length - 1]! : null,
  };
}

/** Nhận xét ngắn theo độ chính xác của một dạng. */
export function accuracyVerdict(pct: number): 'strong' | 'ok' | 'weak' {
  if (pct >= 80) return 'strong';
  if (pct >= 55) return 'ok';
  return 'weak';
}
