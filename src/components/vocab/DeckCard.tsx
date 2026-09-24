import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { relativeTimeVi, type DeckProgress } from '@/services/vocab/deck-library';

/**
 * THẺ BỘ TỪ ở thư viện Quiz từ vựng: tên bộ, nghĩa tiếng Việt, thanh tiến độ hai
 * nấc (đã nhớ đậm, đang học nhạt), lần học cuối, số từ và nguồn của bộ.
 *
 * Bấm vào là sang trang của bộ đó — nơi có đủ các cách luyện. Thẻ không tự chọn
 * kiểu luyện: chọn bộ trước, vào trong rồi mới chọn cách học.
 */

const WEB = Platform.OS === 'web';

/** Cờ Việt Nam vẽ bằng SVG — emoji cờ trên Windows chỉ hiện hai chữ "VN". */
export function FlagVN({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size * 1.5} height={size} viewBox="0 0 30 20">
      <Rect x={0} y={0} width={30} height={20} rx={3} fill="#DA251D" />
      <Path d="M15 4.2l1.55 4.77h5.01l-4.05 2.95 1.55 4.77L15 13.74l-4.06 2.95 1.55-4.77-4.05-2.95h5.01z" fill="#FFDD00" />
    </Svg>
  );
}

/** Thanh tiến độ hai nấc: phần đã nhớ màu đậm, phần đang học cùng màu nhưng nhạt. */
export function DeckProgressBar({ progress, color, height = 8 }: { progress: DeckProgress; color: string; height?: number }) {
  const total = Math.max(1, progress.total);
  return (
    <View style={{ flex: 1, height, borderRadius: height, backgroundColor: '#EEF1F7', overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ width: `${(progress.mastered / total) * 100}%`, backgroundColor: color, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
      <View style={{ width: `${(progress.learning / total) * 100}%`, backgroundColor: color, opacity: 0.32, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
    </View>
  );
}

export function DeckCard({
  title,
  subtitle,
  progress,
  accent,
  icon,
  sourceLabel,
  now,
  onPress,
}: {
  title: string;
  /** Dòng phụ ngắn (tên tiếng Anh của chủ đề, vài từ đầu của bộ…). */
  subtitle?: string;
  progress: DeckProgress;
  accent: readonly [string, string];
  icon: IconName;
  sourceLabel: string;
  now: Date;
  onPress: () => void;
}) {
  const done = progress.total > 0 && progress.mastered === progress.total;
  const last = relativeTimeVi(progress.lastAt, now);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. Đã nhớ ${progress.mastered} trên ${progress.total} từ. Học lần cuối: ${last}.`}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
        height: '100%',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderWidth: 1.5,
        borderColor: hovered ? `${accent[1]}66` : '#E9ECF5',
        ...(WEB
          ? ({
              boxShadow: hovered ? '0 2px 4px rgba(15,23,42,0.05), 0 18px 36px rgba(30,41,99,0.12)' : '0 1px 2px rgba(15,23,42,0.04), 0 10px 26px rgba(30,41,99,0.07)',
              transform: pressed ? 'scale(0.985)' : hovered ? 'translateY(-3px)' : 'none',
              transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 200ms ease, border-color 200ms ease',
            } as object)
          : { elevation: 2 }),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: accent[0] }}>
          <Icon name={icon} size={20} color={accent[1]} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy text-ink" style={{ fontSize: 17, lineHeight: 22 }} numberOfLines={2}>
            {title}
          </Text>
          <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FlagVN size={11} />
            <Text className="font-sans text-label text-muted" numberOfLines={1} style={{ flexShrink: 1 }}>
              Nghĩa tiếng Việt{subtitle ? ` · ${subtitle}` : ''}
            </Text>
          </View>
        </View>
        {done ? (
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#DCFCE7' }}>
            <Text className="font-strong" style={{ fontSize: 11, color: '#15803D' }}>
              Đã thuộc
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <DeckProgressBar progress={progress} color={accent[1]} />
        <Text className="font-heavy text-ink" style={{ fontSize: 14, minWidth: 44, textAlign: 'right' }}>
          {progress.mastered}/{progress.total}
        </Text>
      </View>

      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="clock" size={14} color="#94A3B8" />
        <Text className="font-sans text-label text-muted">
          Học lần cuối: <Text className="font-semi" style={{ color: progress.lastAt ? '#334155' : '#94A3B8' }}>{last}</Text>
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#F4F6FB' }}>
          <Text className="font-strong text-label text-ink">{progress.total} từ</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: accent[0], flexShrink: 1 }}>
          <Icon name={icon} size={12} color={accent[1]} strokeWidth={2.2} />
          <Text className="font-strong text-label" numberOfLines={1} style={{ color: accent[1], flexShrink: 1 }}>
            {sourceLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Ô "tạo bộ mới" / "sổ từ chưa đủ" — cùng khổ với thẻ bộ từ nhưng viền đứt. */
export function DeckActionCard({ title, detail, icon, onPress }: { title: string; detail: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        height: '100%',
        minHeight: 180,
        borderRadius: 20,
        padding: 18,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: hovered ? '#6366F1' : '#C7CDE0',
        backgroundColor: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        ...(WEB ? ({ transition: 'border-color 200ms ease, background-color 200ms ease' } as object) : null),
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' }}>
        <Icon name={icon} size={20} color="#4F46E5" strokeWidth={2.2} />
      </View>
      <Text className="mt-3 text-center font-heavy text-ink" style={{ fontSize: 16 }}>
        {title}
      </Text>
      <Text className="mt-1 text-center font-sans text-label text-muted" style={{ maxWidth: 260 }}>
        {detail}
      </Text>
    </Pressable>
  );
}
