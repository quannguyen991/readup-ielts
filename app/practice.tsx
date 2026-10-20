import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { IeltsFocusPicker } from '@/components/practice/IeltsFocusPicker';
import { Icon } from '@/components/ui';
import { ARTICLES, isReadable } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { useL } from '@/i18n/useL';

/**
 * Trang chủ IELTS: chỉ là nơi tổng hợp các tính năng. Bài đọc và đề viết mở ở tác vụ
 * riêng (`/reading-library`), không xếp lẫn trong trang chủ.
 */
export default function PracticeScreen() {
  const { L } = useL();
  const readable = ARTICLES.filter(isReadable).length;

  return (
    <Screen cat="write">
      <View className="mb-5">
        <IeltsFocusPicker />
      </View>

      <Appear index={1}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/ielts/skills' as never)}
          className="mb-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Icon name="target" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="font-heavy text-cardTitle text-ink">
                  {L('Luyện theo dạng bài & kỹ năng', 'IELTS Question Type Mastery')}
                </Text>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  {L('13 dạng trọng điểm · 135+ câu thực chiến kèm chứng cứ & bí kíp', '13 key types · 135+ drill questions with evidence & tips')}
                </Text>
              </View>
            </View>
            <Icon name="arrow-right" size={20} color="#8F6E36" strokeWidth={2.2} />
          </View>
        </Pressable>
      </Appear>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/ielts/placement' as never)}
        className="mb-5 rounded-2xl border border-border bg-surface p-4"
      >
        <Text className="font-heavy text-cardTitle text-ink">Kiểm tra đầu vào IELTS · Reading</Text>
        <Text className="mt-1 font-sans text-label text-muted">40 câu · 3 bài · 60 phút, làm đúng như thi thật.</Text>
      </Pressable>

      <Appear index={2}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/reading-library' as never)}
          style={({ pressed }: { pressed: boolean }) =>
            ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: '#2B2118',
              backgroundColor: '#FFFFFF',
              boxShadow: pressed ? '0 2px 0 #2B2118' : '0 5px 0 #2B2118',
              transform: [{ translateY: pressed ? 2 : 0 }],
              ...(typeof window !== 'undefined' ? { transition: 'transform 160ms ease, box-shadow 160ms ease' } : null),
            }) as object
          }
        >
          <View
            style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#F3E8D2', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="book" size={24} color="#B94A70" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 20, color: '#2B2118' }}>
              {L('Bài đọc & đề Writing', 'Reading texts & Writing prompts')}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 14, color: '#6B5E4E' }}>
              {L(
                `${readable} bài đọc · ${WRITING_PROMPTS.length} đề viết`,
                `${readable} reading texts · ${WRITING_PROMPTS.length} writing prompts`,
              )}
            </Text>
          </View>
          <Icon name="arrow-right" size={20} color="#B94A70" strokeWidth={2.2} />
        </Pressable>
      </Appear>
    </Screen>
  );
}
