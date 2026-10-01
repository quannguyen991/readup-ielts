import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { useL } from '@/i18n/useL';

/**
 * THẺ BÀI của hai thư viện luyện câu (chép chính tả, dịch câu).
 *
 * Mỗi thẻ mang một "DẤU VÂN" vẽ từ chính nội dung bài chứ không phải hoa văn
 * trang trí: bài nghe có dải sóng âm (mỗi cột một từ, cao theo độ dài từ, hết
 * câu thì có quãng lặng), bài dịch có từng cặp vạch Việt–Anh dài theo đúng độ
 * dài câu. Hai bài cạnh nhau vì thế khác nhau thật, và nhìn dấu vân là đoán được
 * bài dài hay ngắn, câu nhiều hay ít.
 *
 * Màu theo TRÌNH ĐỘ (A2 xanh lá → C1 hồng), không xoay vòng theo số thứ tự: màu
 * mang thông tin, người học lướt qua là biết chỗ nào hợp sức mình.
 */
export type LessonTone = { ink: string; mid: string; soft: string };

const GREEN: LessonTone = { ink: '#15803D', mid: '#22C55E', soft: '#DCFCE7' };
const SKY: LessonTone = { ink: '#0F766E', mid: '#0D9488', soft: '#E6F6F4' };
const VIOLET: LessonTone = { ink: '#0F1D33', mid: '#24375A', soft: '#EEF1F6' };
const ROSE: LessonTone = { ink: '#BE123C', mid: '#F43F5E', soft: '#FFE4E6' };

export const LEVEL_TONE: Record<string, LessonTone> = {
  A2: GREEN,
  B1: SKY,
  B2: VIOLET,
  C1: ROSE,
  easy: GREEN,
  medium: SKY,
  hard: ROSE,
};

const WAVE_ID = 'readup-lesson-wave';

/** Keyframes cho sóng âm nhảy khi rê chuột — nhồi vào trang một lần. */
function ensureWaveKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(WAVE_ID)) return;
  const el = document.createElement('style');
  el.id = WAVE_ID;
  el.textContent = `@keyframes readup-wave { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.45); } 100% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { [data-wave-bar] { animation: none !important; } }`;
  document.head.appendChild(el);
}

