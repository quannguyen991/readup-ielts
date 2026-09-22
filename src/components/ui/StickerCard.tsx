import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
};

/**
 * Thẻ màu: nền gradient cùng tông, bo góc, bóng mềm — cho những lưới nhiều thẻ
 * cạnh nhau cần phân biệt nhanh bằng màu.
 *
 * Bản đầu có thêm viền đen 2,5px và bóng lệch cứng, mượn từ The IELTS
 * Dictionary. Người dùng thấy thô và thấy giống app kia; viền và bóng cứng đã
 * bỏ, chỉ giữ màu — thứ duy nhất thật sự giúp phân biệt thẻ.
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
        Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.08)' } as never)
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 3,
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
