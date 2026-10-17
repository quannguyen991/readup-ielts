import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';

import { SelfDiagnose } from './SelfDiagnose';
import { SatExamShell } from '@/components/sat-exam/SatExamShell';
import { MATH_ERROR_LABEL, type MathErrorTag, type MathItem } from '@/lib/math/types';
import { gradeMathItem, type MathResponse } from '@/services/math/grade';

import { MathQuestionView } from './MathQuestionView';
import { observeSkill } from '@/store/useMasteryStore';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

/**
 * Màn làm bài Math — dùng chung cho chẩn đoán, drill và mock.
 *
 * ĐO THỜI GIAN TỪNG CÂU, không chỉ thời gian cả bài. Với SAT thì tốc độ là một
 * nửa vấn đề: biết làm nhưng hết giờ và không biết làm cùng ra một kết quả trên
 * bảng điểm, mà hai chuyện ấy cần hai cách chữa hoàn toàn khác nhau. Số liệu
 * này về sau đủ để tách hai trường hợp đó ra.
 *
 * Đồng hồ chạy LÙI và tự nộp khi hết giờ, đúng như phòng thi. Cho phép làm quá
 * giờ thì con số thời gian mất hết ý nghĩa so sánh.
 */

export type MathRunnerProps = {
  title: string;
  subtitle?: string;
  items: MathItem[];
  minutes: number;
  /** Ghi chú nhỏ dưới đồng hồ, ví dụ "Module 1 / 2". */
  phaseLabel?: string;
  submitLabel?: string;
  /**
   * Cho xem lời giải NGAY sau khi trả lời, không phải đợi nộp cả bài.
   *
   * Bật ở bộ Làm quen và bộ Luyện, tắt ở Tốc độ / Kiểm tra / Đề — ba loại sau mô
   * phỏng điều kiện phòng thi, mà phòng thi thì không có lời giải giữa chừng.
   *
   * Với bộ 20 câu thì đây là khác biệt lớn: đọc lời giải ngay lúc còn nhớ mình
   * vừa nghĩ gì thì sửa được cách nghĩ; đợi tới cuối bài thì 19 câu trước đã
   * trôi mất khỏi đầu.
   */
  instantSolution?: boolean;
  /**
   * Nền trang đang đặt phòng thi này lên.
   *
   * `light` — nền sáng của các màn /math (mặc định, giữ nguyên như cũ).
   * `paper` — nền lưới xanh tím của bài thi SAT đầy đủ, thẻ chuyển sang giấy kem.
   *
   * Là THAM SỐ chứ không phải đổi thẳng: component này còn phục vụ /math/mock,
   * /math/diagnostic và /math/set/* — những màn vẫn nằm trên nền sáng. Đổi thẳng
   * là thẻ giấy kem rơi xuống nền sáng ở bốn màn khác mà không ai đợi.
   *
   * Từ 01/10/2026 mọi màn đều vẽ trong phòng thi `SatExamShell` (mặt trắng), nên
   * tham số này không còn đổi gì; giữ lại để nơi gọi khỏi phải sửa.
   */
  surface?: 'light' | 'paper';
  onFinish: (responses: MathResponse[], elapsedMs: number) => void;
  /** Thoát giữa bài. Mặc định quay lại trang trước (hoặc về /math). */
  onExit?: () => void;
};

/** Toàn bộ nhãn lỗi, dùng làm kho bốc mồi nhử cho bước tự chẩn đoán. */
const ALL_ERROR_TAGS = Object.keys(MATH_ERROR_LABEL) as MathErrorTag[];

