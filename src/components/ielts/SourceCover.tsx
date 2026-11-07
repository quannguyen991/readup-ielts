import React from 'react';
import { Image, StyleSheet, Text as RNText, View, type TextProps } from 'react-native';

import { color } from '@/theme/tokens';

/** Phông Be Vietnam Pro của Band 9, chọn theo độ đậm của từng chữ. */
export function fontFor(weight: unknown): string {
  switch (String(weight)) {
    case '900':
    case '800':
      return 'BeVietnamPro_800ExtraBold';
    case '700':
    case 'bold':
      return 'BeVietnamPro_700Bold';
    case '600':
      return 'BeVietnamPro_600SemiBold';
    case '500':
      return 'BeVietnamPro_500Medium';
    default:
      return 'BeVietnamPro_400Regular';
  }
}

/** Mọi chữ trong khu bộ đề đi qua đây để dùng cùng một phông Band 9. */
export function Text(props: TextProps) {
  const flat = StyleSheet.flatten(props.style) as { fontWeight?: unknown } | undefined;
  return <RNText {...props} style={[{ fontFamily: fontFor(flat?.fontWeight) }, props.style]} />;
}

/**
 * Bìa của một đề: ảnh 2D đã tạo sẵn trong public/books/covers-2d (cam-N.png, vol-N.png).
 */
export function FlatCover({ kind, num, width, height, radius = 10 }: { kind: 'CAMBRIDGE' | 'ACTUAL VOL'; num: string; width: number; height: number; radius?: number }) {
  const n = parseInt(num, 10) || 0;
  const hasImage = kind === 'CAMBRIDGE' ? n >= 7 && n <= 21 : n >= 1 && n <= 10;
  if (!hasImage) return <FlatCoverDrawn kind={kind} num={num || 'IELTS'} width={width} height={height} radius={radius} />;
  const src = `/books/covers-2d/${kind === 'CAMBRIDGE' ? 'cam' : 'vol'}-${n}.webp`;
  return <Image source={{ uri: src }} style={{ width, height, borderRadius: radius }} resizeMode="cover" />;
}

/** Màu nền bìa theo số đề: mỗi đề một màu cố định, để nhìn lướt là nhận ra. */
const COVER_PALETTE = [color.ink, '#0F766E', '#6B3FA0', '#9F1239', '#166534', '#334155', color.primaryDark, '#3730A3', '#0E7490', color.ink];

const SKILL_IN_ID = /-(reading|listening)(?=-|$)/;
/** Các bản Reading và Listening của cùng một đề (cùng id, khác kỹ năng). */
/** Số đề trong tên, ví dụ "Cambridge IELTS 19" -> "19", "VOL 10 KEY" -> "10". */
export function numOf(s: string): string {
  const m = s.match(/(\d+)/);
  return m?.[1] ?? '';
}

/**
 * Bìa 2D vẽ bằng code: nền phẳng một màu, số đề lớn và một dải mờ ở đáy. Không dùng
 * ảnh bìa gốc của nhà xuất bản, nên không có bản quyền bìa nào được sao chép.
 */
function FlatCoverDrawn({
  kind,
  num,
  width,
  height,
  radius = 10,
}: {
  kind: 'CAMBRIDGE' | 'ACTUAL VOL';
  num: string;
  width: number;
  height: number;
  radius?: number;
}) {
  const n = parseInt(num, 10) || 0;
  const bg = COVER_PALETTE[n % COVER_PALETTE.length] ?? color.ink;
  const pad = Math.round(width * 0.09);
  const small = Math.max(8, Math.round(width * 0.085));
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: bg, padding: pad, justifyContent: 'space-between', overflow: 'hidden' }}>
      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: small, fontWeight: '800', letterSpacing: 1 }}>
        {kind === 'CAMBRIDGE' ? 'CAMBRIDGE' : 'ACTUAL TESTS'}
      </Text>
      <Text style={{ color: color.surface, fontSize: Math.round(width * 0.4), fontWeight: '900', lineHeight: Math.round(width * 0.44) }}>
        {num || '—'}
      </Text>
      <View style={{ marginHorizontal: -pad, marginBottom: -pad, paddingHorizontal: pad, paddingVertical: Math.round(pad * 0.7), backgroundColor: 'rgba(0,0,0,0.18)' }}>
        <Text style={{ color: color.surface, fontSize: small, fontWeight: '700' }}>IELTS</Text>
      </View>
    </View>
  );
}


export type SkillName = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

/** Màu nhãn kỹ năng, dùng chung cho danh mục và trang chi tiết để hai nơi không lệch nhau. */
export const SECTION_TONE: Record<SkillName, { bg: string; fg: string }> = {
  Listening: { bg: '#EAF2FF', fg: '#1D4ED8' },
  Reading: { bg: color.primarySoft, fg: color.primaryDark },
  Writing: { bg: color.successSoft, fg: color.success },
  Speaking: { bg: color.accentSoft, fg: color.accentDark },
};
