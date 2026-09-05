import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { PATH_STEPS, stepUnits } from '@/services/writing/translation-path';

/**
 * Cửa vào mảng Writing — hai nhánh, không phải một kho phẳng.
 *
 * Trước đây bấm Writing là rơi thẳng vào 60 đề Task 1/Task 2. Kho ấy vẫn còn
 * nguyên (`/write/tests`), nhưng để nó làm cửa vào thì mảng Writing chỉ có đúng
 * một cách học: ngồi viết cả bài rồi chờ chấm. Người chưa viết nổi một câu đúng
 * cấu trúc mà bị đẩy thẳng vào đề Task 2 thì không học được gì, chỉ nản.
 *
 * Hai nhánh ở đây là hai bậc khác nhau của cùng một kỹ năng: dựng đúng CÂU
 * trước, rồi mới tới dựng cả BÀI. Trang này chỉ có đúng một việc — cho chọn một
 * trong hai — nên nó chỉ có hai thẻ, và cố tình không có gì khác.
 */

const TRANSLATION_UNITS = PATH_STEPS.reduce((sum, s) => sum + stepUnits(s), 0);

export default function WritingHome() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Writing</Text>
      <Text className="mt-1 font-sans text-bodyLg text-muted">
        Dựng đúng câu trước, rồi mới dựng cả bài.
      </Text>

      <View className="mt-6 gap-4">
        <BranchCard
          wide={wide}
          tone="moss"
          eyebrow="BẬC MỘT"
          title="Luyện dịch"
          blurb="Tái tạo đúng câu mẫu, từng từ một. Năm bước siết dần, từ một câu tới trọn đoạn văn."
          stat={`${PATH_STEPS.length} bước · ${TRANSLATION_UNITS.toLocaleString('vi-VN')} lượt · ${TRANSLATION_SETS.length} chủ đề`}
          onPress={() => router.push('/write/translation' as never)}
        />
        <BranchCard
          wide={wide}
          tone="amber"
          eyebrow="BẬC HAI"
          title="Luyện viết"
          blurb="Viết trọn bài theo đề thi thật, AI chấm theo từng tiêu chí và chỉ đúng chỗ hỏng."
          stat={`${WRITING_PROMPTS.length} đề · Task 1 và Task 2`}
          onPress={() => router.push('/write/tests' as never)}
        />
      </View>
    </Screen>
  );
}

/*
  Hai bảng màu, mỗi nhánh một bảng.

  Không lấy hai sắc độ của cùng một màu: hai thẻ này là hai LỐI ĐI khác nhau chứ
  không phải hai mức của một thứ, và mắt phân biệt lối đi bằng sắc màu nhanh hơn
  bằng chữ.
*/
const TONES = {
  moss: { bg: '#3F7D58', ink: '#F2F7F0', pattern: '#2F6242', chip: '#2F6242' },
  amber: { bg: '#E8842B', ink: '#FFF8F0', pattern: '#C56A17', chip: '#C56A17' },
} as const;

function BranchCard({
  wide,
  tone,
  eyebrow,
  title,
  blurb,
  stat,
  onPress,
}: {
  wide: boolean;
  tone: keyof typeof TONES;
  eyebrow: string;
  title: string;
  blurb: string;
  stat: string;
  onPress: () => void;
}) {
  const t = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: t.bg,
        borderWidth: 2.5,
        borderColor: '#0F172A',
        ...(Platform.OS === 'web'
          ? ({ boxShadow: '5px 5px 0 #0F172A' } as never)
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 6,
            }),
      }}
    >
      <View className="flex-row">
        <View style={{ flex: 1, paddingHorizontal: wide ? 32 : 20, paddingVertical: wide ? 34 : 24 }}>
          <Text className="font-heavy text-label" style={{ color: t.ink, opacity: 0.75, letterSpacing: 1.2 }}>
            {eyebrow}
          </Text>
          <Text
            className="mt-2 font-heavy"
            style={{ color: t.ink, fontSize: wide ? 38 : 28, lineHeight: wide ? 44 : 34 }}
          >
            {title}
          </Text>
          <Text
            className="mt-2 font-sans text-body"
            style={{ color: t.ink, opacity: 0.9, maxWidth: 460 }}
          >
            {blurb}
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            <View className="rounded-pill px-3 py-1.5" style={{ backgroundColor: t.chip }}>
              <Text className="font-semi text-label" style={{ color: t.ink }}>
                {stat}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.ink} strokeWidth={2.4} />
          </View>
        </View>

        {/* Mảng hoạ tiết chỉ có ở khổ rộng: ở khổ hẹp nó ăn mất chỗ của chữ. */}
        {wide ? <Pattern color={t.pattern} /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Hoạ tiết hình học — bốn phần tư cung tròn xếp lệch nhau.
 *
 * Vẽ bằng SVG chứ không dùng ảnh: nó co giãn theo mọi khổ màn, đổi màu theo tông
 * thẻ, và không thêm một byte nào vào bundle ảnh.
 */
function Pattern({ color }: { color: string }) {
  return (
    <View style={{ width: 260 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 120 100" preserveAspectRatio="none">
        <Rect x={0} y={0} width={120} height={100} fill={color} opacity={0.55} />
        <Path d="M0 0 H40 A40 40 0 0 1 0 40 Z" fill={color} />
        <Path d="M120 100 H80 A40 40 0 0 1 120 60 Z" fill={color} />
        <Circle cx={70} cy={38} r={16} fill={color} />
        <Path d="M40 100 H80 A40 40 0 0 0 40 60 Z" fill={color} opacity={0.7} />
      </Svg>
    </View>
  );
}
