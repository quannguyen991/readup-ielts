import { Redirect } from 'expo-router';

/**
 * Cửa vào: MỌI NGƯỜI đều thấy trang giới thiệu trước.
 *
 * Bản trước chia hai ngả — ai có dấu vết học thì vào thẳng Tổng quan, ai chưa
 * thì xem giới thiệu — với lý do "bắt người đã học ba tuần xem lại trang quảng
 * cáo mỗi lần mở app là phiền". Lý do đó không sai, nhưng nó đánh đổi bằng một
 * thứ đắt hơn: người quay lại KHÔNG BAO GIỜ còn thấy phần giới thiệu nữa, kể cả
 * khi app có thêm tính năng mới, và cũng không thấy bảng giá.
 *
 * Cách bù cho người quay lại nằm ở chính trang giới thiệu: nếu họ đã học, nút
 * "Tiếp tục học" hiện lên ngay đầu trang, trước cả tiêu đề. Mất thêm một cú
 * bấm, đổi lại mọi người đều đi qua chỗ giới thiệu tính năng và bảng giá.
 */
export default function Index() {
  return <Redirect href="/intro" />;
}
