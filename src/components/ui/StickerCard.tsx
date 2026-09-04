import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
};

/**
 * Thẻ "sticker": viền đen dày + đổ bóng LỆCH CỨNG (không mờ) + nền gradient
 * rực màu — phong cách tham khảo từ The IELTS Dictionary (lưới thẻ chủ đề từ
 * vựng), dùng cho những lưới nhiều thẻ cạnh nhau cần phân biệt nhanh bằng màu.
 *
 * CHỈ DÙNG Ở NHỮNG CHỖ CHỌN LỰA CHỌN (chủ đề từ vựng, chế độ luyện tập) — KHÔNG
 * thay `Card` mặc định của cả app. Đổi cả hệ thống sang phong cách này là một
 * quyết định thẩm mỹ lớn hơn nhiều so với việc được yêu cầu, và rủi ro vỡ hàng
 * chục màn đã ổn định (thanh toán, quản trị, danh sách bài đọc...) không đáng
 * đánh đổi cho một yêu cầu chỉ nhắc tới lưới thẻ chủ đề.
 */
export function StickerCard({ colors, children, className, style, ...rest }: StickerCardProps) {
  return (
    <View
      className={['overflow-hidden rounded-card', className ?? ''].filter(Boolean).join(' ')}
      style={[
        { borderWidth: 2.5, borderColor: '#0F172A' },
        Platform.OS === 'web'
          ? ({ boxShadow: '5px 5px 0 #0F172A' } as never)
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 6,
            },
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16, flex: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}
