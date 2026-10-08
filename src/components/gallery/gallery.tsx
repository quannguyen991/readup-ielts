/**
 * Thế giới "phòng tranh" của Band 9 — dùng chung cho trang giới thiệu (/gioi-thieu) và Tủ sách (/tu-sach).
 * Hệ màu, phông và luật dùng: DESIGN.md. Tranh nền nén riêng ở public/landing (gốc: public/backdrops/art).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';

export const WALL = '#0E1530';
export const NAVY = '#0F1D33';
export const NAVY_2 = '#16264A';
export const CREAM = '#F3EDE1';
export const MIST = '#C9CFDF';
export const GOLD = '#E3BE6A';
export const GOLD_DEEP = '#B8955A';
export const PAPER = '#FBF8F2';
export const INK = '#141A33';
export const BODY = '#4A4F66';
export const RED = '#E5484D';
export const GREEN = '#22A06B';

export const SERIF = 'PlayfairDisplay_700Bold';
export const SERIF_I = 'PlayfairDisplay_600SemiBold_Italic';
export const SANS_4 = 'PlusJakartaSans_400Regular';
export const SANS_5 = 'PlusJakartaSans_500Medium';
export const SANS_6 = 'PlusJakartaSans_600SemiBold';
export const SANS_7 = 'PlusJakartaSans_700Bold';
export const SANS_8 = 'PlusJakartaSans_800ExtraBold';

export const isWeb = Platform.OS === 'web';

export function Painting({ src, pos, scrim, lazy = false }: { src: string; pos: string; scrim: string; lazy?: boolean }) {
  const [show, setShow] = useState(!lazy);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (show || !isWeb) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setShow(true);
        io.disconnect();
      }
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  if (!isWeb) {
    return (
      <>
        <Image source={{ uri: src }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,12,34,0.7)' }} />
      </>
    );
  }
  return (
    <>
      {React.createElement('div', {
        ref,
        'aria-hidden': true,
        style: { position: 'absolute', inset: 0, backgroundColor: WALL, background: show ? `url(${src}) ${pos} / cover no-repeat ${WALL}` : WALL },
      })}
      {React.createElement('div', { 'aria-hidden': true, style: { position: 'absolute', inset: 0, background: scrim } })}
    </>
  );
}

/** Khung tranh vàng + viền giấy kem bên trong. */
export function Frame({ children }: { children: React.ReactNode }) {
  if (!isWeb) {
    return (
      <View style={{ padding: 6, backgroundColor: GOLD_DEEP }}>
        <View style={{ padding: 12, backgroundColor: '#EFE7D6' }}>{children}</View>
      </View>
    );
  }
  return React.createElement(
    'div',
    {
      style: {
        padding: 6,
        borderRadius: 2,
        background: GOLD_DEEP,
        boxShadow: '0 34px 70px rgba(0,0,0,.55)',
        position: 'relative',
      },
    },
    React.createElement('div', { style: { padding: 12, background: '#EFE7D6' } }, children),
  );
}

export function ArtLabel({ title, meta, align }: { title: string; meta: string; align: 'left' | 'right' | 'center' }) {
  return (
    <Text style={{ textAlign: align, color: 'rgba(243,237,225,0.82)', fontSize: 13, lineHeight: 19, fontFamily: SANS_5 }}>
      <Text style={{ fontFamily: SERIF_I, fontSize: 14.5, color: CREAM }}>{title}</Text>
      {' — '}
      {meta}
    </Text>
  );
}
