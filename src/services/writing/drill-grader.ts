import type { AnalysisKey, TrendDirection, TrendFact } from '@/lib/writing/types';

/**
 * Chấm các phần drill mà KHÔNG cần AI.
 *
 * Ba phần chấm được bằng máy vì có đối chiếu khách quan:
 * - Overview: đối chiếu với `analysisKey` suy ra từ chính dữ liệu biểu đồ.
 * - Introduction: đo độ trùng từ với đề bài — chép nguyên đề là lỗi đo được.
 * - Brainstorm: đếm ý và xem có bỏ sót đối tượng nào không.
 *
 * Đây là chỗ đáng khai thác nhất của toàn module: overview là kỹ năng quyết
 * định nhất, và vì chấm được offline nên người học lặp lại bao nhiêu lần cũng
 * được mà không tốn một đồng token nào.
 */

/** Cách người học có thể diễn đạt mỗi chiều xu hướng. */
const DIRECTION_WORDS: Record<TrendDirection, string[]> = {
  up: [
    'rise', 'rises', 'rose', 'risen', 'rising',
    'increase', 'increases', 'increased', 'increasing',
    'grow', 'grows', 'grew', 'grown', 'growth', 'growing',
    'climb', 'climbs', 'climbed', 'climbing',
    'went up', 'go up', 'goes up', 'upward', 'upwards',
    'surge', 'surged', 'soar', 'soared', 'jump', 'jumped',
    'higher', 'more',
  ],
  down: [
    'fall', 'falls', 'fell', 'fallen', 'falling',
    'decrease', 'decreases', 'decreased', 'decreasing',
    'decline', 'declines', 'declined', 'declining',
    'drop', 'drops', 'dropped', 'dropping',
    'went down', 'go down', 'downward', 'downwards',
    'plummet', 'plummeted', 'slump', 'slumped', 'shrink', 'shrank',
    'lower', 'less', 'reduction', 'reduced',
  ],
  stable: [
    'stable', 'steady', 'unchanged', 'constant', 'flat', 'stayed the same',
    'remained', 'remain', 'levelled off', 'leveled off', 'plateau', 'plateaued',
    'little change', 'no change', 'hardly changed', 'stability',
  ],
  fluctuating: [
    'fluctuate', 'fluctuated', 'fluctuation', 'varied', 'vary', 'volatile',
    'up and down', 'rose and fell', 'unstable', 'erratic',
  ],
};

/** Cách diễn đạt việc hai đường đổi ngôi cho nhau. */
const CROSSING_WORDS = [
  'overtook', 'overtake', 'overtaken', 'surpassed', 'exceeded',
  'crossed', 'swapped', 'exchanged', 'took over', 'replaced',
  'changed places', 'reversed',
];

export type OverviewGrade = {
  covered: TrendFact[];
  missed: TrendFact[];
  /** Overview không được có số liệu — đây là lỗi ăn điểm Task Achievement. */
  hasNumbers: boolean;
  mentionsCrossing: boolean;
  /** 0–100. Chỉ để người học thấy tiến bộ qua các lần lặp, không phải band. */
  score: number;
  notes: string[];
};

export function gradeOverview(text: string, key: AnalysisKey): OverviewGrade {
  const lower = text.toLowerCase();

  const covered: TrendFact[] = [];
  const missed: TrendFact[] = [];
  for (const trend of key.trends) {
    if (mentionsTrend(lower, trend)) covered.push(trend);
    else missed.push(trend);
  }

  const hasNumbers = /\d/.test(text);
  const mentionsCrossing =
    key.crossings.length > 0 && CROSSING_WORDS.some((w) => lower.includes(w));

  const notes: string[] = [];
  if (missed.length > 0) {
    notes.push(
      `Chưa nêu xu hướng của: ${missed.map((t) => t.subject).join(', ')}.`,
    );
  }
  if (hasNumbers) {
    notes.push('Overview đang có con số. Chỗ này chỉ nói xu hướng, số liệu để dành cho thân bài.');
  }
  if (key.crossings.length > 0 && !mentionsCrossing) {
    const c = key.crossings[0];
    notes.push(
      `Biểu đồ có chỗ đổi ngôi (${c?.subject} và ${c?.other} quanh ${c?.nearLabel}). Đây là ý overview mạnh nhất, nên nhắc tới.`,
    );
  }
  if (notes.length === 0) notes.push('Overview đã bắt đủ các ý lớn của biểu đồ.');

  const trendRatio = key.trends.length === 0 ? 0 : covered.length / key.trends.length;
  let score = trendRatio * 80;
  if (mentionsCrossing) score += 20;
  else if (key.crossings.length === 0) score += 20; // Đề không có giao cắt thì không trừ.
  if (hasNumbers) score -= 25;

  return {
    covered,
    missed,
    hasNumbers,
    mentionsCrossing,
    score: Math.max(0, Math.min(100, Math.round(score))),
    notes,
  };
}

/**
 * Bắt được xu hướng nghĩa là nhắc tới ĐÚNG đối tượng VÀ ĐÚNG chiều.
 *
 * Chỉ nhắc tên mà tả sai chiều thì không phải mô tả thiếu — đó là mô tả sai,
 * còn tệ hơn, nên không được tính là đã bắt.
 */
