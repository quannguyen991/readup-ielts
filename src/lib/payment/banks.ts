/**
 * Tra tên ngân hàng từ mã BIN 6 chữ số.
 *
 * Chỉ để HIỂN THỊ. Người bán khai BIN trong biến môi trường, và trang thanh
 * toán cần hiện "Vietcombank" chứ không phải "970436" — người chuyển khoản phải
 * đối chiếu được bằng mắt trước khi bấm gửi tiền.
 *
 * Danh sách này KHÔNG đầy đủ và không cần đầy đủ: BIN lạ thì hiện chính con số,
 * và QR vẫn chạy đúng vì QR chỉ cần BIN. Cố nhồi cả trăm ngân hàng vào đây là
 * nhận một danh sách sẽ lỗi thời mà không ai nhớ cập nhật.
 */
export const BANK_NAMES: Record<string, string> = {
  '970415': 'VietinBank',
  '970436': 'Vietcombank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970448': 'OCB',
  '970422': 'MB Bank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970437': 'HDBank',
  '970454': 'BVBank (Bản Việt)',
  '970429': 'SCB',
  '970441': 'VIB',
  '970443': 'SHB',
  '970431': 'Eximbank',
  '970426': 'MSB',
  '546034': 'CAKE by VPBank',
  '546035': 'Ubank by VPBank',
  '963388': 'Timo',
  '970400': 'SaigonBank',
  '970409': 'BacA Bank',
  '970412': 'PVcomBank',
  '970419': 'NCB',
  '970424': 'Shinhan Bank',
  '970425': 'ABBANK',
  '970427': 'VietABank',
  '970428': 'NamA Bank',
  '970430': 'PGBank',
  '970433': 'VietBank',
  '970438': 'BaoViet Bank',
  '970440': 'SeABank',
  '970449': 'LienVietPostBank',
  '970452': 'KienLongBank',
};

export function bankLabel(bin: string): string {
  return BANK_NAMES[bin] ?? `Ngân hàng ${bin}`;
}
