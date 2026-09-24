import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { CHECKPOINT_PASS_RATIO, MATH_DOMAIN_STYLE, MATH_SET_KIND_STYLE } from '@/lib/math/theme';
import type { MathDomain } from '@/lib/math/types';
import type { MathExerciseSet, MathUnit } from '@/services/math/curriculum';
import type { SetProgress } from '@/store/useMathStore';
import { color } from '@/theme/tokens';

/**
 * Thẻ bài tập và thẻ bài học của lộ trình.
 *
 * MÀU LÀ THÔNG TIN, không phải trang trí. Dải màu bên trái mỗi thẻ nói KIỂU bài
 * (khởi động / luyện kỹ / kiểm tra / ôn trộn / đề), còn màu của tiêu đề bài học
 * nói DOMAIN. Nhờ hai trục màu ấy, người học nhìn lướt cả trang là biết mình
 * đang ở mảng nào và bài trước mặt nặng tới đâu — không phải đọc từng dòng.
 *
 * Mỗi thẻ luôn trả lời đủ bốn câu trước khi bấm vào: bài này là kiểu gì, bao
 * nhiêu câu, bao lâu, và mình đã làm chưa. Thiếu câu cuối thì lộ trình chỉ là
 * một danh sách.
 */

export function SetCard({
  set,
  progress,
  compact = false,
  locked = false,
}: {
  set: MathExerciseSet;
  progress?: SetProgress;
  compact?: boolean;
  /** Ngoài gói hiện tại. Vẫn hiện đủ thông tin, chỉ đổi hành động khi bấm. */
  locked?: boolean;
}) {
  const kind = MATH_SET_KIND_STYLE[set.kind];
  const done = (progress?.rounds ?? 0) > 0;
  const best = progress?.bestRatio ?? 0;
  const passed = done && best >= CHECKPOINT_PASS_RATIO;

  return (
    <Pressable
      onPress={() => router.push((locked ? '/upgrade' : `/math/set/${set.id}`) as never)}
      className={`flex-row overflow-hidden rounded-card border bg-surface ${
        locked ? 'border-dashed border-borderStrong' : 'border-border'
      }`}
      style={locked ? { opacity: 0.72 } : undefined}
    >
      <View style={{ width: 6, backgroundColor: locked ? color.subtle : kind.solid }} />

      <View className="flex-1 p-3">
        <View className="flex-row flex-wrap items-center gap-2">
          <View
            className="flex-row items-center gap-1.5 rounded-pill px-2.5 py-1"
            style={{ backgroundColor: kind.soft }}
          >
            <Icon name={kind.icon} size={13} color={kind.solid} />
            <Text className="font-strong text-label" style={{ color: kind.ink }}>
              {kind.label}
            </Text>
          </View>

          {done ? (
            <View
              className="flex-row items-center gap-1 rounded-pill px-2 py-1"
              style={{ backgroundColor: passed ? color.successSoft : color.warningSoft }}
            >
              <Icon
                name={passed ? 'check' : 'refresh'}
                size={12}
                color={passed ? color.success : color.warning}
              />
              <Text
                className="font-strong text-label"
                style={{ color: passed ? '#0F7A38' : '#B26A00' }}
              >
                {Math.round(best * 100)}%
              </Text>
            </View>
          ) : null}
        </View>

        {/* Ở thư viện, thẻ đứng một mình nên phải tự nói nó thuộc bài học nào —
            64 thẻ chỉ ghi "Làm quen dạng" thì không phân biệt được cái nào với
            cái nào. Trong lộ trình thì tiêu đề bài học đã nằm ngay phía trên. */}
        {compact ? (
          <Text className="mt-2 font-mid text-label text-muted" numberOfLines={1}>
            {set.unitTitle}
          </Text>
        ) : null}
        <Text className={`font-strong text-body text-ink ${compact ? '' : 'mt-2'}`}>
          {set.title}
        </Text>
        {compact ? null : (
          <Text className="mt-0.5 font-sans text-label text-muted">{set.blurb}</Text>
        )}

        <View className="mt-2 flex-row flex-wrap items-center gap-3">
          <Meta icon="list" text={`${set.count} câu`} />
          <Meta icon="clock" text={`${set.minutes} phút`} />
          {done ? <Meta icon="refresh" text={`${progress?.rounds} lượt`} /> : null}
        </View>
      </View>

      <View className="items-center justify-center pr-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-pill"
          style={{ backgroundColor: locked ? color.surfaceAlt : done ? color.surfaceAlt : kind.solid }}
        >
          <Icon
            name={locked ? 'lock' : done ? 'refresh' : 'arrow-right'}
            size={17}
            color={locked || done ? color.muted : color.white}
          />
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: 'list' | 'clock' | 'refresh'; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={13} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{text}</Text>
    </View>
  );
}

