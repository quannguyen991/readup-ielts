export type IeltsSkill = 'listening' | 'reading' | 'writing' | 'speaking';
export type IeltsSkillBands = Partial<Record<IeltsSkill, number | null>>;

/** IELTS overall is the mean of four section scores, rounded to the nearest 0.5. */
export function overallIeltsBand(bands: IeltsSkillBands): number | null {
  const values: number[] = [];
  for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
    const value = bands[skill];
    if (value == null || !Number.isFinite(value) || value < 0 || value > 9 || Math.abs(value * 2 - Math.round(value * 2)) > 1e-8) return null;
    values.push(value);
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(9, Math.round((average + Number.EPSILON) * 2) / 2);
}

/** Convert the writing grader's honest range into a half-band display estimate. */
export function writingBandMidpoint(low: number, high: number): number | null {
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high > 9 || low > high) return null;
  return Math.round((((low + high) / 2) + Number.EPSILON) * 2) / 2;
}
