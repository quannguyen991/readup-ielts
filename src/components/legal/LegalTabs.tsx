import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';

import { LEGAL_LINKS, type LegalLink } from '@/content/legal/shared';

/**
 * Bốn tab chuyển giữa Điều khoản · Quyền riêng tư · Hoàn tiền · Liên hệ.
 *
 * `replace` chứ không `push`: người đọc nhảy qua lại giữa bốn trang này rồi bấm
 * back thì phải về đúng chỗ họ đã đứng trước khi mở trang pháp lý (trang thanh
 * toán, trang giá), không phải lùi qua từng tab đã xem.
 */
export function LegalTabs({ active }: { active: LegalLink['key'] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {LEGAL_LINKS.map((link) => {
        const on = link.key === active;
        return (
          <Pressable
            key={link.key}
            accessibilityRole="link"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) router.replace(link.href as never);
            }}
            className={`rounded-pill border px-4 py-2 ${
              on ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface'
            }`}
          >
            <Text className={on ? 'font-strong text-label text-white' : 'font-mid text-label text-muted'}>
              {link.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
