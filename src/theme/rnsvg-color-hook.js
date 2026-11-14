/**
 * Thay cho react-native-svg/lib/module/web/utils/prepare (xem metro.config.js).
 * Trên web, fill / stroke / stopColor… đi thẳng vào thuộc tính SVG nên đổi màu ở đây.
 */
import { prepare as original } from 'react-native-svg/lib/module/web/utils/prepare';
import { chiikawaRecolor } from './chiikawa-recolor';

const COLOR_PROPS = ['fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor', 'color'];

export function prepare(self, props = self.props) {
  let next = props;
  for (const key of COLOR_PROPS) {
    const value = props[key];
    if (typeof value === 'string') {
      const mapped = chiikawaRecolor(value);
      if (mapped !== value) {
        if (next === props) next = { ...props };
        next[key] = mapped;
      }
    }
  }
  return original(self, next);
}
