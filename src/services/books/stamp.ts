import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * In dòng bản quyền lên chân TỪNG TRANG của một cuốn sách (đúng như Điều khoản mục "Bộ sách PDF tặng kèm":
 * "Mỗi bản tải về được in email của bạn và mã đơn ở chân từng trang").
 *
 * Chữ chỉ dùng ASCII: phông chuẩn của PDF (Helvetica, bảng mã WinAnsi) không có dấu tiếng Việt, mà
 * nhúng thêm một phông TTF vào sách 600 trang thì nặng và chậm. Ký tự ngoài ASCII trong email (hiếm)
 * được thay bằng "?" thay vì làm hỏng cả lần tải.
 */
export function stampLine(email: string, orderRef: string): string {
  const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, '?');
  return `Licensed to ${ascii(email)} - Order ${ascii(orderRef)} - Band 9 - personal use only, do not share or resell`;
}

export async function stampPdf(master: Uint8Array, email: string, orderRef: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(master, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = stampLine(email, orderRef);
  const size = 6.5;
  const width = font.widthOfTextAtSize(text, size);
  for (const page of doc.getPages()) {
    const { width: pw } = page.getSize();
    page.drawText(text, { x: Math.max(12, (pw - width) / 2), y: 7, size, font, color: rgb(0.45, 0.47, 0.53), opacity: 0.85 });
  }
  doc.setSubject(`Licensed to ${email} - order ${orderRef}`);
  doc.setKeywords(['Band 9', `order:${orderRef}`, `licensee:${email}`]);
  return doc.save({ useObjectStreams: true });
}
