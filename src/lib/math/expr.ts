/**
 * Markup toán inline cho đề SAT Math, và parser của nó.
 *
 * VÌ SAO TỰ VIẾT: KaTeX và MathJax đều chỉ chạy trên web, mà repo đã chốt "đề
 * phải hiện giống hệt nhau ở web và mobile" (xem `ChartFigure.tsx`). Một cú
 * pháp nhỏ tự chứa, render bằng View/Text lồng nhau, giữ được điều đó mà không
 * thêm một dependency nào.
 *
 * CÚ PHÁP — cố ý hẹp, chỉ đủ cho những gì Digital SAT Math thật sự hỏi:
 *
 *     x^2        luỹ thừa      | x_1         chỉ số dưới
 *     x^(n+1)    số mũ là cụm  | frac(a,b)   phân số xếp chồng
 *     sqrt(x+1)  căn bậc hai   | <=  >=  !=  ≤ ≥ ≠
 *     pi         π             | deg         °
 *
 * KHÔNG có ma trận, tích phân, tổng sigma — đề thi không hỏi những thứ đó. Cần
 * node mới thì thêm node ấy, không dựng sẵn loại chưa dùng tới.
 *
 * Chuỗi đưa vào là văn xuôi tiếng Anh CÓ LẪN toán, không phải toán thuần: cả
 * câu "If 3(x + 4) = 5x - 2, what is the value of x?" đi thẳng qua parser. Nên
 * mọi ký hiệu đặc biệt ở trên đều được chọn vì chúng không xuất hiện trong văn
 * xuôi tiếng Anh bình thường.
 *
 * PARSER KHÔNG BAO GIỜ NÉM LỖI. Markup hỏng thì rơi về chữ thường, vì ném lỗi
 * lúc chạy là vỡ nguyên màn hình chỉ vì một dấu ngoặc thiếu. Lỗi soạn thảo bắt
 * bằng `validateMath()` trong test — mọi đề sinh ra đều đi qua đó ở `npm test`.
 */

export type MathNode =
  | { kind: 'text'; value: string }
  | { kind: 'sup'; children: MathNode[] }
  | { kind: 'sub'; children: MathNode[] }
  | { kind: 'frac'; numerator: MathNode[]; denominator: MathNode[] }
  | { kind: 'sqrt'; children: MathNode[] };

const SYMBOLS: Array<[RegExp, string]> = [
  [/<=/g, '≤'],
  [/>=/g, '≥'],
  [/!=/g, '≠'],
  [/\bpi\b/g, 'π'],
  [/\bdeg\b/g, '°'],
];

function normalizeText(value: string): string {
  let out = value;
  for (const [pattern, replacement] of SYMBOLS) out = out.replace(pattern, replacement);
  return out;
}

type Issue = string;

type Run = { nodes: MathNode[]; end: number; closed: boolean };

/**
 * Đọc một đoạn tới khi gặp ký tự dừng ở ĐỘ SÂU NGOẶC BẰNG KHÔNG.
 *
 * Đếm ngoặc là bắt buộc: `frac(2(x+1),3)` có một dấu `)` của văn bản nằm trước
 * dấu `,` phân cách, không đếm thì tử số bị cắt ngang ở đó.
 */
