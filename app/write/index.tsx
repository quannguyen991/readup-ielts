import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { PATH_STEPS, stepUnits } from '@/services/writing/translation-path';
import { useL } from '@/i18n/useL';

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
  const { L } = useL();

  return (
    <Screen>
      <LightHero cat="hangingPaws"
        badge="WRITING PRACTICE" art="writing"
        line1="Writing"
        line2={L('củng cố cấu trúc, mở rộng từ vựng', 'stronger structure, wider vocabulary')}
        subtitle={L('Dựng đúng câu trước, rồi mới dựng cả bài — mỗi bước dài thêm một bậc.', 'Build correct sentences first, then whole essays — each step a little longer.')}
        footer={
          <>
            <HeroStat value={String(PATH_STEPS.length)} label={L('bước luyện dịch', 'translation steps')} />
            <HeroStat value={String(WRITING_PROMPTS.length)} label={L('đề viết', 'writing prompts')} />
            <HeroStat value="Task 1 + 2" label={L('dạng bài', 'task types')} />
          </>
        }
      />

        <View className="mt-6 gap-4">
          <BranchCard
            wide={wide}
            tone="moss"
            eyebrow={L('BẬC MỘT', 'STEP ONE')}
            title={L('Luyện dịch', 'Translation practice')}
            blurb={L('Tái tạo đúng câu mẫu, từng từ một. Năm bước siết dần, từ một câu tới trọn đoạn văn.', 'Rebuild model sentences word by word. Five steps that build up from one sentence to a full paragraph.')}
            stat={L(
              `${PATH_STEPS.length} bước · ${TRANSLATION_UNITS.toLocaleString('vi-VN')} lượt · ${TRANSLATION_SETS.length} chủ đề`,
              `${PATH_STEPS.length} steps · ${TRANSLATION_UNITS.toLocaleString('en-US')} exercises · ${TRANSLATION_SETS.length} topics`,
            )}
            onPress={() => router.push('/write/translation' as never)}
          />
          <BranchCard
            wide={wide}
            tone="amber"
            eyebrow={L('BẬC HAI', 'STEP TWO')}
            title={L('Luyện viết', 'Essay practice')}
            blurb={L('Viết trọn bài theo đề thi thật, AI chấm theo từng tiêu chí và chỉ đúng chỗ hỏng.', 'Write full essays to real exam prompts; AI grades each criterion and points out exactly what broke.')}
            stat={L(`${WRITING_PROMPTS.length} đề · Task 1 và Task 2`, `${WRITING_PROMPTS.length} prompts · Task 1 and Task 2`)}
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
  moss: { bg: '#6F5323', ink: '#FDFAF4', pattern: '#0B5265', chip: '#0B5265' },
  amber: { bg: '#A7193F', ink: '#FFF5F7', pattern: '#7E1232', chip: '#7E1232' },
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
        ...(Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.10)' } as never)
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
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
        {wide ? <Pattern tone={tone} /> : null}
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
function Pattern({ tone }: { tone: keyof typeof TONES }) {
  return (
    <View style={{ width: 280, height: 210, justifyContent: 'center' }} pointerEvents="none">
      <Image
        source={tone === 'moss' ? require('../../assets/illustrations/writing-translation.png') : require('../../assets/illustrations/writing-essay.png')}
        contentFit="contain"
        transition={180}
        style={{ width: '100%', height: '100%' }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
