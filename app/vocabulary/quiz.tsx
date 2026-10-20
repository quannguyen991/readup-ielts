import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { StudyEntryChooser } from '@/components/vocab/study/StudyEntryChooser';
import { useL } from '@/i18n/useL';

/**
 * QUIZ TỪ VỰNG — CHỌN BỘ TỪ TRƯỚC, vào trong rồi mới chọn cách luyện.
 *
 * Bản trước bắt chọn kiểu luyện (Học xen kẽ / Kiểm tra / Điền vào câu) rồi mới
 * chọn bộ trong một rừng chip tên. Người dùng muốn ngược lại (24/09/2026): trang
 * đầu là thư viện thẻ bộ từ có tiến độ và lần học cuối; bấm vào một bộ thì trang
 * của bộ đó mới hiện đủ sáu cách luyện, thẻ ghi nhớ và danh sách từ.
 *
 * Giao diện học (phẳng hay Chiikawa) chọn ở đây, lúc nào cũng được — không còn hỏi
 * mỗi lần vào màn học.
 */
export default function VocabQuizHub() {
  const { L } = useL();
  const [lookOpen, setLookOpen] = useState(false);
  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge={L('QUIZ TỪ VỰNG', 'VOCABULARY QUIZ')}
          line1={L('Chọn một bộ từ,', 'Pick a word set,')}
          line2={L('vào trong là đủ cách luyện', 'every practice mode is inside')}
        >
          <View className="flex-row flex-wrap gap-2">
            <Pressable accessibilityRole="link" onPress={() => router.push('/vocabulary/review' as never)} style={{ alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD4' }}>
              <Text style={{ color: '#5A3B50', fontWeight: '700' }}>{L('Ôn Destination B1–C2 · phiếu 50 câu →', 'Review Destination B1–C2 · 50 questions →')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLookOpen(true)}
              style={{ alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD4' }}
            >
              <Text style={{ color: '#5A3B50', fontWeight: '700' }}>{L('Giao diện học →', 'Study look →')}</Text>
            </Pressable>
          </View>
        </LightHero>
      </Appear>
      <DeckLibrary />
      <View className="h-10" />
      <StudyEntryChooser visible={lookOpen} onDone={() => setLookOpen(false)} />
    </Screen>
  );
}
