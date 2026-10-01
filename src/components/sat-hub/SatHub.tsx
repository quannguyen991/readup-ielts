import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { B9 } from '@/components/practice/SkillBank';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import type { HubLink } from '@/navigation/sat-hub';

/**
 * Mảnh giao diện chung của phần SAT: phiếu giấy kem kẻ chỉ vàng, số thứ tự ở
 * lề trái như phiếu lộ trình (`app/plan.tsx`), mực xanh đêm. Không khối màu
 * phẳng lớn.
 */

export function go(href: string) {
  router.push(href as never);
}

/** Nút chính: nền xanh đêm, chữ trắng. Mỗi bước đúng một nút như vậy. */
export function PrimaryButton({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        paddingHorizontal: small ? 14 : 18,
        paddingVertical: small ? 9 : 11,
        backgroundColor: hovered ? '#24344F' : B9.navy,
      })}
    >
      <Text className="font-strong" style={{ fontSize: small ? 14 : 15, color: '#FFFFFF' }}>
        {label}
      </Text>
      <Icon name="arrow-right" size={15} color={B9.goldLight} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Liên kết phụ: chữ vàng đậm có mũi tên nhỏ. */
export function MoreLink({ link }: { link: HubLink }) {
  const { en } = useL();
  return (
    <Pressable accessibilityRole="link" onPress={() => go(link.href)} className="flex-row items-center gap-1" style={{ paddingVertical: 4 }}>
      <Text className="font-semi" style={{ fontSize: 14, color: B9.goldDeep }}>
        {en ? link.en : link.vi}
      </Text>
      <Icon name="chevron-right" size={14} color={B9.goldDeep} strokeWidth={2.2} />
    </Pressable>
  );
}

/** Tiêu đề trang: dòng nhỏ chữ vàng giãn rộng, tên trang xanh đêm, một câu phụ. */
export function HubTitle({ eyebrow, title, line }: { eyebrow: string; title: string; line?: string }) {
  const { width } = useWindowDimensions();
  return (
    <View>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2.4, color: B9.goldDeep }}>
        {eyebrow}
      </Text>
      <Text className="font-heavy" style={{ marginTop: 2, fontSize: width >= 900 ? 34 : 26, lineHeight: width >= 900 ? 40 : 32, color: B9.navy }}>
        {title}
      </Text>
      {line ? (
        <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, lineHeight: 22, color: B9.muted }}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

/** Thẻ giấy kem có viền chỉ vàng. */
export function PaperSheet({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ borderRadius: 22, backgroundColor: B9.paper, borderWidth: 1, borderColor: B9.line }, style]}>{children}</View>;
}

/** Nhãn "Bước tiếp theo" — viên vàng nhạt. */
export function NextTag({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2, backgroundColor: B9.goldWash, borderWidth: 1, borderColor: B9.goldLight }}>
      <Text className="font-strong" style={{ fontSize: 12, color: B9.goldDeep }}>
        {label}
      </Text>
    </View>
  );
}

/** Hàng liên kết nhỏ ngăn bằng dấu chấm giữa — lối phụ của hub, không phải nút. */
export function HubLinkRow({ links }: { links: HubLink[] }) {
  const { en } = useL();
  return (
    <View className="flex-row flex-wrap items-center" style={{ marginTop: 8, columnGap: 6 }}>
      {links.map((l, i) => (
        <View key={l.href} className="flex-row items-center" style={{ columnGap: 6 }}>
          {i > 0 ? (
            <Text aria-hidden style={{ color: B9.faint, fontSize: 14 }}>
              ·
            </Text>
          ) : null}
          <Pressable accessibilityRole="link" onPress={() => go(l.href)} style={{ paddingVertical: 2 }}>
            <Text className="font-semi" style={{ fontSize: 14, color: B9.goldDeep, textDecorationLine: 'underline', textDecorationColor: B9.goldLight }}>
              {en ? l.en : l.vi}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/** Thanh công cụ mảnh: chế độ xem bên trái, bộ lọc bên phải; xuống dòng trên điện thoại. */
export function HubToolbar({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-row flex-wrap items-center justify-between"
      style={{ marginTop: 18, paddingBottom: 10, borderBottomWidth: 1, borderColor: B9.line, rowGap: 8, columnGap: 12 }}
    >
      {children}
    </View>
  );
}
