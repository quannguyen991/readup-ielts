/**
 * Tuần tự hoá JSON TẤT ĐỊNH — nền của mọi chữ ký trong app.
 *
 * VÌ SAO KHÔNG DÙNG `JSON.stringify` THẲNG. Nó giữ nguyên thứ tự khoá lúc object
 * được dựng. Hai đoạn mã cùng tạo ra một chứng chỉ giống hệt nhau về nội dung
 * nhưng gán khoá theo thứ tự khác nhau sẽ ra hai chuỗi khác nhau, và chữ ký
 * không tha thứ một byte lệch. Lỗi ấy không hiện ra lúc viết mã — nó hiện ra
 * trên máy người dùng, rất lâu sau, dưới dạng "chứng chỉ hợp lệ bỗng báo sai".
 *
 * ĐÂY LÀ TẬP CON CỦA RFC 8785 (JCS), CỐ Ý. JCS đầy đủ phải xử lý cách in số thực
 * theo đúng ECMAScript — phần khó nhất và cũng là phần dễ lệch nhất giữa các bản
 * cài đặt. App này không cần số thực trong payload ký, nên thay vì cài cho đúng
 * một thứ không dùng, ở đây TỪ CHỐI số thực. Từ chối thì hỏng to tiếng lúc ký;
 * cài sai thì hỏng lặng lẽ lúc kiểm.
 *
 * MỘT CHỖ LỆCH VỚI JCS, CÓ CHỦ Ý: chuỗi được đưa về NFC. JCS giữ nguyên byte.
 * Nhưng nội dung ở đây có tiếng Việt, mà "đã" gõ kiểu tổ hợp và "đã" gõ kiểu
 * dựng sẵn nhìn giống hệt nhau và khác nhau về byte — đã có lần vấp đúng chỗ này
 * ở nơi khác trong dự án. Chuẩn hoá cả hai phía ký và kiểm thì hai cách gõ cho
 * cùng một chữ ký, và đó là hành vi đúng với thứ người ta đọc bằng mắt.
 */

/** Giá trị JSON mà hàm này chịu nhận. */
export type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [k: string]: CanonicalValue };

export class CanonicalError extends Error {
  constructor(message: string, readonly path: string) {
    super(`${message} (tại ${path || 'gốc'})`);
    this.name = 'CanonicalError';
  }
}

/**
 * Số nguyên nằm trong khoảng an toàn, không dấu âm-không.
 *
 * `-0` bị chặn vì `JSON.stringify(-0)` ra `"0"`: hai giá trị khác nhau theo
 * `Object.is` lại ra cùng một chuỗi, nên nhận nó là mở đường cho hai payload
 * khác nhau có cùng chữ ký.
 */
function checkNumber(n: number, path: string): void {
  if (!Number.isFinite(n)) {
    throw new CanonicalError('Số phải hữu hạn — NaN và Infinity không tuần tự hoá được', path);
  }
  if (!Number.isInteger(n)) {
    throw new CanonicalError('Chỉ nhận số nguyên — số thực in ra khác nhau giữa các bản cài đặt', path);
  }
  if (!Number.isSafeInteger(n)) {
    throw new CanonicalError('Số nguyên vượt khoảng an toàn của JS', path);
  }
  if (Object.is(n, -0)) {
    throw new CanonicalError('Không nhận -0 — nó tuần tự hoá thành "0" nên hai giá trị dồn về một', path);
  }
}

function write(value: unknown, path: string, seen: Set<object>): string {
  if (value === null) return 'null';

  const t = typeof value;

  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') {
    checkNumber(value as number, path);
    return String(value);
  }
  if (t === 'string') return JSON.stringify((value as string).normalize('NFC'));

  if (t === 'undefined') {
    throw new CanonicalError('Không nhận undefined — hãy bỏ hẳn khoá, hoặc dùng null', path);
  }
  if (t === 'function' || t === 'symbol' || t === 'bigint') {
    throw new CanonicalError(`Không tuần tự hoá được giá trị kiểu ${t}`, path);
  }

  const obj = value as object;

  // Bắt vòng lặp tham chiếu trước khi đệ quy, nếu không thì tràn ngăn xếp.
  if (seen.has(obj)) {
    throw new CanonicalError('Có vòng lặp tham chiếu', path);
  }
  seen.add(obj);
  try {
    if (Array.isArray(obj)) {
      // Mảng GIỮ THỨ TỰ: nó là dữ liệu có thứ tự, không phải tập hợp. Sắp lại
      // mảng là đổi nội dung, không phải chuẩn hoá cách viết.
      const parts = obj.map((v, i) => write(v, `${path}[${i}]`, seen));
      return `[${parts.join(',')}]`;
    }

    // Mọi thứ có nguyên mẫu lạ đều bị chặn: Date, Map, Set, RegExp, class tự
    // viết… Mỗi cái có ít nhất hai cách quy ra JSON hợp lý như nhau, và chọn hộ
    // một cách là chôn một giả định vào chữ ký.
    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) {
      const name = obj.constructor?.name ?? 'không rõ';
      throw new CanonicalError(`Chỉ nhận object thuần — gặp ${name}`, path);
    }

    const rec = obj as Record<string, unknown>;
    // `Object.keys` đã bỏ khoá symbol. Sắp theo mã đơn vị UTF-16, đúng thứ tự mà
    // RFC 8785 quy định, và cũng là thứ tự mặc định của `Array.prototype.sort`.
    const keys = Object.keys(rec).sort();

    const parts = keys.map((k) => {
      const v = rec[k];
      if (v === undefined) {
        throw new CanonicalError(`Khoá "${k}" mang giá trị undefined`, path);
      }
      return `${JSON.stringify(k.normalize('NFC'))}:${write(v, path ? `${path}.${k}` : k, seen)}`;
    });
    return `{${parts.join(',')}}`;
  } finally {
    seen.delete(obj);
  }
}

/**
 * Chuỗi tất định cho `value`. Cùng nội dung → cùng byte, trên mọi máy, mọi lần chạy.
 *
 * Ném `CanonicalError` khi gặp giá trị không có một cách tuần tự hoá duy nhất.
 */
export function canonicalize(value: unknown): string {
  return write(value, '', new Set());
}
