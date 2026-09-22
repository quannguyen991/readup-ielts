import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackdrop } from './AuroraBackdrop';
import { GridBackdrop, LIGHT_LINE, LIGHT_STOPS } from './GridBackdrop';
import { Icon } from '@/components/ui/Icon';
import { color, layout, paper } from '@/theme/tokens';

export type TaskTone = 'brand' | 'paper';

/**
 * Khung của một màn LÀM BÀI.
 *
 * Ba việc, gom một chỗ vì cả bốn màn tác vụ đều cần đúng ba việc này:
 *
 *   1. Vẽ nền tràn viền (giấy kẻ ô xanh tím, hoặc nền sáng) — kể cả phần chèn
 *      an toàn phía trên, nên `SafeAreaView` nằm BÊN TRONG nền chứ không bọc
 *      ngoài. Bọc ngoài thì máy có tai thỏ sẽ có một dải trắng cắt ngang đỉnh.
 *   2. Một đường về DUY NHẤT ở góc trái. `AppShell` đã bỏ hết thanh điều hướng
 *      ở các đường dẫn này, nên nếu màn nào quên vẽ đường về thì người dùng
 *      thật sự bị kẹt — vì thế nó là tham số bắt buộc, không phải tuỳ chọn.
 *   3. Giới hạn bề ngang nội dung, để dòng chữ không kéo dài hết màn 27 inch.
 *
 * Hai tông: `brand` (nền xanh tím, thẻ giấy kem nổi lên — dùng cho màn có nhiều chữ
 * cần đọc kỹ) và `paper` (nền sáng, thẻ trắng — dùng cho màn thao tác nhiều,
 * nơi nền tối làm mỏi mắt khi nhìn lâu vào ô nhập).
 */
export function TaskShell({
  backHref,
  backLabel,
  title,
  subtitle,
  icon = 'book',
  tone = 'brand',
  paperGrid = true,
  right,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  tone?: TaskTone;
  /** Tắt lưới cho các workspace cần nền trang chủ sạch, không bị chia ô. */
  paperGrid?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const onBrand = tone === 'brand';
  const titleColor = onBrand ? color.white : paper.ink;
  const subColor = onBrand ? 'rgba(255,255,255,0.72)' : paper.muted;

  const body = (
    <SafeAreaView edges={['top']} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View
          className="w-full self-center px-4 pb-4 pt-3 lg:px-8"
          style={{ maxWidth: layout.contentMaxWidth }}
        >
          <Link href={backHref as never} asChild>
            <Pressable
              accessibilityRole="link"
              className="mb-4 flex-row items-center gap-1.5 self-start py-1"
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <Icon name="arrow-right" size={15} color={subColor} strokeWidth={2} />
              </View>
              <Text
                className="font-semi uppercase tracking-wide"
                style={{ color: subColor, fontSize: 11 }}
              >
                {backLabel}
              </Text>
            </Pressable>
          </Link>

          <View className="mb-5 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-panel"
              style={{ backgroundColor: onBrand ? 'rgba(255,255,255,0.16)' : paper.brandMid }}
            >
              <Icon name={icon} size={22} color={color.white} strokeWidth={1.9} />
            </View>
            <View className="flex-1">
              <Text className="font-heavy text-pageTitle" style={{ color: titleColor }}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-0.5 font-semi uppercase tracking-wide"
                  style={{ color: subColor, fontSize: 11 }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>

          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  /*
    Tông tối dùng nền LOANG, tông giấy vẫn giữ lưới kẻ ô. Đây là chủ ý, không
    phải làm dở dang.

    Tông tối là màn chọn bài và màn xem kết quả — chỗ để nhìn, và ở đó khối loang
    lớn mềm làm nền đẹp mà không tranh chỗ với chữ. Tông giấy là màn ĐANG GÕ: ô
    chữ, ô nhập, bài viết. Ở đó lưới kẻ gợi đúng thứ cần gợi — tờ giấy kẻ để
    viết lên — và một nền đang chuyển động chậm ngay sau con trỏ là thứ gây phân
    tâm đúng vào lúc cần tập trung nhất.
  */
  if (onBrand) return <AuroraBackdrop>{body}</AuroraBackdrop>;

  /*
    Tông sáng CŨNG có lưới, chỉ là lưới nhạt trên nền xanh nước biển rất nhạt.

    Trước đây tông này là một mảng trắng phẳng: thẻ trắng đặt trên nền trắng thì
    không còn ranh giới nào, cả màn hình trông như một tờ giấy trống. Nền xanh
    nhạt kẻ ô vừa tách được thẻ ra khỏi nền, vừa giữ đúng một họa tiết với tông
    tối — hai tông là hai độ sáng của cùng một thứ, không phải hai thiết kế.
  */
  return (
    <GridBackdrop colors={LIGHT_STOPS} line={LIGHT_LINE} showGrid={paperGrid}>
      {body}
    </GridBackdrop>
  );
}
