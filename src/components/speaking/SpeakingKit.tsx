import React, { useSyncExternalStore } from 'react';
import { Platform, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import type { SpeakingAttempt } from '@/services/speaking/attempts';
import { canRecognize } from '@/services/shadow/speech';

const noSubscribe = () => () => undefined;

/**
 * Trình duyệt có bộ nhận giọng không. null = chưa biết (bản dựng phía máy chủ
 * không có `window`) — màn hình chờ, không đoán bừa là "không hỗ trợ".
 */
export function useMicSupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(noSubscribe, canRecognize, () => null);
}

/** Đồng hồ ms — tách khỏi thân component để bộ kiểm tra thuần khiết không nhầm là gọi lúc render. */
export function nowMs(): number {
  return Date.now();
}

/** Bảng màu phòng luyện nói — xanh app, lá, hổ phách, hồng đỏ; không tím. */
export const SPK = {
  blue: '#4A7FE8',
  blueSoft: '#E8F0FE',
  green: '#16A34A',
  greenSoft: '#DCFCE7',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  rose: '#E11D48',
  roseSoft: '#FFE4E6',
  teal: '#0F766E',
  tealSoft: '#CCFBF1',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  panel: '#F8FAFC',
};

export const SPK_CARD = (Platform.OS === 'web'
  ? { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(30,41,99,0.08)' }
  : { elevation: 2 }) as object;

/** Màu theo band: dưới 5 đỏ, 5–6 hổ phách, 6,5–7 xanh app, từ 7,5 xanh lá. */
export function bandTone(band: number | null | undefined): { fg: string; bg: string } {
  if (band == null) return { fg: SPK.muted, bg: '#F1F5F9' };
  if (band < 5) return { fg: SPK.rose, bg: SPK.roseSoft };
  if (band < 6.5) return { fg: SPK.amber, bg: SPK.amberSoft };
  if (band < 7.5) return { fg: SPK.blue, bg: SPK.blueSoft };
  return { fg: SPK.green, bg: SPK.greenSoft };
}

export function fmtBand(b: number | null | undefined): string {
  return b == null ? '—' : b.toFixed(1).replace('.', ',');
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const MODE_LABEL: Record<SpeakingAttempt['mode'], string> = {
  full: 'Full test',
  p1: 'Part 1',
  p2: 'Part 2',
  p3: 'Part 3',
  q: 'Một câu',
};

/** Ô số liệu nhỏ. `hint` là một dòng giải thích ngắn dưới con số. */
export function MetricTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: SPK.panel, borderWidth: 1, borderColor: SPK.line, flexGrow: 1, flexShrink: 1, flexBasis: 130 }}>
      <Text className="font-semi text-label" style={{ color: SPK.muted }}>
        {label}
      </Text>
      <Text className="mt-1 font-heavy" style={{ fontSize: 24, lineHeight: 30, color: tone ?? SPK.ink }}>
        {value}
      </Text>
      {hint ? (
        <Text className="mt-0.5 font-sans text-label" style={{ color: SPK.muted, lineHeight: 17 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Cột band các lượt gần nhất (cũ → mới). Chỉ lượt NÓI có điểm AI. */
export function BandHistory({ attempts }: { attempts: SpeakingAttempt[] }) {
  const graded = attempts
    .filter((a) => !a.typed && a.grade?.overall != null)
    .slice(0, 10)
    .reverse();
  if (graded.length < 2) return null;
  return (
    <View>
      <View className="flex-row items-end gap-2" style={{ height: 96 }}>
        {graded.map((a) => {
          const b = a.grade!.overall!;
          const tone = bandTone(b);
          return (
            <View key={a.id} className="flex-1 items-center" style={{ maxWidth: 40 }}>
              <Text className="font-strong text-label" style={{ color: tone.fg }}>
                {fmtBand(b)}
              </Text>
              <View className="mt-1 w-full rounded-t-lg" style={{ height: Math.max(8, (b / 9) * 70), backgroundColor: tone.fg, opacity: 0.85 }} />
            </View>
          );
        })}
      </View>
      <Text className="mt-2 font-sans text-label" style={{ color: SPK.muted }}>
        Band tổng {graded.length} lượt nói gần nhất (cũ → mới)
      </Text>
    </View>
  );
}

/** Dải thông báo một dòng: info / cảnh báo / lỗi. */
export function Notice({ tone, children, icon = 'info' }: { tone: 'info' | 'warn' | 'error' | 'ok'; children: React.ReactNode; icon?: React.ComponentProps<typeof Icon>['name'] }) {
  const c =
    tone === 'warn'
      ? { bg: SPK.amberSoft, fg: '#92400E' }
      : tone === 'error'
        ? { bg: SPK.roseSoft, fg: '#9F1239' }
        : tone === 'ok'
          ? { bg: SPK.greenSoft, fg: '#166534' }
          : { bg: SPK.blueSoft, fg: '#1E3A8A' };
  return (
    <View className="flex-row gap-2.5 rounded-2xl p-3.5" style={{ backgroundColor: c.bg }}>
      <View style={{ paddingTop: 1 }}>
        <Icon name={icon} size={18} color={c.fg} />
      </View>
      <Text className="min-w-0 flex-1 font-sans text-body" style={{ color: c.fg, lineHeight: 21 }}>
        {children}
      </Text>
    </View>
  );
}
