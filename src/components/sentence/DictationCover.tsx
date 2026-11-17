import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { LessonTone } from '@/components/sentence/LessonCard';

/**
 * BÌA CỦA THẺ BÀI (chép chính tả, dịch câu): gradient đậm theo TRÌNH ĐỘ, lớp chấm bi
 * + vòng tròn mờ (đổi vị trí theo số bài để mỗi bài một vẻ), và một "con tem" chủ đề.
 * Bài nghe có sóng âm trắng vẽ từ độ dài các câu; bài dịch có hai bong bóng Việt–Anh
 * lấy từ chính câu đầu của bài.
 */

type Props = {
  tone: LessonTone;
  topic: string;
  sentences: readonly string[];
};

export type Motif = 'tech' | 'globe' | 'bowl' | 'leaf' | 'book' | 'note';

const BADGE = 76;
const COVER_H = 112;

/** Chọn biểu tượng theo từ khoá trong tên chủ đề (chữ thường, có dấu). */
export function motifOf(topic: string): Motif {
  const t = topic.toLowerCase();
  if (/công nghệ|khoa học|\bai\b|tech|điện thoại|mạng|dữ liệu|thiết kế|khởi nghiệp/.test(t)) return 'tech';
  if (/du lịch|bản đồ|di cư|travel|sân bay|khách sạn|giao thông|chỉ đường|khảo cổ|vũ trụ/.test(t)) return 'globe';
  if (/ẩm thực|food|nấu|mua sắm|chợ|nhà hàng|cà phê|siêu thị/.test(t)) return 'bowl';
  if (/môi trường|đại dương|khí hậu|năng lượng|nature|climate|thiên nhiên|thời tiết|làm vườn|nông|thú cưng|công viên/.test(t)) return 'leaf';
  if (/giáo dục|báo chí|bảo tàng|lịch sử|education|news|học|thư viện|sách|nghệ thuật/.test(t)) return 'book';
  return 'note';
}

/** Biểu tượng trong huy hiệu, vẽ quanh gốc (0,0), trong khung khoảng 44. */
export function MotifGlyph({ motif, ink }: { motif: Motif; ink: string }) {
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

/** Cặp màu gradient theo trình độ — đậm, rực, cùng họ với thẻ lộ trình bên trên. */
const LEVEL_GRADIENT: Record<string, [string, string]> = {
  A2: ['#10B981', '#06B6D4'],
  B1: ['#0EA5E9', '#6366F1'],
  B2: ['#6366F1', '#A855F7'],
  C1: ['#F43F5E', '#F97316'],
  easy: ['#10B981', '#06B6D4'],
  medium: ['#0EA5E9', '#6366F1'],
  hard: ['#F43F5E', '#F97316'],
};

function gradientFor(tone: LessonTone, level?: string): [string, string] {
  return LEVEL_GRADIENT[level ?? ''] ?? [tone.mid, tone.ink];
}

/** Lớp hoạ tiết dùng chung: chấm bi + hai vòng tròn mờ, đổi vị trí theo `seed`. */
function Pattern({ seed }: { seed: number }) {
  const dx = (seed * 37) % 60;
  return (
    <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 400 128" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 14 }, (_, c) => (
          <Circle key={`${r}-${c}`} cx={c * 32 + (r % 2) * 16 - 6} cy={r * 24 + 8} r={1.8} fill="#FFFFFF" opacity={0.22} />
        )),
      )}
      <Circle cx={330 - dx} cy={10} r={70} fill="#FFFFFF" opacity={0.1} />
      <Circle cx={40 + dx} cy={140} r={80} fill="#000000" opacity={0.08} />
    </Svg>
  );
}

type CoverProps = Props & { level?: string; seed?: number };

export function DictationCover({ tone, topic, sentences, level, seed = 0 }: CoverProps) {
  const lengths = sentences.length ? sentences.map((s) => s.length) : [40];
  const longest = Math.max(...lengths, 1);
  const N = 22;
  const bars = Array.from({ length: N }, (_, i) => {
    const len = lengths[i % lengths.length] ?? 40;
    const envelope = 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / N);
    const jitter = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + seed));
    return Math.max(5, Math.min(30, (0.45 + 0.55 * (len / longest)) * 30 * envelope * jitter));
  });
  const [c1, c2] = gradientFor(tone, level);
  const motif = motifOf(topic);

  return (
    <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Pattern seed={seed} />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 14, top: (COVER_H - BADGE) / 2, width: BADGE, height: BADGE, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}
      >
        <Svg width={48} height={48} viewBox="-22 -22 44 44">
          <MotifGlyph motif={motif} ink={c1} />
        </Svg>
      </View>
      {/* Thanh phát nhạc: nút play + sóng âm thon dần hai đầu, phần đã "phát" sáng hơn. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: BADGE + 28, right: 14, top: (COVER_H - 46) / 2, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', flexDirection: 'row', alignItems: 'center', paddingLeft: 5, paddingRight: 12, gap: 9 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={16} height={16} viewBox="-8 -8 16 16">
            <Path d="M-3 -6 L6 0 L-3 6 Z" fill={c1} />
          </Svg>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 34 }}>
          {bars.map((h, i) => (
            <View key={i} style={{ width: 3, height: h, borderRadius: 1.5, backgroundColor: '#FFFFFF', opacity: i < 9 ? 1 : 0.5 }} />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Bìa bộ dịch câu: hai bong bóng hội thoại Việt (mờ) – Anh (đặc) lấy từ chính câu đầu của bài. */
export function TranslationCover({ tone, pairs, level, seed = 0 }: { tone: LessonTone; pairs: readonly { vi: string; en: string }[]; level?: string; seed?: number }) {
  const [c1, c2] = gradientFor(tone, level);
  const first = pairs[0];
  return (
    <View style={{ width: '100%', height: '100%', overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 14, gap: 6 }}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Pattern seed={seed} />
      <View style={{ alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 10, paddingVertical: 5 }}>
        <Text numberOfLines={1} className="font-nun-strong" style={{ fontSize: 12.5, color: '#FFFFFF' }}>{first?.vi ?? ''}</Text>
      </View>
      <View style={{ alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: '#FFFFFF', borderRadius: 14, borderBottomRightRadius: 4, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text numberOfLines={2} className="font-nun-heavy" style={{ fontSize: 13, lineHeight: 17, color: c1 }}>{first?.en ?? ''}</Text>
      </View>
    </View>
  );
}
