import React, { useState } from 'react';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Grid } from '@/components/layout/Grid';
import { BOOK_COVER_IDS, bookCoverUri, bookHue } from '@/data/book-covers';
import { color } from '@/theme/tokens';

/**
 * Bìa sách trong thư viện bộ từ: một bìa có hiệu ứng nhảy lên khi rê chuột, hình quạt ba bìa cho nhóm nhiều sách,
 * banner nền đêm đầu mỗi nhóm, và kệ bìa kèm tiến độ. Ảnh bìa là webp 250×340 (xem `src/data/book-covers.ts`).
 */

const WEB = Platform.OS === 'web';
const RATIO = 340 / 250;

type PressState = { hovered?: boolean; pressed?: boolean; focused?: boolean };

const staticShadow = WEB
  ? ({ boxShadow: '0 10px 16px rgba(40,20,70,0.26)' } as object)
  : { shadowColor: '#281446', shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 5 };

/** Một bìa. Có `onPress` thì rê chuột (hoặc focus bàn phím) sẽ nhảy lên, nghiêng nhẹ và đổ bóng đậm hơn; không có thì đứng yên. */
export function BookCover({
  uri,
  label,
  onPress,
  width,
  maxWidth,
  radius = 14,
}: {
  uri: string;
  label: string;
  onPress?: () => void;
  /** Bề ngang cố định; bỏ trống thì bìa lấp đầy khung chứa. */
  width?: number;
  maxWidth?: number;
  radius?: number;
}) {
  const size = width ? { width, height: Math.round(width * RATIO) } : { width: '100%' as const, aspectRatio: 250 / 340 };
  const image = <Image source={{ uri }} accessibilityLabel={label} style={{ width: '100%', height: '100%', borderRadius: radius }} resizeMode="cover" />;
  const frame = { ...size, ...(maxWidth ? { maxWidth, alignSelf: 'center' as const } : null), borderRadius: radius };
  if (!onPress) return <View style={[frame, staticShadow]}>{image}</View>;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed, focused }: PressState) => {
        const lifted = hovered || focused;
        const base = {
          ...frame,
          transform: [
            { translateY: pressed ? -2 : lifted ? -12 : 0 },
            { rotate: pressed ? '0deg' : lifted ? '-1.6deg' : '0deg' },
            { scale: pressed ? 0.98 : lifted ? 1.04 : 1 },
          ],
        };
        if (WEB) {
          return {
            ...base,
            boxShadow: lifted ? '0 26px 30px rgba(40,20,70,0.38)' : '0 10px 16px rgba(40,20,70,0.26)',
            transition: 'transform 320ms cubic-bezier(.34,1.56,.64,1), box-shadow 260ms ease',
            cursor: 'pointer',
            outlineStyle: 'none',
          } as never;
        }
        return { ...base, shadowColor: '#281446', shadowOpacity: lifted ? 0.38 : 0.26, shadowRadius: lifted ? 16 : 10, shadowOffset: { width: 0, height: lifted ? 14 : 8 }, elevation: lifted ? 10 : 5 };
      }}
    >
      {image}
    </Pressable>
  );
}

/** Nhóm nhiều sách: các bìa xếp quạt, rê chuột thì xòe rộng ra và nhấc lên. */
export function CoverFan({ ids, width, label, onPress }: { ids: readonly string[]; width: number; label: string; onPress?: () => void }) {
  const [hot, setHot] = useState(false);
  const cw = Math.round(width * 0.6);
  const ch = Math.round(cw * RATIO);
  const n = ids.length;
  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHot(true)}
      onHoverOut={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      style={{ width, height: ch + 40, ...(WEB && onPress ? ({ cursor: 'pointer', outlineStyle: 'none' } as object) : null) }}
    >
      {ids.map((id, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const off = t - 0.5;
        const spread = hot ? 1.12 : 1;
        return (
          <View
            key={id}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: t * (width - cw) * spread - (spread - 1) * (width - cw) * 0.5,
              top: 24 + Math.abs(off) * 34 - (hot ? 12 : 0),
              width: cw,
              height: ch,
              zIndex: 10 - Math.round(Math.abs(off) * 4),
              transform: [{ rotate: `${off * (hot ? 26 : 18)}deg` }],
              ...(WEB ? ({ transition: 'left 320ms cubic-bezier(.34,1.56,.64,1), top 320ms cubic-bezier(.34,1.56,.64,1), transform 320ms cubic-bezier(.34,1.56,.64,1)' } as object) : null),
              ...(staticShadow as object),
            }}
          >
            <Image source={{ uri: bookCoverUri(id) }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
          </View>
        );
      })}
    </Pressable>
  );
}

/**
 * Banner đầu một nhóm sách: nền đêm cùng tông bìa, bìa (hoặc quạt bìa) bên trái, tên và số liệu bên phải.
 * Không có `onCover` thì bìa đứng yên (đang ở trong nhóm rồi, không có chỗ để mở).
 */
