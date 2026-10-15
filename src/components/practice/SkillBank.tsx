import { themedHex } from '@/theme/palette-state';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { Grid } from '@/components/layout/Grid';
import { Icon } from '@/components/ui/Icon';
import { DIFFICULTIES, difficultyLabel, type Difficulty } from '@/lib/difficulty';
import { useL } from '@/i18n/useL';

/**
 * Ngân hàng câu theo kỹ năng — bố cục chung của trang SAT Math và SAT Verbal.
 *
 * Bố cục "question bank" (người dùng đưa mẫu 01/10/2026, lấy BỐ CỤC, không lấy
 * màu): mỗi mảng đề là MỘT khung trắng thu gọn được (− / +), tiêu đề ghi tỉ
 * trọng chính thức của mảng trong đề thật và một viên "đã làm / tổng" ở bên
 * phải. Trong khung là lưới thẻ kỹ năng, ba thẻ một hàng trên máy tính:
 *
 *   trái  — tên kỹ năng, tỉ trọng trong mảng, "N câu" + "M mới" + thời gian
 *   phải  — vòng % đúng, ✓ đúng / ✗ sai, đã làm / tổng, nút Luyện
 *
 * Mọi con số lấy từ kho và lượt làm thật; chưa có thì hiện "—", không bao giờ
 * hiện 0% thay cho "chưa làm".
 *
 * Màu Band 9: giấy kem, chỉ vàng, mực xanh đêm. Xanh lá / đỏ chỉ dùng cho số
 * đúng / sai.
 */

export const B9 = {
  navy: '#0F1D33',
  gold: '#A8843F',
  goldMid: themedHex('#B8955A'),
  goldDeep: '#8F6E36',
  goldLight: '#E2C88F',
  goldWash: '#FBF3E2',
  paper: '#FFFDF8',
  line: '#E8DCC0',
  hair: '#F0E6D2',
  muted: '#6B6250',
  faint: '#B7AC95',
  canvas: '#F3EDE1',
} as const;

const GREEN = '#16A34A';
const RED = '#E11D48';

const cardShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,29,51,0.04), 0 8px 22px rgba(94,72,35,0.06)' } as object)
    : { elevation: 2 };

