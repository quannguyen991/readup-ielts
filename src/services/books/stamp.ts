import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * In tên người mua lên từng trang sách.
 *
 * MỤC ĐÍCH KHÔNG PHẢI CHẶN SAO CHÉP — với PDF thì không chặn được. Mục đích là
 * mỗi bản sách trôi nổi đều TRUY ĐƯỢC về một đơn hàng, nên người mua nghĩ hai lần
 * trước khi đăng lên nhóm Facebook. Vì thế dòng in phải đọc được bằng mắt chứ
 * không giấu: một dòng chữ nhỏ ở mép dưới mỗi trang, cộng thêm vào siêu dữ liệu
 * của file (cắt dòng in đi thì file vẫn còn tên).
 *
 * CHỖ ĐẶT ĐO TRÊN ĐÚNG 11 CUỐN: chữ thấp nhất của mọi trang nằm ở khoảng 823pt
 * trên khổ A4 cao 842pt, tức mép dưới còn chừng 19pt trống. Dòng in nằm trong
 * dải 3–13pt tính từ mép giấy, không đè lên chân trang chạy theo chương.
 *
 * BÌA (trang 1) in chữ trắng, không nền: cả 11 bìa đều là mảng màu đậm ở mép
 * dưới. Các trang khác in chữ xám trên một dải trắng mờ — trên giấy trắng thì
 * không thấy dải, trên trang có nền màu thì chữ vẫn đọc được.
 *
 * CHỈ DÙNG CHỮ LATIN. Phông chuẩn của PDF (Helvetica) không có dấu tiếng Việt,
 * nhúng phông riêng thì mỗi bản tải nặng thêm. Email và mã đơn vốn là ASCII; ký
 * tự lạ bị thay bằng dấu hỏi thay vì làm hỏng cả file.
 *
 * Đo trên máy: cuốn dày nhất (624 trang, 9,7 MB) in xong trong khoảng 1,1 giây,
 * bộ nhớ khoảng 120 MB — lọt thỏm trong giới hạn 60 giây của hàm Vercel.
 */

export type StampInfo = {
  email: string;
  orderRef: string;
  issuedAt: Date;
};

const SIZE = 6.5;

export function asciiOnly(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, '?');
}

export function stampLine(info: StampInfo): string {
  const day = info.issuedAt.toISOString().slice(0, 10);
  return `Licensed to ${asciiOnly(info.email)} \u00b7 Order ${asciiOnly(info.orderRef)} \u00b7 ${day} \u00b7 ReadUp \u00b7 personal use only`;
}

export async function stampPdf(bytes: Uint8Array, info: StampInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const line = stampLine(info);
  const textWidth = font.widthOfTextAtSize(line, SIZE);

  doc.getPages().forEach((page, index) => {
    const { width } = page.getSize();
    const x = Math.max(8, (width - textWidth) / 2);

    if (index === 0) {
      page.drawText(line, { x, y: 6, size: SIZE, font, color: rgb(1, 1, 1), opacity: 0.9 });
      return;
    }

    page.drawRectangle({
      x: x - 4,
      y: 3,
      width: textWidth + 8,
      height: SIZE + 3.5,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });
    page.drawText(line, { x, y: 5.2, size: SIZE, font, color: rgb(0.36, 0.37, 0.42) });
  });

  const email = asciiOnly(info.email);
  const ref = asciiOnly(info.orderRef);
  doc.setSubject(`Licensed to ${email} - order ${ref}`);
  doc.setKeywords(['ReadUp', ref, email]);
  doc.setProducer('ReadUp');
  doc.setModificationDate(info.issuedAt);

  return doc.save({ useObjectStreams: true });
}
