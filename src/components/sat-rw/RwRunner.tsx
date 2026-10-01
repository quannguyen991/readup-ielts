import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';

import { SatExamShell } from '@/components/sat-exam/SatExamShell';
import { RwPassagePane, RwQuestionPane } from '@/components/sat-exam/RwExamParts';
import type { MockItem } from '@/services/sat-rw/mock/item';
import { useL } from '@/i18n/useL';

/**
 * Phòng thi Reading and Writing: một module, đồng hồ đếm ngược, không lời giải.
 *
 * DỰNG THEO ĐÚNG NGÔN NGỮ CỦA `MathRunner`, và đó là yêu cầu chứ không phải sở
 * thích: hai phòng thi nằm cạnh nhau trong một bài thi, người học đi từ phòng
 * này sang phòng kia sau mười phút nghỉ. Hai cái trông khác nhau thì họ phải
 * học lại cách dùng giao diện giữa lúc đang thi.
 *
 * Cụ thể là dùng chung: cỡ chữ `text-stat` cho đồng hồ, `Button` viền có icon
 * cho điều hướng, bảng câu hỏi ở CUỐI trang trong thẻ phẳng với bốn trạng thái
 * màu và chú giải `Badge`, `CrossFade` khi đổi câu.
 *
 * KHÔNG DÙNG LẠI `MathRunner` mà viết riêng: hai bên nhận hai kiểu câu khác nhau
 * — `MathItem` có hình vẽ và ô điền số, `MockItem` có bảng số, ghi chú, chỗ
 * trống. Gộp lại sẽ ra một component biết quá nhiều thứ.
 *
 * KHÔNG CÓ LỜI GIẢI GIỮA CHỪNG, và hết giờ là tự nộp kể cả còn câu chưa làm.
 * Đề thật không cho cộng giờ; một màn hình chờ người bấm khi đã hết giờ dạy sai
 * thói quen làm bài.
 *
 * GIAO DIỆN (01/10/2026): khung `SatExamShell` kiểu đề số — bảng câu hỏi, đánh
 * dấu xem lại, gạch phương án, tô & ghi chú đều là của khung.
 *
 * CHIA ĐÔI MÀN HÌNH KHI ĐỦ RỘNG — bài đọc bên trái, câu hỏi bên phải. Đây là chỗ
 * DUY NHẤT phòng thi này khác `MathRunner`, và nó khác vì nội dung khác chứ không
 * phải vì tôi thích: câu Math dài vài dòng, còn bài đọc R&W dài cả đoạn. Xếp một
 * cột trên màn 1280px thì mỗi dòng văn dài hơn 1.200px — mắt đọc hết dòng rồi
 * không tìm lại được đầu dòng sau. Bluebook của College Board cũng chia đôi đúng
 * như vậy, nên người học quen tay luôn.
 */

export type RwRunnerProps = {
  title: string;
  /** Ghi chú nhỏ dưới đồng hồ, ví dụ "Module 1 / 2". */
  phaseLabel?: string;
  items: MockItem[];
  minutes: number;
  onFinish: (answers: (number | null)[], elapsedMs: number) => void;
  /** Thoát giữa bài (khung hỏi lại trước). Mặc định về trang SAT. */
  onExit?: () => void;
};

export function RwRunner({ title, phaseLabel, items, minutes, onFinish, onExit }: RwRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null));
  const [remainingMs, setRemainingMs] = useState(minutes * 60_000);
  const { L } = useL();

  const startedAt = useRef(0);
  const finished = useRef(false);

  const submit = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(answers, Date.now() - startedAt.current);
  }, [answers, onFinish]);

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setInterval(() => {
      const left = minutes * 60_000 - (Date.now() - startedAt.current);
      setRemainingMs(left);
      // Hết giờ là nộp, không hỏi lại: đề thật không cho cộng giờ.
      if (left <= 0) submitRef.current();
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  const item = items[index];
  if (!item) return null;

  const choose = (option: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = option;
      return next;
    });
  };

  return (
    <SatExamShell
      section="rw"
      title={title}
      band={phaseLabel ?? title}
      info={L(
        'Mỗi câu một đoạn văn ngắn và bốn phương án. Hết giờ là tự nộp.',
        'Each question has a short passage and four choices. The module submits itself at time-up.',
      )}
      timer={{ kind: 'down', remainingMs }}
      questionKeys={items.map((it) => it.id)}
      index={index}
      onJump={setIndex}
      isAnswered={(i) => answers[i] !== null}
      passage={<RwPassagePane item={item} />}
      onBack={() => setIndex((i) => Math.max(0, i - 1))}
      onNext={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
      onSubmit={submit}
      submitLabel={L('Nộp module', 'Submit module')}
      onExit={onExit ?? (() => router.replace('/sat' as never))}
      confirmExit
      onChoose={choose}
      choiceCount={item.options.length}
    >
      <RwQuestionPane item={item} picked={answers[index] ?? null} onPick={choose} />
    </SatExamShell>
  );
}