/**
 * Điều khiển phân đoạn GÓC VUÔNG, nhỏ và trầm — không dùng hàng viên tròn
 * (người dùng chê "pill chip" 01/10/2026). Đoạn đang chọn tô vàng, còn lại
 * chữ xanh đêm trên nền trắng, ngăn bằng chỉ kem.
 */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  /** Nhãn cho trình đọc màn hình. */
  label: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, borderColor: B9.line, backgroundColor: '#FFFFFF', overflow: 'hidden' }}
    >
      {options.map((o, i) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            aria-checked={on}
            onPress={() => onChange(o.key)}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderColor: B9.line,
              backgroundColor: on ? B9.gold : 'transparent',
            }}
          >
            <Text className={on ? 'font-strong' : 'font-semi'} style={{ fontSize: 13, lineHeight: 17, color: on ? '#FFFFFF' : B9.navy }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bộ lọc độ khó của ngân hàng; nút Luyện của mọi thẻ tôn trọng lựa chọn này. */
export type DifficultyFilterValue = Difficulty | 'all';

export function DifficultyFilter({ value, onChange }: { value: DifficultyFilterValue; onChange: (v: DifficultyFilterValue) => void }) {
  const { L, en } = useL();
  return (
    <Segmented
      label={L('Độ khó', 'Difficulty')}
      value={value}
      onChange={onChange}
      options={[
        { key: 'all' as DifficultyFilterValue, label: L('Mọi mức', 'All levels') },
        ...DIFFICULTIES.map((d) => ({ key: d as DifficultyFilterValue, label: difficultyLabel(d, en) })),
      ]}
    />
  );
}

/** Một mảng đề: khung trắng, thu gọn được, tiêu đề + tỉ trọng + viên "đã làm / tổng". */
export function DomainSection({
  title,
  subtitle,
  done,
  total,
  children,
}: {
  title: string;
  /** Tỉ trọng của mảng, ví dụ "35% Math". */
  subtitle: string;
  done: number;
  total: number;
  children: React.ReactNode;
}) {
  const { L } = useL();
  const [open, setOpen] = useState(true);
  return (
    <View className="mt-4 overflow-hidden" style={[{ borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: B9.hair }, cardShadow]}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        accessibilityLabel={open ? L(`Thu gọn ${title}`, `Collapse ${title}`) : L(`Mở ${title}`, `Expand ${title}`)}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-3"
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <View
          aria-hidden
          style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: B9.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="font-heavy" style={{ fontSize: 15, lineHeight: 17, color: B9.navy }}>
            {open ? '−' : '+'}
          </Text>
        </View>
        <Text className="min-w-0 flex-1" style={{ fontSize: 17, lineHeight: 23 }}>
          <Text className="font-heavy" style={{ color: B9.navy }}>
            {title}
          </Text>
          <Text className="font-sans" style={{ color: B9.muted, fontSize: 14 }}>
            {'  ·  '}
            {subtitle}
          </Text>
        </Text>
        <View style={{ borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: B9.paper, borderWidth: 1, borderColor: B9.line }}>
          <Text className="font-semi" style={{ fontSize: 13, color: B9.navy }}>
            <Text className="font-heavy">{done}</Text>/{total}
          </Text>
        </View>
      </Pressable>
      {open ? (
        <View style={{ borderTopWidth: 1, borderColor: B9.hair, padding: 14, backgroundColor: B9.paper }}>
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
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
  /** Tỉ trọng của kỹ năng trong mảng, ví dụ "20% Algebra". null = không hiện. */
  share: string | null;
  /** Số câu trong kho của kỹ năng này. */
  bank: number;
  answered: number;
  correct: number;
  wrong: number;
  /** null = chưa làm câu nào. */
  accuracy: number | null;
  /** Tổng thời gian đã làm, ms. 0 khi chưa có lượt nào — thẻ hiện "—". */
  totalMs: number;
  /** Đích của nút Luyện (đã tính theo bộ lọc độ khó). */
  href: string;
};

/** Cả thẻ bấm được — không bắt người học ngắm trúng một nút nhỏ ở góc. */
export function SkillCard(p: SkillCardProps) {
  const { L } = useL();
  const [hovered, setHovered] = useState(false);
  const fresh = Math.max(0, p.bank - p.answered);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Luyện ${p.title}`, `Practise ${p.title}`)}
      onPress={() => router.push(p.href as never)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className="h-full flex-row overflow-hidden"
      style={{ borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: hovered ? B9.goldLight : B9.hair, minHeight: 176 }}
    >
      <View className="min-w-0 flex-1 justify-between" style={{ padding: 16 }}>
        <View>
          <Text className="font-strong" style={{ fontSize: 16, lineHeight: 22, color: B9.navy }}>
            {p.title}
          </Text>
          {p.subtitle ? (
            <Text className="mt-0.5 font-sans" style={{ fontSize: 13, lineHeight: 18, color: B9.muted }}>
              {p.subtitle}
            </Text>
          ) : null}
          {p.share ? (
            <Text className="mt-1.5 font-semi" style={{ fontSize: 13, color: B9.goldDeep }}>
              {p.share}
            </Text>
          ) : null}
        </View>
        <View className="mt-3 flex-row flex-wrap items-center" style={{ columnGap: 10, rowGap: 4 }}>
          <Text className="font-sans" style={{ fontSize: 13, color: B9.muted }}>
            {L(`${p.bank} câu`, `${p.bank} Qs`)}
          </Text>
          {fresh > 0 ? (
            <View style={{ borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, backgroundColor: B9.goldWash, borderWidth: 1, borderColor: B9.goldLight }}>
              <Text className="font-semi" style={{ fontSize: 12, color: B9.goldDeep }}>
                {L(`${fresh} mới`, `${fresh} new`)}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-1">
            <Icon name="clock" size={13} color={B9.faint} />
            <Text className="font-sans" style={{ fontSize: 13, color: B9.muted }}>
              {p.totalMs > 0 ? formatDuration(p.totalMs) : '—'}
            </Text>
          </View>
        </View>
      </View>

      <View
        className="items-center justify-between"
        style={{ width: 118, paddingHorizontal: 10, paddingVertical: 12, backgroundColor: B9.paper, borderLeftWidth: 1, borderLeftColor: B9.hair }}
      >
        <Ring accuracy={p.accuracy} />
        <View className="flex-row items-center gap-2.5">
          <Count value={p.correct} tone={GREEN} mark="✓" label={L('câu đúng', 'correct')} />
          <Count value={p.wrong} tone={RED} mark="✗" label={L('câu sai', 'wrong')} />
        </View>
        <Text className="font-sans" style={{ fontSize: 12, color: B9.muted }}>
          <Text className="font-semi" style={{ color: B9.navy }}>
            {p.answered}
          </Text>
          /{p.bank}
        </Text>
        <View className="w-full items-center" style={{ borderRadius: 10, paddingVertical: 7, backgroundColor: hovered ? B9.gold : B9.navy }}>
          <Text className="font-semi" style={{ fontSize: 14, color: '#FFFFFF' }}>
            {L('Luyện', 'Practise')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Count({ value, tone, mark, label }: { value: number; tone: string; mark: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-row items-center gap-1">
      <Text className="font-heavy" style={{ fontSize: 13, color: tone }}>
        {mark}
      </Text>
      <Text className="font-semi" style={{ fontSize: 13, color: B9.navy }}>
        {value}
      </Text>
    </View>
  );
}

/** Vòng độ chính xác. Chưa làm câu nào thì hiện "—", không phải "0%": chưa làm khác làm sai hết. */
function Ring({ accuracy }: { accuracy: number | null }) {
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = accuracy ?? 0;
  const tone = accuracy === null ? B9.faint : pct >= 0.8 ? GREEN : pct >= 0.5 ? B9.gold : RED;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={B9.hair} strokeWidth={stroke} fill="none" />
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
      <Text className="font-semi" style={{ fontSize: 14, color: accuracy === null ? B9.faint : B9.navy }}>
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
