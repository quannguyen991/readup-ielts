import React from 'react';
import { Text, View } from 'react-native';

import type { ProofState } from '@/services/proofloop/types';
import { bi, useL, type Bi } from '@/i18n/useL';

/**
 * Nhãn trạng thái ProofLoop cho một lượt trả lời.
 *
 * NGÔN TỪ Ở ĐÂY LÀ RÀNG BUỘC, KHÔNG PHẢI GU VIẾT. Mỗi nhãn chỉ được nói điều
 * quan sát được. Không có "hiểu thật", không có "đoán bừa" — hệ thống không
 * nhìn thấy trạng thái trong đầu ai, và một nhãn nói quá là một lời hứa mà sản
 * phẩm không giữ được.
 *
 * `misaligned-correct` cố tình KHÔNG dùng tông xanh dù đáp án đúng: đó chính là
 * khoảnh khắc đáng chú ý nhất trong cả hệ thống — điểm số nói đúng, bằng chứng
 * nói chưa chắc — và tô xanh nó là xoá mất lý do tồn tại của tính năng này.
 */
const LABEL: Readonly<Record<ProofState, { text: Bi; hint: Bi; tone: Tone }>> =
  Object.freeze({
    'unobserved': {
      text: { vi: 'Chưa khoanh bằng chứng', en: 'No evidence marked' },
      hint: {
        vi: 'Không có gì để so — đây là chưa đo được, không phải khoanh sai.',
        en: "Nothing to compare — this is not measured yet, not a wrong mark.",
      },
      tone: 'neutral',
    },
    'aligned-correct': {
      text: { vi: 'Đáp án đúng · bằng chứng khớp', en: 'Correct answer · evidence matches' },
      hint: {
        vi: 'Chưa xác nhận là đã nắm được: cần một câu ở bài khác mới biết.',
        en: "Not confirmed as mastered yet: we'll know after a question in another passage.",
      },
      tone: 'good',
    },
    'misaligned-correct': {
      text: { vi: 'Đáp án đúng · bằng chứng chưa khớp', en: "Correct answer · evidence doesn't match" },
      hint: {
        vi: 'Đoạn bạn khoanh chưa đỡ được đáp án đó. Chưa ghi nhận là đã hiểu.',
        en: "The part you marked doesn't support that answer. Not recorded as understood yet.",
      },
      tone: 'watch',
    },
    'aligned-wrong': {
      text: { vi: 'Tìm đúng chỗ · trả lời chưa đúng', en: 'Right place · wrong answer' },
      hint: {
        vi: 'Đã tìm ra đúng đoạn rồi. Chỗ vướng nằm ở bước suy ra.',
        en: 'You found the right part. The sticking point is the inference step.',
      },
      tone: 'warn',
    },
    'misaligned-wrong': {
      text: { vi: 'Chưa tìm ra chỗ chứa đáp án', en: "Haven't found where the answer is" },
      hint: {
        vi: 'Chỗ vướng nằm ở bước định vị, chưa phải ở bước suy luận.',
        en: 'The sticking point is locating the answer, not the reasoning.',
      },
      tone: 'warn',
    },
  });

type Tone = 'neutral' | 'good' | 'watch' | 'warn';

const TONE: Readonly<Record<Tone, { box: string; text: string }>> = Object.freeze({
  neutral: { box: 'border-border bg-surfaceAlt', text: 'text-muted' },
  good: { box: 'border-success/30 bg-success-soft', text: 'text-success-ink' },
  watch: { box: 'border-warning/40 bg-warning-soft', text: 'text-warning-ink' },
  warn: { box: 'border-danger/30 bg-danger-soft', text: 'text-danger-ink' },
});

export function ProofStateBadge({ state }: { state: ProofState }) {
  const { locale } = useL();
  const entry = LABEL[state];
  const tone = TONE[entry.tone];

  return (
    <View className={`mt-3 rounded-panel border px-3 py-2.5 ${tone.box}`}>
      <Text className={`font-semi text-label ${tone.text}`}>{bi(entry.text, locale)}</Text>
      <Text className="mt-1 font-sans text-label text-body">{bi(entry.hint, locale)}</Text>
    </View>
  );
}