/**
 * Một bài học: tiêu đề màu theo domain, cái bẫy viết ngay dưới, rồi ba bộ đề.
 *
 * CÁI BẪY ĐỌC ĐƯỢC TRƯỚC KHI LÀM BÀI là có chủ ý. Biết trước "chỗ này hay sai
 * vì quên đổi chiều bất phương trình" không làm bài dễ đi — nó biến bài tập từ
 * chỗ kiểm tra thành chỗ học.
 */
export function UnitCard({
  unit,
  index,
  progressBySet,
  locked = false,
}: {
  unit: MathUnit;
  index: number;
  progressBySet: Record<string, SetProgress>;
  locked?: boolean;
}) {
  const style = MATH_DOMAIN_STYLE[unit.domain];
  const doneCount = unit.sets.filter((s) => (progressBySet[s.id]?.rounds ?? 0) > 0).length;
  const complete = doneCount === unit.sets.length;

  return (
    <View className="overflow-hidden rounded-card border border-border bg-surface">
      <LinearGradient
        colors={style.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 14 }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-white/25">
            <Text className="font-heavy text-body text-white">{index}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-heavy text-cardTitle text-white">{unit.title}</Text>
            <Text className="mt-0.5 font-sans text-label text-white/85">{unit.englishName}</Text>
          </View>
          <View className="rounded-pill bg-white/25 px-2.5 py-1">
            <Text className="font-strong text-label text-white">
              {complete ? 'Xong' : `${doneCount}/${unit.sets.length}`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="p-3">
        <View
          className="flex-row gap-2 rounded-panel p-2.5"
          style={{ backgroundColor: style.soft }}
        >
          <Icon name="info" size={15} color={style.solid} />
          <Text className="flex-1 font-sans text-label" style={{ color: style.ink }}>
            {unit.trap}
          </Text>
        </View>

        <View className="mt-3 gap-2">
          {unit.sets.map((set) => (
            <SetCard key={set.id} set={set} progress={progressBySet[set.id]} locked={locked} />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Chip lọc dùng ở tab Thư viện. */
export function FilterChip({
  label,
  active,
  tint,
  onPress,
}: {
  label: string;
  active: boolean;
  tint?: string;
  onPress: () => void;
}) {
  const accent = tint ?? color.primary;
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className="rounded-pill border px-3 py-1.5"
      style={{
        borderColor: active ? accent : color.border,
        backgroundColor: active ? accent : color.surface,
      }}
    >
      <Text className="font-strong text-label" style={{ color: active ? color.white : color.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Vòng tròn tiến độ nhỏ, dùng trong banner đầu trang. */
export function ProgressRing({
  ratio,
  size = 64,
  tint = color.white,
  label,
}: {
  ratio: number;
  size?: number;
  tint?: string;
  label: string;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View className="items-center">
      <View
        className="items-center justify-center rounded-pill"
        style={{
          width: size,
          height: size,
          borderWidth: 5,
          borderColor: 'rgba(255,255,255,0.28)',
          borderTopColor: tint,
          borderRightColor: clamped > 0.25 ? tint : 'rgba(255,255,255,0.28)',
          borderBottomColor: clamped > 0.5 ? tint : 'rgba(255,255,255,0.28)',
          borderLeftColor: clamped > 0.75 ? tint : 'rgba(255,255,255,0.28)',
        }}
      >
        <Text className="font-heavy text-body" style={{ color: tint }}>
          {Math.round(clamped * 100)}%
        </Text>
      </View>
      <Text className="mt-1 font-mid text-label text-white/85">{label}</Text>
    </View>
  );
}

export function domainTint(domain: MathDomain): string {
  return MATH_DOMAIN_STYLE[domain].solid;
}