export function MathRunner({
  title,
  subtitle,
  items,
  minutes,
  phaseLabel,
  submitLabel,
  instantSolution = false,
  onFinish,
  onExit,
}: MathRunnerProps) {
  const { L } = useL();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Đã mở lời giải câu nào. Mở rồi thì KHOÁ câu đó lại — xem đáp án xong còn
  // sửa được lựa chọn thì con số đúng/sai không còn nói lên điều gì.
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [spent, setSpent] = useState<Record<string, number>>({});
  // Phương án Cú đã loại, theo từng câu.
  const [hints, setHints] = useState<Record<string, number[]>>({});
  const [remainingMs, setRemainingMs] = useState(minutes * 60_000);

  const startedAt = useRef(0);
  const questionEnteredAt = useRef(0);
  const finished = useRef(false);

  // Đặt mốc trong effect, không phải trong `useRef(Date.now())`: đối số của
  // useRef được tính NGAY TRONG LÚC RENDER, mà render thì phải thuần tuý.
  useEffect(() => {
    const now = Date.now();
    startedAt.current = now;
    questionEnteredAt.current = now;
  }, []);

  const current = items[index];

  /*
    Nhãn lỗi của câu ĐANG mở, nếu người học đã trả lời và trả lời sai.

    `null` ở cả ba trường hợp: chưa trả lời, trả lời đúng, hoặc sai nhưng phương
    án họ chọn không mang nhãn lỗi nào (câu điền số không có nhiễu có tên).
  */
  const answeredWrong = useMemo(() => {
    if (!current) return null;
    const given = answers[current.id];
    if (given === undefined || given.trim() === '') return null;
    const grade = gradeMathItem(current, given);
    return grade.isCorrect ? null : grade.errorTag;
  }, [current, answers]);

  /** Dồn thời gian đã ở trên câu hiện tại vào sổ, rồi bắt đầu đếm lại. */
  const flushTime = useCallback(() => {
    const item = items[index];
    if (!item) return;
    const now = Date.now();
    const delta = now - questionEnteredAt.current;
    questionEnteredAt.current = now;
    setSpent((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + delta }));
  }, [index, items]);

  const submit = useCallback(() => {
    if (finished.current) return;
    finished.current = true;

    const now = Date.now();
    const item = items[index];
    const lastDelta = now - questionEnteredAt.current;

    const totals: Record<string, number> = { ...spent };
    if (item) totals[item.id] = (totals[item.id] ?? 0) + lastDelta;

    const responses: MathResponse[] = items.map((it) => ({
      itemId: it.id,
      answer: answers[it.id] ?? null,
      timeSpentMs: totals[it.id] ?? 0,
    }));

    // Game khi học: câu nào chưa chấm lúc xem lời giải thì chấm cả lượt lúc nộp.
    const pending = items.filter((it) => !revealed[it.id]);
    const right = pending.filter((it) => {
      const given = answers[it.id];
      return given !== undefined && given.trim() !== '' && gradeMathItem(it, given).isCorrect;
    }).length;
    if (pending.length > 0) useGameStore.getState().awardBatch(right, pending.length, 'math');

    onFinish(responses, now - startedAt.current);
  }, [answers, index, items, onFinish, revealed, spent]);

  // Đồng hồ đếm lùi. Hết giờ là nộp, không hỏi lại — phòng thi không hỏi lại.
  useEffect(() => {
    const timer = setInterval(() => {
      const left = minutes * 60_000 - (Date.now() - startedAt.current);
      setRemainingMs(left);
      if (left <= 0) submit();
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes, submit]);

  const goTo = (next: number) => {
    flushTime();
    setIndex(Math.min(items.length - 1, Math.max(0, next)));
  };

  const answered = useMemo(
    () => items.filter((item) => (answers[item.id] ?? '').trim() !== '').length,
    [answers, items],
  );

  // Gợi ý của Cú: câu trắc nghiệm chưa xem lời giải thì loại bớt hai phương án sai.
  useOwlHint(
    instantSolution && current?.choices && current.correctIndex !== null && !revealed[current.id]
      ? () => {
          if (hints[current.id]) return false;
          const wrong = current.choices!.map((_, i) => i).filter((i) => i !== current.correctIndex);
          const drop = Math.min(2, wrong.length - 1);
          if (drop <= 0) return false;
          const from = index % wrong.length;
          const out = Array.from({ length: drop }, (_, k) => wrong[(from + k) % wrong.length]!);
          setHints((prev) => ({ ...prev, [current.id]: out }));
          // Phương án đang chọn mà bị loại thì bỏ chọn.
          const picked = answers[current.id];
          if (picked !== undefined && picked !== '' && out.includes(Number(picked))) {
            setAnswers((prev) => ({ ...prev, [current.id]: '' }));
          }
          return true;
        }
      : null,
  );

  if (!current) return null;

  const isRevealed = revealed[current.id] ?? false;
  const given = (answers[current.id] ?? '').trim();
  const setAnswer = (value: string) => setAnswers((prev) => ({ ...prev, [current.id]: value }));
  // Bộ luyện: chạm một phương án là hiện đúng/sai và lời giải ngay (câu điền số vẫn có nút Kiểm tra).
  const pickChoice = (value: string) => {
    if (!instantSolution || !current.choices) {
      setAnswer(value);
      return;
    }
    useGameStore.getState().answer(gradeMathItem(current, value).isCorrect, 'math');
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setRevealed((prev) => ({ ...prev, [current.id]: true }));
  };

  return (
    <SatExamShell
      section="math"
      title={title}
      band={[phaseLabel, L(`đã trả lời ${answered}/${items.length}`, `answered ${answered}/${items.length}`)].filter(Boolean).join(' · ')}
      info={subtitle ?? null}
      timer={{ kind: 'down', remainingMs }}
      questionKeys={items.map((it) => it.id)}
      index={index}
      onJump={goTo}
      // Chỉ bộ luyện hiện độ khó; bài có giờ giữ đúng như đề thật (không nhãn).
      difficulty={instantSolution ? current.difficulty : undefined}
      isAnswered={(i) => (answers[items[i]!.id] ?? '').trim() !== ''}
      topSlot={instantSolution ? <BattleStrip /> : null}
      onBack={() => goTo(index - 1)}
      onNext={() => goTo(index + 1)}
      check={
        instantSolution && !isRevealed
          ? {
              label: given === '' ? L('Xem lời giải', 'Show solution') : L('Kiểm tra', 'Check'),
              onPress: () => {
                // Xem lời giải = chấm câu này cho game; chưa trả lời mà xem luôn thì tính là sai.
                useGameStore.getState().answer(given !== '' && gradeMathItem(current, given).isCorrect, 'math');
                setRevealed((prev) => ({ ...prev, [current.id]: true }));
              },
            }
          : null
      }
      onSubmit={submit}
      submitLabel={submitLabel ?? L('Nộp bài', 'Submit')}
      onExit={onExit ?? (() => (router.canGoBack() ? router.back() : router.replace('/math' as never)))}
      confirmExit
      onChoose={current.choices && !isRevealed ? (i) => pickChoice(String(i)) : undefined}
      choiceCount={current.choices?.length ?? 0}
      eliminable={!!current.choices}
    >
      <MathQuestionView
        surface="exam"
        practice={instantSolution}
        index={index}
        item={current}
        answer={answers[current.id] ?? null}
        revealed={isRevealed}
        hidden={hints[current.id]}
        onAnswer={isRevealed ? undefined : pickChoice}
      />

      {/*
        Bước tự chẩn đoán chen vào GIỮA "đã trả lời sai" và "xem lời giải".

        Đặt sau lời giải thì vô nghĩa — lúc ấy đáp án đã nằm trên màn hình. Đặt
        trước khi trả lời thì cũng vô nghĩa — chưa sai thì chưa có lỗi nào để
        gọi tên. Chỉ đúng một khe này là hỏi được.
      */}
      {answeredWrong && !isRevealed ? (
        <SelfDiagnose
          itemId={current.id}
          actualTag={answeredWrong}
          allTags={ALL_ERROR_TAGS}
          onPick={(picked) => {
            observeSkill({
              skill: { domain: 'sat-math', key: current.skill },
              sourceId: current.id,
              answerCorrect: false,
              pointer: { kind: 'error-tag', tag: picked },
              truth: { kind: 'error-tag', tag: answeredWrong },
              at: new Date().toISOString(),
            });
          }}
        />
      ) : null}
    </SatExamShell>
  );
}
