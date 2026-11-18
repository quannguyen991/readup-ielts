import { GT_CATEGORIES, MOCK_TESTS } from '@/data/hub/speaking-more';
import { SPEAKING_TOPICS, topicExtra } from '@/data/hub/speaking-topics';

/**
 * Tra câu hỏi của khu Luyện nói trong kho đề (chủ đề, đề thi thử, đề giao tiếp) — dùng cả ở client và máy chủ.
 * Máy chủ chỉ chấm câu hỏi có trong kho này, không nhận lời nhắc tuỳ ý từ client.
 */

export type HubPart = 1 | 2 | 3;

/** Câu hỏi Part 2 dạng một chuỗi: đề cộng bốn gợi ý (cùng khuôn với ngân hàng đề Speaking). */
export function part2Question(prompt: string, bullets: string[]): string {
  return bullets.length ? `${prompt} (${bullets.join('; ')})` : prompt;
}

let index: Map<string, HubPart> | null = null;

function build(): Map<string, HubPart> {
  const m = new Map<string, HubPart>();
  const put = (q: string, part: HubPart) => {
    if (q.trim()) m.set(q.trim(), part);
  };
  for (const t of SPEAKING_TOPICS) {
    t.part1.forEach((q) => put(q, 1));
    t.part3.forEach((q) => put(q, 3));
    put(part2Question(t.part2.prompt, t.part2.bullets), 2);
    const e = topicExtra(t.id);
    e?.p1More.forEach((q) => put(q, 1));
    e?.p3More.forEach((q) => put(q, 3));
  }
  for (const mock of MOCK_TESTS) {
    mock.part1.forEach((g) => g.qs.forEach((q) => put(q, 1)));
    put(part2Question(mock.part2.prompt, mock.part2.bullets), 2);
    mock.part3.forEach((q) => put(q, 3));
  }
  // Đề giao tiếp là một lượt nói tự do: chấm như Part 1 nhưng yêu cầu dài hơn.
  for (const c of GT_CATEGORIES) c.tasks.forEach((t) => put(t.task, 1));
  return m;
}

/** Phần thi của một câu hỏi trong kho; null nếu câu đó không thuộc kho. */
export function hubQuestionPart(question: string): HubPart | null {
  index ??= build();
  return index.get(question.trim()) ?? null;
}

let answers: Map<string, string> | null = null;

/** Đáp án mẫu (Band 7–8) của một câu trong kho; null nếu kho chưa có. */
export function modelAnswerFor(question: string): string | null {
  if (!answers) {
    const m = new Map<string, string>();
    const put = (q: string, a: string | undefined) => {
      if (q.trim() && a && a.trim()) m.set(q.trim(), a.trim());
    };
    for (const t of SPEAKING_TOPICS) {
      const e = topicExtra(t.id);
      if (!e) continue;
      // Theo thứ tự câu: AI đôi khi diễn đạt lại câu hỏi trong phần đáp án, nên không ghép theo nguyên văn.
      t.part1.forEach((q, i) => put(q, e.p1[i]?.a));
      t.part3.forEach((q, i) => put(q, e.p3[i]?.a));
      put(part2Question(t.part2.prompt, t.part2.bullets), e.sample);
    }
    for (const mock of MOCK_TESTS) {
      const qs = mock.part1.flatMap((g) => g.qs);
      qs.forEach((q, i) => put(q, mock.answers.p1[i]));
      put(part2Question(mock.part2.prompt, mock.part2.bullets), mock.answers.sample);
      mock.part3.forEach((q, i) => put(q, mock.answers.p3[i]));
    }
    for (const c of GT_CATEGORIES) c.tasks.forEach((t) => put(t.task, t.sample));
    answers = m;
  }
  return answers.get(question.trim()) ?? null;
}