function parseRun(src: string, start: number, stopChars: string, issues: Issue[]): Run {
  const nodes: MathNode[] = [];
  let buf = '';
  let paren = 0;
  let i = start;

  const flush = () => {
    if (buf.length > 0) {
      nodes.push({ kind: 'text', value: normalizeText(buf) });
      buf = '';
    }
  };

  while (i < src.length) {
    const ch = src[i] ?? '';

    if (paren === 0 && stopChars.includes(ch)) {
      flush();
      return { nodes, end: i, closed: true };
    }

    if (src.startsWith('frac(', i)) {
      const numerator = parseRun(src, i + 5, ',', issues);
      const denominator = numerator.closed
        ? parseRun(src, numerator.end + 1, ')', issues)
        : null;

      if (!numerator.closed || !denominator || !denominator.closed) {
        issues.push(`frac( không đóng đủ hai phần ở vị trí ${i}`);
        buf += 'frac(';
        i += 5;
        continue;
      }

      flush();
      nodes.push({ kind: 'frac', numerator: numerator.nodes, denominator: denominator.nodes });
      i = denominator.end + 1;
      continue;
    }

    if (src.startsWith('sqrt(', i)) {
      const inner = parseRun(src, i + 5, ')', issues);
      if (!inner.closed) {
        issues.push(`sqrt( không đóng ngoặc ở vị trí ${i}`);
        buf += 'sqrt(';
        i += 5;
        continue;
      }

      flush();
      nodes.push({ kind: 'sqrt', children: inner.nodes });
      i = inner.end + 1;
      continue;
    }

    if (ch === '^' || ch === '_') {
      const script = readScript(src, i + 1, issues);
      if (script) {
        flush();
        nodes.push({ kind: ch === '^' ? 'sup' : 'sub', children: script.nodes });
        i = script.end;
        continue;
      }
      issues.push(`Dấu ${ch} ở vị trí ${i} không có gì đi kèm`);
      buf += ch;
      i += 1;
      continue;
    }

    if (ch === '(') paren += 1;
    else if (ch === ')' && paren > 0) paren -= 1;

    buf += ch;
    i += 1;
  }

  flush();
  // Hết chuỗi mà vẫn đang chờ ký tự dừng nghĩa là markup thiếu dấu đóng.
  return { nodes, end: i, closed: stopChars.length === 0 };
}

/**
 * Đọc phần đi sau `^` hoặc `_`.
 *
 * Ba dạng được nhận: cụm trong ngoặc `x^(n+1)`, dãy chữ số `x^12`, hoặc đúng
 * MỘT chữ cái `x^n`. Hẹp như vậy để `x^2y` đọc thành "x mũ 2, rồi y" — nếu
 * nuốt cả dãy chữ cái thì nó thành "x mũ 2y", sai hẳn nghĩa.
 */
function readScript(src: string, start: number, issues: Issue[]): { nodes: MathNode[]; end: number } | null {
  let i = start;
  let sign = '';

  if (src[i] === '-') {
    sign = '−';
    i += 1;
  }

  if (src[i] === '(') {
    const inner = parseRun(src, i + 1, ')', issues);
    if (!inner.closed) return null;
    const nodes = sign ? [{ kind: 'text' as const, value: sign }, ...inner.nodes] : inner.nodes;
    return { nodes, end: inner.end + 1 };
  }

  let j = i;
  while (j < src.length && src[j] !== undefined && src[j]! >= '0' && src[j]! <= '9') j += 1;
  if (j > i) {
    return { nodes: [{ kind: 'text', value: sign + src.slice(i, j) }], end: j };
  }

  const ch = src[i];
  if (ch && /[A-Za-z]/.test(ch)) {
    return { nodes: [{ kind: 'text', value: sign + ch }], end: i + 1 };
  }

  return null;
}

export function parseMath(src: string): MathNode[] {
  return parseRun(src, 0, '', []).nodes;
}

/**
 * Trả về danh sách vấn đề của markup. Rỗng nghĩa là sạch.
 *
 * Dùng trong test chứ không dùng lúc chạy: mọi stem và mọi bước giải do template
 * sinh ra đều phải đi qua đây, nên một dấu ngoặc thiếu lộ ra ở `npm test` thay
 * vì lộ ra trên màn hình người học dưới dạng chữ "frac(" trần trụi.
 */
export function validateMath(src: string): string[] {
  const issues: Issue[] = [];
  parseRun(src, 0, '', issues);
  return issues;
}

/**
 * Đổ AST về một dòng chữ phẳng.
 *
 * Dùng cho hai chỗ: khẳng định trong test, và prompt gửi cho chatbox trợ giảng
 * — mô hình đọc `(3x+1)/2` chuẩn hơn là đọc một cây JSON.
 */
export function mathToPlainText(nodes: MathNode[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case 'text':
          return node.value;
        case 'sup': {
          const inner = mathToPlainText(node.children);
          return inner.length > 1 ? `^(${inner})` : `^${inner}`;
        }
        case 'sub': {
          const inner = mathToPlainText(node.children);
          return inner.length > 1 ? `_(${inner})` : `_${inner}`;
        }
        case 'frac':
          return `(${mathToPlainText(node.numerator)})/(${mathToPlainText(node.denominator)})`;
        case 'sqrt':
          return `√(${mathToPlainText(node.children)})`;
      }
    })
    .join('');
}
