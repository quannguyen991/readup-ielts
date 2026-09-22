import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { Grid } from '@/components/layout/Grid';
import { Icon, type IconName } from '@/components/ui/Icon';
import { color } from '@/theme/tokens';

/**
 * Ngân hàng câu theo kỹ năng — bố cục chung của trang SAT Math và SAT Verbal.
 *
 * Mỗi mảng đề (domain) là một khối; trong khối, mỗi kỹ năng một thẻ: bên trái
 * là tên và quy mô kho, bên phải là "mình đang ở đâu" (vòng độ chính xác, số
 * câu đúng/sai, đã làm bao nhiêu) và một nút Luyện. Người học quét cả trang là
 * thấy ngay chỗ trống: thẻ nào còn 0% là chỗ chưa đụng tới.
 */

const GREEN = '#16A34A';
const RED = '#DC2626';

export type BankInfo = {
  eyebrow: string;
  title: string;
  blurb: string;
  done: number;
  total: number;
  icon: IconName;
  href?: string;
};

/**
 * Hai thẻ ngân hàng ở đầu trang: thẻ của trang đang mở (lớn, viền xanh) và thẻ
 * của môn còn lại (nhỏ, bấm để sang). Đi giữa Math và Verbal là một cú bấm.
 */
export function BankHeader({ current, other }: { current: BankInfo; other: BankInfo }) {
  return (
    <View className="flex-row flex-wrap items-stretch gap-4">
      <BankCard info={current} big />
      <BankCard info={other} />
    </View>
  );
}

