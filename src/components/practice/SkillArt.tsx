import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { IeltsSkill } from '@/navigation/ielts-focus';

/**
 * Minh hoạ phẳng cho từng kỹ năng IELTS: nét bo tròn, hai tông (một tông đậm, một tông nhạt),
 * nền để trong suốt để đặt lên thẻ pastel. Vẽ bằng hình học đơn giản, không dùng ảnh bitmap.
 */
export function SkillArt({ skill, size = 84, ink = '#0F1D33', accent = '#F0644F', soft = '#FFFFFF' }: { skill: IeltsSkill; size?: number; ink?: string; accent?: string; soft?: string }) {
  const common = { width: size, height: size, viewBox: '0 0 96 96' };
  if (skill === 'reading') {
    return (
      <Svg {...common}>
        {/* quyển sách mở */}
        <Path d="M14 30 Q30 24 47 32 L47 74 Q30 66 14 72 Z" fill={soft} stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
        <Path d="M82 30 Q66 24 49 32 L49 74 Q66 66 82 72 Z" fill={accent} stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
        <Path d="M20 42 Q28 40 40 44 M20 52 Q28 50 40 54 M56 44 Q68 40 76 42 M56 54 Q68 50 76 52" stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        <Circle cx="78" cy="22" r="4" fill={accent} />
      </Svg>
    );
  }
  if (skill === 'listening') {
    return (
      <Svg {...common}>
        {/* tai nghe */}
        <Path d="M22 56 V46 Q22 18 48 18 Q74 18 74 46 V56" stroke={ink} strokeWidth="5" fill="none" strokeLinecap="round" />
        <Rect x="14" y="52" width="16" height="26" rx="7" fill={accent} stroke={ink} strokeWidth="2.6" />
        <Rect x="66" y="52" width="16" height="26" rx="7" fill={accent} stroke={ink} strokeWidth="2.6" />
        {/* sóng âm */}
        <Path d="M38 74 Q42 66 46 74 T54 74" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.6" />
        <Path d="M32 82 Q40 72 48 82 T64 82" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
      </Svg>
    );
  }
  if (skill === 'writing') {
    return (
      <Svg {...common}>
        {/* tờ giấy */}
        <Rect x="18" y="16" width="50" height="62" rx="8" fill={soft} stroke={ink} strokeWidth="2.6" />
        <Path d="M26 34 H56 M26 44 H60 M26 54 H48" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
        {/* bút */}
        <G transform="rotate(35 70 58)">
          <Rect x="62" y="22" width="16" height="50" rx="5" fill={accent} stroke={ink} strokeWidth="2.6" />
          <Path d="M62 72 L70 84 L78 72 Z" fill={ink} />
          <Rect x="62" y="28" width="16" height="6" fill={ink} opacity="0.85" />
        </G>
      </Svg>
    );
  }
  if (skill === 'speaking') {
    return (
      <Svg {...common}>
        {/* micro */}
        <Rect x="36" y="14" width="24" height="40" rx="12" fill={accent} stroke={ink} strokeWidth="2.6" />
        <Path d="M26 46 Q26 66 48 66 Q70 66 70 46" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M48 66 V78 M38 80 H58" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        {/* sóng nói */}
        <Path d="M14 30 Q10 40 14 50" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5" />
        <Path d="M82 30 Q86 40 82 50" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5" />
      </Svg>
    );
  }
  // khác: lưới ô nhỏ
  return (
    <Svg {...common}>
      <Rect x="16" y="16" width="30" height="30" rx="9" fill={soft} stroke={ink} strokeWidth="2.6" />
      <Rect x="50" y="16" width="30" height="30" rx="9" fill={accent} stroke={ink} strokeWidth="2.6" />
      <Rect x="16" y="50" width="30" height="30" rx="9" fill={accent} stroke={ink} strokeWidth="2.6" opacity="0.6" />
      <Rect x="50" y="50" width="30" height="30" rx="9" fill={soft} stroke={ink} strokeWidth="2.6" />
    </Svg>
  );
}
