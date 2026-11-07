import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ielts/SourceCover';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

type Exam = 'ielts' | 'sat';

const RESOURCES = {
  ielts: [
    {
      label: { vi: 'Đề mẫu IELTS chính thức', en: 'Official IELTS sample tests' },
      detail: { vi: 'Làm đề thi thử Reading 40 câu mô phỏng thi thật ngay trên Band 9.', en: 'Take full 40-question Reading mock test directly on Band 9.' },
      source: 'Band 9 Mock Tests',
      route: '/mock-tests',
    },
    {
      label: { vi: 'Cambridge IELTS 10–21 & Actual Volumes', en: 'Cambridge IELTS 10–21 & Actual Volumes' },
      detail: { vi: 'Kho 212 đề Cambridge & Actual Tests làm trực tiếp trên web.', en: '212 Cambridge & Actual Tests available directly in web practice room.' },
      source: 'Band 9 Exam Room',
      route: '/ielts-source-practice',
    },
  ],
  sat: [
    {
      label: { vi: 'Đề thi thử SAT đầy đủ 98 câu', en: 'Full-length SAT practice tests' },
      detail: { vi: 'Làm đề số thích ứng, xem điểm và giải thích sau khi nộp.', en: 'Take adaptive digital tests, review scores and explanations.' },
      source: 'Band 9 SAT Room',
      route: '/sat/practice-tests',
    },
    {
      label: { vi: 'Kho luyện SAT Reading & Writing', en: 'SAT Reading & Writing Bank' },
      detail: { vi: 'Luyện 624 câu hỏi phân hóa theo 19 kỹ năng chuẩn SAT.', en: 'Practice 624 questions across 19 SAT skills.' },
      source: 'Band 9 Question Bank',
      route: '/sat-rw',
    },
  ],
} satisfies Record<Exam, { label: { vi: string; en: string }; detail: { vi: string; en: string }; source: string; route: string }[]>;

/** Internal practice room resource links; all exam practice stays directly on Band 9. */
export function ExamResourceLinks({ exam }: { exam: Exam }) {
  const { L } = useL();
  const resources = RESOURCES[exam];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {resources.map((resource) => (
        <Pressable
          key={resource.route}
          accessibilityRole="button"
          onPress={() => router.push(resource.route as never)}
          style={({ hovered }: { hovered?: boolean }) => ({
            flex: 1,
            minWidth: 260,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderWidth: 1,
            borderColor: hovered ? color.primaryDark : color.border,
            borderRadius: 14,
            backgroundColor: hovered ? color.primarySoft : color.surface,
            paddingHorizontal: 16,
            paddingVertical: 14,
          })}
        >
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: color.ink }} numberOfLines={1}>{L(resource.label.vi, resource.label.en)}</Text>
          <Text style={{ fontSize: 16, color: color.primaryDark }}>→</Text>
        </Pressable>
      ))}
    </View>
  );
}