function mentionsTrend(lower: string, trend: TrendFact): boolean {
  const subject = trend.subject.toLowerCase();
  if (!lower.includes(subject)) return false;

  // Chỉ xét đoạn văn bản sau lần nhắc tên gần nhất, để chiều của đối tượng này
  // không bị "mượn" từ câu nói về đối tượng khác.
  const at = lower.indexOf(subject);
  const window = lower.slice(at, at + subject.length + 90);
  return DIRECTION_WORDS[trend.direction].some((w) => window.includes(w));
}

// ---------------------------------------------------------------------------

export type ParaphraseGrade = {
  /**
   * Tỷ lệ từ nội dung của đề còn nguyên trong bài viết.
   *
   * GIỚI HẠN ĐÃ BIẾT: chỉ số này đo *giữ lại bao nhiêu từ*, không đo *có đổi
   * cấu trúc câu hay không*. Hai câu cùng giữ 3/5 từ nhưng một câu đảo hẳn trật
   * tự còn câu kia chỉ thay từ đồng nghĩa sẽ ra cùng một con số. Vì vậy nó
   * phân biệt chắc chắn "chép" với "không chép", còn ranh giới yếu/tốt thì chỉ
   * là gợi ý — phần nhận xét câu chữ để cho AI làm.
   */
  overlapRatio: number;
  verdict: 'copied' | 'weak' | 'good';
  repeatedWords: string[];
  note: string;
};

/**
 * Từ không tính vào độ trùng.
 *
 * Gồm hai nhóm: từ chức năng (trùng là đương nhiên), và **từ chỉ loại hình biểu
 * đồ** — "line graph", "table", "pie chart" thì bắt buộc phải giữ nguyên, không
 * ai paraphrase được chúng. Tính chúng vào là phạt người học vì một việc họ
 * không được phép làm khác đi.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'been', 'by', 'with', 'from', 'that',
  'this', 'it', 'as', 'below', 'between', 'over', 'during', 'their', 'its',
  // Loại hình biểu đồ và từ dẫn của đề — phải giữ nguyên nên không tính.
  'line', 'graph', 'bar', 'pie', 'chart', 'charts', 'table', 'diagram',
  'map', 'maps', 'graphs', 'below', 'show', 'shows',
]);

export function gradeParaphrase(promptText: string, text: string): ParaphraseGrade {
  const promptWords = contentWords(promptText);
  const written = new Set(contentWords(text));

  const repeated = promptWords.filter((w) => written.has(w));
  const ratio = promptWords.length === 0 ? 0 : repeated.length / promptWords.length;

  // Một câu lệnh đề thường chỉ còn 5-7 từ nội dung sau khi loại từ chức năng và
  // từ loại hình biểu đồ, nên mỗi từ giữ lại đã là 15-20%. Giữ 4/5 trở lên là
  // chép; giữ 3/5 là mới thay từ đồng nghĩa.
  const verdict: ParaphraseGrade['verdict'] = ratio >= 0.8 ? 'copied' : ratio >= 0.6 ? 'weak' : 'good';
  const note =
    verdict === 'copied'
      ? 'Câu mở bài gần như chép nguyên đề. Chữ chép từ đề không được tính vào số từ tối thiểu.'
      : verdict === 'weak'
        ? 'Mới đổi được vài chữ. Thử đổi cả từ loại và trật tự câu, không chỉ thay từ đồng nghĩa.'
        : 'Paraphrase tốt — đã đổi được phần lớn từ khoá của đề.';

  return { overlapRatio: Math.round(ratio * 100) / 100, verdict, repeatedWords: repeated, note };
}

function contentWords(s: string): string[] {
  const words = (s.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).filter(
    (w) => w.length > 2 && !STOP_WORDS.has(w),
  );
  return [...new Set(words)];
}

// ---------------------------------------------------------------------------

export type BrainstormGrade = {
  ideaCount: number;
  matchedSubjects: string[];
  missedSubjects: string[];
  note: string;
};

/**
 * Chấm phần brainstorm: đếm ý và xem có bỏ sót đối tượng nào của biểu đồ không.
 *
 * Người học được viết bằng tiếng Việt ở phần này — brainstorm là để nghĩ, không
 * phải để diễn đạt. Nên chỉ đối chiếu tên đối tượng, không đối chiếu chiều.
 */
export function gradeBrainstorm(text: string, key: AnalysisKey): BrainstormGrade {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter((l) => l.length > 0);

  const lower = text.toLowerCase();
  const subjects = key.trends.map((t) => t.subject);
  const matched = subjects.filter((s) => lower.includes(s.toLowerCase()));
  const missed = subjects.filter((s) => !matched.includes(s));

  const note =
    missed.length > 0
      ? `Chưa nhắc tới: ${missed.join(', ')}. Overview cần bao được mọi đối tượng trên biểu đồ.`
      : lines.length < 2
        ? 'Mới có một ý. Cố nghĩ thêm ít nhất hai ý nữa trước khi viết.'
        : 'Đã bao đủ các đối tượng của biểu đồ.';

  return { ideaCount: lines.length, matchedSubjects: matched, missedSubjects: missed, note };
}
