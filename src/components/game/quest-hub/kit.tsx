/**
 * BỘ THẺ CHUNG của sảnh game (/quest, /quest/hero, /quest/pick).
 *
 * Người dùng 30/09/2026: "phần chơi game cần hoàn thiện lại chỉn chu hơn" và
 * không thích tông tím. Ba trang game dùng chung MỘT hệ thẻ: nền xanh mực đậm,
 * viền mảnh, bo 20, cùng một thang khoảng cách (6 / 10 / 14 / 20 / 28) và cùng
 * một kiểu tiêu đề mục (con dấu màu + chữ đậm + một dòng giải thích). Màu nhấn
 * lấy từ bảng màu chung của app (xanh dương, vàng, xanh lá, cam, đỏ, xanh trời,
 * hồng) — không còn tím/chàm.
 */
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { SealIcon } from '@/components/illust/HeroArt';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';

export const WEB = Platform.OS === 'web';

/** Bảng màu của sảnh game. */
export const HUB = {
  panel: '#0E1B30',
  raised: 'rgba(215, 192, 153,0.08)',
  raisedHover: 'rgba(215, 192, 153,0.14)',
  line: 'rgba(215, 192, 153,0.16)',
  track: 'rgba(215, 192, 153,0.16)',
  ink: '#FCFBF8',
  muted: '#CDC1AC',
  faint: 'rgba(205, 193, 172,0.62)',
  stage: '#132C4E',
  ground: '#0A1628',
  blue: '#A8843F',
  gold: '#FACC15',
  goldHover: '#FDE047',
  amber: '#F2B632',
  green: '#22A06B',
  orange: '#F0703F',
  red: '#E0533D',
  sky: '#B07A3A',
  pink: '#F472B6',
  ctaInk: '#2A1B02',
} as const;

/** Thang khoảng cách dùng chung. */
export const GAP = { xs: 6, sm: 10, md: 14, lg: 20, section: 30 } as const;

const SHADOW = WEB ? ({ boxShadow: '0 12px 32px rgba(2,8,23,0.35)' } as object) : null;

/** Bề ngang THẬT của khung (đo bằng onLayout); trước lần đo đầu dùng ước lượng theo cửa sổ. */
export function useBoxWidth(): [number, (e: LayoutChangeEvent) => void] {
  const { width } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => setMeasured(Math.round(e.nativeEvent.layout.width)), []);
  const guess = width - (width >= 1024 ? 248 + 48 : 32);
  return [measured || Math.max(300, guess), onLayout];
}

/** Hiệu ứng nhấc thẻ khi rê chuột (web). */
export function lift(hovered: boolean | undefined, px = 3): object {
  return WEB
    ? ({
        transform: hovered ? `translateY(-${px}px)` : 'none',
        transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 160ms ease, border-color 160ms ease, box-shadow 180ms ease',
      } as object)
    : {};
}

/** Khung thẻ chuẩn của sảnh game. */
export function Panel({ children, style, pad = 20 }: { children: React.ReactNode; style?: ViewStyle; pad?: number }) {
  return (
    <View style={[{ borderRadius: 20, backgroundColor: HUB.panel, borderWidth: 1, borderColor: HUB.line, padding: pad }, SHADOW as ViewStyle, style]}>
      {children}
    </View>
  );
}

/** Tiêu đề một mục: con dấu màu + tên + một dòng giải thích + (tuỳ) liên kết bên phải. */
export function SectionHeader({
  title,
  sub,
  seal,
  tone = HUB.amber,
  action,
  onDark = true,
}: {
  title: string;
  sub?: string;
  seal?: IconName;
  tone?: string;
  action?: { label: string; href: string };
  /** true: tiêu đề nằm trên nền trời (ngoài thẻ). */
  onDark?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: GAP.sm }}>
      <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: GAP.sm }}>
        {seal ? (
          <View aria-hidden>
            <SealIcon name={seal} color={tone} size={36} />
          </View>
        ) : null}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" className="font-heavy" style={{ fontSize: 18, lineHeight: 23, color: HUB.ink }}>
            {title}
          </Text>
          {sub ? (
            <Text className="font-sans" style={{ marginTop: 1, fontSize: 13, lineHeight: 18, color: onDark ? 'rgba(240, 235, 226,0.78)' : HUB.muted }}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? <TextLink label={action.label} href={action.href} /> : null}
    </View>
  );
}

/** Liên kết chữ vàng có mũi tên. */
export function TextLink({ label, href, onPress }: { label: string; href?: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress ?? (() => href && router.push(href as never))}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        opacity: hovered ? 1 : 0.9,
        ...(WEB ? ({ transition: 'opacity 150ms ease' } as object) : null),
      })}
    >
      <Text className="font-strong" style={{ fontSize: 13, color: HUB.gold }}>
        {label}
      </Text>
      <Icon name="arrow-right" size={14} color={HUB.gold} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Thanh tiến độ (0–1). Vẽ bằng scaleX để không giật khung khi số đổi. */