function BankCard({ info, big = false }: { info: BankInfo; big?: boolean }) {
  const pct = info.total > 0 ? Math.min(1, info.done / info.total) : 0;
  const body = (
    <View
      className={`overflow-hidden rounded-card bg-surface ${big ? 'border-2 border-primary-500 p-7' : 'border border-border p-5'}`}
      style={{ flexGrow: big ? 1.4 : 1, flexShrink: 1, flexBasis: big ? 480 : 340, minWidth: 0 }}
    >
      <View pointerEvents="none" className="absolute" style={{ right: -24, top: -18, opacity: 0.07, transform: [{ rotate: '-18deg' }] }}>
        <Icon name={info.icon} size={big ? 190 : 150} color={color.primary} strokeWidth={1.2} />
      </View>
      <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{info.eyebrow}</Text>
      <Text className={`mt-1.5 font-heavy text-ink ${big ? 'text-pageTitle' : 'text-sectionTitle'}`}>{info.title}</Text>
      <Text className="mt-1.5 max-w-[420px] font-sans text-body text-muted">{info.blurb}</Text>
      <View className="mt-4 flex-row items-baseline gap-1.5">
        <Text className={`font-heavy text-primary-600 ${big ? 'text-stat' : 'text-sectionTitle'}`}>{info.done.toLocaleString('vi-VN')}</Text>
        <Text className="font-semi text-body text-muted">/{info.total.toLocaleString('vi-VN')} câu</Text>
      </View>
      <View className="mt-2 h-2 max-w-[420px] overflow-hidden rounded-pill bg-surfaceAlt">
        <View className="h-2 rounded-pill bg-primary-500" style={{ width: `${Math.round(pct * 100)}%` }} />
      </View>
    </View>
  );
  if (!info.href) return body;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Sang ${info.title}`} onPress={() => router.push(info.href as never)} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 340, minWidth: 0 }}>
      {body}
    </Pressable>
  );
}

/** Một mảng đề: tiêu đề, tỉ trọng trong đề thật, tổng đã làm, và lưới thẻ kỹ năng. Thu gọn được. */
export function DomainSection({
  title,
  subtitle,
  done,
  total,
  children,
}: {
  title: string;
  subtitle: string;
  done: number;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View className="mt-6 rounded-card border border-border bg-surface p-5 lg:p-6">
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? `Thu gọn ${title}` : `Mở ${title}`}
          onPress={() => setOpen((v) => !v)}
          className="h-10 w-10 items-center justify-center rounded-panel bg-surfaceAlt"
        >
          <Text className="font-heavy text-sectionTitle text-muted">{open ? '–' : '+'}</Text>
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-sectionTitle text-ink">{title}</Text>
          <Text className="mt-0.5 font-sans text-body text-muted">{subtitle}</Text>
        </View>
        <View className="rounded-pill bg-primary-600 px-4 py-1.5">
          <Text className="font-strong text-body text-white">
            {done}/{total}
          </Text>
        </View>
      </View>
      {open ? (
        <View className="mt-5">
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
            {children}
          </Grid>
        </View>
      ) : null}
    </View>
  );
}

export type SkillCardProps = {
  title: string;
  subtitle: string;
  /** Số câu trong kho của kỹ năng này. */
  bank: number;
  answered: number;
  correct: number;
  wrong: number;
  /** null = chưa làm câu nào. */
  accuracy: number | null;
  totalMs: number;
  href: string;
  icon: IconName;
};

export function SkillCard(p: SkillCardProps) {
  return (
    <View className="flex-row overflow-hidden rounded-card border border-border bg-surface" style={{ minHeight: 210 }}>
      <View className="min-w-0 flex-1 justify-between p-5">
        <View pointerEvents="none" className="absolute" style={{ right: -30, bottom: -26, opacity: 0.06, transform: [{ rotate: '-18deg' }] }}>
          <Icon name={p.icon} size={150} color={color.primary} strokeWidth={1.2} />
        </View>
        <View>
          <Text className="font-strong text-cardTitle text-ink">{p.title}</Text>
          <Text className="mt-1 font-sans text-label text-muted">{p.subtitle}</Text>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-semi text-body text-muted">{p.bank} câu</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="clock" size={15} color={color.muted} />
            <Text className="font-semi text-body text-muted">{formatDuration(p.totalMs)}</Text>
          </View>
        </View>
      </View>

      <View className="w-[150px] items-center justify-between border-l border-border px-3 py-4">
        <Ring accuracy={p.accuracy} />
        <View className="flex-row items-center gap-3">
          <Count value={p.correct} tone={GREEN} mark="✓" label="câu đúng" />
          <Count value={p.wrong} tone={RED} mark="✕" label="câu sai" />
        </View>
        <View className="h-px w-full bg-border" />
        <Text className="font-semi text-body text-muted">
          <Text className="font-strong text-primary-600">{p.answered}</Text>/{p.bank}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Luyện ${p.title}`}
          onPress={() => router.push(p.href as never)}
          className="w-full flex-row items-center justify-center gap-1.5 rounded-panel bg-primary-600 py-2.5"
          style={{ borderBottomWidth: 3, borderBottomColor: '#1D4ED8' }}
        >
          <Icon name="play" size={14} color="#FFFFFF" strokeWidth={2.2} />
          <Text className="font-heavy text-[14px] uppercase tracking-[0.6px] text-white">Luyện</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Count({ value, tone, mark, label }: { value: number; tone: string; mark: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-row items-center gap-1">
      <View className="h-5 w-5 items-center justify-center rounded-pill" style={{ backgroundColor: tone }}>
        <Text className="font-heavy text-[11px] text-white">{mark}</Text>
      </View>
      <Text className="font-strong text-body" style={{ color: tone }}>{value}</Text>
    </View>
  );
}

/** Vòng độ chính xác. Chưa làm câu nào thì hiện "—", không phải "0%": chưa làm khác làm sai hết. */
function Ring({ accuracy }: { accuracy: number | null }) {
  const size = 68;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = accuracy ?? 0;
  const tone = accuracy === null ? color.muted : pct >= 0.8 ? GREEN : pct >= 0.5 ? '#D97706' : RED;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E9EDF5" strokeWidth={stroke} fill="none" />
        {accuracy !== null && pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={tone}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * pct} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <Text className="font-heavy text-body" style={{ color: tone }}>
        {accuracy === null ? '—' : `${Math.round(pct * 100)}%`}
      </Text>
    </View>
  );
}

/** 0 → "0s", 45 000 → "45s", 200 000 → "3m 20s", 3 900 000 → "1h 5m". */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
