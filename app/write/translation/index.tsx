import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Icon, StickerCard } from '@/components/ui';
import { GlowStars } from '@/components/ui/GlowStars';
import { INK, STICKER_TEXT_SHADOW, STICKER_TITLE_SHADOW } from '@/components/ui/StickerCard';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { PATH_STEPS, stepUnits, topicsForStep, type PathStep } from '@/services/writing/translation-path';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { STEP_EN } from '@/components/writing/translation-step-en';

/**
 * Năm bậc của lộ trình luyện dịch, dựng thành một CẦU THANG.
 *
 * Màn này chỉ trả lời một câu: BẮT ĐẦU TỪ ĐÂU. Cầu thang trả lời bằng hình: bậc
 * thấp nhất bên trái là chỗ bắt đầu, và mỗi bậc cao thêm đúng theo số câu phải
 * dịch liền trong một lượt (1 → 1 → 3 → 4 → 6). Dải con nhộng dưới đáy mỗi bậc
 * đếm đúng số câu ấy, nên độ khó tăng dần là thứ NHÌN thấy, không phải đọc thấy.
 * Chùm sao sáng nhất nằm trên bậc cao nhất: đích là dịch trọn một đoạn văn.
 *
 * Số mục, số lượt đếm từ dữ liệu thật lúc dựng màn, không gõ tay. Trang giới
 * thiệu một lộ trình là chỗ dễ nói quá nhất, và cũng là chỗ bị bắt quả tang
 * nhanh nhất.
 */

/** Màu đi theo thứ tự bậc, từ lam trời lên hồng đậm — nhìn dải màu là biết đang ở đoạn nào. */
const STEP_COLORS: readonly (readonly [string, string])[] = [
  ['#CEA662', '#7D5E27'],
  ['#E0C699', '#BF9243'],
  ['#E8CD9D', '#C3923E'],
  ['#E879F9', '#A21CAF'],
  ['#FB7185', '#BE123C'],
];

const TOTAL_UNITS = PATH_STEPS.reduce((sum, s) => sum + stepUnits(s), 0);

export default function TranslationPathScreen() {
  const wide = useWindowDimensions().width >= 1100;
  const { L, en } = useL();

  return (
    <Screen>
      <Pressable onPress={() => router.push('/write' as never)} className="flex-row items-center gap-1.5 self-start">
        <Icon name="chevron-left" size={16} color={color.muted} />
        <Text className="font-semi text-body text-muted">Writing</Text>
      </Pressable>

      <Appear>
        <Text className="mt-3 font-heavy text-pageTitle text-ink">{L('Luyện dịch', 'Translation practice')}</Text>
        <Text className="mt-1 max-w-[640px] font-sans text-bodyLg text-muted">
          {L('Tái tạo đúng câu mẫu, từng từ một. Mỗi bậc dịch liền nhiều câu hơn bậc trước — leo từ một câu lên trọn một đoạn văn.', 'Rebuild model sentences word by word. Each step translates more sentences in a row — climbing from one sentence to a full paragraph.')}
        </Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pill value={String(PATH_STEPS.length)} label={L('bậc', 'steps')} />
          <Pill value={TOTAL_UNITS.toLocaleString(en ? 'en-US' : 'vi-VN')} label={L('lượt dịch', 'exercises')} />
          <Pill value={String(TRANSLATION_SETS.length)} label={L('chủ đề', 'topics')} />
        </View>
      </Appear>

      {wide ? (
        <View className="mt-8 flex-row items-end" style={{ gap: 18 }}>
          {PATH_STEPS.map((step, i) => (
            <Appear key={step.id} index={i + 1} style={{ flex: 1, height: 292 + i * 36 }}>
              <StepBlock step={step} index={i} />
            </Appear>
          ))}
        </View>
      ) : (
        <View className="mt-10" style={{ gap: 22 }}>
          {PATH_STEPS.map((step, i) => (
            // Màn hẹp: bậc sau thụt vào thêm một nấc — vẫn đọc ra một cầu thang.
            <Appear key={step.id} index={i + 1} style={{ marginLeft: i * 10 }}>
              <StepBlock step={step} index={i} />
            </Appear>
          ))}
        </View>
      )}
      <View className="h-10" />
    </Screen>
  );
}

function StepBlock({ step, index }: { step: PathStep; index: number }) {
  const topics = topicsForStep(step);
  const last = index === PATH_STEPS.length - 1;
  const { L, en } = useL();
  const tx = en ? STEP_EN[step.id] : undefined;
  const title = tx?.title ?? step.title;
  const badge = tx ? tx.badge : step.badge;

  return (
    <PressScale fill onPress={() => router.push(`/write/translation/${step.id}` as never)} style={{ flex: 1 }}>
      <StickerCard
        bold
        colors={STEP_COLORS[index] ?? STEP_COLORS[0]!}
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={L(`Bậc ${step.order}: ${step.title}`, `Step ${step.order}: ${title}`)}
        ornament={last ? <GlowStars /> : undefined}
      >
        <Text className="font-heavy text-white" style={[STICKER_TITLE_SHADOW, { fontSize: 46, lineHeight: 50 }]}>
          {step.order}
        </Text>
        <Text className="mt-2 font-heavy text-cardTitle text-white" style={STICKER_TITLE_SHADOW}>
          {title}
        </Text>
        {badge ? (
          <View className="mt-2 self-start rounded-pill px-2.5 py-1" style={{ backgroundColor: 'rgba(27,24,64,0.62)' }}>
            <Text className="font-heavy text-white" style={{ fontSize: 10, letterSpacing: 0.8 }}>
              {badge}
            </Text>
          </View>
        ) : null}
        <Text className="mt-2.5 font-semi text-label text-white" style={[STICKER_TEXT_SHADOW, { lineHeight: 19 }]}>
          {tx?.blurb ?? step.blurb}
        </Text>

        <View className="flex-1" />

        {/* Dải con nhộng: mỗi viên một câu phải dịch liền trong một lượt. */}
        <View className="mt-4 flex-row flex-wrap items-center gap-1">
          {Array.from({ length: step.chunk }, (_, k) => (
            <View key={k} style={{ width: 18, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
          ))}
          <Text className="ml-1.5 font-strong text-label text-white" style={STICKER_TEXT_SHADOW}>
            {step.chunk === 1 ? L('1 câu mỗi lượt', '1 sentence per round') : L(`${step.chunk} câu liền`, `${step.chunk} sentences in a row`)}
          </Text>
        </View>
        <View className="mt-3 flex-row items-center justify-between gap-2">
          <Text className="font-semi text-label text-white" style={STICKER_TEXT_SHADOW}>
            {L(
              `${topics.length} mục · ${stepUnits(step).toLocaleString('vi-VN')} lượt`,
              `${topics.length} sets · ${stepUnits(step).toLocaleString('en-US')} exercises`,
            )}
          </Text>
          <View className="h-8 w-8 items-center justify-center rounded-pill bg-white">
            <Icon name="arrow-right" size={15} color={INK} strokeWidth={2.4} />
          </View>
        </View>
      </StickerCard>
    </PressScale>
  );
}

function Pill({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill bg-white px-3 py-1.5" style={{ borderWidth: 1.5, borderColor: '#F0EBE2' }}>
      <Text className="font-heavy text-body" style={{ color: color.primary }}>
        {value}
      </Text>
      <Text className="font-sans text-label text-muted">{label}</Text>
    </View>
  );
}
