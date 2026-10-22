import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';

/**
 * Các mảnh giao diện dùng chung cho mục Luyện đọc: khung mục có tiêu đề, chip, nhãn
 * trình độ, bìa sách, thẻ hành động và dòng ghi nguồn. Dùng đúng token của Band 9
 * (nền kem, viền mờ, vàng kim, navy); không có màu của app khác.
 */

/** Màu nhãn trình độ: mỗi mức một màu, chữ trắng đủ tương phản. */
const LEVEL_COLOR: Record<string, { bg: string; fg: string }> = {
  A2: { bg: '#0F766E', fg: '#FFFFFF' },
  B1: { bg: '#6A4BD9', fg: '#FFFFFF' },
  B2: { bg: '#24375A', fg: '#FFFFFF' },
  C1: { bg: '#6A4BD9', fg: '#FFFFFF' },
};

export function Section({
  title,
  sub,
  onMore,
  children,
}: {
  title: string;
  sub?: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  const { L } = useL();
  return (
    <View className="mt-7 gap-3">
      <View className="flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-sectionTitle text-ink">{title}</Text>
          {sub ? <Text className="mt-1 font-sans text-label text-muted">{sub}</Text> : null}
        </View>
        {onMore ? (
          <Pressable onPress={onMore} accessibilityRole="link" className="flex-row items-center gap-1">
            <Text className="font-semi text-body text-primary">{L('Xem tất cả', 'See all')}</Text>
            <Icon name="chevron-right" size={14} color="#6A4BD9" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Chip bấm được (lọc). Đang chọn thì tô vàng kim. */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-pill border px-3.5 py-2 ${active ? 'border-brand bg-brand' : 'border-border bg-surface'}`}
    >
      <Text className={`font-semi text-label ${active ? 'text-ink' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}

/** Nhãn tĩnh. Nếu truyền `level` hợp lệ thì tự chọn màu theo trình độ. */
export function Pill({ label, level, bg = '#EEE9FF', fg = '#6A4BD9' }: { label: string; level?: string; bg?: string; fg?: string }) {
  const c = level && LEVEL_COLOR[level] ? LEVEL_COLOR[level] : { bg, fg };
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: c.bg }}>
      <Text className="font-strong" style={{ color: c.fg, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Text>
    </View>
  );
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <View className="rounded-card border border-dashed border-borderStrong bg-surface p-5">
      <Text className="font-sans text-body text-muted">{text}</Text>
    </View>
  );
}

/** Dòng ghi nguồn và giấy phép. Bắt buộc có ở mọi màn dùng nội dung ngoài. */
export function SourceNote({ lines, link }: { lines: string[]; link?: string }) {
  const { L } = useL();
  return (
    <View className="mt-7 flex-row items-start gap-2.5 rounded-panel border border-border bg-canvas p-3.5">
      <Icon name="info" size={16} color="#6A4BD9" />
      <View className="min-w-0 flex-1 gap-1">
        {lines.map((line) => (
          <Text key={line} className="font-sans text-label text-muted">
            {line}
          </Text>
        ))}
        {link ? (
          <Pressable onPress={() => Linking.openURL(link)} accessibilityRole="link">
            <Text className="font-semi text-label text-primary">{L('Mở trang gốc', 'Open source page')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Bìa sách vẽ bằng gradient vàng kim và tên sách. Không dùng bìa có bản quyền. */
export function BookCover({ title, height = 140 }: { title: string; height?: number }) {
  return (
    <LinearGradient
      colors={['#F3F0FB', '#D9B873', '#6A4BD9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ height, justifyContent: 'flex-end', padding: 12 }}
    >
      <Text className="font-heavy text-cardTitle" style={{ color: '#0F1D33' }} numberOfLines={3}>
        {title}
      </Text>
    </LinearGradient>
  );
}

/** Thẻ hành động: biểu tượng, tên và một dòng mô tả. */
export function ActionCard({
  icon,
  title,
  text,
  onPress,
}: {
  icon: IconName;
  title: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className="rounded-card border border-border bg-surface p-4"
      style={{ width: 250, gap: 8 }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-pill bg-brand-soft">
        <Icon name={icon} size={18} color="#6A4BD9" />
      </View>
      <Text className="font-strong text-body text-ink">{title}</Text>
      <Text className="font-sans text-label text-muted">{text}</Text>
    </Pressable>
  );
}