export function LessonCard({
  number,
  level,
  levelLabel,
  icon,
  title,
  blurb,
  meta,
  done,
  visual,
  onPress,
  eyebrow,
  secondary,
}: {
  number: number;
  level: string;
  levelLabel: string;
  icon: IconName;
  title: string;
  blurb: string;
  meta: { icon: IconName; label: string }[];
  /** Số lần đã luyện bài này (0 = chưa). */
  done: number;
  visual: (tone: LessonTone, active: boolean) => React.ReactNode;
  onPress: () => void;
  /** Nhãn nhỏ phía trên, mặc định "BÀI 01". */
  eyebrow?: string;
  /** Lối phụ ở góc dưới phải (ví dụ "Luyện từng phần"). */
  secondary?: { label: string; onPress: () => void };
}) {
  const tone = LEVEL_TONE[level] ?? SKY;
  const [hover, setHover] = useState(false);
  const { L } = useL();
  const lift =
    Platform.OS === 'web'
      ? ({
          boxShadow: hover
            ? `0 2px 4px rgba(15,23,42,0.06), 0 18px 36px ${tone.mid}33`
            : '0 1px 2px rgba(15,23,42,0.05), 0 8px 22px rgba(94, 72, 35,0.07)',
          transform: hover ? 'translateY(-3px)' : 'none',
          transition: 'box-shadow 200ms ease, transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 200ms ease',
        } as object)
      : { elevation: 2 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow ?? L(`Bài ${number}`, `Lesson ${number}`)}: ${title}`}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      className="h-full rounded-[20px] bg-white p-4"
      style={[{ borderWidth: 1, borderColor: hover ? tone.mid : '#F2EEE6' }, lift]}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: tone.mid }}>
          <Icon name={icon} size={17} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-semi text-label text-muted" style={{ letterSpacing: 0.6, fontVariant: ['tabular-nums'] }}>
            {eyebrow ?? L(`BÀI ${String(number).padStart(2, '0')}`, `LESSON ${String(number).padStart(2, '0')}`)}
          </Text>
          <Text className="font-heavy text-label" style={{ color: tone.ink }}>
            {levelLabel}
          </Text>
        </View>
        {done > 0 ? (
          <View className="flex-row items-center gap-1 rounded-pill px-2 py-1" style={{ backgroundColor: '#ECFDF3' }}>
            <Icon name="check" size={12} color="#16A34A" strokeWidth={2.6} />
            <Text className="font-strong text-label" style={{ color: '#15803D' }}>
              {done}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3.5 justify-center overflow-hidden rounded-xl px-3" style={{ height: 52, backgroundColor: tone.soft }}>
        {visual(tone, hover)}
      </View>

      <Text className="mt-3.5 font-heavy text-ink" style={{ fontSize: 17, lineHeight: 22 }} numberOfLines={2}>
        {title}
      </Text>
      <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 18 }} numberOfLines={2}>
        {blurb}
      </Text>
      <View className="flex-1" />
      <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        {meta.map((m) => (
          <View key={m.label} className="flex-row items-center gap-1">
            <Icon name={m.icon} size={12} color="#94A3B8" />
            <Text className="font-mid text-label text-muted">{m.label}</Text>
          </View>
        ))}
        {secondary ? (
          <Pressable
            accessibilityRole="button"
            onPress={(e) => {
              // Không để cú bấm lan lên thẻ, kẻo mở luôn lối chính.
              (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
              secondary.onPress();
            }}
            className="ml-auto flex-row items-center gap-1 rounded-pill px-2.5 py-1"
            style={{ backgroundColor: tone.soft }}
          >
            <Text className="font-strong text-label" style={{ color: tone.ink }}>
              {secondary.label}
            </Text>
            <Icon name="arrow-right" size={12} color={tone.ink} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Chiều cao cột sóng (0–1) từ các câu: mỗi từ một cột, hết câu một quãng lặng. */
export function waveBars(sentences: readonly string[], count = 34): number[] {
  const out: number[] = [];
  for (const s of sentences) {
    const words = s.split(/\s+/).filter(Boolean);
    words.forEach((w, i) => {
      const letters = w.replace(/[^\p{L}\p{N}]/gu, '').length;
      // Từ đầu câu nói mạnh hơn một chút, cuối câu hạ giọng.
      const stress = i === 0 ? 1.08 : i === words.length - 1 ? 0.86 : 1;
      out.push(Math.min(1, (0.26 + Math.min(1, letters / 9) * 0.74) * stress));
    });
    out.push(0.08, 0.08);
    if (out.length >= count) break;
  }
  return out.slice(0, count);
}

/** Dải sóng âm của một bài nghe. `active`: thẻ đang được rê chuột → sóng nhảy như đang phát. */
export function Waveform({ sentences, tone, active }: { sentences: readonly string[]; tone: LessonTone; active: boolean }) {
  useEffect(ensureWaveKeyframes, []);
  const bars = waveBars(sentences);
  return (
    <View className="flex-row items-center justify-between" style={{ height: 36 }}>
      {bars.map((h, i) => (
        <View
          key={i}
          {...({ dataSet: { waveBar: '1' } } as object)}
          style={{
            width: 3,
            height: Math.max(3, h * 36),
            borderRadius: 2,
            backgroundColor: tone.mid,
            opacity: h < 0.1 ? 0.35 : 0.55 + h * 0.45,
            ...(Platform.OS === 'web' && active
              ? ({
                  animationName: 'readup-wave',
                  animationDuration: `${0.7 + (i % 5) * 0.11}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${(i % 7) * 0.06}s`,
                } as object)
              : null),
          }}
        />
      ))}
    </View>
  );
}

/** Từng cặp vạch Việt (xám) — Anh (màu), dài theo độ dài câu thật. */
export function BilingualLines({ pairs, tone, active }: { pairs: readonly { vi: string; en: string }[]; tone: LessonTone; active: boolean }) {
  const shown = pairs.slice(0, 3);
  const longest = Math.max(1, ...shown.flatMap((p) => [p.vi.length, p.en.length]));
  return (
    <View style={{ gap: 5 }}>
      {shown.map((p, i) => (
        <View key={i} style={{ gap: 2 }}>
          <View style={{ height: 4, borderRadius: 2, width: `${(p.vi.length / longest) * 100}%`, backgroundColor: '#94A3B8', opacity: 0.55 }} />
          <View
            style={{
              height: 4,
              borderRadius: 2,
              width: `${(p.en.length / longest) * 100}%`,
              backgroundColor: tone.mid,
              // Rê chuột: vạch tiếng Anh "dịch" nốt cho đủ câu — co giãn bằng transform, không đụng bố cục.
              transform: [{ scaleX: active ? 1 : 0.86 }],
              transformOrigin: 'left',
              ...(Platform.OS === 'web' ? ({ transition: `transform ${260 + i * 80}ms cubic-bezier(0.2, 0.8, 0.2, 1)` } as object) : null),
            }}
          />
        </View>
      ))}
    </View>
  );
}
