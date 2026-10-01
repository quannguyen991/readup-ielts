import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { type DeckProgress } from '@/services/vocab/deck-library';

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
    <View style={{ flex: 1, height, borderRadius: height, backgroundColor: '#F7F4EE', overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ width: `${(progress.mastered / total) * 100}%`, backgroundColor: color, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
      <View style={{ width: `${(progress.learning / total) * 100}%`, backgroundColor: color, opacity: 0.32, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
    </View>
  );
}

/**
 * THẺ BỘ TỪ KIỂU CHỒNG THẺ GHI NHỚ (27/09/2026). Bản thẻ màu kín có hoa văn
 * trông giống The IELTS Dictionary quá — người dùng bảo đổi. Bản này là một
 * xấp thẻ giấy: hai tấm lệch phía sau nhuộm màu của bộ, tấm trước màu trắng
 * có gáy màu bên trái, chữ cái đầu to mờ làm nền, và vòng tiến độ ở góc.
 * Chữ chỉ còn: tên bộ, dòng phụ, số từ.
 */
export function ProgressRing({ pct, color, size = 46 }: { pct: number; color: string; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}22`} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </Svg>
      <Text className="font-heavy" style={{ fontSize: 12, color }}>
        {pct}%
      </Text>
    </View>
  );
}

export function DeckCard({
  title,
  subtitle,
  progress,
  accent = ['#F9F2E6', '#CDA45E'],
  icon,
  sourceLabel,
  onPress,
}: {
  title: string;
  /** Dòng phụ ngắn (tên tiếng Anh của chủ đề, vài từ đầu của bộ…). */
  subtitle?: string;
  progress: DeckProgress;
  accent?: readonly [string, string];
  icon: IconName;
  sourceLabel: string;
  now?: Date;
  onPress: () => void;
}) {
  const [soft, strong] = accent;
  const pct = progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0;
  const [hovered, setHovered] = React.useState(false);
  const letter = title.trim().charAt(0).toUpperCase();
  const fan = (deg: number, dx: number) =>
    WEB ? ({ transform: `rotate(${hovered ? deg * 1.8 : deg}deg) translateX(${hovered ? dx * 1.6 : dx}px)`, transition: 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as object) : { transform: [{ rotate: `${deg}deg` }] };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. Thuộc ${pct}%, ${progress.total} từ.`}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ height: '100%', minHeight: 158, paddingTop: 6, paddingHorizontal: 4 }}
    >
      {/* Hai tấm thẻ phía sau, lệch nhẹ — nhìn ra ngay đây là một xấp thẻ. */}
      <View style={[{ position: 'absolute', top: 10, bottom: 2, left: 10, right: 10, borderRadius: 18, backgroundColor: strong, opacity: 0.35 }, fan(3.2, 4)]} />
      <View style={[{ position: 'absolute', top: 8, bottom: 4, left: 8, right: 8, borderRadius: 18, backgroundColor: soft }, fan(-2.2, -3)]} />

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          ...(WEB
            ? ({
                boxShadow: hovered ? '0 14px 30px rgba(15,23,42,0.16)' : '0 4px 14px rgba(15,23,42,0.08)',
                transform: hovered ? 'translateY(-3px)' : 'none',
                transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms ease',
              } as object)
            : { elevation: 3 }),
        }}
      >
        {/* Gáy màu của bộ. */}
        <View style={{ width: 7, backgroundColor: strong }} />
        <View style={{ flex: 1, padding: 16 }}>
          {/* Chữ cái đầu to, mờ — như chữ in trên mặt thẻ. */}
          <Text
            pointerEvents="none"
            className="font-heavy"
            style={{ position: 'absolute', right: 12, bottom: -18, fontSize: 104, lineHeight: 110, color: soft }}
          >
            {letter}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={19} color={strong} strokeWidth={2.1} />
            </View>
            <ProgressRing pct={pct} color={strong} />
          </View>
          <View style={{ flex: 1 }} />
          <Text className="font-heavy text-ink" style={{ marginTop: 12, fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
            {title}
          </Text>
          <Text className="font-sans text-muted" style={{ marginTop: 2, fontSize: 13 }} numberOfLines={1}>
            {subtitle ? `${subtitle} · ` : ''}
            {progress.total} từ
          </Text>
          <Text className="font-strong" style={{ marginTop: 8, fontSize: 11, letterSpacing: 0.6, color: strong }}>
            {sourceLabel.toUpperCase()}
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
        borderColor: hovered ? '#D7B67D' : '#E0D7C7',
        backgroundColor: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        ...(WEB ? ({ transition: 'border-color 200ms ease, background-color 200ms ease' } as object) : null),
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCF8F1' }}>
        <Icon name={icon} size={20} color="#CDA45E" strokeWidth={2.2} />
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
