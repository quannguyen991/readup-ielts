import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useL } from '@/i18n/useL';

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
    <View style={{ gap: 10, borderWidth: 1, borderColor: '#F3F0FB', borderRadius: 16, backgroundColor: '#F3F0FB', padding: 16 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#29251F' }}>{L('Kho đề và phòng thi trên Band 9', 'Official tests and practice rooms on Band 9')}</Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: '#71685D' }}>
          {L('Toàn bộ câu hỏi, bài đọc và đáp án được tích hợp trực tiếp, làm bài không cần chuyển trang.', 'All questions, passages, and keys are built in; practice directly inside Band 9.')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {resources.map((resource) => (
          <Pressable
            key={resource.route}
            accessibilityRole="button"
            onPress={() => router.push(resource.route as never)}
            style={({ hovered }: { hovered?: boolean }) => ({
              flex: 1,
              minWidth: 220,
              borderWidth: 1,
              borderColor: hovered ? '#D7B764' : '#F3F0FB',
              borderRadius: 12,
              backgroundColor: hovered ? '#F3F0FB' : '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 10,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350' }}>{L(resource.label.vi, resource.label.en)} →</Text>
            <Text style={{ marginTop: 3, fontSize: 11, lineHeight: 16, color: '#71685D' }}>{L(resource.detail.vi, resource.detail.en)}</Text>
            <Text style={{ marginTop: 5, fontSize: 10, fontWeight: '700', color: '#6A4BD9' }}>{resource.source}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontSize: 11, lineHeight: 16, color: '#82796F' }}>
        {exam === 'ielts'
          ? L(
              'Toàn bộ đề Cambridge và Actual Tests đã được số hóa thành văn bản, bài làm có timer và chấm điểm tự động.',
              'All Cambridge and Actual Tests are digitized into full text with timer and automatic scoring.',
            )
          : L(
              'Hệ thống câu hỏi SAT được tổ chức theo đúng chuẩn Digital SAT của College Board.',
              'SAT questions are structured according to College Board Digital SAT standards.',
            )}
      </Text>
    </View>
  );
}
