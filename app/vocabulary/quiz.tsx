import React from 'react';
import { View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { useL } from '@/i18n/useL';

/**
 * QUIZ TỪ VỰNG — CHỌN BỘ TỪ TRƯỚC, vào trong rồi mới chọn cách luyện.
 *
 * Bản trước bắt chọn kiểu luyện (Học xen kẽ / Kiểm tra / Điền vào câu) rồi mới
 * chọn bộ trong một rừng chip tên. Người dùng muốn ngược lại (24/09/2026): trang
 * đầu là thư viện thẻ bộ từ có tiến độ và lần học cuối; bấm vào một bộ thì trang
 * của bộ đó mới hiện đủ sáu cách luyện, thẻ ghi nhớ và danh sách từ.
 */
export default function VocabQuizHub() {
  const { L } = useL();
  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge={L('QUIZ TỪ VỰNG', 'VOCABULARY QUIZ')}
          line1={L('Chọn một bộ từ,', 'Pick a word set,')}
          line2={L('vào trong là đủ cách luyện', 'every practice mode is inside')}
          subtitle={L(
            'Học xen kẽ, Kiểm tra, Điền vào câu, Nghe chép, Phát âm, Bóng bay, Ghép cặp, Đoán chữ, Xếp câu — cùng một bộ từ, đáp án chấm bằng luật, từ sai quay lại ngay trong lượt.',
            'Mixed learning, Test, Fill the gap, Dictation, Pronunciation, Balloons, Match pairs, Hangman, Build sentence — one word set, rule-based marking, and missed words come back in the same round.',
          )}
        />
      </Appear>
      <DeckLibrary />
      <View className="h-10" />
    </Screen>
  );
}
