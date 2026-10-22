import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { IeltsFocusPicker } from '@/components/practice/IeltsFocusPicker';
import { Icon, type IconName } from '@/components/ui';
import { ARTICLES, isReadable } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { useL } from '@/i18n/useL';

/** Bảng màu chung của web, cùng bộ với thẻ kỹ năng. */
const TONE = {
  coral: { bg: '#FFF1EE', fg: '#D9503E' },
  sky: { bg: '#EAF2FF', fg: '#2F6FD6' },
} as const;

/**
 * Trang chủ IELTS: chỉ là nơi tổng hợp các tính năng. Bài đọc và đề Writing mở ở tác vụ
 * riêng (`/reading-library`), không xếp lẫn trong trang chủ.
 */
export default function PracticeScreen() {
  const { L } = useL();
  const readable = ARTICLES.filter(isReadable).length;

  return (
    <Screen>
      <View className="mb-5">
        <IeltsFocusPicker />
      </View>

      <View className="gap-3">
        <Appear index={1}>
          <PracticeLink
            icon="clipboard"
            tone="coral"
            title={L('Kiểm tra đầu vào', 'Placement test')}
            sub={L('Reading · 40 câu · 60 phút', 'Reading · 40 questions · 60 min')}
            onPress={() => router.push('/ielts/placement' as never)}
          />
        </Appear>
        <Appear index={2}>
          <PracticeLink
            icon="book"
            tone="sky"
            title={L('Bài đọc & Writing', 'Reading & Writing')}
            sub={L(`${readable} bài đọc · ${WRITING_PROMPTS.length} đề viết`, `${readable} reading texts · ${WRITING_PROMPTS.length} writing prompts`)}
            onPress={() => router.push('/reading-library' as never)}
          />
        </Appear>
      </View>
    </Screen>
  );
}

/** Thẻ lối vào của trang IELTS: một kiểu duy nhất, đồng bộ với thẻ Speaking. */
function PracticeLink({ icon, tone, title, sub, onPress }: { icon: IconName; tone: keyof typeof TONE; title: string; sub: string; onPress: () => void }) {
  const t = TONE[tone];
  return (
    <Pressable accessibilityRole="link" onPress={onPress} className="flex-row items-center gap-4 rounded-2xl border border-border bg-surface p-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
        <Icon name={icon} size={22} color={t.fg} />
      </View>
      <View className="flex-1">
        <Text className="font-heavy text-cardTitle text-ink">{title}</Text>
        <Text className="mt-0.5 font-sans text-label text-muted">{sub}</Text>
      </View>
      <Icon name="arrow-right" size={18} color={t.fg} strokeWidth={2.2} />
    </Pressable>
  );
}
