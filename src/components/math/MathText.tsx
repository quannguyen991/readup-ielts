import React from 'react';
import { Text, View } from 'react-native';

import { parseMath, type MathNode } from '@/lib/math/expr';
import { color, fontFamily } from '@/theme/tokens';

/**
 * Vẽ markup toán inline (xem `src/lib/math/expr.ts`).
 *
 * Dựng bằng View/Text lồng nhau chứ không phải SVG hay KaTeX — cùng lý do đã
 * ghi ở `ChartFigure.tsx`: web và mobile phải hiện giống hệt nhau, mà KaTeX chỉ
 * chạy web. Chữ vẫn là chữ thật nên chọn được, đọc được bằng trình đọc màn
 * hình, và tự co theo cỡ chữ hệ thống.
 *
 * CẢ CÂU ĐỀ ĐI QUA ĐÂY, không phải chỉ riêng phần công thức. Nên bài toán thật
 * ở component này là XUỐNG DÒNG: một câu tiếng Anh dài có phân số nằm giữa phải
 * ngắt dòng theo từ như văn bản thường. Cách làm: mỗi TỪ là một phần tử riêng
 * trong một hàng `flex-wrap`, khoảng trắng cũng là một phần tử — nhờ vậy chỗ
 * ngắt dòng rơi đúng vào khoảng trắng, y như văn bản bình thường.
 */

type MathTextProps = {
  children: string;
  /** Cỡ chữ gốc. Mũ, chỉ số dưới và phân số đều suy ra từ đây. */
  size?: number;
  tone?: string;
  /** Đậm cho đề bài, thường cho lời giải. */
  weight?: 'regular' | 'semibold';
};

export function MathText({
  children,
  size = 15,
  tone = color.ink,
  weight = 'regular',
}: MathTextProps) {
  return (
    <View className="flex-row flex-wrap items-center">
      {renderNodes(parseMath(children), { size, tone, weight })}
    </View>
  );
}

type Ctx = { size: number; tone: string; weight: 'regular' | 'semibold' };

function family(weight: Ctx['weight']): string {
  return weight === 'semibold' ? fontFamily.semibold : fontFamily.regular;
}

function renderNodes(nodes: MathNode[], ctx: Ctx): React.ReactNode[] {
  return nodes.flatMap((node, index) => renderNode(node, ctx, String(index)));
}

function renderNode(node: MathNode, ctx: Ctx, key: string): React.ReactNode[] {
  switch (node.kind) {
    case 'text':
      // Tách theo từ NHƯNG giữ lại khoảng trắng làm phần tử riêng: mất khoảng
      // trắng thì "sin(" và ")" dính vào nhau ở chỗ đáng lẽ có dấu cách.
      return node.value
        .split(/(\s+)/)
        .filter((piece) => piece.length > 0)
        .map((piece, i) => (
          <Text
            key={`${key}-t${i}`}
            style={{ fontSize: ctx.size, color: ctx.tone, fontFamily: family(ctx.weight) }}
          >
            {piece}
          </Text>
        ));

    case 'sup':
    case 'sub': {
      const scriptSize = Math.round(ctx.size * 0.72);
      // Hàng cha căn giữa theo chiều dọc, nên đẩy bằng margin đối diện: chừa
      // chỗ dưới thì chữ bị đẩy lên, chừa chỗ trên thì bị đẩy xuống.
      const offset = Math.round(ctx.size * 0.42);
      return [
        <View
          key={`${key}-s`}
          style={node.kind === 'sup' ? { marginBottom: offset } : { marginTop: offset }}
        >
          <View className="flex-row items-center">
            {renderNodes(node.children, { ...ctx, size: scriptSize })}
          </View>
        </View>,
      ];
    }

    case 'frac': {
      const partSize = Math.round(ctx.size * 0.92);
      return [
        <View key={`${key}-f`} className="items-center" style={{ marginHorizontal: 2 }}>
          <View className="flex-row items-center" style={{ paddingHorizontal: 3 }}>
            {renderNodes(node.numerator, { ...ctx, size: partSize })}
          </View>
          <View
            style={{
              height: 1,
              alignSelf: 'stretch',
              backgroundColor: ctx.tone,
              marginVertical: 2,
            }}
          />
          <View className="flex-row items-center" style={{ paddingHorizontal: 3 }}>
            {renderNodes(node.denominator, { ...ctx, size: partSize })}
          </View>
        </View>,
      ];
    }

    case 'sqrt':
      return [
        <View key={`${key}-r`} className="flex-row items-center">
          <Text style={{ fontSize: ctx.size, color: ctx.tone, fontFamily: family(ctx.weight) }}>
            √
          </Text>
          {/* Vạch ngang trên biểu thức dưới căn — thiếu nó thì không biết căn
              phủ tới đâu, mà √(x)+1 với √(x+1) là hai số khác nhau. */}
          <View style={{ borderTopWidth: 1, borderTopColor: ctx.tone, paddingTop: 2 }}>
            <View className="flex-row items-center" style={{ paddingHorizontal: 2 }}>
              {renderNodes(node.children, ctx)}
            </View>
          </View>
        </View>,
      ];
  }
}
