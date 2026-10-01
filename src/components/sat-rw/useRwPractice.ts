import { useCallback, useEffect, useRef, useState } from 'react';

import type { SatRwQuestion } from '@/data/sat-rw-repository';
import { recordRwAttempt } from '@/store/useSatRwStore';
import { useGameStore } from '@/store/useGameStore';

/**
 * Trạng thái một lượt luyện SAT Verbal trong phòng thi: đi tới / lui tự do,
 * chọn rồi mới "Kiểm tra".
 *
 * GHI ĐIỂM MỘT LẦN MỖI CÂU, như trước: bộ có lời giải ngay ghi lúc bấm Kiểm tra
 * (kèm một đòn của game khi học); bộ chốt ghi tất cả lúc nộp. Câu đã chọn mà
 * chưa kiểm tra khi nộp thì cũng được ghi lúc ấy — không có câu nào bị bỏ sót.
 *
 * Thời gian mỗi câu cộng dồn qua các lần quay lại câu đó.
 */
export function useRwPractice(questions: SatRwQuestion[], instant: boolean) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [graded, setGraded] = useState<boolean[]>(() => questions.map(() => false));
  const [hidden, setHidden] = useState<Record<number, number[]>>({});

  const spent = useRef<number[]>(questions.map(() => 0));
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const timeOn = (i: number) => spent.current[i]! + (i === index ? Date.now() - shownAt.current : 0);

  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(questions.length - 1, to));
      if (next === index) return;
      spent.current[index] = (spent.current[index] ?? 0) + (Date.now() - shownAt.current);
      setIndex(next);
    },
    [index, questions.length],
  );

  const question = questions[index];
  const locked = instant && !!graded[index];

  const pick = (choice: number) => {
    if (locked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[index] = choice;
      return next;
    });
  };

  /** Bấm Kiểm tra ở câu đang mở. Trả về đúng/sai, hoặc null nếu chưa chọn. */
  const check = (): boolean | null => {
    const choice = picks[index];
    if (!question || choice === null || choice === undefined || graded[index]) return null;
    const ok = choice === question.answerIndex;
    recordRwAttempt(question.id, ok, timeOn(index));
    // Bộ chốt không có nút Kiểm tra; chặn thêm ở đây cho chắc — đòn từng câu sẽ lộ đúng sai trước khi nộp.
    if (instant) useGameStore.getState().answer(ok, 'verbal');
    setGraded((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    return ok;
  };

  /**
   * Nộp: ghi mọi câu đã chọn mà chưa ghi. Trả số câu đúng của cả bộ.
   *
   * `partial` = "Lưu & thoát" giữa chừng: cũng ghi các câu đã chọn, nhưng bộ
   * chốt chỉ thưởng theo số câu ĐÃ LÀM chứ không tính cả bộ.
   */
  const finish = (partial = false): number => {
    let pendingRight = 0;
    let pendingCount = 0;
    questions.forEach((q, i) => {
      const choice = picks[i];
      if (graded[i] || choice === null || choice === undefined) return;
      const ok = choice === q.answerIndex;
      recordRwAttempt(q.id, ok, timeOn(i));
      pendingCount++;
      if (ok) pendingRight++;
    });
    setGraded(questions.map((_, i) => graded[i] || picks[i] !== null));
    const correct = questions.filter((q, i) => picks[i] === q.answerIndex).length;
    // Bộ chốt: một lượt thưởng cho cả bộ (như cũ). Bộ học: chỉ phần chưa kiểm tra.
    const answeredCount = picks.filter((c) => c !== null).length;
    if (!instant && !partial) useGameStore.getState().awardBatch(correct, questions.length, 'verbal');
    else if (!instant && answeredCount > 0) useGameStore.getState().awardBatch(correct, answeredCount, 'verbal');
    if (instant && pendingCount > 0) useGameStore.getState().awardBatch(pendingRight, pendingCount, 'verbal');
    return correct;
  };

  const reset = () => {
    setIndex(0);
    setPicks(questions.map(() => null));
    setGraded(questions.map(() => false));
    setHidden({});
    spent.current = questions.map(() => 0);
  };

  const correctSoFar = questions.filter((q, i) => graded[i] && picks[i] === q.answerIndex).length;

  return {
    index,
    go,
    question,
    picks,
    picked: picks[index] ?? null,
    graded,
    locked,
    pick,
    check,
    finish,
    reset,
    correctSoFar,
    hidden: hidden[index] ?? [],
    setHidden: (out: number[]) => setHidden((prev) => ({ ...prev, [index]: out })),
  };
}
