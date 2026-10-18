import type { ListeningTest } from '@/services/listening/types';

import band9T1 from './band9-t1.json';
import sampleS1 from './sample-s1.json';
import { ORIGINAL_TOPIC_TESTS } from './original-topics';

/**
 * Kho đề Listening. THÊM ĐỀ: bỏ `<id>.json` vào thư mục này, rồi import và đưa
 * vào mảng dưới đây (bundler chỉ gom những tệp được import). `npm test` kiểm
 * toàn bộ tệp trong thư mục — kể cả tệp quên khai báo ở đây.
 */
export const LISTENING_TESTS: ListeningTest[] = [sampleS1 as ListeningTest, band9T1 as ListeningTest, ...ORIGINAL_TOPIC_TESTS];

export function getListeningTest(id: string): ListeningTest | undefined {
  return LISTENING_TESTS.find((t) => t.id === id);
}
