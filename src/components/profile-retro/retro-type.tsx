/**
 * Kiểu chữ retro dùng chung: chữ có nhiều lớp màu lùi sau (hiệu ứng sọc 70s).
 * Được cả trang hồ sơ và thanh trên dùng, để logo và tiêu đề cùng một nét.
 */
import React from 'react';
import { Text, View } from 'react-native';

import { RFONT } from './retro-art';

/** Chữ lớn có nhiều lớp màu lùi sau. Lớp đầu tiên của `stripes` là xa nhất (thường là viền mực). */
export function EchoWord({
  text,
  size,
  color,
  stripes,
  align = 'center',
}: {
  text: string;
  size: number;
  color: string;
  stripes: string[];
  /** Căn khối chữ trong hàng hoặc cột cha. */
  align?: 'center' | 'flex-start';
}) {
  // Chữ nhỏ (logo thanh trên) lùi mỗi lớp 1px; chữ lớn lùi theo tỉ lệ cỡ chữ.
  const step = size < 60 ? 1 : Math.round(size * 0.03);
  const base = { fontFamily: RFONT.display, fontSize: size, lineHeight: Math.round(size * 1.1) };
  return (
    <View style={{ alignSelf: align, flexShrink: 0 }}>
      {stripes.map((c, i) => {
        const n = stripes.length - i;
        return (
          <Text key={i} aria-hidden style={[base, { position: 'absolute', top: n * step, left: n * step, right: -n * step, color: c }]}>
            {text}
          </Text>
        );
      })}
      <Text style={[base, { color }]}>{text}</Text>
    </View>
  );
}
