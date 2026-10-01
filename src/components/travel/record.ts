import { themeOfDeck } from '@/data/travel/replies';
import type { VisitQuestion } from '@/services/travel/content';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/**
 * Ghi một câu trả lời vào lịch ôn chung của app (`topic_study`): câu có từ vựng
 * thật thì cập nhật hộp ôn, trả lời sai thì tính một lần "hay sai". Nhờ vậy học
 * trong game không tách rời học thường.
 */
export function recordAnswer(q: VisitQuestion, ok: boolean): void {
  if (!q.info || q.deck === 'translate' || themeOfDeck(q.deck)) return;
  const store = useTopicStudyStore.getState();
  store.review(q.deck, q.info.word, ok);
  if (!ok) store.addLapse(q.deck, q.info.word);
}

/** Khoá nội dung của các câu vừa làm (không hỏi lại trong 24 giờ). */
export function seenKeys(questions: VisitQuestion[]): string[] {
  return questions.map((q) => q.key);
}
