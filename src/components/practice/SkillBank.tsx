import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
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
 * câu đúng/sai, đã làm bao nhiêu) và nút Luyện. Quét cả trang là thấy chỗ
 * trống: thẻ nào còn "—" là chỗ chưa đụng tới.
 *
 * TIẾT CHẾ: không hình nền mờ, không chữ in hoa đậm, không nút nổi 3D. Bản đầu
 * có đủ ba thứ đó và trông thô — thẻ dày đặc chi tiết trang trí trong khi thứ
 * người học cần đọc chỉ là một con số và một nút bấm. Màu chỉ dùng cho số liệu
 * (xanh lá đúng, đỏ sai, xanh dương tiến độ).
 */

const GREEN = '#16A34A';
const RED = '#E11D48';
const LINE = '#E6EAF2';
const SOFT = '#F7F9FC';
/** Chữ phụ đặt trên nền xanh của app (ngoài thẻ trắng). */
const ON_CANVAS = '#1E293B';

const cardShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)' } as object)
    : { elevation: 2 };

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
 * Hai thẻ ngân hàng ở đầu trang: thẻ của trang đang mở (viền xanh) và thẻ của
 * môn còn lại (viền xám, có mũi tên, bấm để sang). Cùng chiều cao.
 */
export function BankHeader({ current, other }: { current: BankInfo; other: BankInfo }) {
  return (
    <View className="flex-row flex-wrap items-stretch gap-4">
      <View style={{ flexGrow: 3, flexShrink: 1, flexBasis: 420, minWidth: 0 }}>
        <BankCard info={current} active />
      </View>
      <View style={{ flexGrow: 2, flexShrink: 1, flexBasis: 300, minWidth: 0 }}>
        <BankCard info={other} />
      </View>
    </View>
  );
}

function BankCard({ info, active = false }: { info: BankInfo; active?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const pct = info.total > 0 ? Math.min(1, info.done / info.total) : 0;

  const body = (
    <View
      className="h-full rounded-[20px] bg-surface px-6 py-5"
      style={[
        cardShadow,
        {
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? '#93B4F5' : hovered ? '#CBD5E1' : LINE,
        },
      ]}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2.5">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: active ? '#EAF1FF' : SOFT }}
          >
            <Icon name={info.icon} size={18} color={active ? color.primary : color.muted} strokeWidth={2} />
          </View>
          <Text className="font-semi text-label text-muted">{info.eyebrow}</Text>
        </View>
        {info.href ? <Icon name="arrow-right" size={18} color={hovered ? color.primary : color.muted} /> : null}
      </View>

      <Text className="mt-3 font-strong text-[22px] leading-7 text-ink">{info.title}</Text>
      <Text className="mt-1 font-sans text-body text-muted" numberOfLines={2}>
        {info.blurb}
      </Text>

      <View className="mt-5 flex-row items-baseline justify-between">
        <Text className="font-sans text-body text-muted">
          <Text className="font-strong text-ink">{info.done.toLocaleString('vi-VN')}</Text> /{' '}
          {info.total.toLocaleString('vi-VN')} câu
        </Text>
        <Text className="font-semi text-label text-muted">{Math.round(pct * 100)}%</Text>
      </View>
      <View className="mt-2 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#EEF2F7' }}>
        <View className="h-1.5 rounded-pill bg-primary-500" style={{ width: `${Math.max(pct * 100, pct > 0 ? 2 : 0)}%` }} />
      </View>
    </View>
  );

  if (!info.href) return body;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Sang ${info.title}`}
      onPress={() => router.push(info.href as never)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className="h-full"
    >
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
    <View className="mt-8">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? `Thu gọn ${title}` : `Mở ${title}`}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-3"
      >
        <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
          <Icon name="chevron-down" size={20} color={color.muted} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-[21px] leading-7 text-ink">{title}</Text>
          {/* Chữ ở đây nằm TRỰC TIẾP trên nền xanh của app, không trong thẻ
              trắng: `text-muted` trên nền ấy chỉ còn tỉ lệ tương phản 2,1. */}
          <Text className="font-sans text-body" style={{ color: ON_CANVAS }}>
            {subtitle}
          </Text>
        </View>
        <Text className="font-sans text-body" style={{ color: ON_CANVAS }}>
          <Text className="font-strong text-ink">{done}</Text> / {total}
        </Text>
      </Pressable>
      {open ? (
        <View className="mt-4">
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
  /** Giữ để hai trang gọi như cũ; thẻ không còn vẽ biểu tượng nền. */
  icon?: IconName;
};

/** Cả thẻ bấm được — không bắt người học ngắm trúng một nút nhỏ ở góc. */
export function SkillCard(p: SkillCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Luyện ${p.title}`}
      onPress={() => router.push(p.href as never)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className="h-full flex-row overflow-hidden rounded-[18px] bg-surface"
      style={[cardShadow, { borderWidth: 1, borderColor: hovered ? '#C9D6EE' : LINE, minHeight: 188 }]}
    >
      <View className="min-w-0 flex-1 justify-between p-5">
        <View>
          <Text className="font-semi text-[17px] leading-6 text-ink">{p.title}</Text>
          <Text className="mt-1 font-sans text-[14px] leading-5 text-muted">{p.subtitle}</Text>
        </View>
        <View className="mt-4 flex-row items-center gap-4">
          <Text className="font-sans text-[14px] text-muted">{p.bank} câu</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="clock" size={14} color={color.subtle} />
            <Text className="font-sans text-[14px] text-muted">{formatDuration(p.totalMs)}</Text>
          </View>
        </View>
      </View>

      <View
        className="w-[132px] items-center justify-between px-3 py-4"
        style={{ backgroundColor: SOFT, borderLeftWidth: 1, borderLeftColor: LINE }}
      >
        <Ring accuracy={p.accuracy} />
        <View className="flex-row items-center gap-3">
          <Count value={p.correct} tone={GREEN} label="câu đúng" />
          <Count value={p.wrong} tone={RED} label="câu sai" />
        </View>
        <Text className="font-sans text-[13px] text-muted">
          <Text className="font-semi text-ink">{p.answered}</Text> / {p.bank}
        </Text>
        <View className="w-full items-center rounded-xl py-2" style={{ backgroundColor: hovered ? '#1D4ED8' : color.primary }}>
          <Text className="font-semi text-[14px] text-white">Luyện</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Count({ value, tone, label }: { value: number; tone: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-pill" style={{ backgroundColor: tone }} />
      <Text className="font-semi text-[14px] text-ink">{value}</Text>
    </View>
  );
}

/** Vòng độ chính xác. Chưa làm câu nào thì hiện "—", không phải "0%": chưa làm khác làm sai hết. */
function Ring({ accuracy }: { accuracy: number | null }) {
  const size = 58;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = accuracy ?? 0;
  const tone = accuracy === null ? color.muted : pct >= 0.8 ? GREEN : pct >= 0.5 ? '#D97706' : RED;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E6EAF2" strokeWidth={stroke} fill="none" />
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
      <Text className="font-semi text-[14px]" style={{ color: accuracy === null ? color.subtle : tone }}>
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