export function BookBanner({
  ids,
  eyebrow,
  title,
  subtitle,
  chips,
  mastered,
  total,
  masteredLabel,
  cta,
  onCta,
  onCover,
}: {
  ids: readonly string[];
  eyebrow: string;
  title: string;
  subtitle: string;
  chips: readonly string[];
  mastered: number;
  total: number;
  masteredLabel: string;
  cta?: string;
  onCta?: () => void;
  onCover?: () => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 640;
  const hue = bookHue(ids[0] ?? BOOK_COVER_IDS[0]);
  const night = `hsl(${hue} 46% 13%)`;
  const deep = `hsl(${hue} 56% 7%)`;
  const bright = `hsl(${hue} 88% 68%)`;
  const soft = `hsl(${hue} 92% 82%)`;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const coverW = compact ? 104 : 152;
  const fanW = compact ? 168 : 250;

  return (
    <View
      style={
        {
          borderRadius: 24,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 16 : 26,
          paddingHorizontal: compact ? 16 : 26,
          paddingVertical: compact ? 18 : 24,
          backgroundColor: night,
          ...(WEB ? { backgroundImage: `linear-gradient(135deg, ${night}, ${deep})`, boxShadow: `0 14px 30px hsl(${hue} 60% 12% / 0.32)` } : null),
        } as never
      }
    >
      {/* Ánh sao: vòng sáng mờ và vài chấm, giống nền bìa. */}
      {/* Vòng thiên cầu bên phải, cùng ngôn ngữ với vòng sau số lớn trên bìa. */}
      <View pointerEvents="none" style={{ position: 'absolute', right: compact ? -150 : -70, top: '50%', marginTop: -170, width: 340, height: 340, borderRadius: 170, borderWidth: 1, borderColor: soft, opacity: 0.22 }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: compact ? -110 : -30, top: '50%', marginTop: -130, width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: soft, borderStyle: 'dashed', opacity: 0.28 }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: bright, opacity: 0.16 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: -40, bottom: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: bright, opacity: 0.1 }} />
      {[
        { l: '46%', t: 14, s: 3 },
        { l: '71%', t: 38, s: 2 },
        { l: '88%', t: 22, s: 3 },
        { l: '58%', t: '82%', s: 2 },
        { l: '93%', t: '70%', s: 2 },
      ].map((d, i) => (
        <View key={i} pointerEvents="none" style={{ position: 'absolute', left: d.l as never, top: d.t as never, width: d.s, height: d.s, borderRadius: d.s, backgroundColor: soft, opacity: 0.8 }} />
      ))}

      <View style={{ paddingVertical: 4 }}>
        {ids.length > 1 ? (
          <CoverFan ids={ids} width={fanW} label={title} onPress={onCover} />
        ) : (
          <BookCover uri={bookCoverUri(ids[0]!)} label={title} width={coverW} radius={10} onPress={onCover} />
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} className="font-strong" style={{ fontSize: 13, letterSpacing: 1.6, color: soft }}>{eyebrow.toUpperCase()}</Text>
        <Text numberOfLines={2} className="font-heavy" style={{ marginTop: 4, fontSize: compact ? 22 : 30, lineHeight: compact ? 27 : 36, color: '#FFFFFF' }}>{title}</Text>
        <Text numberOfLines={2} className="font-sans" style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.78)' }}>{subtitle}</Text>

        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c) => (
            <View key={c} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
              <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>{c}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 460 }}>
          <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: bright }} />
          </View>
          <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>{`${pct}% · ${masteredLabel}`}</Text>
        </View>

        {cta && onCta ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCta}
            style={({ hovered }: PressState) =>
              ({
                alignSelf: 'flex-start',
                marginTop: 16,
                borderRadius: 999,
                paddingHorizontal: 18,
                paddingVertical: 10,
                backgroundColor: hovered ? '#FFFFFF' : soft,
                ...(WEB ? { transition: 'background-color 160ms ease, transform 160ms ease', transform: [{ translateY: hovered ? -2 : 0 }], cursor: 'pointer' } : null),
              }) as never
            }
          >
            <Text className="font-strong" style={{ fontSize: 14, color: deep }}>{cta}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type ShelfItem = {
  key: string;
  /** Mã bìa (xem `BOOK_COVER_IDS`). */
  id: string;
  /** Dùng cho bìa sách có sẵn ngoài bộ bìa collection. */
  uri?: string;
  title: string;
  meta: string;
  pct: number;
  onPress: () => void;
};

/** Kệ bìa: mỗi sách một bìa nhảy được, tên, số từ và thanh tiến độ ở dưới. */
export function CoverShelf({ items, columns = 6 }: { items: readonly ShelfItem[]; columns?: number }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Grid columns={columns} tabletColumns={Math.min(columns, 4)} mobileColumns={2} gap={22}>
        {items.map((it) => (
          <View key={it.key} style={{ width: '100%', maxWidth: 230, alignSelf: 'center', paddingTop: 10 }}>
            <BookCover uri={it.uri ?? bookCoverUri(it.id)} label={it.title} onPress={it.onPress} />
            <Pressable accessibilityRole="link" onPress={it.onPress} style={{ marginTop: 12 }}>
              <Text numberOfLines={2} className="font-strong" style={{ fontSize: 14, lineHeight: 19, color: color.ink }}>{it.title}</Text>
              <Text numberOfLines={1} className="font-sans" style={{ marginTop: 2, fontSize: 13, color: '#6E5E4B' }}>{it.meta}</Text>
              <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: '#EEE9FB', overflow: 'hidden' }}>
                <View style={{ width: `${it.pct}%`, height: '100%', borderRadius: 3, backgroundColor: color.primary }} />
              </View>
            </Pressable>
          </View>
        ))}
      </Grid>
    </View>
  );
}

/** Tiêu đề một cuốn trong nhóm nhiều sách (Global Success, Destination): bìa nhỏ, tên, số liệu. */
export function BookGroupHead({ id, title, meta }: { id: string; title: string; meta: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <BookCover uri={bookCoverUri(id)} label={title} width={58} radius={8} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} className="font-heavy" style={{ fontSize: 20, lineHeight: 26, color: color.ink }}>{title}</Text>
        <Text numberOfLines={1} className="font-sans" style={{ marginTop: 2, fontSize: 14, color: '#6E5E4B' }}>{meta}</Text>
      </View>
    </View>
  );
}
