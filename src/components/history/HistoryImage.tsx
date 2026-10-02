import React, { useCallback, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { useReducedMotion } from '@/components/travel/ui/hooks';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';

const WEB = Platform.OS === 'web';

/**
 * Ảnh minh hoạ của một cảnh.
 *   - Tải dần (`loading="lazy"` + giải mã bất đồng bộ), có khung xương trong lúc chờ;
 *   - Lỗi tải → khung dự phòng + nút thử lại, KHÔNG để lỗ trống;
 *   - Ảnh pixel: chỉ dùng `image-rendering: pixelated` khi phóng LÊN, và phóng theo HỆ SỐ NGUYÊN khi vừa
 *     khung (thu NHỎ thì để trình duyệt làm mịn — pixelated khi thu nhỏ ra răng cưa);
 *   - Tỉ lệ 16:9 cố định nên đổi cảnh không làm nhảy bố cục.
 * `children` vẽ chồng lên ảnh; lớp `futureMedia` rỗng ở dưới là CHỖ DÀNH cho parallax / chuyển động nhẹ về sau
 * (xem `Scene.futureMedia`) — hiện chưa làm gì.
 */
export function HistoryImage({ file, alt, children }: { file: string; alt: string; children?: React.ReactNode }) {
  const { L } = useL();
  const reduced = useReducedMotion();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [tries, setTries] = useState(0);
  const [boxW, setBoxW] = useState(0);
  const [natural, setNatural] = useState(0);

  // Đổi ảnh (đổi cảnh) hoặc thử lại → về "đang tải", ngay trong lượt vẽ (không qua effect).
  const imgKey = `${file}|${tries}`;
  const [prevKey, setPrevKey] = useState(imgKey);
  if (prevKey !== imgKey) {
    setPrevKey(imgKey);
    setState('loading');
    setNatural(0);
  }

  const onLoad = useCallback((e: { currentTarget?: HTMLImageElement; target?: EventTarget }) => {
    const el = (e.currentTarget ?? e.target) as HTMLImageElement | null;
    setNatural(el?.naturalWidth ?? 0);
    setState('ok');
  }, []);

  // Hệ số nguyên: ảnh gốc rộng `natural`, khung rộng `boxW`.
  const scale = natural > 0 && boxW > 0 ? boxW / natural : 0;
  const upscaled = natural > 0 ? scale >= 1 : state === 'ok';
  const intW = natural > 0 && boxW > 0 && scale >= 1 ? natural * Math.floor(scale) : null;
  const pixelated = upscaled;

  return (
    <View
      onLayout={(e) => setBoxW(Math.round(e.nativeEvent.layout.width))}
      style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#E9E4D6', alignItems: 'center', justifyContent: 'center' }}
    >
      {state === 'loading' ? <Skeleton reduced={reduced} label={L('Đang tải ảnh…', 'Loading image…')} /> : null}
      {state === 'error' ? (
        <View style={{ alignItems: 'center', gap: 8, padding: 16 }}>
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 13, color: '#6B6A60', textAlign: 'center' }}>{L('Không tải được ảnh minh hoạ.', 'The illustration could not be loaded.')}</Text>
          <Pressable accessibilityRole="button" onPress={() => setTries((n) => n + 1)} style={{ minHeight: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, backgroundColor: '#957846' }}>
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: '#FFFFFF' }}>{L('Thử lại', 'Try again')}</Text>
          </Pressable>
        </View>
      ) : null}
      {state !== 'error' ? (
        WEB ? (
          <img
            key={`${file}-${tries}`}
            src={file}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={onLoad as never}
            onError={() => setState('error')}
            style={{
              width: intW ? `${intW}px` : '100%',
              maxWidth: '100%',
              height: intW ? 'auto' : '100%',
              objectFit: 'cover',
              imageRendering: pixelated ? 'pixelated' : 'auto',
              opacity: state === 'ok' ? 1 : 0,
              transition: reduced ? 'none' : 'opacity .35s ease',
              userSelect: 'none',
              display: 'block',
            }}
          />
        ) : (
          <Image
            source={{ uri: file }}
            accessibilityLabel={alt}
            resizeMode="cover"
            onLoad={() => setState('ok')}
            onError={() => setState('error')}
            style={{ width: '100%', height: '100%', opacity: state === 'ok' ? 1 : 0 }}
          />
        )
      ) : null}
      {/* CHỖ DÀNH cho parallax / lớp tiền cảnh-hậu cảnh về sau (Scene.futureMedia). Rỗng: không chiếm sự kiện chạm. */}
      <View pointerEvents="none" nativeID="history-future-media" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {children}
    </View>
  );
}

function Skeleton({ reduced, label }: { reduced: boolean; label: string }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={label}>
      {WEB && !reduced ? <style>{'@keyframes histPulse{0%,100%{opacity:.55}50%{opacity:1}}'}</style> : null}
      <View
        style={[
          { width: '100%', height: '100%', backgroundColor: '#E1DBC9' },
          WEB && !reduced ? ({ animation: 'histPulse 1.4s ease-in-out infinite' } as object) : null,
        ]}
      />
      <Text style={{ position: 'absolute', fontFamily: readingFont.sansSemi, fontSize: 12.5, color: '#8A8575' }}>{label}</Text>
    </View>
  );
}
