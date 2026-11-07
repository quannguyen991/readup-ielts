import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { GlossOrb } from '@/components/ui/GlossOrb';
import { TileArt } from '@/components/ui/TileArt';
import { studiedPct, type DeckProgress } from '@/services/vocab/deck-library';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { useL } from '@/i18n/useL';
import { fontFamily } from '@/theme/tokens';

/**
 * THẺ BỘ TỪ ở thư viện Quiz từ vựng: ảnh bìa của bộ (hoặc nền màu theo nguồn nếu chưa có ảnh),
 * tên bộ in nghiêng theo kiểu mặt chữ đọc báo, thanh tiến độ, số từ và nguồn.
 *
 * Bấm vào là sang trang của bộ đó — nơi có đủ các cách luyện. Thẻ không tự chọn
 * kiểu luyện: chọn bộ trước, vào trong rồi mới chọn cách học.
 */

const WEB = Platform.OS === 'web';
const TEXT_STRONG = '#2B2350';
const TEXT_SOFT = '#6E5E4B';
const TEXT_META = '#9A8A74';

/** Cờ Việt Nam vẽ bằng SVG — emoji cờ trên Windows chỉ hiện hai chữ "VN". */
export function FlagVN({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size * 1.5} height={size} viewBox="0 0 30 20">
      <Rect x={0} y={0} width={30} height={20} rx={3} fill="#DA251D" />
      <Path d="M15 4.2l1.55 4.77h5.01l-4.05 2.95 1.55 4.77L15 13.74l-4.06 2.95 1.55-4.77-4.05-2.95h5.01z" fill="#FFDD00" />
    </Svg>
  );
}

/**
 * Thanh tiến độ hai nấc: phần đã nhớ đặc, phần đang học cùng màu nhưng nhạt hơn. Nền thanh (`track`) phải
 * tối hơn màu thanh, nếu không phần đã học chìm vào nền (thanh trắng trên nền gần trắng trông như không đổi).
 */
export function DeckProgressBar({
  progress,
  color,
  height = 8,
  track = '#F3F0FB',
}: {
  progress: DeckProgress;
  color: string;
  height?: number;
  track?: string;
}) {
  const total = Math.max(1, progress.total);
  return (
    <View style={{ flex: 1, height, borderRadius: height, backgroundColor: track, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ width: `${(progress.mastered / total) * 100}%`, backgroundColor: color, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
      <View style={{ width: `${(progress.learning / total) * 100}%`, backgroundColor: color, opacity: 0.55, ...(WEB ? ({ transition: 'width 420ms ease' } as object) : null) }} />
    </View>
  );
}

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
      <Text style={{ fontFamily: fontFamily.semibold, fontSize: 12, color }}>{pct}%</Text>
    </View>
  );
}

/**
 * Bìa đứng 4:5 như bìa sách. Ảnh nếu có, không thì nền gradient theo màu nguồn kèm biểu tượng.
 * Rê chuột thì ảnh phóng nhẹ, chậm và mượt.
 */
const COVER_RATIO = 0.8;
/**
 * Khung hoạ tiết đầu thẻ bộ: ảnh bìa nếu có, không thì hoạ tiết pastel theo tên bộ, quả cầu icon chồng lên —
 * cùng kiểu thẻ luyện của trang từ vựng.
 */
function DeckCover({ cover, icon, soft, strong, seed, hovered }: { cover?: string; icon: IconName; soft: string; strong: string; seed: string; hovered: boolean }) {
  return (
    <View style={{ aspectRatio: 1.5, overflow: 'hidden', backgroundColor: soft }}>
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={{ width: '100%', height: '100%', transform: [{ scale: hovered ? 1.05 : 1 }], ...(WEB ? ({ transition: 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as object) : null) }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <TileArt seed={seed} tone={[soft, strong]} height={124} style={{ borderRadius: 0, height: '100%' }} />
      )}
      <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 10 }}>
        <GlossOrb icon={icon} tone={[soft, strong]} size={40} />
      </View>
    </View>
  );
}

export function DeckCard({
  title,
  subtitle,
  progress,
  accent = ['#F3F0FB', '#CDA45E'],
  icon,
  sourceLabel,
  cover,
  onPress,
}: {
  title: string;
  /** Dòng phụ ngắn (tên tiếng Anh của chủ đề, vài từ đầu của bộ…). */
  subtitle?: string;
  progress: DeckProgress;
  accent?: readonly [string, string];
  icon: IconName;
  sourceLabel: string;
  /** Ảnh bìa của bộ (đường dẫn trong app). Không có thì dùng nền màu. */
  cover?: string;
  now?: Date;
  onPress: () => void;
}) {
  useReadingFonts();
  const [soft, strong] = accent;
  const pct = studiedPct(progress);
  const { L } = useL();
  const [hovered, setHovered] = React.useState(false);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(
        `${title}. Đã học ${pct}% (${progress.mastered} đã nhớ, ${progress.learning} đang học), ${progress.total} từ.`,
        `${title}. ${pct}% studied (${progress.mastered} remembered, ${progress.learning} learning), ${progress.total} words.`,
      )}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ height: '100%', minHeight: 300 }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: strong,
          ...(WEB
            ? ({
                boxShadow: hovered ? '0 14px 30px rgba(40,30,80,0.28)' : '0 6px 16px rgba(40,30,80,0.16)',
                transform: hovered ? 'translateY(-3px)' : 'none',
                transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms ease',
              } as object)
            : { elevation: 3 }),
        }}
      >
        <LinearGradient colors={[soft, strong]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <DeckCover cover={cover} icon={icon} soft={soft} strong={strong} seed={title} hovered={hovered} />

        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 14, gap: 6, justifyContent: 'flex-end' }}>
          <Text
            numberOfLines={2}
            style={{ fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '600', color: '#FFFFFF', fontSize: 18, lineHeight: 23 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
              {subtitle}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <DeckProgressBar progress={progress} color="#FFFFFF" height={6} track="rgba(20,10,40,0.35)" />
            <Text style={{ fontFamily: fontFamily.semibold, fontSize: 12, color: '#FFFFFF' }}>{pct}%</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <View style={{ borderRadius: 999, backgroundColor: 'rgba(20,10,40,0.3)', paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontFamily: fontFamily.semibold, fontSize: 12, color: '#FFFFFF' }}>
                {`${sourceLabel} · ${progress.total} ${L('từ', 'words')}`}
              </Text>
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow-right" size={14} color={strong} strokeWidth={2.2} />
            </View>
          </View>
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
      <View style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}>
        <Icon name={icon} size={20} color="#CDA45E" strokeWidth={2.2} />
      </View>
      <Text style={{ marginTop: 12, textAlign: 'center', fontFamily: fontFamily.semibold, color: TEXT_STRONG, fontSize: 16 }}>{title}</Text>
      <Text style={{ marginTop: 4, textAlign: 'center', fontFamily: fontFamily.regular, color: TEXT_SOFT, fontSize: 13, maxWidth: 260 }}>{detail}</Text>
    </Pressable>
  );
}
