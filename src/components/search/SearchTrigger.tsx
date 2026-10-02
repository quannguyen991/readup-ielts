import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { useHydrated } from '@/components/layout/useHydrated';
import { useL } from '@/i18n/useL';
import { useSearchStore } from '@/store/useSearchStore';
import { shortcutLabel } from './keys';

/**
 * Nút mở bảng tìm bài ở đầu thanh bên.
 *
 * Mở rộng: trông như một ô nhập (kính lúp, chữ gợi ý, phím tắt) — người ta nhận
 * ra ô tìm kiếm bằng hình dáng của nó. Thu gọn: chỉ còn kính lúp.
 */
export function SidebarSearchTrigger({
  collapsed,
  tone,
}: {
  collapsed: boolean;
  tone: { text: string; muted: string; hover: string; border: string; isDark: boolean };
}) {
  const { L } = useL();
  const show = useSearchStore((s) => s.show);
  const [hovered, setHovered] = useState(false);
  // Nhãn phím tắt tuỳ hệ điều hành — chỉ biết sau khi chạy trên trình duyệt
  // (lượt vẽ đầu phải giống bản máy chủ, nên chờ hydrate xong mới hiện).
  const hydrated = useHydrated();
  const keys = hydrated && Platform.OS === 'web' ? shortcutLabel() : null;

  const label = L('Tìm bài học', 'Find a lesson');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={keys ? `${label} (${keys})` : label}
      aria-haspopup="dialog"
      onPress={show}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className={collapsed ? 'h-11 w-11 items-center justify-center self-center rounded-2xl' : 'flex-row items-center gap-2.5 rounded-xl px-3 py-2.5'}
      style={{
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: hovered ? tone.hover : tone.isDark ? 'rgba(255,255,255,0.04)' : '#FFFDF7',
      }}
    >
      <Icon name="search" size={collapsed ? 19 : 17} color={tone.isDark ? tone.text : '#A8843F'} strokeWidth={2} />
      {collapsed ? null : (
        <>
          <Text numberOfLines={1} className="min-w-0 flex-1 font-semi text-[14px]" style={{ color: tone.muted }}>
            {L('Tìm bài học…', 'Find a lesson…')}
          </Text>
          {keys ? (
            <View style={{ borderWidth: 1, borderColor: tone.border, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text className="font-semi" style={{ fontSize: 12, color: tone.muted }}>
                {keys}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

/** Kính lúp trên thanh đầu trang (điện thoại, máy tính bảng). */
export function SearchIconButton({ color, size = 19 }: { color: string; size?: number }) {
  const { L } = useL();
  const show = useSearchStore((s) => s.show);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={L('Tìm bài học', 'Find a lesson')}
      aria-haspopup="dialog"
      onPress={show}
      className="h-11 w-11 items-center justify-center"
    >
      <Icon name="search" size={size} color={color} strokeWidth={1.9} />
    </Pressable>
  );
}
