import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { LightHero } from '@/components/layout/LightHero';
import { Button, PaperCard } from '@/components/ui';
import { SAT_PRACTICE_FORMS } from '@/services/sat-practice/forms';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

export default function SatPracticeTestsScreen() {
  const { L } = useL();
  const [selected, setSelected] = useState(1);
  const current = SAT_PRACTICE_FORMS[selected - 1]!;
  const groups = useMemo(() => Array.from({ length: 5 }, (_, i) => SAT_PRACTICE_FORMS.slice(i * 10, i * 10 + 10)), []);

  const open = (mode: 'math' | 'reading-writing' | 'full') => {
    const path = mode === 'math' ? '/math/mock' : mode === 'reading-writing' ? '/sat/rw-test' : '/sat/full-test';
    router.push({ pathname: path, params: { form: current.id } } as never);
  };

  return (
    <Screen>
      <LightHero
        scene="math"
        badge={L('SAT · 50 BỘ ĐỀ', 'SAT · 50 PRACTICE FORMS')}
        line1={L('Chọn một bộ đề', 'Choose a practice form')}
        line2={L('Math, Reading and Writing hoặc thi đầy đủ', 'Math, Reading and Writing, or the full test')}
        subtitle={L('Mỗi bộ đề có mã cố định để làm lại cùng một phiên bản. Câu hỏi trong app là câu luyện tự biên soạn theo dạng SAT.', 'Each form has a stable ID so you can revisit the same version. In-app questions are original SAT-style practice.')}
      />

      <PaperCard className="mt-4">
        <View className="flex-row flex-wrap items-baseline justify-between gap-2">
          <Text className="font-heavy text-cardTitle text-paper-ink">{L('50 bộ luyện', '50 practice forms')}</Text>
          <Text className="font-semi text-label text-paper-muted">{current.label} / 50</Text>
        </View>
        <Text className="mt-1 font-sans text-label text-paper-muted">
          {L('Chọn mã đề. Mỗi mã mở được cả ba kiểu bài.', 'Choose a form. Every form is available in all three modes.')}
        </Text>
        <View className="mt-4" style={{ gap: 8 }}>
          {groups.map((group, groupIndex) => (
            <View key={groupIndex} className="flex-row flex-wrap" style={{ gap: 8 }}>
              {group.map((form) => {
                const active = form.number === selected;
                return (
                  <Pressable
                    key={form.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={L(`Chọn đề ${form.number}`, `Select form ${form.number}`)}
                    onPress={() => setSelected(form.number)}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      width: 42,
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      backgroundColor: active ? color.primary : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: active ? color.primary : '#E8E1D6',
                      opacity: hovered ? 0.82 : 1,
                    })}
                  >
                    <Text className="font-heavy text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>{form.number}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View className="mt-5" style={{ gap: 10 }}>
          <Button label={L('Làm full SAT Math · 44 câu', 'Full SAT Math · 44 questions')} onPress={() => open('math')} iconRight="chevron-right" />
          <Button label={L('Làm full Reading and Writing · 54 câu', 'Full Reading and Writing · 54 questions')} variant="outline" onPress={() => open('reading-writing')} iconRight="chevron-right" />
          <Button label={L('Làm full SAT · 98 câu', 'Full SAT · 98 questions')} variant="outline" onPress={() => open('full')} iconRight="chevron-right" />
        </View>
      </PaperCard>

      <PaperCard className="mt-3">
        <Text className="font-strong text-body text-paper-ink">{L('Kho câu hỏi chính thức', 'Official question bank')}</Text>
        <Text className="mt-1 font-sans text-label text-paper-muted">
          {L('Lọc và làm câu hỏi SAT Suite trực tiếp trong Student Question Bank của College Board.', 'Filter and practice SAT Suite questions directly in College Board’s Student Question Bank.')}
        </Text>
        <Button
          className="mt-3 self-start"
          label={L('Mở Student Question Bank ↗', 'Open Student Question Bank ↗')}
          variant="outline"
          onPress={() => void Linking.openURL('https://satsuitequestionbank.collegeboard.org/')}
        />
      </PaperCard>

      <Text className="mx-2 mt-3 font-sans text-label text-muted" style={{ lineHeight: 20 }}>
        {L('Kho câu hỏi chính thức thuộc College Board nên app dẫn sang nguồn gốc; 50 bộ trong app dùng câu luyện riêng, không sao chép đề.', 'Official questions belong to College Board, so this app links to the source. The 50 in-app forms use original practice questions, not copied tests.')}
      </Text>
      <View className="h-8" />
    </Screen>
  );
}
