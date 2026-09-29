/**
 * Ghi công tài nguyên 3D tải về — đọc thẳng từ `assets/city/LICENSES.json`
 * (mỗi model PHẢI có một dòng ở đó trước khi tải; test giấy phép kiểm hai
 * chiều giữa tệp này và `public/city/models/*.glb`).
 */
import rows from '../../../assets/city/LICENSES.json';

export type CreditRow = {
  id: string;
  ten: string;
  tenEn: string;
  nguon: string;
  url: string;
  giayPhep: string;
  tacGia: string;
  ghiCong: string;
  ghiCongEn: string;
  ngayTai: string;
};

export const CREDITS: readonly CreditRow[] = rows as CreditRow[];
