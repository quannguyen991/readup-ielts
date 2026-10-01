import type React from 'react';
import { createPortal } from 'react-dom';

/**
 * Đưa lớp nổi ra thẳng <body>. `position: fixed` nằm trong ScrollView của
 * react-native-web thì bị neo theo khung cuộn (khung ấy có `transform`), nên
 * bảng tô màu, máy tính, bảng câu hỏi đều phải đi qua đây.
 */
export function toBody(node: React.ReactNode): React.ReactNode {
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
