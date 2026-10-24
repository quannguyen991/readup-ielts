import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { LessonTone } from '@/components/sentence/LessonCard';

/**
 * BÌA CỦA BỘ CHÉP CHÍNH TẢ: dải sóng âm vẽ từ độ dài các câu của bài, lớp sóng nền,
 * và một huy hiệu tròn mang biểu tượng của chủ đề (công nghệ, du lịch, ẩm thực,
 * môi trường, giáo dục; mặc định là nốt nhạc). Màu lấy theo trình độ.
 *
 * Bố cục bằng flex (không đo chiều rộng): sóng âm trải đều theo chiều ngang của thẻ,
 * huy hiệu neo bên phải, nên đúng cả trên điện thoại lẫn máy tính.
 */

type Props = {
  tone: LessonTone;
  topic: string;
  sentences: readonly string[];
};

type Motif = 'tech' | 'globe' | 'bowl' | 'leaf' | 'book' | 'note';

const BAR_COUNT = 40;
const BADGE = 80;
const COVER_H = 112;

/** Chọn biểu tượng theo từ khoá trong tên chủ đề (chữ thường, có dấu). */
function motifOf(topic: string): Motif {
  const t = topic.toLowerCase();
  if (/công nghệ|khoa học|ai|tech/.test(t)) return 'tech';
  if (/du lịch|bản đồ|di cư|travel/.test(t)) return 'globe';
  if (/ẩm thực|food|nấu/.test(t)) return 'bowl';
  if (/môi trường|đại dương|khí hậu|năng lượng|nature|climate/.test(t)) return 'leaf';
  if (/giáo dục|báo chí|bảo tàng|lịch sử|education|news/.test(t)) return 'book';
  return 'note';
}

/** Biểu tượng trong huy hiệu, vẽ quanh gốc (0,0), trong khung khoảng 44. */
function MotifGlyph({ motif, ink }: { motif: Motif; ink: string }) {
  switch (motif) {
    case 'tech':
      return (
        <G stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round">
          <Path d="M-14 -8 H-4 V-2 H6 M-14 6 H-2 V0 H10 M-6 -14 V-8 M8 6 V14" />
          <Rect x={-18} y={-12} width={6} height={6} rx={1} fill={ink} stroke="none" />
          <Rect x={8} y={-4} width={6} height={6} rx={1} fill={ink} stroke="none" />
          <Circle cx={-4} cy={14} r={2.4} fill={ink} stroke="none" />
        </G>
      );
    case 'globe':
      return (
        <G stroke={ink} strokeWidth={2} fill="none">
          <Circle cx={0} cy={0} r={13} />
          <Path d="M-13 0 H13 M0 -13 Q7 0 0 13 Q-7 0 0 -13" />
        </G>
      );
    case 'bowl':
      return (
        <G stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round">
          <Path d="M-15 -2 H15 A15 14 0 0 1 -15 -2 Z" fill={ink} />
          <Path d="M-6 -10 Q-9 -16 -5 -20 M3 -10 Q0 -16 4 -20" />
        </G>
      );
    case 'leaf':
      return (
        <G stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round">
          <Path d="M-12 12 Q-14 -10 12 -13 Q14 10 -12 12 Z" fill={ink} />
          <Path d="M-12 12 L6 -4" />
        </G>
      );
    case 'book':
      return (
        <G stroke={ink} strokeWidth={2} fill="none" strokeLinejoin="round">
          <Path d="M-15 -10 Q-6 -14 0 -8 Q6 -14 15 -10 V12 Q6 8 0 13 Q-6 8 -15 12 Z" />
          <Path d="M0 -8 V13" />
        </G>
      );
    default:
      return (
        <G fill={ink}>
          <Circle cx={-5} cy={9} r={6} />
          <Rect x={-0.5} y={-13} width={2.6} height={22} />
          <Path d="M2 -13 Q12 -8 9 1 Q7 -4 2 -2 Z" />
        </G>
      );
  }
}

export function DictationCover({ tone, topic, sentences }: Props) {
  // Chiều cao mỗi vạch đổi theo độ dài câu, nên bài dài trông khác bài ngắn.
  const lengths = sentences.length ? sentences.map((s) => s.length) : [40];
  const longest = Math.max(...lengths, 1);
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const len = lengths[i % lengths.length] ?? 40;
    return Math.max(6, (len / longest) * 50) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7)));
  });
  const motif = motifOf(topic);

  return (
    <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <LinearGradient colors={[tone.mid + '4D', tone.soft]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Sóng nền: hai lớp mềm ở đáy, kéo theo chiều ngang của thẻ. */}
      <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 400 112" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Path d="M0 84 C60 66 110 96 170 80 S290 64 400 84 V112 H0 Z" fill={tone.mid} opacity={0.22} />
        <Path d="M0 96 C90 84 150 104 230 92 S340 82 400 96 V112 H0 Z" fill={tone.mid} opacity={0.36} />
      </Svg>
      {/* Sóng âm từ các câu của bài, trải đều và chừa chỗ cho huy hiệu. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 16, right: BADGE + 30, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {bars.map((h, i) => (
          <View key={`b-${i}`} style={{ width: 3.6, height: h, borderRadius: 2, backgroundColor: tone.mid, opacity: 0.9 }} />
        ))}
      </View>
      {/* Huy hiệu chủ đề, neo bên phải. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 14,
          top: (COVER_H - BADGE) / 2,
          width: BADGE,
          height: BADGE,
          borderRadius: BADGE / 2,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderWidth: 1.5,
          borderColor: tone.mid,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={44} height={44} viewBox="-22 -22 44 44">
          <MotifGlyph motif={motif} ink={tone.ink} />
        </Svg>
      </View>
    </View>
  );
}