export function Bar({ value, color, height = 8, label }: { value: number; color: string; height?: number; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      style={{ height, borderRadius: height / 2, backgroundColor: HUB.track, overflow: 'hidden' }}
    >
      <View
        style={{
          height,
          width: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          transform: [{ scaleX: v === 0 ? 0 : Math.max(0.03, v) }],
          transformOrigin: 'left',
          ...(WEB ? ({ transition: 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as object) : null),
        }}
      />
    </View>
  );
}

/** Viên số liệu nhỏ: biểu tượng + số + nhãn. */
export function StatPill({ glyph, value, label }: { glyph: string; value: string; label: string }) {
  return (
    <View
      accessibilityLabel={`${value} ${label}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: HUB.raised }}
    >
      <Text aria-hidden style={{ fontSize: 13 }}>
        {glyph}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 13, color: HUB.ink, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="font-sans" style={{ fontSize: 12, color: HUB.muted }}>
        {label}
      </Text>
    </View>
  );
}

/** Ô số liệu to (tổng kết hôm nay, hồ sơ nhân vật). */
export function StatBox({ value, label, tone = HUB.ink }: { value: string; label: string; tone?: string }) {
  return (
    <View accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: HUB.raised }}>
      <Text className="font-heavy" style={{ fontSize: 20, lineHeight: 25, color: tone, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="font-sans" style={{ marginTop: 1, fontSize: 12, color: HUB.muted }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Nút chính (vàng) hoặc phụ (viền). `sub` = dòng nhỏ phía trên nhãn. */
export function CtaButton({
  label,
  sub,
  glyph,
  onPress,
  a11yLabel,
  variant = 'primary',
  full = false,
}: {
  label: string;
  sub?: string;
  glyph?: string;
  onPress: () => void;
  a11yLabel?: string;
  variant?: 'primary' | 'ghost';
  full?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={a11yLabel ?? label}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        ...(full ? { alignSelf: 'stretch' as const } : { flexShrink: 1 }),
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: full ? 'space-between' : 'flex-start',
        gap: 10,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: sub ? 8 : 12,
        backgroundColor: primary ? (hovered ? HUB.goldHover : HUB.gold) : hovered ? HUB.raisedHover : HUB.raised,
        borderWidth: primary ? 0 : 1,
        borderColor: HUB.line,
        ...(WEB ? ({ transition: 'background-color 160ms ease, transform 160ms ease', transform: hovered ? 'translateY(-1px)' : 'none' } as object) : null),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 }}>
        {glyph ? (
          <Text aria-hidden style={{ fontSize: primary ? 17 : 15 }}>
            {glyph}
          </Text>
        ) : null}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          {sub ? (
            <Text className="font-semi" style={{ fontSize: 11, letterSpacing: 0.4, color: primary ? '#5B4205' : HUB.muted }} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
          <Text className="font-heavy" style={{ fontSize: primary ? 16 : 14, color: primary ? HUB.ctaInk : HUB.ink }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
      <Icon name="arrow-right" size={17} color={primary ? HUB.ctaInk : HUB.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Nhãn nhỏ viết hoa phía trên một khối (eyebrow). */
export function Eyebrow({ text, tone = HUB.gold }: { text: string; tone?: string }) {
  return (
    <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.3, color: tone }} numberOfLines={1}>
      {text}
    </Text>
  );
}

/**
 * Lưới đều cột theo BỀ NGANG KHUNG (không theo cửa sổ): thẻ trong cùng hàng cao
 * bằng nhau, hàng cuối thiếu thì chèn ô trống để thẻ không bị kéo giãn.
 */
export function Cols({ cols, gap = GAP.md, children }: { cols: number; gap?: number; children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={{ gap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {row.map((child, i) => (
            <View key={i} style={{ flex: 1, minWidth: 0 }}>
              {child}
            </View>
          ))}
          {Array.from({ length: cols - row.length }).map((_, i) => (
            <View key={`s${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Nút quay lại dạng viên thuốc cho đầu trang con. */
export function BackPill({ label, onPress }: { label: string; onPress: () => void }) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Quay lại ${label}`, `Back to ${label}`)}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: HUB.line,
        backgroundColor: hovered ? '#16294A' : HUB.panel,
        ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
      })}
    >
      <Icon name="chevron-left" size={15} color={HUB.ink} strokeWidth={2.2} />
      <Text className="font-strong" style={{ fontSize: 13, color: HUB.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
