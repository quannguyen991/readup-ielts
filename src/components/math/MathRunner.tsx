import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ExamShell } from '@/components/layout/ExamShell';
import { SelfDiagnose } from './SelfDiagnose';
import { CrossFade } from '@/components/motion/Motion';
import { Badge, Button, Card, PaperCard } from '@/components/ui';
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
   */
  surface?: 'light' | 'paper';
  onFinish: (responses: MathResponse[], elapsedMs: number) => void;
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
  surface = 'light',
  onFinish,
}: MathRunnerProps) {
  const onPaper = surface === 'paper';
  const { L } = useL();
  /* Chu tren nen: toi tren nen sang, trang tren nen cham. */
  const titleClass = onPaper ? 'text-white' : 'text-ink';
  const subClass = onPaper ? 'text-white/70' : 'text-muted';
  const Shell = onPaper ? ExamShell : Screen;
  const Panel = onPaper ? PaperCard : Card;
  const hairline = onPaper ? 'border-brand-soft' : 'border-border';
  const mutedClass = onPaper ? 'text-paper-muted' : 'text-muted';
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

  const lowOnTime = remainingMs <= 5 * 60_000;

  return (
    <Shell>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`font-heavy text-pageTitle ${titleClass}`}>{title}</Text>
          {subtitle ? (
            <Text className={`mt-1 font-sans text-body ${subClass}`}>{subtitle}</Text>
          ) : null}
        </View>
        <View className="items-end">
          {/*
            Trên nền chàm tối, đỏ đậm `text-danger` gần như không đọc được — đúng
            lúc con số ấy cần đập vào mắt nhất — nên hết giờ dùng đỏ SÁNG.
          */}
          {onPaper ? (
            <Text
              className="font-heavy text-stat"
              style={{ color: lowOnTime ? '#FCA5A5' : '#FFFFFF' }}
            >
              {formatClock(remainingMs)}
            </Text>
          ) : (
            <Text className={`font-heavy text-stat ${lowOnTime ? 'text-danger' : 'text-ink'}`}>
              {formatClock(remainingMs)}
            </Text>
          )}
          <Text className={`font-sans text-label ${subClass}`}>
            {phaseLabel ? `${phaseLabel} · ` : ''}
            {L(`đã trả lời ${answered}/${items.length}`, `answered ${answered}/${items.length}`)}
          </Text>
        </View>
      </View>

      {instantSolution ? <BattleStrip className="mt-4" /> : null}

      <Panel className="mt-4">
        {/*
          Hiện dần tại chỗ mỗi khi đổi câu. Đề toán đổi mà khung đứng im thì rất
          dễ tưởng chưa bấm được, nhất là hai câu liền nhau cùng dạng nên nhìn
          gần giống nhau. Không dịch chuyển, vì câu hỏi không có trước/sau về
          không gian — chỉ đơn giản là câu khác.
        */}
        <CrossFade swapKey={`${current.id}-${revealed[current.id] ? 'revealed' : 'open'}`}>
          <MathQuestionView
            surface={surface}
            item={current}
            index={index}
            answer={answers[current.id] ?? null}
            revealed={revealed[current.id] ?? false}
            hidden={hints[current.id]}
            onAnswer={
              revealed[current.id]
                ? undefined
                : (value) => setAnswers((prev) => ({ ...prev, [current.id]: value }))
            }
          />
        </CrossFade>

        {/*
          Bước tự chẩn đoán chen vào GIỮA "đã trả lời sai" và "xem lời giải".

          Đặt sau lời giải thì vô nghĩa — lúc ấy đáp án đã nằm trên màn hình. Đặt
          trước khi trả lời thì cũng vô nghĩa — chưa sai thì chưa có lỗi nào để
          gọi tên. Chỉ đúng một khe này là hỏi được.
        */}
        {answeredWrong && !revealed[current.id] ? (
          <SelfDiagnose
            itemId={current.id}
            actualTag={answeredWrong}
            allTags={ALL_ERROR_TAGS}
            onPick={(picked, correct) => {
              observeSkill({
                skill: { domain: 'sat-math', key: current.skill },
                sourceId: current.id,
                answerCorrect: false,
                pointer: { kind: 'error-tag', tag: picked },
                truth: { kind: 'error-tag', tag: answeredWrong },
                at: new Date().toISOString(),
              });
              if (correct) {
                /* không làm gì thêm: ghi nhận là đủ, không thưởng phạt */
              }
            }}
          />
        ) : null}

        {instantSolution && !revealed[current.id] ? (
          <View className={`mt-3 border-t pt-3 ${hairline}`}>
            <Button
              label={
                (answers[current.id] ?? '').trim() === ''
                  ? L('Chưa trả lời — xem lời giải luôn', 'Not answered — show the solution anyway')
                  : L('Xem lời giải câu này', 'Show solution')
              }
              variant="outline"
              iconRight="chevron-down"
              onPress={() => {
                // Xem lời giải = chấm câu này cho game; chưa trả lời mà xem luôn thì tính là sai.
                const given = answers[current.id] ?? '';
                useGameStore.getState().answer(given.trim() !== '' && gradeMathItem(current, given).isCorrect, 'math');
                setRevealed((prev) => ({ ...prev, [current.id]: true }));
              }}
            />
            <Text className={`mt-2 font-sans text-label ${mutedClass}`}>
              {L('Xem lời giải xong thì câu này bị khoá, không đổi đáp án được nữa.', "Once you see the solution, this question locks and your answer can't be changed.")}
            </Text>
          </View>
        ) : null}
      </Panel>

      <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row gap-2">
          <Button
            label={L('Câu trước', 'Previous')}
            variant="outline"
            iconLeft="chevron-left"
            disabled={index === 0}
            onPress={() => goTo(index - 1)}
          />
          <Button
            label={L('Câu sau', 'Next')}
            variant="outline"
            iconRight="chevron-right"
            disabled={index === items.length - 1}
            onPress={() => goTo(index + 1)}
          />
        </View>
        <Button label={submitLabel ?? L('Nộp bài', 'Submit')} iconRight="check" onPress={submit} />
      </View>

      <Panel className="mt-4">
        <Text className={`font-strong text-label ${mutedClass}`}>{L('Bảng câu hỏi', 'Question map')}</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {items.map((item, itemIndex) => {
            const done = (answers[item.id] ?? '').trim() !== '';
            const seen = revealed[item.id] ?? false;
            const active = itemIndex === index;
            return (
              <Pressable
                key={item.id}
                onPress={() => goTo(itemIndex)}
                className={`h-9 w-9 items-center justify-center rounded-pill border ${
                  active
                    ? onPaper
                      ? 'border-brand-mid bg-brand-mid'
                      : 'border-primary-600 bg-primary-600'
                    : seen
                      ? 'border-success bg-success-soft'
                      : done
                        ? onPaper
                          ? 'border-brand-soft bg-brand-tint'
                          : 'border-primary-200 bg-primary-50'
                        : onPaper
                          ? 'border-brand-soft bg-paper'
                          : 'border-border bg-surface'
                }`}
              >
                <Text
                  className={`font-strong text-label ${
                    active
                      ? 'text-white'
                      : seen
                        ? 'text-success'
                        : done
                          ? onPaper
                            ? 'text-brand'
                            : 'text-primary-700'
                          : mutedClass
                  }`}
                >
                  {itemIndex + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Badge label={L('Đang làm', 'Current')} tone="primary" shape="tag" />
          <Badge label={L('Đã trả lời', 'Answered')} tone="info" shape="tag" />
          {instantSolution ? <Badge label={L('Đã xem lời giải', 'Solution viewed')} tone="success" shape="tag" /> : null}
          <Badge label={L('Chưa trả lời', 'Not answered')} tone="neutral" shape="tag" />
        </View>
      </Panel>
    </Shell>
  );
}

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const minutes = Math.floor(clamped / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
