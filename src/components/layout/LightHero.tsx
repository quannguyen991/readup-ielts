import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { GridBackdrop, LIGHT_LINE, LIGHT_STOPS } from './GridBackdrop';
import { Badge } from '@/components/ui/Badge';

/**
 * Hero nền lưới sáng — kiểu đang dùng ở trang chủ, nay dùng chung.
 *
 * Trước đây trang Tổng quan có hero riêng: một khối gradient xanh đặc, chữ
 * trắng, kèm hình minh hoạ 3D. Đặt cạnh trang chủ thì thành hai thế giới khác
 * nhau trong cùng một app — người dùng bấm "Bắt đầu học" ở trang chủ là rơi
 * thẳng vào một trang trông như của app khác.
 *
 * DÒNG THỨ HAI NẰM TRÊN KHỐI CHÀM. Đây là chỗ duy nhất còn chữ trắng: mắt bắt
 * được câu chốt trước cả khi đọc hết dòng một. Khối lùi trái đúng bằng đệm
 * ngang để hai dòng vẫn thẳng mép chữ.
 */
export function LightHero({
  badge,
  line1,
  line2,
  subtitle,
  children,
  footer,
}: {
  badge: string;
  line1: string;
  /** Dòng chốt, in trắng trên khối chàm. Bỏ trống thì hero chỉ có một dòng. */
  line2?: string;
  subtitle: string;
  /** Hàng nút. */
  children?: React.ReactNode;
  /** Hàng viên số liệu dưới cùng. */
  footer?: React.ReactNode;
}) {
  const wide = useWindowDimensions().width >= 768;
  const size = wide ? 44 : 28;
  const line = wide ? 52 : 36;

  /*
    Bọc thêm một HÀNG NGANG quanh nền: `GridBackdrop` lấy cả khung bằng
    `flex-1`, mà `flex-1` trong một cột cao-theo-nội-dung thì co về 0. Trong
    hàng ngang, flex-1 ăn theo bề ngang còn chiều cao do nội dung quyết định.
  */
  return (
    <View style={{ flexDirection: 'row', borderRadius: 24, overflow: 'hidden' }}>
      <GridBackdrop colors={LIGHT_STOPS} line={LIGHT_LINE}>
        <View style={{ paddingHorizontal: wide ? 40 : 22, paddingVertical: wide ? 52 : 30 }}>
          <Badge label={badge} tone="neutral" shape="tag" />

          <Text className="mt-4 font-heavy text-paper-ink" style={{ fontSize: size, lineHeight: line }}>
            {line1}
          </Text>

          {line2 ? (
            <View className="mt-1.5 self-start rounded-md bg-brand-mid px-3 py-1" style={{ marginLeft: -10 }}>
              <Text className="font-heavy text-white" style={{ fontSize: size, lineHeight: line }}>
                {line2}
              </Text>
            </View>
          ) : null}

          <Text className="mt-4 font-sans text-bodyLg text-paper-body" style={{ maxWidth: 620 }}>
            {subtitle}
          </Text>

          {children ? <View className="mt-6 flex-row flex-wrap gap-2">{children}</View> : null}
          {footer ? <View className="mt-7 flex-row flex-wrap gap-2">{footer}</View> : null}
        </View>
      </GridBackdrop>
    </View>
  );
}

/** Viên số liệu dưới hero: con số đậm, nhãn nhạt. */
export function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill border border-brand-soft bg-white px-3 py-1.5">
      <Text className="font-heavy text-body text-brand">{value}</Text>
      <Text className="font-sans text-label text-paper-muted">{label}</Text>
    </View>
  );
}
