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
