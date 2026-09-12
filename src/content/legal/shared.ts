import { contactPhrase, type Contact } from '@/lib/contact';

/**
 * Kiểu dữ liệu và câu chữ dùng chung của ba trang pháp lý.
 *
 * NỘI DUNG LÀ DỮ LIỆU, KHÔNG PHẢI JSX. Ba trang được dựng bằng hàm thuần nhận
 * cấu hình (kênh liên hệ, công cụ đo lường đang bật) và trả về văn bản — nên
 * test được bằng Node, và mọi con số (giá, ngày dùng thử, hạn hoàn tiền, số
 * sách) đọc thẳng từ module đang điều khiển hành vi thật của app. Trang chính
 * sách không thể nói 7 ngày trong khi app làm 3 ngày.
 */

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'note'; text: string };

export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

export type LegalDocId = 'terms' | 'privacy' | 'refund';

export type LegalDoc = {
  id: LegalDocId;
  title: string;
  lead: string;
  /** YYYY-MM-DD */
  updatedAt: string;
  sections: LegalSection[];
};

export type LegalContext = {
  contact: Contact;
  /** Tên các công cụ đo lường đang bật; rỗng nghĩa là không có. */
  trackers: string[];
};

/** Sửa chữ nào trong ba trang này thì đổi ngày này — người đọc có quyền biết bản nào đang có hiệu lực. */
export const LEGAL_UPDATED_AT = '2026-09-11';

export type LegalLink = { key: LegalDocId | 'contact'; href: string; label: string };

export const LEGAL_LINKS: readonly LegalLink[] = [
  { key: 'terms', href: '/legal/terms', label: 'Điều khoản' },
  { key: 'privacy', href: '/legal/privacy', label: 'Quyền riêng tư' },
  { key: 'refund', href: '/legal/refund', label: 'Hoàn tiền' },
  { key: 'contact', href: '/contact', label: 'Liên hệ' },
];

/** "Zalo 0912 345 678 hoặc email a@b.vn", hoặc lời chỉ sang trang Liên hệ khi chưa khai kênh nào. */
export function contactVia(contact: Contact): string {
  return contactPhrase(contact) ?? 'các kênh ở trang Liên hệ';
}

/** Mệnh đề giới thiệu bên vận hành — chỉ nêu tên khi đã khai, không bịa ra một pháp nhân. */
export function operatorClause(contact: Contact): string {
  return contact.sellerName
    ? `, do ${contact.sellerName} vận hành (sau đây gọi là “chúng tôi”)`
    : ' (sau đây gọi là “chúng tôi”)';
}

/** ["A", "B", "C"] → "A, B và C". */
export function joinVi(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} và ${items[items.length - 1]}`;
}

/** "2026-09-11" → "11/09/2026". */
export function formatDateVi(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
