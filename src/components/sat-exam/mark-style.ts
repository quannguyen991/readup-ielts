import { MARK_FILL, type Mark } from './highlight-model';
import { EXAM } from './exam-theme';

/** Kiểu chữ của một vệt tô (và/hoặc gạch chân sẵn của đề) — dùng chung cho R&W và Math. */
export function markTextStyle(m: Mark | null | undefined, given = false) {
  return {
    backgroundColor: m?.color ? MARK_FILL[m.color] : undefined,
    textDecorationLine: given || m?.underline ? ('underline' as const) : undefined,
    borderBottomWidth: m && m.note ? 2 : undefined,
    borderBottomColor: m && m.note ? EXAM.gold : undefined,
    borderStyle: m && m.note ? ('dashed' as const) : undefined,
  };
}
