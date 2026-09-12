import { publicEnv } from './env';

/**
 * Người bán và kênh liên hệ, chuẩn hoá từ biến môi trường.
 *
 * VÌ SAO PHẢI CÓ. Trước đây cả app không có một địa chỉ liên hệ nào: trang thanh
 * toán bảo người bị huỷ đơn "liên hệ lại" mà không nói liên hệ ở đâu, còn gói
 * Max hứa "hỗ trợ ưu tiên trong ngày" mà không có kênh nào để được hỗ trợ. Người
 * vừa chuyển 400.000đ mà gói chưa bật cần đúng một thứ: biết nhắn cho ai.
 *
 * CHƯA KHAI THÌ IM LẶNG, KHÔNG BỊA. Kênh sai định dạng bị bỏ chứ không hiện ra
 * một nút mở Zalo tới số không tồn tại. Hàm dựng nhận đầu vào từ ngoài nên test
 * được mà không phải đặt biến môi trường.
 */

export type ContactChannel = {
  kind: 'zalo' | 'email';
  /** Nhãn cho người đọc: "Zalo", "Email". */
  label: string;
  /** Giá trị hiện ra: số điện thoại đã chia nhóm, hoặc địa chỉ email. */
  display: string;
  /** Đường dẫn mở kênh: https://zalo.me/… hoặc mailto:… */
  href: string;
};

export type Contact = {
  sellerName: string | null;
  address: string | null;
  taxId: string | null;
  /** Zalo đứng trước email: người mua ở Việt Nam nhắn Zalo nhanh hơn viết email. */
  channels: ContactChannel[];
};

export type ContactInput = {
  supportEmail?: string;
  supportZalo?: string;
  sellerName?: string;
  sellerAddress?: string;
  sellerTaxId?: string;
};

const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

/**
 * Số di động Việt Nam về dạng 10 số bắt đầu bằng 0.
 *
 * Nhận cả +84, 84, dấu cách, chấm, gạch, ngoặc. Chỉ nhận đầu số di động
 * (03, 05, 07, 08, 09): Zalo gắn với số di động, số bàn không có Zalo.
 */
export function normalizeVnPhone(raw: string): string | null {
  const compact = raw.replace(/[\s.()-]/g, '');
  const match = /^(?:\+?84|0)([35789]\d{8})$/.exec(compact);
  return match ? `0${match[1]}` : null;
}

/** 0912345678 → "0912 345 678", cách chia người Việt vẫn đọc số điện thoại. */
export function formatVnPhone(phone: string): string {
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
}

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

export function buildContact(input: ContactInput): Contact {
  const channels: ContactChannel[] = [];

  const zalo = normalizeVnPhone(input.supportZalo ?? '');
  if (zalo) {
    channels.push({
      kind: 'zalo',
      label: 'Zalo',
      display: formatVnPhone(zalo),
      href: `https://zalo.me/${zalo}`,
    });
  }

  const email = clean(input.supportEmail);
  if (email && EMAIL.test(email)) {
    channels.push({ kind: 'email', label: 'Email', display: email, href: `mailto:${email}` });
  }

  return {
    sellerName: clean(input.sellerName),
    address: clean(input.sellerAddress),
    taxId: clean(input.sellerTaxId),
    channels,
  };
}

/** "Zalo 0912 345 678 hoặc email a@b.vn" — chèn vào câu văn của các trang chính sách. */
export function contactPhrase(contact: Contact): string | null {
  if (contact.channels.length === 0) return null;
  return contact.channels
    .map((c) => `${c.kind === 'zalo' ? 'Zalo' : 'email'} ${c.display}`)
    .join(' hoặc ');
}

export const CONTACT: Contact = buildContact(publicEnv);
