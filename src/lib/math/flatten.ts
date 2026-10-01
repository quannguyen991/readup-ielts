import { parseMath, type MathNode } from './expr';

/**
 * Chuỗi thuần của một đề toán theo ĐÚNG thứ tự `MathText` vẽ các mẩu chữ (tử số
 * trước mẫu số, mũ / chỉ số theo chỗ đứng). Đây là gốc của mọi vị trí tô màu.
 */
export function flattenMath(source: string): string {
  const walk = (nodes: MathNode[]): string =>
    nodes
      .map((n) => {
        switch (n.kind) {
          case 'text':
            return n.value;
          case 'frac':
            return walk(n.numerator) + walk(n.denominator);
          default:
            return walk(n.children);
        }
      })
      .join('');
  return walk(parseMath(source));
}
