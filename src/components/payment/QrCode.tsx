import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import qrcode from 'qrcode-generator';
import Svg, { Path, Rect } from 'react-native-svg';

import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Vẽ mã QR bằng `react-native-svg` — chạy giống hệt nhau ở web và native.
 *
 * KHÔNG dùng dịch vụ sinh ảnh QR (img.vietqr.io và tương tự). Ba lý do, theo
 * thứ tự quan trọng:
 *
 * 1. Trang thanh toán mà phụ thuộc một máy chủ bên thứ ba thì nó hỏng theo máy
 *    chủ đó, và hỏng đúng lúc người dùng đang định trả tiền.
 * 2. Số tài khoản người bán đi qua máy họ ở MỌI lượt xem trang.
 * 3. Ảnh tải về là một request nữa phải chờ; vẽ tại chỗ thì QR có ngay khi
 *    trang render.
 *
 * `qrcode-generator` chỉ mã hoá ra ma trận đen/trắng, không phụ thuộc gói nào
 * khác và không đụng tới DOM. Phần vẽ là của ta.
 */

export function QrCode({
  value,
  size = 220,
  /**
   * Mức sửa lỗi.
   *
   * 'M' (~15%) là mặc định đúng cho QR chuyển khoản: đủ để chịu được vết xước
   * hay ngón tay che một góc màn hình, mà không làm ma trận dày thêm tới mức
   * khó quét trên màn hình nhỏ. 'H' (~30%) chỉ cần khi có logo đè lên giữa.
   */
  errorCorrection = 'M',
}: {
  value: string;
  size?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}) {
  const { L } = useL();
  const matrix = useMemo(() => {
    try {
      // typeNumber 0 = tự chọn phiên bản nhỏ nhất chứa vừa dữ liệu.
      const qr = qrcode(0, errorCorrection);
      qr.addData(value);
      qr.make();
      const count = qr.getModuleCount();
      const rows: boolean[][] = [];
      for (let r = 0; r < count; r += 1) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c += 1) row.push(qr.isDark(r, c));
        rows.push(row);
      }
      return rows;
    } catch {
      // Dữ liệu quá dài cho mọi phiên bản QR. Trả null để hiện lời nhắn thay vì
      // để cả trang thanh toán đổ.
      return null;
    }
  }, [errorCorrection, value]);

  if (!matrix) {
    return (
      <View
        className="items-center justify-center rounded-card border border-border bg-surfaceAlt"
        style={{ width: size, height: size }}
      >
        <Text className="px-4 text-center font-sans text-label text-muted">
          {L('Không dựng được mã QR cho nội dung này.', "Couldn't generate a QR code for this content.")}
        </Text>
      </View>
    );
  }

  const count = matrix.length;
  /*
    Viền trắng 4 ô quanh mã ("quiet zone") là BẮT BUỘC theo chuẩn, không phải
    trang trí. Thiếu nó thì máy quét không tìm được biên của mã khi nền xung
    quanh có màu — mà thẻ trong app thì luôn có nền.
  */
  const quiet = 4;
  const total = count + quiet * 2;

  /*
    Gộp toàn bộ ô đen vào MỘT path thay vì vẽ mỗi ô một <Rect>.

    Một mã QR cỡ vừa có khoảng 1.500 ô đen; 1.500 node SVG làm chậm thấy rõ trên
    máy yếu, nhất là khi trang có thêm bộ đếm chạy mỗi giây khiến React so lại
    cây. Một path thì luôn là một node.
  */
  const path = matrix
    .map((row, r) =>
      row
        .map((dark, c) => (dark ? `M${c + quiet} ${r + quiet}h1v1h-1z` : ''))
        .join(''),
    )
    .join('');

  return (
    <View className="rounded-card bg-white p-2" style={{ alignSelf: 'flex-start' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`}>
        <Rect x={0} y={0} width={total} height={total} fill="#FFFFFF" />
        <Path d={path} fill={color.ink} />
      </Svg>
    </View>
  );
}
