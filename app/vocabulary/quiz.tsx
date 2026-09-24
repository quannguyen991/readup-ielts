import React from 'react';
import { View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';

/**
 * QUIZ TỪ VỰNG — CHỌN BỘ TỪ TRƯỚC, vào trong rồi mới chọn cách luyện.
 *
 * Bản trước bắt chọn kiểu luyện (Học xen kẽ / Kiểm tra / Điền vào câu) rồi mới
 * chọn bộ trong một rừng chip tên. Người dùng muốn ngược lại (24/09/2026): trang
 * đầu là thư viện thẻ bộ từ có tiến độ và lần học cuối; bấm vào một bộ thì trang
 * của bộ đó mới hiện đủ sáu cách luyện, thẻ ghi nhớ và danh sách từ.
 */
export default function VocabQuizHub() {
  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge="QUIZ TỪ VỰNG"
          line1="Chọn một bộ từ,"
          line2="vào trong là đủ cách luyện"
          subtitle="Học xen kẽ, Kiểm tra, Điền vào câu, Nghe chép, Phát âm, Bóng bay — cùng một bộ từ, đáp án chấm bằng luật, từ sai quay lại ngay trong lượt."
        />
      </Appear>
      <DeckLibrary />
      <View className="h-10" />
    </Screen>
  );
}
