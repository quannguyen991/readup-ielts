/**
 * Thay cho react-native-web/.../compiler/normalizeValueWithProperty (xem metro.config.js).
 * Giá trị màu đi qua `chiikawaRecolor` rồi mới vào bộ chuẩn hoá gốc.
 */
import original from 'react-native-web/dist/exports/StyleSheet/compiler/normalizeValueWithProperty';
import { chiikawaRecolor } from './chiikawa-recolor';

const colorProps = {
  backgroundColor: 1, borderColor: 1, borderTopColor: 1, borderRightColor: 1, borderBottomColor: 1,
  borderLeftColor: 1, color: 1, shadowColor: 1, textDecorationColor: 1, textShadowColor: 1,
};

/** Thuộc tính chứa màu lẫn trong chuỗi (gradient, đổ bóng). */
const colorInString = { backgroundImage: 1, boxShadow: 1, textShadow: 1, filter: 1 };

// #RRGGBB(AA) hoặc rgb()/rgba() nằm trong chuỗi.
const COLOR_TOKEN = /#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b|rgba?\([^)]*\)/g;

export default function normalizeValueWithProperty(value, property) {
  if (property != null && colorProps[property]) return original(chiikawaRecolor(value), property);
  if (property != null && colorInString[property] && typeof value === 'string') {
    return original(value.replace(COLOR_TOKEN, (token) => chiikawaRecolor(token)), property);
  }
  return original(value, property);
}
