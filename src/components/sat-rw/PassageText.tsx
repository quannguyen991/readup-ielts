import React from 'react';
import { Text, View } from 'react-native';

import { markUnderline, splitPassage } from '@/services/sat-rw/mock/passage';

/**
 * Đoạn văn của một câu R&W: tách hai văn bản, và gạch chân chỗ đề bài đang hỏi.
 *
 * MỘT CHỖ VẼ CHO CẢ HAI MÀN. Cùng một câu xuất hiện ở phòng thi (`RwRunner`) và
 * ở màn luyện theo unit (`QuestionCard`). Hai chỗ tự vẽ lấy thì sớm muộn lệch
 * nhau — mà đã lệch một lần rồi: `QuestionCard` in thẳng `question.passage`, nên
 * câu ghép hiện ra dính liền một đoạn với chữ "Văn bản 2" nằm giữa dòng.
 *
 * HAI TÔNG CHỮ, một cho nền trắng của app và một cho nền giấy kem của màn luyện.
 * Truyền `tone` chứ không truyền class: nơi gọi chỉ cần nói mình đang ở nền nào,
 * không phải nhớ đúng bộ class — và thêm một nền mới thì sửa ở đây, một lần.
 */

export type PassageTone = 'app' | 'paper';

const TONES: Record<PassageTone, { body: string; label: string; lineHeight: number }> = {
  app: {
    body: 'font-sans text-body text-body',
    label: 'font-strong text-label uppercase text-primary-700',
    lineHeight: 25,
  },
  paper: {
    body: 'font-mid text-bodyLg text-paper-ink',
    label: 'font-strong text-label uppercase text-brand',
    lineHeight: 28,
  },
};

export function PassageText({
  passage,
  underline,
  tone = 'app',
}: {
  passage: string;
  /** Chuỗi được gạch chân, do `scripts/mark-underlines.ts` đặt vào kho. */
  underline?: string;
  tone?: PassageTone;
}) {
  const t = TONES[tone];
  const blocks = splitPassage(passage);

  return (
    <View style={{ gap: 14 }}>
      {blocks.map((block, i) => (
        <View key={`${block.label ?? 'x'}-${i}`}>
          {block.label ? <Text className={`mb-1 ${t.label}`}>{block.label}</Text> : null}
          <Text className={t.body} style={{ lineHeight: t.lineHeight }}>
            {/*
              Gạch chân bằng <Text> lồng trong <Text> — RN nối chúng thành một
              dòng chảy liên tục, nên chữ vẫn ngắt dòng bình thường giữa chừng
              đoạn gạch chân. Cắt thành nhiều <View> thì mỗi mẩu thành một khối
              riêng và câu vỡ ra làm ba dòng.
            */}
            {markUnderline(block.text, underline).map((run, j) =>
              run.underlined ? (
                <Text key={j} style={{ textDecorationLine: 'underline' }}>
                  {run.text}
                </Text>
              ) : (
                run.text
              ),
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}
